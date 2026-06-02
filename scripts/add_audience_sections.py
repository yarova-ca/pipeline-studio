#!/usr/bin/env python3
"""Add dual-audience CSS to all HTML pages in pipeline-studio.

CSS is injected once per file into the first </style> block.
Already-patched files (those already containing 'audience-grid') are skipped.
Content sections (audience-grid HTML blocks) are handled separately for the
4 key pages: 02, 09, 16, 17 — those were updated by hand.
"""
from pathlib import Path

ROOT = Path(__file__).parent.parent
HTML_FILES = sorted(ROOT.glob("[0-9][0-9]-*.html")) + [ROOT / "index.html"]

AUDIENCE_CSS = """
/* ── Dual-audience sections ── */
.audience-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.audience-card{border-radius:8px;padding:16px;font-size:12px}
.audience-new{background:#e8f4fd;border:1px solid #90caf9}
.audience-new .audience-label{font-weight:700;color:#1565c0;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:.07em}
.audience-maintainer{background:#f1f8e9;border:1px solid #a5d6a7}
.audience-maintainer .audience-label{font-weight:700;color:#2e7d32;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:.07em}
.qr-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
.qr-table td{padding:4px 6px;border-bottom:1px solid rgba(0,0,0,.08);vertical-align:top}
.qr-table tr:last-child td{border-bottom:none}
.qr-table td:first-child{font-weight:600;white-space:nowrap;padding-right:10px;min-width:130px}
.checklist-section{display:flex;flex-direction:column;gap:12px;margin:12px 0}
.checklist-item{display:flex;align-items:flex-start;gap:12px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:12px 14px}
.checklist-item input[type="checkbox"]{width:16px;height:16px;margin-top:2px;flex-shrink:0;cursor:pointer}
.checklist-cmd{font-family:monospace;background:var(--bg3);padding:4px 8px;border-radius:4px;font-size:11px;margin:4px 0}
.checklist-pass{font-size:11px;color:var(--green);margin-top:2px}
.checklist-fail{font-size:11px;color:var(--red);margin-top:2px}
@media(max-width:768px){.audience-grid{grid-template-columns:1fr}}
@media(prefers-color-scheme:dark){
  .audience-new{background:#0d2744;border-color:#1565c0}
  .audience-new .audience-label{color:#90caf9}
  .audience-maintainer{background:#1b2e1b;border-color:#2e7d32}
  .audience-maintainer .audience-label{color:#a5d6a7}
  .qr-table td{border-bottom-color:rgba(255,255,255,.08)}
}
"""

count = 0
skipped = 0
for html in HTML_FILES:
    if not html.exists():
        print(f"  SKIP (not found): {html.name}")
        continue
    content = html.read_text(encoding="utf-8")
    if "audience-grid" in content:
        skipped += 1
        print(f"  already patched:  {html.name}")
        continue
    if "</style>" not in content:
        print(f"  SKIP (no </style>): {html.name}")
        continue
    # Insert before the FIRST </style> tag
    content = content.replace("</style>", AUDIENCE_CSS + "</style>", 1)
    html.write_text(content, encoding="utf-8")
    count += 1
    print(f"  added CSS:        {html.name}")

print(f"\nDone — CSS added to {count} pages, {skipped} already patched.")
