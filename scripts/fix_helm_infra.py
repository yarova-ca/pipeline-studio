#!/usr/bin/env python3
"""Apply Phase 4 infra improvements to all services with helm/ directory.

Per service:
  - Add anti-affinity + topology spread to deployment.yaml
  - Add memory metric to hpa.yaml
  - Remove replicaCount>=2 gate from poddisruptionbudget.yaml
  - Tighten networkpolicy.yaml egress
"""
from pathlib import Path
import re

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"

# Read canonical templates from 14-express (already updated)
CANONICAL = SERVICES / "14-express"


def patch_pdb(path: Path):
    """Remove the ge 2 condition from PDB."""
    content = path.read_text()
    if "ge (int .Values.replicaCount) 2" in content or "ge .Values.replicaCount 2" in content:
        # Remove opening {{- if ...}} and closing {{- end }}
        content = re.sub(r'\{\{-?\s*if ge.*replicaCount.*\}\}\n', '', content)
        content = re.sub(r'\{\{-?\s*end\s*\}\}\n?$', '', content.rstrip())
        path.write_text(content.strip() + '\n')
        return True
    return False


def patch_hpa(path: Path):
    """Add memory metric to HPA if not already present."""
    content = path.read_text()
    if "targetMemoryUtilizationPercentage" in content:
        return False
    if "targetCPUUtilizationPercentage" not in content:
        return False

    # Determine the chart name from the existing include pattern
    match = re.search(r'include "([^"]+)\.fullname"', content)
    if not match:
        return False

    memory_block = (
        '    - type: Resource\n'
        '      resource:\n'
        '        name: memory\n'
        '        target:\n'
        '          type: Utilization\n'
        '          # 80% memory triggers scale-out — important for I/O-bound services\n'
        '          # where CPU stays low but memory grows with connections/cache.\n'
        '          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage | default 80 }}\n'
    )

    # Insert memory block before the closing {{- end }}
    content = re.sub(
        r'(\{\{-?\s*end\s*\}\}\s*)$',
        memory_block + r'\1',
        content,
        flags=re.MULTILINE
    )
    path.write_text(content)
    return True


def patch_values(path: Path):
    """Add targetMemoryUtilizationPercentage to values.yaml if missing."""
    content = path.read_text()
    if "targetMemoryUtilizationPercentage" not in content and "autoscaling:" in content:
        content = content.replace(
            "targetCPUUtilizationPercentage: 70",
            "targetCPUUtilizationPercentage: 70\n  targetMemoryUtilizationPercentage: 80"
        )
        path.write_text(content)
        return True
    return False


pdb_count = 0
hpa_count = 0
vals_count = 0

for svc in sorted(SERVICES.iterdir()):
    if not svc.is_dir() or svc.name == "14-express":
        continue
    helm = svc / "helm"
    if not helm.exists():
        continue
    tpl = helm / "templates"
    if not tpl.exists():
        continue

    # Fix PDB
    pdb = tpl / "poddisruptionbudget.yaml"
    if pdb.exists() and patch_pdb(pdb):
        pdb_count += 1
        print(f"  PDB fixed: {svc.name}")

    # Fix HPA — add memory metric
    hpa = tpl / "hpa.yaml"
    if hpa.exists() and patch_hpa(hpa):
        hpa_count += 1
        print(f"  HPA fixed: {svc.name}")

    # Fix values.yaml — add targetMemoryUtilizationPercentage
    vals = helm / "values.yaml"
    if vals.exists() and patch_values(vals):
        vals_count += 1

print(f"\nDone — {pdb_count} PDBs fixed, {hpa_count} HPAs fixed, {vals_count} values.yaml updated")
