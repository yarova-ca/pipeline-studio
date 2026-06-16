"""Industry compliance profile, read at startup.

One repo serves every industry. COMPLIANCE_PROFILE flips the active profile —
no code change, no rebuild. The profiles come from the platform's canonical
catalog, generated to compliance/profiles.json so there is no per-language YAML
parsing. Every profile carries the SAME control keys, just on/off.
"""
import json
import os
from typing import Dict, Optional, Union

ControlValue = Union[str, int, bool]


class Compliance:
    def __init__(self) -> None:
        profile = os.getenv("COMPLIANCE_PROFILE", "baseline").lower()
        data = _load_profiles()
        profiles = (data or {}).get("profiles", {})
        p = profiles.get(profile) or profiles.get("baseline")

        if p is None:
            self.profile = profile
            self.name = "unknown"
            self.jurisdiction = ""
            self.controls: Dict[str, ControlValue] = {}
        else:
            self.profile = profile
            self.name = p.get("name", "")
            self.jurisdiction = p.get("jurisdiction", "")
            self.controls = p.get("controls", {})

    def view(self) -> dict:
        return {
            "profile": self.profile,
            "name": self.name,
            "jurisdiction": self.jurisdiction,
            "controls": self.controls,
        }


def _load_profiles() -> Optional[dict]:
    path = os.path.join(os.getcwd(), "compliance", "profiles.json")
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return None


compliance = Compliance()
