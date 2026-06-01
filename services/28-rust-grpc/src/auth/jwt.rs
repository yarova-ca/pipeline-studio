use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::errors::AppError;

/// JWT claims embedded in every token.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject — the user UUID.
    pub sub: String,
    pub email: String,
    pub name: String,
    /// Expiry — Unix timestamp.
    pub exp: u64,
}

/// Expiry window: 8 hours.
/// Why 8h: matches a standard workday session; short enough to limit replay risk.
const TOKEN_EXPIRY_SECS: u64 = 8 * 60 * 60;

fn secret() -> Result<String, AppError> {
    env::var("JWT_SECRET").map_err(|_| AppError::internal("JWT_SECRET env var not set"))
}

/// Sign a new JWT for the given user.
pub fn sign_token(user_id: &str, email: &str, name: &str) -> Result<String, AppError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::internal(&e.to_string()))?
        .as_secs();

    let claims = Claims {
        sub: user_id.to_owned(),
        email: email.to_owned(),
        name: name.to_owned(),
        exp: now + TOKEN_EXPIRY_SECS,
    };

    let key = EncodingKey::from_secret(secret()?.as_bytes());
    encode(&Header::default(), &claims, &key)
        .map_err(|e| AppError::internal(&format!("JWT encode error: {e}")))
}

/// Verify and decode a JWT.
pub fn verify_token(token: &str) -> Result<Claims, AppError> {
    let key = DecodingKey::from_secret(secret()?.as_bytes());
    let data = decode::<Claims>(token, &key, &Validation::default())
        .map_err(|_| AppError::Unauthorized)?;
    Ok(data.claims)
}
