#!/usr/bin/env python3
"""Add HEALTHCHECK to runtime-fips stages in all Dockerfiles that are missing it.

Strategy: copy the HEALTHCHECK from the non-fips `runtime` stage into `runtime-fips`,
inserting it immediately before the final CMD in that stage.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"

# Pattern: matches a complete multi-line or single-line HEALTHCHECK directive.
# Multi-line form: HEALTHCHECK ... \\\n  CMD ...
# Single-line form: HEALTHCHECK ... CMD ...
HC_PATTERN = re.compile(
    r'(HEALTHCHECK[^\n]*\\\n\s*CMD[^\n]+|HEALTHCHECK[^\n]*CMD[^\n]+)',
    re.MULTILINE,
)

# Pattern: matches a FROM ... AS runtime-fips line and everything that follows
# until the next FROM or end-of-file.
FIPS_STAGE_PATTERN = re.compile(
    r'(FROM[^\n]+AS runtime-fips\n)((?:(?!FROM).*\n?)*)',
    re.MULTILINE,
)

count = 0
skipped = 0

for svc in sorted(SERVICES.iterdir()):
    if not svc.is_dir():
        continue
    df = svc / "Dockerfile"
    if not df.exists():
        continue

    content = df.read_text()

    # Only process files with a runtime-fips stage.
    if 'AS runtime-fips' not in content:
        continue

    fips_match = FIPS_STAGE_PATTERN.search(content)
    if not fips_match:
        print(f"WARN (fips stage pattern unmatched): {svc.name}")
        continue

    fips_header = fips_match.group(1)   # "FROM ... AS runtime-fips\n"
    fips_body   = fips_match.group(2)   # everything after that FROM line

    # Already has HEALTHCHECK in the fips stage — nothing to do.
    if 'HEALTHCHECK' in fips_body:
        skipped += 1
        continue

    # Extract the HEALTHCHECK from the non-fips runtime stage.
    all_hcs = HC_PATTERN.findall(content)
    if not all_hcs:
        print(f"WARN (no HEALTHCHECK found in file): {svc.name}")
        continue

    # Use the first HEALTHCHECK found (belongs to the `runtime` stage).
    source_hc = all_hcs[0]

    # Insert the HEALTHCHECK before the last CMD in the fips stage body.
    # We want: ... EXPOSE N\nHEALTHCHECK ...\nCMD ...
    new_fips_body = re.sub(
        r'^(CMD .+)$',
        f'{source_hc}\n\\1',
        fips_body,
        count=1,
        flags=re.MULTILINE,
    )

    if new_fips_body == fips_body:
        # No CMD found in fips body — append HEALTHCHECK before end of block.
        new_fips_body = fips_body.rstrip('\n') + f'\n{source_hc}\n'

    new_content = content.replace(
        fips_header + fips_body,
        fips_header + new_fips_body,
    )

    if new_content != content:
        df.write_text(new_content)
        count += 1
        print(f"Fixed FIPS HEALTHCHECK: {svc.name}")
    else:
        print(f"WARN (replacement produced no change): {svc.name}")

print(f"\nDone — {count} Dockerfiles fixed, {skipped} already had HEALTHCHECK in fips stage")
