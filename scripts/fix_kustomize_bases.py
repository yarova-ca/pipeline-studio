#!/usr/bin/env python3
"""Replace deprecated 'bases:' with 'resources:' in kustomization.yaml files."""
from pathlib import Path

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"

count = 0
for kust in SERVICES.rglob("kustomization.yaml"):
    content = kust.read_text()
    if "bases:" in content:
        new_content = content.replace("bases:", "resources:")
        kust.write_text(new_content)
        count += 1
        print(f"Fixed: {kust.relative_to(ROOT)}")

print(f"\nDone — {count} kustomization.yaml files updated")
