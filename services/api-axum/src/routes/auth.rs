use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect, Response},
    routing::{delete, get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use std::env;
use uuid::Uuid;

use crate::auth::{
    jwt::sign_token,
    middleware::AuthUser,
};
use crate::errors::AppError;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/auth/login", get(login))
        .route("/auth/callback", get(callback))
        .route("/auth/me", get(me))
        .route("/auth/logout", post(logout))
        .route("/auth/api-key", post(create_api_key))
        .route("/auth/api-key", delete(delete_api_key))
        // Dev-only token endpoint — guarded at runtime, not compile time.
        .route("/dev/token", post(dev_token))
}

// ---------------------------------------------------------------------------
// GitHub OAuth helpers
// ---------------------------------------------------------------------------

fn github_client_id() -> Result<String, AppError> {
    env::var("AUTH_CLIENT_ID").map_err(|_| AppError::internal("AUTH_CLIENT_ID not set"))
}

fn github_client_secret() -> Result<String, AppError> {
    env::var("AUTH_CLIENT_SECRET").map_err(|_| AppError::internal("AUTH_CLIENT_SECRET not set"))
}

fn callback_url() -> String {
    env::var("AUTH_CALLBACK_URL")
        .unwrap_or_else(|_| "http://localhost:8080/auth/callback".to_owned())
}

// ---------------------------------------------------------------------------
// GET /auth/login  — redirect to GitHub OAuth
// ---------------------------------------------------------------------------

async fn login() -> Result<Response, AppError> {
    let client_id = github_client_id()?;
    let url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&scope=read:user,user:email&redirect_uri={}",
        client_id,
        callback_url()
    );
    Ok(Redirect::temporary(&url).into_response())
}

// ---------------------------------------------------------------------------
// GET /auth/callback  — exchange code, upsert user, return JWT
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct CallbackParams {
    code: String,
}

#[derive(Deserialize)]
struct GitHubTokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct GitHubUser {
    id: u64,
    login: String,
    email: Option<String>,
    name: Option<String>,
}

async fn callback(
    State(pool): State<PgPool>,
    Query(params): Query<CallbackParams>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client_id = github_client_id()?;
    let client_secret = github_client_secret()?;

    // Exchange code for access token.
    let http = reqwest::Client::new();
    let token_res: GitHubTokenResponse = http
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("code", params.code.as_str()),
            ("redirect_uri", callback_url().as_str()),
        ])
        .send()
        .await
        .map_err(|e| AppError::internal(&e.to_string()))?
        .json()
        .await
        .map_err(|e| AppError::internal(&e.to_string()))?;

    // Fetch the authenticated GitHub user.
    let gh_user: GitHubUser = http
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {}", token_res.access_token))
        .header("User-Agent", "pipeline-studio-axum-service")
        .send()
        .await
        .map_err(|e| AppError::internal(&e.to_string()))?
        .json()
        .await
        .map_err(|e| AppError::internal(&e.to_string()))?;

    let user_id = format!("github:{}", gh_user.id);
    let email = gh_user
        .email
        .unwrap_or_else(|| format!("{}@github.noreply", gh_user.login));
    let name = gh_user.name.unwrap_or_else(|| gh_user.login.clone());
    let now = chrono::Utc::now();

    // Upsert: insert or update name/email if GitHub profile changed.
    sqlx::query(
        r#"
        INSERT INTO users (id, email, name, provider, created_at, updated_at)
        VALUES ($1, $2, $3, 'github', $4, $4)
        ON CONFLICT (id) DO UPDATE
            SET email      = EXCLUDED.email,
                name       = EXCLUDED.name,
                updated_at = EXCLUDED.updated_at
        "#,
    )
    .bind(&user_id)
    .bind(&email)
    .bind(&name)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(AppError::from)?;

    let token = sign_token(&user_id, &email, &name)?;
    Ok(Json(json!({ "token": token })))
}

// ---------------------------------------------------------------------------
// GET /auth/me  — return authenticated user
// ---------------------------------------------------------------------------

#[derive(serde::Serialize, sqlx::FromRow)]
struct UserRow {
    id: String,
    email: String,
    name: String,
    provider: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

async fn me(
    State(pool): State<PgPool>,
    auth: AuthUser,
) -> Result<Json<UserRow>, AppError> {
    let user = sqlx::query_as::<_, UserRow>(
        "SELECT id, email, name, provider, created_at, updated_at FROM users WHERE id = $1",
    )
    .bind(&auth.id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::from)?
    .ok_or_else(|| AppError::NotFound("user not found".to_owned()))?;

    Ok(Json(user))
}

// ---------------------------------------------------------------------------
// POST /auth/logout  — no server-side session; client discards the token
// ---------------------------------------------------------------------------

async fn logout() -> StatusCode {
    StatusCode::NO_CONTENT
}

// ---------------------------------------------------------------------------
// POST /auth/api-key  — generate a UUID API key and persist it
// ---------------------------------------------------------------------------

async fn create_api_key(
    State(pool): State<PgPool>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let new_key = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    sqlx::query("UPDATE users SET api_key = $1, updated_at = $2 WHERE id = $3")
        .bind(&new_key)
        .bind(now)
        .bind(&auth.id)
        .execute(&pool)
        .await
        .map_err(AppError::from)?;

    Ok(Json(json!({ "api_key": new_key })))
}

// ---------------------------------------------------------------------------
// DELETE /auth/api-key  — revoke the API key
// ---------------------------------------------------------------------------

async fn delete_api_key(
    State(pool): State<PgPool>,
    auth: AuthUser,
) -> Result<StatusCode, AppError> {
    let now = chrono::Utc::now();

    sqlx::query("UPDATE users SET api_key = NULL, updated_at = $1 WHERE id = $2")
        .bind(now)
        .bind(&auth.id)
        .execute(&pool)
        .await
        .map_err(AppError::from)?;

    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// POST /dev/token  — test-only JWT (blocked unless ALLOW_DEV_TOKEN=true)
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct DevTokenBody {
    user_id: String,
    email: String,
    name: String,
}

async fn dev_token(
    Json(body): Json<DevTokenBody>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Guard: refuse in production environments.
    // When NODE_ENV=production or ALLOW_DEV_TOKEN is absent: 400.
    // When NODE_ENV != production and ALLOW_DEV_TOKEN=true: issue token.
    let is_prod = env::var("NODE_ENV")
        .map(|v| v == "production")
        .unwrap_or(false);
    let allow_dev = env::var("ALLOW_DEV_TOKEN")
        .map(|v| v == "true")
        .unwrap_or(false);

    if is_prod || !allow_dev {
        return Err(AppError::BadRequest(
            "dev token endpoint is disabled in this environment".to_owned(),
        ));
    }

    let token = sign_token(&body.user_id, &body.email, &body.name)?;
    Ok(Json(json!({ "token": token })))
}
