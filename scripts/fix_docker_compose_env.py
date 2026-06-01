#!/usr/bin/env python3
"""Fix docker-compose.yml environment variable syntax.

Shell syntax: DATABASE_URL=postgresql://...
YAML syntax:  DATABASE_URL: "postgresql://..."

Also fixes the Python conditional that got embedded literally in some files.
"""
from pathlib import Path
import re

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"

count = 0
for svc in sorted(SERVICES.iterdir()):
    if not svc.is_dir(): continue
    dc = svc / "docker-compose.yml"
    if not dc.exists(): continue
    content = dc.read_text()
    original = content

    # Fix shell-assignment env vars in environment blocks
    # Pattern: lines like "      DATABASE_URL=postgresql://..."
    # Should be: "      DATABASE_URL: \"postgresql://...\""
    def fix_env_line(m):
        indent = m.group(1)
        key = m.group(2)
        value = m.group(3).strip()
        # Don't double-quote if already quoted
        if value.startswith('"') and value.endswith('"'):
            return f'{indent}{key}: {value}'
        return f'{indent}{key}: "{value}"'

    content = re.sub(
        r'^( +)([A-Z_]+)=([^\n]+)$',
        fix_env_line,
        content,
        flags=re.MULTILINE
    )

    # Fix the Python conditional that got embedded literally
    content = content.replace(
        'if "postgres" in db_image else "mysqladmin ping -h localhost -u app -pdevpassword"',
        'pg_isready -U app'
    )

    if content != original:
        dc.write_text(content)
        count += 1
        print(f"Fixed: {svc.name}/docker-compose.yml")

print(f"\nDone — {count} docker-compose.yml files fixed")
