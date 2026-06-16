"""Industry compliance profile, read at startup.

One repo serves every industry. COMPLIANCE_PROFILE flips a few controls.
baseline: no regulated controls. hipaa|pci|fedramp|fips|pipeda: load the yaml.
"""
import os
import re
import sys

_VALID = {"baseline", "hipaa", "pci", "fedramp", "fips", "pipeda"}


def _parse_required(text: str) -> dict:
    # required_controls is a list of single-key entries:  - audit_logging: true
    out: dict = {}
    in_block = False
    for line in text.splitlines():
        if line.startswith("required_controls:"):
            in_block = True
            continue
        if in_block:
            m = re.match(r"^\s*-\s*([a-z_]+):\s*(.+?)\s*$", line)
            if m:
                # Strip any trailing inline "# comment" before reading the value.
                raw = m.group(2).split("#", 1)[0].strip().strip("\"'")
                if raw == "true":
                    val: object = True
                elif raw == "false":
                    val = False
                elif raw.isdigit():
                    val = int(raw)
                else:
                    val = raw
                out[m.group(1)] = val
            elif line and not line[0].isspace():
                break
    return out


class Compliance:
    def __init__(self) -> None:
        profile = os.getenv("COMPLIANCE_PROFILE", "baseline").lower()
        if profile not in _VALID:
            print(f"FATAL: unknown COMPLIANCE_PROFILE: {profile}", file=sys.stderr)
            sys.exit(1)

        self.profile = profile
        self.required: dict = {}
        self.session_timeout_seconds = 8 * 60 * 60
        self.audit_logging = False
        self.mfa_required = False
        self.encryption_in_transit = False

        if profile != "baseline":
            path = os.path.join(os.getcwd(), "compliance", f"{profile}.yaml")
            try:
                with open(path, "r", encoding="utf-8") as fh:
                    self.required = _parse_required(fh.read())
            except OSError as exc:
                # A named profile with no readable file must fail loud.
                print(f"FATAL: compliance profile not loadable: {profile}: {exc}", file=sys.stderr)
                sys.exit(1)
            st = self.required.get("session_timeout")
            if isinstance(st, int):
                self.session_timeout_seconds = st
            self.audit_logging = self.required.get("audit_logging") is True
            self.mfa_required = self.required.get("mfa_required") is True
            self.encryption_in_transit = self.required.get("encryption_in_transit") is True


compliance = Compliance()
