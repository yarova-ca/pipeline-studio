#!/usr/bin/env python3
"""
Extractor: images group for Pipeline Studio graph.

Sources:
  legacy/09-linux-distros.html      -> 22 distros x 18 columns, grouped into 4 family tables
  legacy/10-linux-compliance.html   -> Matrix 1: 22 distros x 11 compliance standards (Yes/Par/—)
  legacy/11-dockerfile-catalog.html -> 105 framework Dockerfile templates (6 cols) + runtime axis legend

Outputs (web/graph/nodes/):
  images.json             -> distros/base images: all 18 cols + family + complianceRatings{standard->rating}
  dockerfileTemplates.json-> per-framework: frameworkId, buildFrom, runtimeFrom, runtimeVariants[], pkgMgr, port, pattern

Provenance:
  web/graph/provenance/images.json

Re-runnable. Pure stdlib (regex + html.unescape).
"""
import json
import os
import re
from html import unescape

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LEGACY = os.path.join(ROOT, "legacy")
WEB = os.path.join(ROOT, "web")
NODES = os.path.join(WEB, "graph", "nodes")
PROV = os.path.join(WEB, "graph", "provenance")

DISTROS = os.path.join(LEGACY, "09-linux-distros.html")
COMPLIANCE = os.path.join(LEGACY, "10-linux-compliance.html")
CATALOG = os.path.join(LEGACY, "11-dockerfile-catalog.html")
FRAMEWORKS_JSON = os.path.join(NODES, "frameworks.json")
CATEGORIES_JSON = os.path.join(NODES, "categories.json")

os.makedirs(NODES, exist_ok=True)
os.makedirs(PROV, exist_ok=True)

SRC_DISTROS = "legacy/09-linux-distros.html"
SRC_COMPLIANCE = "legacy/10-linux-compliance.html"
SRC_CATALOG = "legacy/11-dockerfile-catalog.html"


def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def strip_tags(fragment):
    no_tags = re.sub(r"<[^>]+>", "", fragment)
    return re.sub(r"\s+", " ", unescape(no_tags)).strip()


def slugify(text):
    s = text.lower().strip()
    s = s.replace("+", "plus").replace("#", "sharp").replace(".", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


# Canonical key for cross-file distro matching (09-distros <-> 10-compliance).
# Distro names differ between files (e.g. "Alpine Linux 3.21" vs "Alpine 3.21",
# "VMware Photon OS 5" vs "Photon OS 5"). Drop family/descriptor words, keep
# version digits, so each distro produces a stable key with no collisions.
DISTRO_KEY_DROP = {"linux", "lts", "stream", "container", "vmware", "os", "chainguard"}


def distro_key(name):
    s = name.lower()
    s = re.sub(r"\(.*?\)", "", s)          # drop parentheticals
    s = re.sub(r"[^a-z0-9. ]", " ", s)
    s = re.sub(r"\bx\b", "", s)            # drop trailing 'x' in version like 1.x
    s = re.sub(r"\s+", " ", s).strip()
    toks = [t.rstrip(".") for t in s.split() if t not in DISTRO_KEY_DROP]
    return " ".join(t for t in toks if t)


def cells_of(row_html):
    """Return list of inner-html for each td/th in a row, in order."""
    return re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", row_html, re.S)


def data_rows(table_html):
    """Rows inside <tbody> that contain a <td>. Falls back to whole table."""
    body = re.search(r"<tbody>(.*?)</tbody>", table_html, re.S)
    src = body.group(1) if body else table_html
    return [r for r in re.findall(r"<tr[^>]*>(.*?)</tr>", src, re.S) if "<td" in r]


# Provenance accumulator: "nodefile#id.field" -> {...}
prov = {}


def add_prov(nodefile, ident, field, source, source_type, confidence):
    prov[f"{nodefile}#{ident}.{field}"] = {
        "source": source,
        "sourceType": source_type,
        "confidence": confidence,
    }


# ---------------------------------------------------------------------------
# 1. Distros (09-linux-distros.html) — 4 family tables, 18 columns each
# ---------------------------------------------------------------------------
DISTROS_HTML = read(DISTROS)

# 18 column keys, in source order (verified against the single shared <thead>).
DISTRO_KEYS = [
    "name",          # 0  Distro / Image
    "family",        # 1  Family
    "libc",          # 2  libc
    "pkgMgr",        # 3  Pkg mgr
    "minImage",      # 4  Min image
    "architecture",  # 5  Architecture
    "fromTag",       # 6  FROM tag
    "caCerts",       # 7  CA certs
    "defaultUser",   # 8  Default user
    "fips",          # 9  FIPS
    "disaStig",      # 10 DISA STIG
    "cis",           # 11 CIS
    "vendor",        # 12 Vendor
    "eolSupport",    # 13 EOL / Support
    "useContext",    # 14 Use context
    "whenToUse",     # 15 When to use
    "whenNot",       # 16 When NOT
    "primaryTradeoff",  # 17 Primary tradeoff
]

DISTRO_COL_LABELS = [
    "Distro / Image", "Family", "libc", "Pkg mgr", "Min image", "Architecture",
    "FROM tag", "CA certs", "Default user", "FIPS", "DISA STIG", "CIS",
    "Vendor", "EOL / Support", "Use context", "When to use", "When NOT",
    "Primary tradeoff",
]

# Family wrap class -> human family label. Order matches the 4 tables.
FAMILY_WRAP_RE = re.compile(r'<div class="tbl-wrap ([a-z\-]+)-fam">', re.S)
FAMILY_LABELS = {
    "container": "Container-optimized",
    "general": "General purpose",
    "rhel": "RHEL family — enterprise",
    "immutable": "Immutable / Kubernetes-native node OS",
}

# Each distro-table sits inside one family wrap, in source order.
family_classes = FAMILY_WRAP_RE.findall(DISTROS_HTML)
distro_tables = re.findall(r'<table class="distro-table">(.*?)</table>', DISTROS_HTML, re.S)

images = []
images_by_id = {}

for ti, tbl in enumerate(distro_tables):
    fam_class = family_classes[ti] if ti < len(family_classes) else None
    fam_label = FAMILY_LABELS.get(fam_class, fam_class)
    fam_id = slugify(fam_class) if fam_class else None

    for row in data_rows(tbl):
        cells = cells_of(row)
        if len(cells) != len(DISTRO_KEYS):
            # tolerate by zipping the shorter length; preserves real data, no invention
            pass
        cell_text = {}
        for key, cell in zip(DISTRO_KEYS, cells):
            cell_text[key] = strip_tags(cell)

        # Name cell: primary name on the first line, optional <br><small> subtitle.
        # Use the primary name for id/name; keep the subtitle in `subtitle`.
        name_cell_html = cells[0] if cells else ""
        primary_html = re.split(r"<br\s*/?>", name_cell_html, maxsplit=1)[0]
        primary_name = strip_tags(primary_html)
        full_name = cell_text.get("name", "")
        subtitle = strip_tags(re.sub(re.escape(primary_html), "", name_cell_html, count=1)) \
            if primary_html != name_cell_html else ""

        name = primary_name or full_name
        if not name:
            continue
        ident = slugify(name)

        img = {
            "id": ident,
            "name": name,
            "label": name,
            "familyId": fam_id,
            "familyLabel": fam_label,
        }
        if subtitle:
            img["subtitle"] = subtitle
            add_prov("images.json", ident, "subtitle", SRC_DISTROS, "legacy", "high")

        # all 18 columns verbatim. Override `name` field with the full cell text
        # so no source text is lost, but keep id/name/label on the primary name.
        for key in DISTRO_KEYS:
            if key == "name":
                continue
            if key in cell_text:
                img[key] = cell_text[key]
                add_prov("images.json", ident, key, SRC_DISTROS, "legacy", "high")

        add_prov("images.json", ident, "name", SRC_DISTROS, "legacy", "high")
        add_prov("images.json", ident, "familyId", SRC_DISTROS, "legacy", "high")
        add_prov("images.json", ident, "familyLabel", SRC_DISTROS, "legacy", "high")

        images.append(img)
        images_by_id[ident] = img

# Index distros by canonical key for cross-file matching. Record first-token
# index too, for a fallback when the full key differs by a version suffix.
images_by_key = {}
images_by_firsttoken = {}
firsttoken_counts = {}
for img in images:
    k = distro_key(img["name"])
    images_by_key.setdefault(k, img)
    ft = k.split()[0] if k else ""
    if ft:
        firsttoken_counts[ft] = firsttoken_counts.get(ft, 0) + 1
        images_by_firsttoken.setdefault(ft, img)

# ---------------------------------------------------------------------------
# 2. Compliance ratings (10-linux-compliance.html) — Matrix 1
#    22 distros x 11 standards. Values: Yes / Par / — .
# ---------------------------------------------------------------------------
COMPLIANCE_HTML = read(COMPLIANCE)

# Matrix 1 is the first xref-table, after the first <h2>.
h2_matches = list(re.finditer(r"<h2[^>]*>(.*?)</h2>", COMPLIANCE_HTML, re.S))
m1_start = h2_matches[0].end()
m1_end = h2_matches[1].start() if len(h2_matches) > 1 else len(COMPLIANCE_HTML)
matrix1_seg = COMPLIANCE_HTML[m1_start:m1_end]
matrix1_tbl = re.search(r'<table class="xref-table">(.*?)</table>', matrix1_seg, re.S).group(1)

# Header order: col 0 = Distro, cols 1..11 = standards.
m1_headers = [strip_tags(h) for h in re.findall(r"<th[^>]*>(.*?)</th>", matrix1_tbl, re.S)]
COMPLIANCE_STANDARDS = m1_headers[1:]  # 11 standards

# Body rows: family group rows have 1 cell; data rows have 12 cells.
body = re.search(r"<tbody>(.*?)</tbody>", matrix1_tbl, re.S)
m1_src = body.group(1) if body else matrix1_tbl
m1_rows = [r for r in re.findall(r"<tr[^>]*>(.*?)</tr>", m1_src, re.S)
           if ("<td" in r or "<th" in r)]

compliance_by_distro = {}  # distro id -> {standard: rating}
compliance_rows_matched = 0
compliance_rows_unmatched = []

for row in m1_rows:
    cells = cells_of(row)
    if len(cells) != len(m1_headers):
        continue  # family group subheader row (1 cell) — skip
    distro_name = strip_tags(cells[0])
    ratings = {}
    for std, cell in zip(COMPLIANCE_STANDARDS, cells[1:]):
        ratings[std] = strip_tags(cell)
    compliance_by_distro[distro_name] = ratings

# Attach to images by canonical-key match (names differ across the two files).
# Primary: exact canonical key. Fallback: unique first token.
for distro_name, ratings in compliance_by_distro.items():
    ck = distro_key(distro_name)
    target = images_by_key.get(ck)
    if target is None:
        ft = ck.split()[0] if ck else ""
        if ft and firsttoken_counts.get(ft) == 1:
            target = images_by_firsttoken.get(ft)
    if target is not None:
        target["complianceRatings"] = ratings
        add_prov("images.json", target["id"], "complianceRatings", SRC_COMPLIANCE, "legacy", "high")
        compliance_rows_matched += 1
    else:
        compliance_rows_unmatched.append(distro_name)

# ---------------------------------------------------------------------------
# 3. Dockerfile templates (11-dockerfile-catalog.html) — 105 framework rows
#    Columns: Framework, Build FROM, Runtime FROM, Pattern, Pkg mgr, Port
# ---------------------------------------------------------------------------
CATALOG_HTML = read(CATALOG)

# Framework name -> framework id (from existing frameworks.json), match by slug of name.
frameworks = json.load(open(FRAMEWORKS_JSON, encoding="utf-8"))
fw_id_by_nameslug = {}
for f in frameworks:
    fw_id_by_nameslug.setdefault(slugify(f["name"]), f["id"])

# Catalog tables are in category order (c1..c30), matching categories.json.
# Used to give each template a stable category-scoped id and to keep distinct
# rows for frameworks that appear in more than one category table.
categories = json.load(open(CATEGORIES_JSON, encoding="utf-8"))
CATEGORY_ORDER = [c["id"] for c in sorted(categories, key=lambda x: x["num"])]

# 6 catalog framework cells use a short label that does not slug-match the catalog
# name. These are resolved to the correct framework id by an explicit, verified alias.
# sourceType for these id resolutions is "curated" (a normalized cross-reference).
FW_ALIASES = {
    "nextjs-edge": "06-nextjs-edge",       # Next.js Edge -> Next.js Edge Runtime
    "mf-webpack-5": "08-mf-webpack",       # MF Webpack 5 -> Module Federation
    "mf-rspack": "08-mf-rspack",           # MF Rspack -> Rspack (Module Fed. v2)
    "kotlin-jetpack-compose": "12-kotlin-jetpack",  # -> Kotlin + Jetpack Compose
    "minimal-apis": "19-minimal-apis",     # Minimal APIs -> Minimal APIs (.NET 9)
    "play": "25-play",                     # Play -> Play Framework
}

CATALOG_COL_LABELS = ["Framework", "Build FROM", "Runtime FROM", "Pattern", "Pkg mgr", "Port"]

# Runtime variant separators in catalog Runtime-FROM cells: only " / " (spaced
# slash), " · " (middot), " or ". A bare "/" inside an image ref like
# "denoland/deno:2.3.3" is NOT a separator, so the slash must be space-padded.
RT_SPLIT_RE = re.compile(r"\s+(?:/|·|or)\s+")


def split_runtime_variants(text):
    if not text:
        return []
    parts = [p.strip() for p in RT_SPLIT_RE.split(text) if p.strip()]
    return parts


catalog_tables = re.findall(r'<table class="xref-table">(.*?)</table>', CATALOG_HTML, re.S)

dockerfile_templates = []
tmpl_matched = 0
tmpl_unmatched = []

seen_template_ids = {}

for tbl_index, tbl in enumerate(catalog_tables):
    cat_id = CATEGORY_ORDER[tbl_index] if tbl_index < len(CATEGORY_ORDER) else None
    for row in data_rows(tbl):
        cells = cells_of(row)
        if len(cells) < 6:
            continue
        # Framework cell: name + optional <small> version.
        fw_cell = cells[0]
        version_m = re.search(r"<small[^>]*>(.*?)</small>", fw_cell, re.S)
        version = strip_tags(version_m.group(1)) if version_m else None
        name_only_html = re.sub(r"<small[^>]*>.*?</small>", "", fw_cell, flags=re.S)
        fw_name = strip_tags(name_only_html)

        name_slug = slugify(fw_name)
        fw_id = fw_id_by_nameslug.get(name_slug)
        id_source_type = "legacy"
        if fw_id is None:
            fw_id = FW_ALIASES.get(name_slug)
            id_source_type = "curated"

        build_from = strip_tags(cells[1])
        runtime_from = strip_tags(cells[2])
        pattern = strip_tags(cells[3])
        pkg_mgr = strip_tags(cells[4])
        port = strip_tags(cells[5])

        runtime_variants = split_runtime_variants(runtime_from)

        # Stable id: prefer the matched framework id; else slug of catalog name.
        # A framework can appear in several category tables, so disambiguate
        # repeats by appending the category id, then a counter if still clashing.
        base_id = fw_id if fw_id else name_slug
        tmpl_id = base_id
        if tmpl_id in seen_template_ids:
            tmpl_id = f"{base_id}-{cat_id}" if cat_id else base_id
            while tmpl_id in seen_template_ids:
                seen_template_ids[base_id] += 1
                tmpl_id = f"{base_id}-{cat_id}-{seen_template_ids[base_id]}"
        seen_template_ids[tmpl_id] = seen_template_ids.get(tmpl_id, 0)
        seen_template_ids.setdefault(base_id, 0)

        tmpl = {
            "id": tmpl_id,
            "name": fw_name,
            "label": fw_name,
            "categoryId": cat_id,
            "frameworkId": fw_id,
            "buildFrom": build_from or None,
            "runtimeFrom": runtime_from or None,
            "runtimeVariants": runtime_variants,
            "pattern": pattern or None,
            "pkgMgr": pkg_mgr or None,
            "port": port or None,
        }
        if version:
            tmpl["version"] = version

        if fw_id:
            tmpl_matched += 1
        else:
            tmpl_unmatched.append(fw_name)

        # Provenance on dockerfileTemplates rows (logged under images.json prov map).
        for field in ("name", "categoryId", "buildFrom", "runtimeFrom",
                      "runtimeVariants", "pattern", "pkgMgr", "port"):
            add_prov("dockerfileTemplates.json", tmpl_id, field, SRC_CATALOG, "legacy", "high")
        if version:
            add_prov("dockerfileTemplates.json", tmpl_id, "version", SRC_CATALOG, "legacy", "high")
        # frameworkId resolution: legacy when name matched, curated when aliased.
        add_prov("dockerfileTemplates.json", tmpl_id, "frameworkId", SRC_CATALOG,
                 id_source_type, "high" if id_source_type == "legacy" else "medium")

        dockerfile_templates.append(tmpl)


# ---------------------------------------------------------------------------
# Write outputs
# ---------------------------------------------------------------------------
def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


write_json(os.path.join(NODES, "images.json"), images)
write_json(os.path.join(NODES, "dockerfileTemplates.json"), dockerfile_templates)
write_json(os.path.join(PROV, "images.json"), prov)

print("images (distros):", len(images))
print("  with complianceRatings:", sum(1 for i in images if "complianceRatings" in i))
print("  compliance standards per distro:", len(COMPLIANCE_STANDARDS), COMPLIANCE_STANDARDS)
print("  compliance rows matched:", compliance_rows_matched)
print("  compliance rows unmatched:", compliance_rows_unmatched)
print("dockerfileTemplates:", len(dockerfile_templates))
print("  with frameworkId:", tmpl_matched)
print("  without frameworkId:", len(tmpl_unmatched), tmpl_unmatched)
print("provenance entries:", len(prov))
