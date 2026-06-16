import importlib
import json
import os

# Invariant under test: one repo serves every industry. Same controls, just on/off.
# The profiles come from the canonical catalog, generated to profiles.json.

_PATH = os.path.join(os.getcwd(), "compliance", "profiles.json")
with open(_PATH, "r", encoding="utf-8") as _fh:
    _DATA = json.load(_fh)
_PROFILES = _DATA["profiles"]


def test_every_profile_has_the_same_control_keys():
    base_keys = sorted(_PROFILES["baseline"]["controls"].keys())
    for name, p in _PROFILES.items():
        assert sorted(p["controls"].keys()) == base_keys, f"profile {name} key drift"


def test_itsg_33_enforces_canadian_residency_and_fips_crypto():
    controls = _PROFILES["itsg-33"]["controls"]
    assert controls["data_residency"] == "canada"
    assert controls["fips_crypto"] is True


def test_loader_selects_profile_from_env(monkeypatch):
    monkeypatch.setenv("COMPLIANCE_PROFILE", "itsg-33")
    import src.compliance as compliance_mod

    compliance_mod = importlib.reload(compliance_mod)
    view = compliance_mod.compliance.view()
    assert view["profile"] == "itsg-33"
    assert view["controls"]["data_residency"] == "canada"
