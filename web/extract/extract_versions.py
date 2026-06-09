#!/usr/bin/env python3
"""
Extractor for the `versions` graph group.

Source: legacy/15-version-registry.html
Output: web/graph/nodes/versions.json
Provenance: web/graph/provenance/versions.json

Parses the Version & Source Registry tables. Each <h2 id=...> section maps to a
`kind`. The frameworks section contains both frameworks and protocols, split by a
single `colspan="6"` separator row labelled "Protocols ...".

Each data row has 6 cells:
  0: Item name
  1: Version in docs (inside <code class="ic">)
  2: Used in (doc badges -> list of doc numbers)
  3: Source / release page (anchor href + display text)
  4: Notes
  5: Last verified date

Re-runnable. Stdlib only (re + html.unescape).
"""

import json
import os
import re
import html as htmllib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # web/
REPO = os.path.dirname(ROOT)  # pipeline-studio/
SRC = os.path.join(REPO, "legacy", "15-version-registry.html")
NODES = os.path.join(ROOT, "graph", "nodes", "versions.json")
PROV = os.path.join(ROOT, "graph", "provenance", "versions.json")

SOURCE_FILE = "legacy/15-version-registry.html"
SOURCE_TYPE = "legacy"

# Section id -> kind. "data" section is out of scope (market/industry sources).
SECTION_KIND = {
    "base-images": "image",
    "frameworks": "framework",   # protocols split out inside this section
    "ci-tools": "tool",
    "linux-distros": "distro",
    "compliance": "standard",
}


def strip_tags(s):
    s = re.sub(r"<[^>]+>", "", s)
    return htmllib.unescape(s).strip()


def slugify(text):
    s = text.lower().strip()
    s = s.replace("+", " plus ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def parse_cells(row_html):
    """Return list of inner-HTML strings for each <td> in the row."""
    return re.findall(r"<td\b[^>]*>(.*?)</td>", row_html, re.DOTALL)


def extract_version(cell_html):
    """Version lives inside <code class="ic">...</code>. Fall back to stripped text."""
    m = re.search(r'<code[^>]*class="ic"[^>]*>(.*?)</code>', cell_html, re.DOTALL)
    if m:
        v = strip_tags(m.group(1))
        return v or None
    v = strip_tags(cell_html)
    return v or None


def extract_used_in(cell_html):
    """Doc badges: anchors with class doc-badge; text is the doc number."""
    docs = []
    for m in re.finditer(r'<a[^>]*class="doc-badge"[^>]*>(.*?)</a>', cell_html, re.DOTALL):
        num = strip_tags(m.group(1))
        if num:
            docs.append(num)
    return docs


def extract_source(cell_html):
    """First anchor -> {url, label}."""
    m = re.search(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', cell_html, re.DOTALL)
    if m:
        url = htmllib.unescape(m.group(1)).strip()
        label = strip_tags(m.group(2))
        return {"url": url, "label": label or None}
    txt = strip_tags(cell_html)
    if txt:
        return {"url": None, "label": txt}
    return None


def extract_cadence(section_sub):
    """e.g. 'review every 30 days' -> 30. Returns int days or None."""
    m = re.search(r"review every (\d+) days", section_sub)
    if m:
        return int(m.group(1))
    return None


def main():
    raw = open(SRC, encoding="utf-8").read()

    # Split into sections by <h2 id="...">.
    parts = re.split(r'<h2 id="([^"]+)">([^<]*)</h2>', raw)
    # parts[0] preamble; then groups of (id, title, content)...
    sections = []
    for i in range(1, len(parts), 3):
        sid = parts[i]
        title = parts[i + 1].strip()
        content = parts[i + 2]
        sections.append((sid, title, content))

    nodes = []
    prov = {}
    seen_ids = {}

    for sid, title, content in sections:
        if sid not in SECTION_KIND:
            continue  # skip "data" / market section
        base_kind = SECTION_KIND[sid]

        # section-sub paragraph carries the review cadence.
        sub_m = re.search(r'<p class="section-sub">(.*?)</p>', content, re.DOTALL)
        section_sub = strip_tags(sub_m.group(1)) if sub_m else ""
        cadence_days = extract_cadence(section_sub)

        # Limit to the first table's tbody in this section.
        tbody_m = re.search(r"<tbody>(.*?)</tbody>", content, re.DOTALL)
        if not tbody_m:
            continue
        tbody = tbody_m.group(1)

        # Walk rows in order so the colspan separator can flip the kind.
        current_kind = base_kind
        for row_m in re.finditer(r"<tr>(.*?)</tr>", tbody, re.DOTALL):
            row_inner = row_m.group(1)

            # Separator row: single colspan cell -> switch kind for the rest.
            if 'colspan="6"' in row_inner:
                label = strip_tags(row_inner).lower()
                if label.startswith("protocols"):
                    current_kind = "protocol"
                continue

            cells = parse_cells(row_inner)
            if len(cells) != 6:
                continue  # not a data row

            name = strip_tags(cells[0])
            if not name:
                continue
            version = extract_version(cells[1])
            used_in = extract_used_in(cells[2])
            source = extract_source(cells[3])
            notes = strip_tags(cells[4]) or None
            last_verified = strip_tags(cells[5]) or None

            base_slug = slugify(name)
            nid = base_slug
            if nid in seen_ids:
                seen_ids[nid] += 1
                nid = f"{base_slug}-{seen_ids[base_slug]}"
            else:
                seen_ids[base_slug] = 0

            node = {
                "id": nid,
                "name": name,
                "label": name,
                "kind": current_kind,
                "version": version,
                "usedIn": used_in,
                "source": source,
                "notes": notes,
                "lastVerified": last_verified,
                "reviewCadenceDays": cadence_days,
            }
            nodes.append(node)

            # Provenance per extracted field.
            for field in (
                "name", "kind", "version", "usedIn",
                "source", "notes", "lastVerified", "reviewCadenceDays",
            ):
                key = f"versions.json#{nid}.{field}"
                prov[key] = {
                    "source": SOURCE_FILE,
                    "sourceType": SOURCE_TYPE,
                    "confidence": 1.0,
                }

    os.makedirs(os.path.dirname(NODES), exist_ok=True)
    os.makedirs(os.path.dirname(PROV), exist_ok=True)
    with open(NODES, "w", encoding="utf-8") as f:
        json.dump(nodes, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(PROV, "w", encoding="utf-8") as f:
        json.dump(prov, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # Summary to stderr-free stdout for the runner.
    from collections import Counter
    kc = Counter(n["kind"] for n in nodes)
    print(f"total nodes: {len(nodes)}")
    for k in ("framework", "protocol", "tool", "image", "distro", "standard"):
        print(f"  {k}: {kc.get(k, 0)}")
    print(f"provenance entries: {len(prov)}")


if __name__ == "__main__":
    main()
