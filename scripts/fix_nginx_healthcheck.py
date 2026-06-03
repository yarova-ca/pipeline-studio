#!/usr/bin/env python3
"""Fix nginx HEALTHCHECK: replace 'node -e' with 'curl' in nginx-based Dockerfiles."""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"

# Services that use nginx runtime (static SPAs)
NGINX_SERVICES = [
    '02-angular', '02-lit', '02-preact', '02-react', '02-solidjs', '02-svelte', '02-vue',
    '03-astro', '03-eleventy', '03-gatsby', '03-hugo',
    '04-astro', '04-fresh', '05-qwik',
    '08-mf-rspack', '08-mf-webpack', '08-single-spa',
    '13-vite-pwa', '13-workbox',
]

CURL_HEALTHCHECK = (
    'HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\\n'
    '  CMD curl -sf http://localhost:80/ > /dev/null || exit 1'
)

count = 0
for slug in NGINX_SERVICES:
    df = SERVICES / slug / "Dockerfile"
    if not df.exists():
        print(f"SKIP (no Dockerfile): {slug}")
        continue

    content = df.read_text()

    if 'node -e' not in content:
        print(f"OK (no node -e in HEALTHCHECK): {slug}")
        continue

    # Replace two-line HEALTHCHECK ... CMD node -e ...
    new_content = re.sub(
        r'HEALTHCHECK[^\n]*\n\s*CMD node -e[^\n]+',
        CURL_HEALTHCHECK,
        content,
        flags=re.MULTILINE,
    )

    if new_content == content:
        # Try single-line form
        new_content = re.sub(
            r'HEALTHCHECK[^\n]*CMD node -e[^\n]+',
            CURL_HEALTHCHECK.replace('\\\n  ', ' '),
            content,
            flags=re.MULTILINE,
        )

    if new_content != content:
        df.write_text(new_content)
        count += 1
        print(f"Fixed: {slug}")
    else:
        print(f"No match found (pattern unrecognised): {slug}")

print(f"\nDone — {count} Dockerfiles fixed")
