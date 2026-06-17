use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// A registered user. Provider is always "github" for now.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: String,
    /// Nullable — only set after the user requests an API key.
    pub api_key: Option<String>,
    pub provider: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// An item owned by a user.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Item {
    pub id: String,
    pub title: String,
    /// Optional free-text description.
    pub description: Option<String>,
    pub user_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request body for creating or updating an item.
///
/// I-6: `deny_unknown_fields` makes serde reject any extra/unknown JSON key
/// with a deserialization error, which Axum's `Json` extractor surfaces as 400.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ItemBody {
    pub title: Option<String>,
    pub description: Option<String>,
}
