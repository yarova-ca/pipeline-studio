use actix_web::{
    delete, get, post,
    web::{Data, Json, Query, ServiceConfig},
    HttpResponse, Responder,
};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use std::env;
use uuid::Uuid;

use crate::auth::{jwt::sign_token, middleware::AuthUser};

/// Register all /auth routes on the given ServiceConfig.
pub fn configure(cfg: &mut ServiceConfig) {
    cfg.service(login)
        .service(callback)
        .service(me)
        .service(logout)
        .service(create_api_key)
        .service(delete_api_key)
        .service(dev_token);
}

// ── GET /auth/login — redirect to GitHub OAuth ────────────────────────────

#[get("/auth/login")]
async fn login() -> impl Responder {
    let client_id = env::var("AUTH_CLIENT_ID").unwrap_or_default();
    let callback_url = env::var("AUTH_CALLBACK_URL")
        .unwrap_or_else(|_| "http://localhost:8080/auth/callback".to_owned());
    let url = format!(
        "https://github.com/login/oauth/authorize?client_id={client_id}&scope=read:user,user:email&redirect_uri={callback_url}"
    );
    HttpResponse::Found()
        .insert_header(("Location", url))
        .finish()
}

// ── GET /auth/callback — exchange code, upsert user, return JWT ───────────

#[derive(Deserialize)]
struct CallbackQuery {
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

#[get("/auth/callback")]
async fn callback(pool: Data<PgPool>, query: Query<CallbackQuery>) -> impl Responder {
    let client_id = env::var("AUTH_CLIENT_ID").unwrap_or_default();
    let client_secret = env::var("AUTH_CLIENT_SECRET").unwrap_or_default();
    let callback_url = env::var("AUTH_CALLBACK_URL")
        .unwrap_or_else(|_| "http://localhost:8080/auth/callback".to_owned());

    let http = reqwest::Client::new();

    let token_res: GitHubTokenResponse = match http
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("code", query.code.as_str()),
            ("redirect_uri", callback_url.as_str()),
        ])
        .send()
        .await
    {
        Ok(r) => match r.json::<GitHubTokenResponse>().await {
            Ok(t) => t,
            Err(e) => return HttpResponse::BadGateway()
                .json(json!({"error": format!("GitHub token parse failed: {e}")})),
        },
        Err(e) => return HttpResponse::BadGateway()
            .json(json!({"error": format!("GitHub token exchange failed: {e}")})),
    };

    let gh_user: GitHubUser = match http
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {}", token_res.access_token))
        .header("User-Agent", "pipeline-studio-actix-service")
        .send()
        .await
    {
        Ok(r) => match r.json::<GitHubUser>().await {
            Ok(u) => u,
            Err(e) => return HttpResponse::BadGateway()
                .json(json!({"error": format!("GitHub user parse failed: {e}")})),
        },
        Err(e) => return HttpResponse::BadGateway()
            .json(json!({"error": format!("GitHub user fetch failed: {e}")})),
    };

    let user_id = format!("github:{}", gh_user.id);
    let email = gh_user
        .email
        .unwrap_or_else(|| format!("{}@github.noreply", gh_user.login));
    let name = gh_user.name.unwrap_or_else(|| gh_user.login.clone());
    let now = chrono::Utc::now();

    if let Err(e) = sqlx::query(
        r#"
        INSERT INTO users (id, email, name, provider, created_at, updated_at)
        VALUES ($1, $2, $3, 'github', $4, $4)
        ON CONFLICT (id) DO UPDATE
            SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = EXCLUDED.updated_at
        "#,
    )
    .bind(&user_id)
    .bind(&email)
    .bind(&name)
    .bind(now)
    .execute(pool.get_ref())
    .await
    {
        return HttpResponse::InternalServerError()
            .json(json!({"error": format!("DB upsert failed: {e}")}));
    }

    match sign_token(&user_id, &email, &name) {
        Ok(token) => HttpResponse::Ok().json(json!({"token": token})),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e})),
    }
}

// ── GET /auth/me — return authenticated user ──────────────────────────────

#[get("/auth/me")]
async fn me(pool: Data<PgPool>, auth: AuthUser) -> impl Responder {
    #[derive(serde::Serialize, sqlx::FromRow)]
    struct UserRow {
        id: String,
        email: String,
        name: String,
        provider: String,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
    }

    match sqlx::query_as::<_, UserRow>(
        "SELECT id, email, name, provider, created_at, updated_at FROM users WHERE id = $1",
    )
    .bind(&auth.id)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => HttpResponse::NotFound().json(json!({"error": "user not found"})),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    }
}

// ── POST /auth/logout — no server-side session; client discards token ─────

#[post("/auth/logout")]
async fn logout(_auth: AuthUser) -> impl Responder {
    HttpResponse::NoContent().finish()
}

// ── POST /auth/api-key — generate UUID API key ───────────────────────────

#[post("/auth/api-key")]
async fn create_api_key(pool: Data<PgPool>, auth: AuthUser) -> impl Responder {
    let new_key = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    match sqlx::query("UPDATE users SET api_key = $1, updated_at = $2 WHERE id = $3")
        .bind(&new_key)
        .bind(now)
        .bind(&auth.id)
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().json(json!({"api_key": new_key})),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    }
}

// ── DELETE /auth/api-key — revoke API key ────────────────────────────────

#[delete("/auth/api-key")]
async fn delete_api_key(pool: Data<PgPool>, auth: AuthUser) -> impl Responder {
    let now = chrono::Utc::now();
    match sqlx::query("UPDATE users SET api_key = NULL, updated_at = $1 WHERE id = $2")
        .bind(now)
        .bind(&auth.id)
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    }
}

// ── POST /dev/token — test-only JWT ──────────────────────────────────────

#[derive(Deserialize)]
struct DevTokenBody {
    user_id: String,
    email: String,
    name: String,
}

#[post("/dev/token")]
async fn dev_token(Json(body): Json<DevTokenBody>) -> impl Responder {
    let is_prod = env::var("NODE_ENV")
        .map(|v| v == "production")
        .unwrap_or(false);
    let allow_dev = env::var("ALLOW_DEV_TOKEN")
        .map(|v| v == "true")
        .unwrap_or(false);

    if is_prod || !allow_dev {
        return HttpResponse::BadRequest()
            .json(json!({"error": "dev token endpoint is disabled"}));
    }

    match sign_token(&body.user_id, &body.email, &body.name) {
        Ok(token) => HttpResponse::Ok().json(json!({"token": token})),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e})),
    }
}

