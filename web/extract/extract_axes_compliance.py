#!/usr/bin/env python3
"""
Extractor for the axes-compliance graph group.

Sources (all real, parsed — never invented):
  legacy/21-build-axes.html         -> 8 build axes (default, valid values, appliesTo, per-value notes)
                                       + compliance per-value middleware detail
  legacy/12-compliance-variations.html -> compliance runtime behaviour (forces / required controls)
  legacy/10-linux-compliance.html   -> distro support (use/avoid) per standard + region hints
  legacy/17-feature-matrix.html     -> per-axis implementation status + appliesTo scope text

Outputs:
  web/graph/nodes/buildAxes.json    -> 8 axes
  web/graph/nodes/compliance.json   -> 8 compliance standards
  web/graph/provenance/axes-compliance.json

Only emits a force/value/field when the source states it. Absent -> omitted.
Stdlib only: html.parser via re + html.unescape.
"""

import json
import os
import re
import html

ROOT = "/mnt/c/Users/RohithY/yarova/pipeline-studio"
LEGACY = os.path.join(ROOT, "legacy")
NODES = os.path.join(ROOT, "web", "graph", "nodes")
PROV = os.path.join(ROOT, "web", "graph", "provenance")

SRC_AXES = "legacy/21-build-axes.html"
SRC_VAR = "legacy/12-compliance-variations.html"
SRC_LINUX = "legacy/10-linux-compliance.html"
SRC_MATRIX = "legacy/17-feature-matrix.html"


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def strip_tags(s):
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def ic_codes(cell_html):
    """Extract every <code class=ic>VALUE</code> token in document order."""
    return [html.unescape(m).strip() for m in
            re.findall(r'<code class="ic">(.*?)</code>', cell_html, re.S)]


provenance = {}


def prov(key, source, source_type, conf=1.0):
    provenance[key] = {"source": source, "sourceType": source_type, "confidence": conf}


# ──────────────────────────────────────────────────────────────────────
# 1. BUILD AXES  — from 21-build-axes.html quick-reference table (sec 2)
# ──────────────────────────────────────────────────────────────────────
axes_html = read(SRC_AXES)
matrix_html = read(SRC_MATRIX)

# Slug map for the 8 axes (ARG name -> slug + human label)
AXIS_META = {
    "BUILD_IMAGE": ("build-image", "Language / runtime family"),
    "RUNTIME": ("runtime", "OS variant / compliance mode"),
    "PKG_MGR": ("pkg-mgr", "Package manager"),
    "BUILD_TOOL": ("build-tool", "TypeScript compiler / bundler"),
    "COMPLIANCE": ("compliance", "Compliance preset"),
    "OBSERVABILITY": ("observability", "Observability stack"),
    "AUTH": ("auth", "Authentication method"),
    "ORM": ("orm", "Database access layer"),
}

# Grab the quick-reference table body (section 2). It is the first xref-table
# inside <h2 ... id="quick-reference"> ... <h2 ... id="axis-detail">.
qr_block = re.search(
    r'id="quick-reference".*?id="axis-detail"', axes_html, re.S
).group(0)
qr_table = re.search(r"<tbody>(.*?)</tbody>", qr_block, re.S).group(1)
qr_rows = re.findall(r"<tr>(.*?)</tr>", qr_table, re.S)

# Per-axis "applies to" scope text + status from the feature matrix axis cards.
# Map ARG -> (status, scope sentence) parsed from axis-card blocks.
matrix_axis = {}
# Each axis card starts at <span class="ac-arg">ARG</span>. Slice from one
# ac-arg to the next so status + scope stay inside the right card.
arg_marks = [(m.start(), m.group(1))
             for m in re.finditer(r'<span class="ac-arg">(\w+)</span>', matrix_html)]
for i, (pos, arg) in enumerate(arg_marks):
    end = arg_marks[i + 1][0] if i + 1 < len(arg_marks) else len(matrix_html)
    card = matrix_html[pos:end]
    status_m = re.search(r'<span class="s-(impl|des)">([^<]+)</span>', card)
    status = strip_tags(status_m.group(2)) if status_m else None
    scope_m = re.search(r'Scope:\s*applies to[^<.]*', strip_tags(card))
    scope = scope_m.group(0).strip() if scope_m else None
    matrix_axis[arg] = {"status": status, "scope": scope}

# Per-value notes: from the COMPLIANCE/OBSERVABILITY/AUTH detail tables we pull
# the short "Required for"/"Notes" style descriptions where the source gives them.
# For BUILD_IMAGE / RUNTIME / PKG_MGR / BUILD_TOOL the per-value "Notes" come
# straight from the detail tables in section 3.

def value_notes_from_table(anchor_id, value_col=0, note_col=-1):
    """Parse the first xref-table inside an axis-card with given id; return
    {value: note}. value_col/note_col index the <td> cells."""
    m = re.search(r'id="%s".*?</table>' % re.escape(anchor_id), axes_html, re.S)
    if not m:
        return {}
    tb = re.search(r"<tbody>(.*?)</tbody>", m.group(0), re.S)
    if not tb:
        return {}
    out = {}
    for row in re.findall(r"<tr>(.*?)</tr>", tb.group(1), re.S):
        cells = re.findall(r"<td.*?>(.*?)</td>", row, re.S)
        if len(cells) <= max(value_col, note_col if note_col >= 0 else 0):
            continue
        val_codes = ic_codes(cells[value_col])
        if not val_codes:
            continue
        val = val_codes[0]
        note = strip_tags(cells[note_col])
        if note:
            out[val] = note
    return out

build_image_notes = value_notes_from_table("axis-build-image")
runtime_notes = value_notes_from_table("axis-runtime")  # last col = "Use when"
build_tool_notes = value_notes_from_table("axis-build-tool")

# PKG_MGR has two tables (Node, Python). Parse both note maps.
pkg_block = re.search(r'id="axis-pkg-mgr".*?(?=<!-- BUILD_TOOL)', axes_html, re.S).group(0)
pkg_notes = {}
for tb in re.findall(r"<tbody>(.*?)</tbody>", pkg_block, re.S):
    for row in re.findall(r"<tr>(.*?)</tr>", tb, re.S):
        cells = re.findall(r"<td.*?>(.*?)</td>", row, re.S)
        if not cells:
            continue
        vc = ic_codes(cells[0])
        if vc:
            pkg_notes[vc[0]] = strip_tags(cells[-1])

# COMPLIANCE/OBSERVABILITY/AUTH/ORM per-value short notes from feature-matrix
# "Values" tables where present (cleanest one-line descriptions).
def matrix_value_notes(arg):
    """From 17-feature-matrix axis card with given ARG, parse its Values table
    -> {value: 'what it adds'}."""
    card_m = re.search(
        r'<span class="ac-arg">%s</span>.*?(?=<span class="ac-arg">|</main>)'
        % re.escape(arg), matrix_html, re.S)
    if not card_m:
        return {}
    card = card_m.group(0)
    # The per-value table lives in the <details> whose <summary> says "Values".
    # Prefer that; fall back to the last <tbody> (Values table comes after the
    # "Applies?" scope table).
    vals_m = re.search(
        r'<summary>[^<]*Values.*?<tbody>(.*?)</tbody>', card, re.S)
    if vals_m:
        body = vals_m.group(1)
    else:
        bodies = re.findall(r"<tbody>(.*?)</tbody>", card, re.S)
        if not bodies:
            return {}
        body = bodies[-1]
    out = {}
    for row in re.findall(r"<tr>(.*?)</tr>", body, re.S):
        cells = re.findall(r"<td.*?>(.*?)</td>", row, re.S)
        if len(cells) < 2:
            continue
        # matrix Values tables use plain <code>VALUE</code> (no class="ic").
        codes = re.findall(r"<code[^>]*>(.*?)</code>", cells[0], re.S)
        if codes:
            val = html.unescape(codes[0]).strip()
        else:
            txt = strip_tags(cells[0])
            val = txt.split()[0] if txt else None
        if not val:
            continue
        out[val] = strip_tags(cells[1])
    return out

compliance_value_notes = matrix_value_notes("COMPLIANCE")
auth_value_notes = matrix_value_notes("AUTH")
obs_value_notes = matrix_value_notes("OBSERVABILITY")
orm_value_notes = matrix_value_notes("ORM")

NOTE_MAPS = {
    "BUILD_IMAGE": build_image_notes,
    "RUNTIME": runtime_notes,
    "PKG_MGR": pkg_notes,
    "BUILD_TOOL": build_tool_notes,
    "COMPLIANCE": compliance_value_notes,
    "OBSERVABILITY": obs_value_notes,
    "AUTH": auth_value_notes,
    "ORM": orm_value_notes,
}

build_axes = []
for row in qr_rows:
    cells = re.findall(r"<td.*?>(.*?)</td>", row, re.S)
    if len(cells) != 4:
        continue
    arg = ic_codes(cells[0])[0]
    if arg not in AXIS_META:
        continue
    slug, label = AXIS_META[arg]

    # Default column: keep the raw codes (some axes are language-conditional).
    default_codes = ic_codes(cells[1])
    default_raw = strip_tags(cells[1])

    # Valid values: every ic code token, deduped preserving order.
    valid = []
    for v in ic_codes(cells[2]):
        if v not in valid:
            valid.append(v)

    applies_to = strip_tags(cells[3])

    # Per-value notes (only where source states one).
    notes = {}
    nm = NOTE_MAPS.get(arg, {})
    for v in valid:
        if v in nm and nm[v]:
            notes[v] = nm[v]

    obj = {
        "id": slug,
        "name": arg,
        "label": label,
        "arg": arg,
        "validValues": valid,
        "appliesTo": applies_to,
    }
    # default: prefer single code if exactly one, else raw string
    if len(default_codes) == 1:
        obj["default"] = default_codes[0]
    else:
        obj["default"] = default_raw
    if notes:
        obj["valueNotes"] = notes

    # implementation status + scope from feature matrix (only if present)
    mx = matrix_axis.get(arg)
    if mx:
        if mx.get("status"):
            obj["implStatus"] = mx["status"]
            prov(f"buildAxes.json#{slug}.implStatus", SRC_MATRIX, "legacy")
        if mx.get("scope"):
            obj["scope"] = mx["scope"]
            prov(f"buildAxes.json#{slug}.scope", SRC_MATRIX, "legacy")

    build_axes.append(obj)

    for fld in ("name", "label", "arg", "validValues", "appliesTo", "default"):
        prov(f"buildAxes.json#{slug}.{fld}", SRC_AXES, "legacy")
    prov(f"buildAxes.json#{slug}.id", SRC_AXES, "curated")
    if notes:
        prov(f"buildAxes.json#{slug}.valueNotes", SRC_AXES, "legacy")

build_axes.sort(key=lambda a: a["id"])


# ──────────────────────────────────────────────────────────────────────
# 2. COMPLIANCE STANDARDS
# ──────────────────────────────────────────────────────────────────────
var_html = read(SRC_VAR)
linux_html = read(SRC_LINUX)

# 2a. Static facts stated explicitly in the docs.
# region[]: derived ONLY from explicit "US"/"Canada"/etc statements in source.
# forces{axis->value}: only fips states a hard force (COMPLIANCE=fips => RUNTIME=fips).
STANDARD_REGION = {
    # Each region only where the source text names a jurisdiction.
    "standard": [],                         # "Commercial baseline" - no region stated
    "hipaa": ["US"],                        # "US healthcare" / HIPAA US law (doc12,17,21)
    "pci": [],                              # PCI DSS card networks - no jurisdiction stated
    "pipeda": ["CA"],                       # "Canadian" / PIPEDA Schedule 1 (doc12,17,21)
    "fips": ["US"],                         # "US federal" (doc12,17,21)
    "soc2": [],                             # SaaS audit - no jurisdiction stated
    "cmmc": ["US"],                         # "US DoD contractors" (doc21)
    "nerc": [],                             # energy grid - no jurisdiction stated in source
}

# forces: only where a doc states a hard build-axis constraint.
STANDARD_FORCES = {
    "fips": {"RUNTIME": "fips"},  # 21: "COMPLIANCE=fips requires RUNTIME=fips" (build guard)
}

# distro support from 10-linux-compliance picker table (use/avoid).
# keyed by the picker "Regulation" label -> our standard slug.
PICKER_TO_SLUG = {
    "FIPS 140-2": "fips",
    "HIPAA": "hipaa",
    "PCI DSS": "pci",
    "PIPEDA (Canada)": "pipeda",
}
picker_tb = re.search(
    r'<table class="picker-table">(.*?)</table>', linux_html, re.S).group(1)
distro_support = {}  # slug -> {"use":[...], "avoid":[...], "why": str}
for row in re.findall(r"<tr>(.*?)</tr>", picker_tb, re.S):
    cells = re.findall(r"<td.*?>(.*?)</td>", row, re.S)
    if len(cells) != 4:
        continue
    reg = strip_tags(cells[0])
    slug = PICKER_TO_SLUG.get(reg)
    if not slug:
        continue
    use = [x.strip() for x in strip_tags(cells[1]).split(",") if x.strip()]
    avoid_raw = strip_tags(cells[2])
    avoid = [] if "No hard technical restriction" in avoid_raw else \
        [x.strip() for x in avoid_raw.split(",") if x.strip()]
    distro_support[slug] = {
        "use": use,
        "avoid": avoid,
        "why": strip_tags(cells[3]),
    }

# required controls + label + use-when, from 12-compliance-variations overview
# table (id="overview") and runtime behaviour matrix (id="matrix").
ov_block = re.search(r'id="overview".*?id="matrix"', var_html, re.S).group(0)
ov_tb = re.search(r"<tbody>(.*?)</tbody>", ov_block, re.S).group(1)
overview = {}  # slug -> {"middleware":..., "startup":..., "useWhen":...}
for row in re.findall(r"<tr>(.*?)</tr>", ov_tb, re.S):
    cells = re.findall(r"<td.*?>(.*?)</td>", row, re.S)
    if len(cells) != 4:
        continue
    slug = strip_tags(cells[0])
    overview[slug] = {
        "middleware": strip_tags(cells[1]),
        "startupCheck": strip_tags(cells[2]).lstrip("✓✗ ").strip(),
        "useWhen": strip_tags(cells[3]),
    }

# runtime behaviour matrix (id="matrix") -> structured required controls.
mx_block = re.search(r'id="matrix".*?</table>', var_html, re.S).group(0)
mx_tb = re.search(r"<tbody>(.*?)</tbody>", mx_block, re.S).group(1)
DASH = {"—", "-", ""}
behaviour = {}  # slug -> dict of control columns
MX_COLS = ["startup", "blockedPaths", "auditLog", "piiMasking",
           "headersAdded", "noEgress", "verboseErrors"]
for row in re.findall(r"<tr>(.*?)</tr>", mx_tb, re.S):
    cells = re.findall(r"<td.*?>(.*?)</td>", row, re.S)
    if len(cells) != 8:
        continue
    slug = strip_tags(cells[0])
    d = {}
    for i, col in enumerate(MX_COLS, start=1):
        txt = strip_tags(cells[i])
        if txt not in DASH:
            d[col] = txt
    behaviour[slug] = d

# Human labels for each standard (from 21-build-axes mw-card headers).
STANDARD_LABEL = {
    "standard": "standard — No extra middleware",
    "hipaa": "HIPAA — Healthcare data",
    "pci": "PCI DSS — Payment card data",
    "pipeda": "PIPEDA — Canadian personal information",
    "fips": "FIPS 140-2 — US federal cryptography",
    "soc2": "SOC 2 — Service organization controls",
    "cmmc": "CMMC — Defense supply chain",
    "nerc": "NERC CIP — Energy grid / OT-IT boundary",
}

# The 8 standards = COMPLIANCE axis valid values (from doc 21 quick-ref).
compliance_values = next(
    a["validValues"] for a in build_axes if a["id"] == "compliance")

compliance = []
for slug in compliance_values:
    obj = {
        "id": slug,
        "name": slug,
        "label": STANDARD_LABEL.get(slug, slug),
    }
    prov(f"compliance.json#{slug}.id", SRC_AXES, "legacy")
    prov(f"compliance.json#{slug}.name", SRC_AXES, "legacy")
    prov(f"compliance.json#{slug}.label", SRC_AXES, "legacy")

    region = STANDARD_REGION.get(slug, [])
    if region:
        obj["region"] = region
        prov(f"compliance.json#{slug}.region", SRC_VAR, "legacy")

    forces = STANDARD_FORCES.get(slug)
    if forces:
        obj["forces"] = forces
        prov(f"compliance.json#{slug}.forces", SRC_AXES, "legacy")

    if slug in distro_support:
        obj["distroSupport"] = distro_support[slug]
        prov(f"compliance.json#{slug}.distroSupport", SRC_LINUX, "legacy")

    # required controls: structured runtime behaviour (only stated columns).
    if slug in behaviour and behaviour[slug]:
        obj["requiredControls"] = behaviour[slug]
        prov(f"compliance.json#{slug}.requiredControls", SRC_VAR, "legacy")

    if slug in overview:
        ov = overview[slug]
        if ov.get("middleware") and ov["middleware"].lower() not in (
                "none — applycompliance is a no-op",):
            obj["middleware"] = ov["middleware"]
            prov(f"compliance.json#{slug}.middleware", SRC_VAR, "legacy")
        else:
            obj["middleware"] = ov["middleware"]
            prov(f"compliance.json#{slug}.middleware", SRC_VAR, "legacy")
        if ov.get("useWhen"):
            obj["useWhen"] = ov["useWhen"]
            prov(f"compliance.json#{slug}.useWhen", SRC_VAR, "legacy")
        if ov.get("startupCheck") and ov["startupCheck"].lower() != "none":
            obj["startupCheck"] = ov["startupCheck"]
            prov(f"compliance.json#{slug}.startupCheck", SRC_VAR, "legacy")

    compliance.append(obj)

compliance.sort(key=lambda c: c["id"])


# ──────────────────────────────────────────────────────────────────────
# write
# ──────────────────────────────────────────────────────────────────────
os.makedirs(NODES, exist_ok=True)
os.makedirs(PROV, exist_ok=True)

with open(os.path.join(NODES, "buildAxes.json"), "w", encoding="utf-8") as f:
    json.dump(build_axes, f, indent=2, ensure_ascii=False)
with open(os.path.join(NODES, "compliance.json"), "w", encoding="utf-8") as f:
    json.dump(compliance, f, indent=2, ensure_ascii=False)
with open(os.path.join(PROV, "axes-compliance.json"), "w", encoding="utf-8") as f:
    json.dump(provenance, f, indent=2, ensure_ascii=False)

print("buildAxes:", len(build_axes))
print("compliance:", len(compliance))
print("provenance keys:", len(provenance))
print("axes ids:", [a["id"] for a in build_axes])
print("compliance ids:", [c["id"] for c in compliance])
