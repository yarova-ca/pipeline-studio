#!/usr/bin/env python3
"""
Extractor: frameworks group for Pipeline Studio graph.

Sources:
  legacy/01-framework-catalog.html  -> 105 frameworks across 30 category tables (per-table thead drives columns)
  legacy/17-feature-matrix.html     -> tier classification (Tier 1 / Tier 2 sections of slugs)
  legacy/18-service-status.html     -> per-service data-status -> tierStatus

Outputs (web/graph/nodes/):
  frameworks.json, categories.json, devices.json, languages.json
Provenance:
  web/graph/provenance/frameworks.json

Re-runnable. Pure stdlib (html.parser + html for unescape).
"""
import json
import os
import re
from html import unescape
from html.parser import HTMLParser

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LEGACY = os.path.join(ROOT, "legacy")
WEB = os.path.join(ROOT, "web")
NODES = os.path.join(WEB, "graph", "nodes")
PROV = os.path.join(WEB, "graph", "provenance")

CATALOG = os.path.join(LEGACY, "01-framework-catalog.html")
FEATURE = os.path.join(LEGACY, "17-feature-matrix.html")
STATUS = os.path.join(LEGACY, "18-service-status.html")

os.makedirs(NODES, exist_ok=True)
os.makedirs(PROV, exist_ok=True)


def slugify(text):
    s = text.lower().strip()
    s = s.replace("+", "plus").replace("#", "sharp").replace(".", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def strip_tags(html_fragment):
    """Remove tags, unescape entities, collapse whitespace. Keeps inner text."""
    no_tags = re.sub(r"<[^>]+>", "", html_fragment)
    return re.sub(r"\s+", " ", unescape(no_tags)).strip()


# ---------------------------------------------------------------------------
# Parse the catalog: iterate categories (h2) then each table with its own thead.
# ---------------------------------------------------------------------------

def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


CATALOG_HTML = read(CATALOG)

# Split into category blocks by <h2 ...>...</h2>
h2_re = re.compile(r'<h2 id="(c\d+)">(.*?)</h2>', re.S)
h2_matches = list(h2_re.finditer(CATALOG_HTML))

categories = []          # list of category dicts
cat_block_ranges = []    # (catId, start_offset, end_offset)

for i, m in enumerate(h2_matches):
    start = m.end()
    end = h2_matches[i + 1].start() if i + 1 < len(h2_matches) else len(CATALOG_HTML)
    raw_heading = m.group(2)
    # heading like: "1 — Frontend — SSR / Hybrid <span class="b fe">Frontend Web</span>"
    device_badge_m = re.search(r'<span class="b [^"]*">([^<]*)</span>', raw_heading)
    device_label = strip_tags(device_badge_m.group(1)) if device_badge_m else None
    heading_text = strip_tags(re.sub(r'<span class="b[^>]*>.*?</span>', "", raw_heading))
    # heading_text e.g. "1 — Frontend — SSR / Hybrid"
    num_m = re.match(r"(\d+)\s*[—-]\s*(.*)", heading_text)
    if num_m:
        cat_num = int(num_m.group(1))
        cat_name = num_m.group(2).strip()
    else:
        cat_num = i + 1
        cat_name = heading_text

    cat_id = m.group(1)  # cN
    cat_block_ranges.append((cat_id, start, end))

    # category meta (description) directly after heading
    block = CATALOG_HTML[start:end]
    meta_m = re.search(r'<div class="cat-meta">(.*?)</div>', block, re.S)
    cat_meta = strip_tags(meta_m.group(1)) if meta_m else None
    verified_m = re.search(r'<div class="cat-verified">(.*?)</div>', block, re.S)
    cat_verified = strip_tags(verified_m.group(1)) if verified_m else None

    categories.append({
        "id": cat_id,
        "num": cat_num,
        "name": cat_name,
        "label": cat_name,
        "device": device_label,
        "description": cat_meta,
        "verified": cat_verified,
    })

# Provenance accumulator: "nodefile#id.field" -> {...}
prov = {}


def add_prov(nodefile, ident, field, source, source_type, confidence):
    prov[f"{nodefile}#{ident}.{field}"] = {
        "source": source,
        "sourceType": source_type,
        "confidence": confidence,
    }


# Generic td-cell parser: given a table HTML, return headers list + list of row cells (raw html).
class TableParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.in_thead = False
        self.in_tbody = False
        self.in_th = False
        self.in_td = False
        self.headers = []
        self.cur_header = []
        self.rows = []
        self.cur_row = []
        self.cur_cell = []

    def handle_starttag(self, tag, attrs):
        if tag == "thead":
            self.in_thead = True
        elif tag == "tbody":
            self.in_tbody = True
        elif tag == "th" and self.in_thead:
            self.in_th = True
            self.cur_header = []
        elif tag == "tr" and self.in_tbody:
            self.cur_row = []
        elif tag == "td" and self.in_tbody:
            self.in_td = True
            self.cur_cell = []
        else:
            # capture inner markup of cells/headers verbatim
            attr_str = "".join(f' {k}="{v}"' if v is not None else f" {k}" for k, v in attrs)
            frag = f"<{tag}{attr_str}>"
            if self.in_th:
                self.cur_header.append(frag)
            elif self.in_td:
                self.cur_cell.append(frag)

    def handle_startendtag(self, tag, attrs):
        attr_str = "".join(f' {k}="{v}"' if v is not None else f" {k}" for k, v in attrs)
        frag = f"<{tag}{attr_str}/>"
        if self.in_th:
            self.cur_header.append(frag)
        elif self.in_td:
            self.cur_cell.append(frag)

    def handle_endtag(self, tag):
        if tag == "thead":
            self.in_thead = False
        elif tag == "tbody":
            self.in_tbody = False
        elif tag == "th" and self.in_th:
            self.in_th = False
            self.headers.append("".join(self.cur_header))
        elif tag == "td" and self.in_td:
            self.in_td = False
            self.rows_append_cell()
        elif tag == "tr" and self.in_tbody:
            if self.cur_row:
                self.rows.append(self.cur_row)
            self.cur_row = []
        else:
            frag = f"</{tag}>"
            if self.in_th:
                self.cur_header.append(frag)
            elif self.in_td:
                self.cur_cell.append(frag)

    def rows_append_cell(self):
        self.cur_row.append("".join(self.cur_cell))
        self.cur_cell = []

    def handle_data(self, data):
        if self.in_th:
            self.cur_header.append(data)
        elif self.in_td:
            self.cur_cell.append(data)

    def handle_entityref(self, name):
        ref = f"&{name};"
        if self.in_th:
            self.cur_header.append(ref)
        elif self.in_td:
            self.cur_cell.append(ref)

    def handle_charref(self, name):
        ref = f"&#{name};"
        if self.in_th:
            self.cur_header.append(ref)
        elif self.in_td:
            self.cur_cell.append(ref)


# Map raw header html -> clean column name (just the visible text, before any nested span)
def header_name(raw):
    # the th text is the leading text before any child element
    text = strip_tags(raw)
    return text


# canonical key for a column name
def col_key(name):
    n = name.lower().strip().rstrip("→").strip()
    mapping = {
        "name": "name",
        "version": "version",
        "language": "language",
        "license": "license",
        "maintained by": "maintainedBy",
        "maturity": "maturity",
        "concurrency": "concurrency",
        "memory": "memory",
        "perf": "perf",
        "throughput": "throughput",
        "bundle size (gzip)": "bundleSize",
        "bundle size": "bundleSize",
        "security posture": "securityPosture",
        "scaling": "scaling",
        "ecosystem": "ecosystem",
        "pkg mgr": "pkgMgr",
        "build tool": "buildTool",
        "registry": "registry",
        "when to use": "whenToUse",
        "when not": "whenNot",
        "tradeoff": "tradeoff",
        "rendering modes": "renderingModes",
        "rendering": "rendering",
        "hydration": "hydration",
        "runtime target": "runtimeTarget",
        "service": "service",
        "cold start": "coldStart",
        "container size (alpine)": "containerSize",
        "container size": "containerSize",
        "thread model": "threadModel",
        "p99 latency": "p99Latency",
        "state init": "stateInit",
    }
    if n in mapping:
        return mapping[n]
    return re.sub(r"[^a-z0-9]+", "_", n).strip("_")


# Extract service slug from the "Service →" cell html (href .../services/SLUG)
def extract_slug(cell_html):
    m = re.search(r"services/([0-9a-z\-]+)", cell_html)
    return m.group(1) if m else None


# Extract a list of languages from the Language cell text, e.g. "TS / JS".
# Split only on " / " (spaced slash) and commas. A bare slash like "C++14/17"
# stays one token so the source value is preserved verbatim, not fragmented.
def split_languages(text):
    parts = re.split(r"\s+/\s+|\s*,\s*", text)
    return [p.strip() for p in parts if p.strip()]


frameworks = []
languages_map = {}  # langName -> dict

for cat_id, start, end in cat_block_ranges:
    block = CATALOG_HTML[start:end]
    # there is one <table> per category
    tbl_m = re.search(r"<table>.*?</table>", block, re.S)
    if not tbl_m:
        continue
    parser = TableParser()
    parser.feed(tbl_m.group(0))
    col_names = [header_name(h) for h in parser.headers]
    keys = [col_key(n) for n in col_names]

    cat_obj = next(c for c in categories if c["id"] == cat_id)
    device_label = cat_obj["device"]

    for row in parser.rows:
        if len(row) != len(keys):
            # tolerate mismatch by zipping the shorter
            pass
        cell_map = {}
        for k, cell in zip(keys, row):
            cell_map[k] = cell

        name_cell = cell_map.get("name", "")
        name = strip_tags(name_cell)
        if not name:
            continue

        slug = None
        if "service" in cell_map:
            slug = extract_slug(cell_map["service"])

        ident = slug if slug else slugify(name)

        fw = {"id": ident, "name": name, "label": name, "categoryId": cat_id}

        # device list (from category badge)
        device_id = slugify(device_label) if device_label else None
        fw["device"] = [device_id] if device_id else []

        # language
        lang_text = strip_tags(cell_map.get("language", "")) if "language" in cell_map else ""
        lang_names = split_languages(lang_text) if lang_text else []
        lang_ids = []
        for ln in lang_names:
            lid = slugify(ln)
            lang_ids.append(lid)
            if lid not in languages_map:
                languages_map[lid] = {"id": lid, "name": ln, "label": ln}
        fw["languageId"] = lang_ids[0] if lang_ids else None
        fw["languages"] = lang_ids

        # capture every column present (clean text), plus a homepage/version url where useful
        for k, cell in cell_map.items():
            if k in ("name", "language", "service"):
                continue
            fw[k] = strip_tags(cell)
            add_prov("frameworks.json", ident, k, "legacy/01-framework-catalog.html", "legacy", "high")

        # homepage URL from name cell anchor
        href_m = re.search(r'href="([^"]+)"', name_cell)
        if href_m:
            fw["homepage"] = unescape(href_m.group(1))
            add_prov("frameworks.json", ident, "homepage", "legacy/01-framework-catalog.html", "legacy", "high")

        # version source url if version cell has an anchor
        ver_cell = cell_map.get("version", "")
        ver_href = re.search(r'href="([^"]+)"', ver_cell)
        if ver_href:
            fw["versionSource"] = unescape(ver_href.group(1))

        if slug:
            fw["serviceSlug"] = slug
            add_prov("frameworks.json", ident, "serviceSlug", "legacy/01-framework-catalog.html", "legacy", "high")

        # provenance for structural fields
        add_prov("frameworks.json", ident, "name", "legacy/01-framework-catalog.html", "legacy", "high")
        add_prov("frameworks.json", ident, "categoryId", "legacy/01-framework-catalog.html", "legacy", "high")
        add_prov("frameworks.json", ident, "device", "legacy/01-framework-catalog.html", "legacy", "high")
        if lang_ids:
            add_prov("frameworks.json", ident, "languageId", "legacy/01-framework-catalog.html", "legacy", "high")

        frameworks.append(fw)

# ---------------------------------------------------------------------------
# Cross-reference tier from 17-feature-matrix.html (Tier 1 / Tier 2 sections)
# ---------------------------------------------------------------------------
FEATURE_HTML = read(FEATURE)

tier_of_slug = {}
# Find tier section heads and collect codes until the next tier head.
tier_heads = list(re.finditer(r'class="(tier[12])-head"', FEATURE_HTML))
for i, hm in enumerate(tier_heads):
    tier_label = hm.group(1)  # tier1 / tier2
    seg_start = hm.end()
    seg_end = tier_heads[i + 1].start() if i + 1 < len(tier_heads) else len(FEATURE_HTML)
    # but stop at the end of that table to avoid bleeding; tables are large — use </table>
    tbl_end = FEATURE_HTML.find("</table>", seg_start)
    if tbl_end != -1 and tbl_end < seg_end:
        seg_end = tbl_end
    segment = FEATURE_HTML[seg_start:seg_end]
    for cm in re.finditer(r"<code>([0-9a-z\-]+)</code>", segment):
        slug = cm.group(1)
        # only real service-looking slugs (start with digits)
        if re.match(r"^\d", slug):
            tier_of_slug.setdefault(slug, "Tier 1" if tier_label == "tier1" else "Tier 2")

# ---------------------------------------------------------------------------
# Cross-reference tierStatus from 18-service-status.html (data-status per row)
# ---------------------------------------------------------------------------
STATUS_HTML = read(STATUS)
status_of_slug = {}
for rm in re.finditer(
    r'<tr([^>]*data-status="[^"]*"[^>]*)>(.*?)</tr>', STATUS_HTML, re.S
):
    attrs = rm.group(1)
    body = rm.group(2)
    slug_m = re.search(r"services/([0-9a-z\-]+)", body)
    status_m = re.search(r'data-status="([^"]*)"', attrs)
    if slug_m and status_m:
        status_of_slug[slug_m.group(1)] = status_m.group(1)

# Apply cross-refs
for fw in frameworks:
    slug = fw.get("serviceSlug")
    if slug and slug in tier_of_slug:
        fw["tier"] = tier_of_slug[slug]
        add_prov("frameworks.json", fw["id"], "tier", "legacy/17-feature-matrix.html", "legacy", "high")
    if slug and slug in status_of_slug:
        fw["tierStatus"] = status_of_slug[slug]
        add_prov("frameworks.json", fw["id"], "tierStatus", "legacy/18-service-status.html", "legacy", "high")

# ---------------------------------------------------------------------------
# Build devices from distinct category badges
# ---------------------------------------------------------------------------
devices_map = {}
for c in categories:
    if c["device"]:
        did = slugify(c["device"])
        if did not in devices_map:
            devices_map[did] = {"id": did, "name": c["device"], "label": c["device"]}
            add_prov("devices.json", did, "name", "legacy/01-framework-catalog.html", "legacy", "high")

# attach device to each category for output
categories_out = []
for c in categories:
    out = {
        "id": c["id"],
        "num": c["num"],
        "name": c["name"],
        "label": c["label"],
        "deviceId": slugify(c["device"]) if c["device"] else None,
        "device": c["device"],
        "description": c["description"],
        "verified": c["verified"],
    }
    categories_out.append(out)
    add_prov("categories.json", c["id"], "name", "legacy/01-framework-catalog.html", "legacy", "high")
    add_prov("categories.json", c["id"], "deviceId", "legacy/01-framework-catalog.html", "legacy", "high")

for lid in languages_map:
    add_prov("languages.json", lid, "name", "legacy/01-framework-catalog.html", "legacy", "high")

# ---------------------------------------------------------------------------
# Write outputs
# ---------------------------------------------------------------------------
def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


languages_out = sorted(languages_map.values(), key=lambda x: x["id"])
devices_out = sorted(devices_map.values(), key=lambda x: x["id"])

write_json(os.path.join(NODES, "frameworks.json"), frameworks)
write_json(os.path.join(NODES, "categories.json"), categories_out)
write_json(os.path.join(NODES, "devices.json"), devices_out)
write_json(os.path.join(NODES, "languages.json"), languages_out)
write_json(os.path.join(PROV, "frameworks.json"), prov)

print("frameworks:", len(frameworks))
print("categories:", len(categories_out))
print("devices:", len(devices_out))
print("languages:", len(languages_out))
print("with serviceSlug:", sum(1 for f in frameworks if f.get("serviceSlug")))
print("with tier:", sum(1 for f in frameworks if f.get("tier")))
print("with tierStatus:", sum(1 for f in frameworks if f.get("tierStatus")))
print("provenance entries:", len(prov))
