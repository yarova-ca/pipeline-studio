//! Compliance catalog tests.
//!
//! These run against `compliance/profiles.json` resolved relative to the crate
//! working directory (where `cargo test` runs). They assert the catalog is
//! uniform, the ITSG-33 profile carries the Canadian controls, and the loader
//! honours COMPLIANCE_PROFILE.

use std::collections::BTreeSet;
use std::fs;

use axum_service::compliance::load_profile;

fn catalog() -> serde_json::Value {
    let text = fs::read_to_string("compliance/profiles.json")
        .expect("compliance/profiles.json must exist relative to the crate root");
    serde_json::from_str(&text).expect("profiles.json must be valid JSON")
}

#[test]
fn every_profile_has_the_same_control_keys() {
    let doc = catalog();
    let profiles = doc["profiles"]
        .as_object()
        .expect("\"profiles\" must be an object");

    let mut iter = profiles.iter();
    let (first_name, first) = iter.next().expect("catalog must have at least one profile");
    let reference: BTreeSet<String> = first["controls"]
        .as_object()
        .expect("controls must be an object")
        .keys()
        .cloned()
        .collect();

    for (name, profile) in iter {
        let keys: BTreeSet<String> = profile["controls"]
            .as_object()
            .unwrap_or_else(|| panic!("profile {name} has no controls object"))
            .keys()
            .cloned()
            .collect();
        assert_eq!(
            keys, reference,
            "profile {name} control keys differ from reference profile {first_name}"
        );
    }
}

#[test]
fn itsg_33_has_canadian_residency_and_fips() {
    let doc = catalog();
    let controls = doc["profiles"]["itsg-33"]["controls"]
        .as_object()
        .expect("itsg-33 must have a controls object");

    assert_eq!(
        controls["data_residency"], "canada",
        "itsg-33 data_residency must be \"canada\""
    );
    assert_eq!(
        controls["fips_crypto"], true,
        "itsg-33 fips_crypto must be true"
    );
}

#[test]
fn loader_selects_itsg_33() {
    let active = load_profile("itsg-33").expect("itsg-33 must load");
    assert_eq!(active.profile, "itsg-33");
    assert_eq!(active.controls["data_residency"], "canada");
    assert_eq!(active.controls["fips_crypto"], true);
}
