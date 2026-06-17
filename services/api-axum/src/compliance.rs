//! Industry compliance profile, read at startup.
//! One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.
//!
//! Source of truth is `compliance/profiles.json` (relative to the working dir),
//! a generated catalog of 30 profiles sharing the same control keys.

use serde::Serialize;
use serde_json::{Map, Value};
use std::sync::OnceLock;

/// The active profile, shaped for the GET /compliance response.
#[derive(Serialize, Clone)]
pub struct Controls {
    pub profile: String,
    pub name: String,
    pub jurisdiction: String,
    pub controls: Map<String, Value>,
}

impl Controls {
    /// Session length in seconds, read from the active profile's controls.
    /// Falls back to 8 hours when the control is absent or non-numeric.
    pub fn session_timeout_seconds(&self) -> u64 {
        self.controls
            .get("session_timeout_seconds")
            .and_then(Value::as_u64)
            .unwrap_or(8 * 60 * 60)
    }
}

static ACTIVE: OnceLock<Controls> = OnceLock::new();

/// The profile this process booted with.
pub fn active() -> &'static Controls {
    ACTIVE.get_or_init(load)
}

fn load() -> Controls {
    let profile = std::env::var("COMPLIANCE_PROFILE").unwrap_or_else(|_| "baseline".into());
    match load_profile(&profile) {
        Ok(c) => c,
        Err(e) => {
            // A named profile we cannot load must fail loud rather than serve
            // a silently-wrong control set.
            eprintln!("FATAL: compliance profile not loadable: {profile}: {e}");
            std::process::exit(1);
        }
    }
}

/// Read `compliance/profiles.json` and return the selected profile.
/// Kept separate from `load` so tests can drive it without exiting the process.
pub fn load_profile(profile: &str) -> Result<Controls, String> {
    let path = std::path::Path::new("compliance").join("profiles.json");
    let text = std::fs::read_to_string(&path)
        .map_err(|e| format!("cannot read {}: {e}", path.display()))?;
    let doc: Value = serde_json::from_str(&text).map_err(|e| format!("invalid JSON: {e}"))?;

    let profiles = doc
        .get("profiles")
        .and_then(Value::as_object)
        .ok_or_else(|| "missing \"profiles\" object".to_string())?;

    let p = profiles
        .get(profile)
        .and_then(Value::as_object)
        .ok_or_else(|| format!("unknown profile: {profile}"))?;

    let name = p
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or(profile)
        .to_string();
    let jurisdiction = p
        .get("jurisdiction")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let controls = p
        .get("controls")
        .and_then(Value::as_object)
        .ok_or_else(|| format!("profile {profile} has no \"controls\" object"))?
        .clone();

    Ok(Controls {
        profile: profile.to_string(),
        name,
        jurisdiction,
        controls,
    })
}
