#!/usr/bin/env python3
"""Remove duplicate aria-current='page' from nav-hub links on content pages.

The hub link should NOT have aria-current on non-hub pages.
Only the active .nav-link should have it.
"""
from pathlib import Path
import re

ROOT = Path(__file__).parent.parent
HTML_FILES = sorted(ROOT.glob("[0-9][0-9]-*.html"))

count = 0
for html in HTML_FILES:
    content = html.read_text()

    # The nav-hub link on content pages incorrectly has aria-current="page"
    # Pattern: <a href="index.html" class="nav-hub" aria-current="page">
    # Should be: <a href="index.html" class="nav-hub">
    if 'class="nav-hub" aria-current="page"' in content:
        new_content = content.replace(
            'class="nav-hub" aria-current="page"',
            'class="nav-hub"'
        )
        # Also check alternate attribute order
        new_content = new_content.replace(
            'aria-current="page" class="nav-hub"',
            'class="nav-hub"'
        )
        if new_content != content:
            html.write_text(new_content)
            count += 1
            print(f"Fixed nav-hub aria-current: {html.name}")

print(f"\nDone — {count} HTML files fixed")
