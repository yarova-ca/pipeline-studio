use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::db::models::ItemBody;
use crate::errors::AppError;
use crate::extract::ValidatedJson;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/users/me/items", get(list_items))
        .route("/users/me/items", post(create_item))
        .route("/users/me/items/{id}", get(get_item))
        .route("/users/me/items/{id}", put(update_item))
        .route("/users/me/items/{id}", delete(delete_item))
}

// ---------------------------------------------------------------------------
// Row type returned from DB queries
// ---------------------------------------------------------------------------

#[derive(sqlx::FromRow, serde::Serialize)]
struct ItemRow {
    id: String,
    title: String,
    description: Option<String>,
    user_id: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

// ---------------------------------------------------------------------------
// GET /users/me/items  — list all items for the authenticated user
// ---------------------------------------------------------------------------

async fn list_items(
    State(pool): State<PgPool>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let items = sqlx::query_as::<_, ItemRow>(
        "SELECT id, title, description, user_id, created_at, updated_at
         FROM items
         WHERE user_id = $1
         ORDER BY created_at DESC",
    )
    .bind(&auth.id)
    .fetch_all(&pool)
    .await
    .map_err(AppError::from)?;

    Ok(Json(json!({ "items": items })))
}

// ---------------------------------------------------------------------------
// POST /users/me/items  — create a new item
// ---------------------------------------------------------------------------

async fn create_item(
    State(pool): State<PgPool>,
    auth: AuthUser,
    ValidatedJson(body): ValidatedJson<ItemBody>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let title = body
        .title
        .filter(|t| !t.trim().is_empty())
        .ok_or_else(|| AppError::BadRequest("title is required".to_owned()))?;

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    sqlx::query(
        "INSERT INTO items (id, title, description, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)",
    )
    .bind(&id)
    .bind(&title)
    .bind(&body.description)
    .bind(&auth.id)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(AppError::from)?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "id":          id,
            "title":       title,
            "description": body.description,
            "user_id":     auth.id,
            "created_at":  now,
            "updated_at":  now,
        })),
    ))
}

// ---------------------------------------------------------------------------
// GET /users/me/items/{id}  — fetch a single item (must belong to caller)
// ---------------------------------------------------------------------------

async fn get_item(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<ItemRow>, AppError> {
    let item = sqlx::query_as::<_, ItemRow>(
        "SELECT id, title, description, user_id, created_at, updated_at
         FROM items
         WHERE id = $1 AND user_id = $2",
    )
    .bind(&id)
    .bind(&auth.id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::from)?
    .ok_or_else(|| AppError::NotFound(format!("item {id} not found")))?;

    Ok(Json(item))
}

// ---------------------------------------------------------------------------
// PUT /users/me/items/{id}  — update title and/or description
// ---------------------------------------------------------------------------

#[derive(sqlx::FromRow)]
struct ItemPartial {
    title: String,
    description: Option<String>,
}

async fn update_item(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(id): Path<String>,
    ValidatedJson(body): ValidatedJson<ItemBody>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Confirm ownership before updating.
    let existing = sqlx::query_as::<_, ItemPartial>(
        "SELECT title, description FROM items WHERE id = $1 AND user_id = $2",
    )
    .bind(&id)
    .bind(&auth.id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::from)?
    .ok_or_else(|| AppError::NotFound(format!("item {id} not found")))?;

    let new_title = body.title.unwrap_or(existing.title);
    let new_desc = body.description.or(existing.description);
    let now = chrono::Utc::now();

    sqlx::query(
        "UPDATE items SET title = $1, description = $2, updated_at = $3
         WHERE id = $4 AND user_id = $5",
    )
    .bind(&new_title)
    .bind(&new_desc)
    .bind(now)
    .bind(&id)
    .bind(&auth.id)
    .execute(&pool)
    .await
    .map_err(AppError::from)?;

    Ok(Json(json!({
        "id":          id,
        "title":       new_title,
        "description": new_desc,
        "user_id":     auth.id,
        "updated_at":  now,
    })))
}

// ---------------------------------------------------------------------------
// DELETE /users/me/items/{id}  — delete item, 204 on success
// ---------------------------------------------------------------------------

async fn delete_item(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query("DELETE FROM items WHERE id = $1 AND user_id = $2")
        .bind(&id)
        .bind(&auth.id)
        .execute(&pool)
        .await
        .map_err(AppError::from)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("item {id} not found")));
    }

    Ok(StatusCode::NO_CONTENT)
}
