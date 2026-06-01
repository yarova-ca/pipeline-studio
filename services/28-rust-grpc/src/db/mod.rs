pub mod models;

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

/// Re-export so callers only import from `crate::db`.
pub type Db = PgPool;

/// Build a connection pool from the given DATABASE_URL.
///
/// Max connections: 10 (reasonable for a single-service dev or staging deployment).
/// Why 10: PgBouncer is not assumed; 10 keeps total Postgres connections below typical limits.
pub async fn init_pool(database_url: &str) -> Result<Db, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
}
