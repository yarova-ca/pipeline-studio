#!/usr/bin/env python3
"""Add networkPolicy.enabled: true to values.prod.yaml for all services.
Also adds allowedExternalHTTPS with GitHub CIDRs for OAuth-capable services.
Skips services/14-express — already updated manually.
"""
from pathlib import Path

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"

PROD_NETWORK_BLOCK = (
    "\nnetworkPolicy:\n"
    "  enabled: true\n"
    "  allowedExternalHTTPS:\n"
    "    - cidr: 140.82.112.0/20   # GitHub (for OAuth callbacks)\n"
    "    - cidr: 192.30.252.0/22   # GitHub (for OAuth callbacks)\n"
)

count = 0
skipped = 0

for svc in sorted(SERVICES.iterdir()):
    if not svc.is_dir():
        continue
    if svc.name == "14-express":
        print(f"Skip (already done): {svc.name}/helm/values.prod.yaml")
        skipped += 1
        continue

    prod_vals = svc / "helm" / "values.prod.yaml"
    if not prod_vals.exists():
        continue

    content = prod_vals.read_text()
    if "networkPolicy:" not in content:
        content += PROD_NETWORK_BLOCK
        prod_vals.write_text(content)
        count += 1
        print(f"Updated: {svc.name}/helm/values.prod.yaml")
    else:
        print(f"Skip (networkPolicy already present): {svc.name}/helm/values.prod.yaml")
        skipped += 1

print(f"\nDone — {count} services updated, {skipped} skipped")
