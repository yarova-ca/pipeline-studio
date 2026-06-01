use actix_web::{
    delete, get, post, put,
    web::{Data, Json, Path, ServiceConfig},
    HttpResponse, Responder,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::db::models::{ItemBody, ItemRow};

/// Register all /users routes on the given ServiceConfig.
pub fn configure(cfg: &mut ServiceConfig) {
    cfg.service(list_items)
        .service(create_item)
        .service(get_item)
        .service(update_item)
        .service(delete_item);
}

// ── GET /users/me/items ───────────────────────────────────────────────────

#[get("/users/me/items")]
async fn list_items(pool: Data<PgPool>, auth: AuthUser) -> impl Responder {
    match sqlx::query_as::<_, ItemRow>(
        "SELECT id, title, description, user_id, created_at, updated_at
         FROM items WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(&auth.id)
    .fetch_all(pool.get_ref())
    .await
    {
        Ok(items) => HttpResponse::Ok().json(json!({"items": items})),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    }
}

// ── POST /users/me/items ──────────────────────────────────────────────────

#[post("/users/me/items")]
async fn create_item(
    pool: Data<PgPool>,
    auth: AuthUser,
    Json(body): Json<ItemBody>,
) -> impl Responder {
    let title = match body.title.as_deref().filter(|t| !t.trim().is_empty()) {
        Some(t) => t.to_owned(),
        None => return HttpResponse::BadRequest().json(json!({"error": "title is required"})),
    };

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    match sqlx::query(
        "INSERT INTO items (id, title, description, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)",
    )
    .bind(&id)
    .bind(&title)
    .bind(&body.description)
    .bind(&auth.id)
    .bind(now)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => HttpResponse::Created().json(json!({
            "id": id,
            "title": title,
            "description": body.description,
            "user_id": auth.id,
            "created_at": now,
            "updated_at": now,
        })),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    }
}

// ── GET /users/me/items/{id} ──────────────────────────────────────────────

#[get("/users/me/items/{id}")]
async fn get_item(pool: Data<PgPool>, auth: AuthUser, id: Path<String>) -> impl Responder {
    match sqlx::query_as::<_, ItemRow>(
        "SELECT id, title, description, user_id, created_at, updated_at
         FROM items WHERE id = $1 AND user_id = $2",
    )
    .bind(id.as_str())
    .bind(&auth.id)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(item)) => HttpResponse::Ok().json(item),
        Ok(None) => HttpResponse::NotFound().json(json!({"error": "item not found"})),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    }
}

// ── PUT /users/me/items/{id} ──────────────────────────────────────────────

#[put("/users/me/items/{id}")]
async fn update_item(
    pool: Data<PgPool>,
    auth: AuthUser,
    id: Path<String>,
    Json(body): Json<ItemBody>,
) -> impl Responder {
    // Confirm ownership.
    let existing = sqlx::query_as::<_, (String, Option<String>)>(
        "SELECT title, description FROM items WHERE id = $1 AND user_id = $2",
    )
    .bind(id.as_str())
    .bind(&auth.id)
    .fetch_optional(pool.get_ref())
    .await;

    let (old_title, old_desc) = match existing {
        Ok(Some(row)) => row,
        Ok(None) => return HttpResponse::NotFound().json(json!({"error": "item not found"})),
        Err(e) => return HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    };

    let new_title = body.title.unwrap_or(old_title);
    let new_desc = body.description.or(old_desc);
    let now = chrono::Utc::now();

    match sqlx::query(
        "UPDATE items SET title = $1, description = $2, updated_at = $3
         WHERE id = $4 AND user_id = $5",
    )
    .bind(&new_title)
    .bind(&new_desc)
    .bind(now)
    .bind(id.as_str())
    .bind(&auth.id)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => HttpResponse::Ok().json(json!({
            "id": id.as_str(),
            "title": new_title,
            "description": new_desc,
            "user_id": auth.id,
            "updated_at": now,
        })),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    }
}

// ── DELETE /users/me/items/{id} ───────────────────────────────────────────

#[delete("/users/me/items/{id}")]
async fn delete_item(pool: Data<PgPool>, auth: AuthUser, id: Path<String>) -> impl Responder {
    match sqlx::query("DELETE FROM items WHERE id = $1 AND user_id = $2")
        .bind(id.as_str())
        .bind(&auth.id)
        .execute(pool.get_ref())
        .await
    {
        Ok(r) if r.rows_affected() > 0 => HttpResponse::NoContent().finish(),
        Ok(_) => HttpResponse::NotFound().json(json!({"error": "item not found"})),
        Err(e) => HttpResponse::InternalServerError().json(json!({"error": e.to_string()})),
    }
}
