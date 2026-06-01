use sqlx::PgPool;
use std::env;

/// Initialise a PostgreSQL connection pool from DATABASE_URL.
pub async fn connect() -> Result<PgPool, sqlx::Error> {
    let url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    PgPool::connect(&url).await
}

/// Request body / response types shared across handlers.
pub mod models {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Deserialize)]
    pub struct ItemBody {
        pub title: Option<String>,
        pub description: Option<String>,
    }

    #[derive(Debug, Serialize, sqlx::FromRow)]
    pub struct ItemRow {
        pub id: String,
        pub title: String,
        pub description: Option<String>,
        pub user_id: String,
        pub created_at: chrono::DateTime<chrono::Utc>,
        pub updated_at: chrono::DateTime<chrono::Utc>,
    }
}
