#!/usr/bin/env python3
"""Apply Helm template fixes to all services that have a helm/ directory."""
from pathlib import Path
import re, shutil

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"
TEMPLATE_SVC = SERVICES / "14-express"

count = 0
for svc in sorted(SERVICES.iterdir()):
    if not svc.is_dir() or svc.name == "14-express": continue
    helm = svc / "helm"
    if not helm.exists(): continue
    tpl = helm / "templates"
    if not tpl.exists(): continue

    # Fix ingress pathType
    ingress = tpl / "ingress.yaml"
    if ingress.exists():
        content = ingress.read_text()
        if '.pathType }}' in content and 'default' not in content:
            content = content.replace('pathType: {{ .pathType }}', 'pathType: {{ .pathType | default "Prefix" }}')
            ingress.write_text(content)

    # Fix empty image repository
    vals = helm / "values.yaml"
    if vals.exists():
        content = vals.read_text()
        if 'repository: ""' in content:
            content = content.replace('repository: ""', f'repository: "ghcr.io/yarova-ca/{svc.name}"')
            vals.write_text(content)

    # Copy networkpolicy.yaml if missing
    np = tpl / "networkpolicy.yaml"
    if not np.exists():
        src = TEMPLATE_SVC / "helm" / "templates" / "networkpolicy.yaml"
        if src.exists():
            content = src.read_text().replace("14-express", svc.name)
            np.write_text(content)

    # Copy poddisruptionbudget.yaml if missing
    pdb = tpl / "poddisruptionbudget.yaml"
    if not pdb.exists():
        src = TEMPLATE_SVC / "helm" / "templates" / "poddisruptionbudget.yaml"
        if src.exists():
            content = src.read_text().replace("14-express", svc.name)
            pdb.write_text(content)

    # Copy values.schema.json if missing
    schema = helm / "values.schema.json"
    if not schema.exists():
        src = TEMPLATE_SVC / "helm" / "values.schema.json"
        if src.exists():
            content = src.read_text().replace("14-express", svc.name)
            schema.write_text(content)

    # Add networkPolicy to values.yaml if missing
    vals_content = vals.read_text() if vals.exists() else ""
    if "networkPolicy:" not in vals_content:
        vals_content += "\nnetworkPolicy:\n  enabled: false\n"
        vals.write_text(vals_content)

    count += 1

print(f"Done — {count} services updated")
