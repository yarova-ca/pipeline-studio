#!/usr/bin/env python3
"""
Extract industries / verticals / regions for the 'industries' group.

Sources (all REAL values, no invention):
  legacy/07-canada-schema.html      -> industry x compliance x regulator master table
                                       + provinces/territories table + hubs table
  legacy/14-canada-industry-catalog.html -> per-industry market: demand, tier, wage,
                                       employers by province, entry notes

Outputs:
  web/graph/nodes/industries.json
  web/graph/nodes/verticals.json
  web/graph/nodes/regions.json
  web/graph/provenance/industries.json
"""

import os
import re
import json
import html
from html.parser import HTMLParser

ROOT = "/mnt/c/Users/RohithY/yarova/pipeline-studio"
LEGACY = os.path.join(ROOT, "legacy")
NODES = os.path.join(ROOT, "web", "graph", "nodes")
PROV = os.path.join(ROOT, "web", "graph", "provenance")

SCHEMA_HTML = os.path.join(LEGACY, "07-canada-schema.html")
CATALOG_HTML = os.path.join(LEGACY, "14-canada-industry-catalog.html")

os.makedirs(NODES, exist_ok=True)
os.makedirs(PROV, exist_ok=True)


def slugify(s):
    s = html.unescape(s)
    s = s.lower().strip()
    s = re.sub(r"&", " and ", s)
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")


def clean(s):
    """Unescape entities and collapse whitespace, but keep the source text intact."""
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s)


def split_list(cell, seps=(" · ",)):
    """Split a cell on the bullet separator used in the schema table."""
    txt = clean(cell)
    if not txt:
        return []
    parts = [txt]
    for sep in seps:
        new = []
        for p in parts:
            new.extend(p.split(sep))
        parts = new
    return [p.strip() for p in parts if p.strip()]


# ----------------------------------------------------------------------------
# 1. Parse the industry master table from 07
# ----------------------------------------------------------------------------

with open(SCHEMA_HTML, encoding="utf-8") as f:
    schema_src = f.read()

with open(CATALOG_HTML, encoding="utf-8") as f:
    catalog_src = f.read()

provenance = {}


def prov(key, source, source_type, confidence):
    provenance[key] = {
        "source": source,
        "sourceType": source_type,
        "confidence": confidence,
    }


SCHEMA_REL = "legacy/07-canada-schema.html"
CATALOG_REL = "legacy/14-canada-industry-catalog.html"

# Vertical divider rows: capture vertical name + declared industry count + css key
vert_rows = re.findall(
    r'<tr class="vert-row (\w+)"><td colspan="11">(.*?)<span class="vert-count">(\d+)\s*industries?</span>',
    schema_src,
)
# Map css-key -> {name, declaredCount}
vertical_meta = {}
vertical_order = []
for css_key, name, count in vert_rows:
    nm = clean(name)
    vertical_meta[css_key] = {"name": nm, "declaredCount": int(count)}
    vertical_order.append((css_key, nm))

# Extract the industry tbody region (between "All 73 industries" table thead and its closing)
# Find the ind-table block.
ind_table_start = schema_src.index('<table class="ind-table">')
ind_table_end = schema_src.index("</table>", ind_table_start)
ind_table = schema_src[ind_table_start:ind_table_end]

# Walk the tbody row by row, tracking the current vertical from divider rows.
# Each data row holds c0,c1,c2,c8,c9,c10,c11,c12,c13,c14,c15.
row_iter = re.finditer(
    r'<tr class="vert-row (\w+)">|<tr>\s*(<td class="c0">.*?)</tr>',
    ind_table,
    re.DOTALL,
)

industries = []
current_vertical_css = None
current_vertical_name = None

CELL_RE = re.compile(r'<td class="(c\d+)">(.*?)</td>', re.DOTALL)

for m in row_iter:
    if m.group(1):  # vertical divider row
        current_vertical_css = m.group(1)
        current_vertical_name = vertical_meta.get(
            current_vertical_css, {}
        ).get("name")
        continue
    row_html = m.group(2)
    cells = {k: v for k, v in CELL_RE.findall(row_html)}
    num = clean(strip_tags(cells.get("c0", "")))
    name = clean(strip_tags(cells.get("c1", "")))
    if not name:
        continue
    vertical_name = clean(strip_tags(cells.get("c2", ""))) or current_vertical_name
    iid = slugify(name)
    vert_id = slugify(vertical_name) if vertical_name else None

    mandatory = split_list(cells.get("c8", ""))
    optional = split_list(cells.get("c9", ""))
    regulators = split_list(cells.get("c10", ""))
    sensitivity = split_list(cells.get("c11", ""))
    framework_notes = clean(strip_tags(cells.get("c12", "")))
    # pipeline stages are comma separated, not bullet separated
    stages_raw = clean(strip_tags(cells.get("c13", "")))
    stages = [s.strip() for s in stages_raw.split(",") if s.strip()]
    sec_req = split_list(cells.get("c14", ""))
    audit_req = split_list(cells.get("c15", ""))

    obj = {
        "id": iid,
        "name": name,
        "rowNumber": int(num) if num.isdigit() else None,
        "verticalId": vert_id,
        "vertical": vertical_name,
        "region": "CA",
        "mandatoryCompliance": mandatory,
        "optionalCompliance": optional,
        "regulators": regulators,
        "dataSensitivity": sensitivity,
        "pipelineStagesAffected": stages,
        "frameworkNotes": framework_notes,
        "securityAuditRequirements": {
            "keySecurityRequirements": sec_req,
            "auditRequirements": audit_req,
        },
        "market": None,
    }
    industries.append(obj)

    pfx = f"industries.json#{iid}"
    prov(f"{pfx}.name", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.verticalId", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.mandatoryCompliance", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.optionalCompliance", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.regulators", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.dataSensitivity", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.pipelineStagesAffected", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.frameworkNotes", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.securityAuditRequirements", SCHEMA_REL, "legacy", 1.0)


# ----------------------------------------------------------------------------
# 2. Parse the catalog (14) for market data, match to industries by name
# ----------------------------------------------------------------------------

DEMAND_MAP = {
    "d-hot": "Hot",
    "d-warm": "Warm",
    "d-flat": "Flat",
    "d-declining": "Declining",
}


def norm_name(s):
    """Normalize an industry name for cross-doc matching."""
    s = html.unescape(s).lower()
    s = re.sub(r"&", " and ", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# Stopwords that carry no industry identity — they describe the *medium*,
# not the *industry*. Excluded from the token-overlap score so e.g.
# "Mining & Resources" matches "Mining & Resources Technology".
MATCH_STOPWORDS = {
    "technology", "tech", "it", "and", "the", "of", "services", "service",
    "systems", "system", "products", "product", "solutions", "platform",
}


def match_tokens(s):
    return {t for t in norm_name(s).split() if t not in MATCH_STOPWORDS}


# Split catalog into details blocks.
detail_blocks = re.split(r'<details class="ind-details">', catalog_src)[1:]

catalog_by_name = {}
for block in detail_blocks:
    # summary section ends at </summary>
    sm = re.search(r"<summary>(.*?)</summary>", block, re.DOTALL)
    if not sm:
        continue
    summary = sm.group(1)
    name_m = re.search(r'<span class="sum-label">(.*?)</span>', summary, re.DOTALL)
    if not name_m:
        continue
    cat_name = clean(strip_tags(name_m.group(1)))

    demand = None
    dm = re.search(r'<span class="(d-\w+)">', summary)
    if dm:
        demand = DEMAND_MAP.get(dm.group(1))

    tier = None
    tm = re.search(r'<span class="t-chip">(.*?)</span>', summary)
    if tm:
        tier = clean(strip_tags(tm.group(1)))

    wage = None
    wm = re.search(r"(CA\$[^<]+)<", summary)
    if wm:
        wage = clean(wm.group(1))

    # Employers by Province card -> table rows province / named employers
    employers = {}
    emp_card = re.search(
        r'<div class="ic-head">Employers by Province</div>(.*?)</div></div>',
        block,
        re.DOTALL,
    )
    if emp_card:
        for prov_m in re.finditer(
            r"<tr><td[^>]*>(.*?)</td><td[^>]*>(.*?)</td></tr>",
            emp_card.group(1),
            re.DOTALL,
        ):
            province = clean(strip_tags(prov_m.group(1)))
            named = clean(strip_tags(prov_m.group(2)))
            if province and province.lower() != "province":
                employers[province] = named

    # Entry Notes card -> list of li
    entry_notes = []
    entry_card = re.search(
        r'<div class="ic-head">Entry Notes</div>(.*?)</div></div>',
        block,
        re.DOTALL,
    )
    if entry_card:
        entry_notes = [
            clean(strip_tags(li))
            for li in re.findall(r"<li>(.*?)</li>", entry_card.group(1), re.DOTALL)
        ]

    catalog_by_name[cat_name] = {
        "demand": demand,
        "tier": tier,
        "wage": wage,
        "employersByProvince": employers,
        "entry": entry_notes,
    }

# Attach market data from catalog (14) to schema industries (07).
#
# DECISION: the two docs use DIFFERENT industry rosters (07 = 73 compliance
# industries, 14 = 73 catalog industries with different names/groupings).
# A positional/row-number join would mis-assign market data = fabrication.
# So we join on NAME only, and only when the match is confident.
#
# Match tiers, highest first:
#   1.0  exact normalized name match.
#   >=0.85 Jaccard on identity tokens (stopwords removed).
# Below 0.85: market left null. No guessing.
MATCH_THRESHOLD = 0.85

cat_norm = {norm_name(n): n for n in catalog_by_name}
cat_token = {n: match_tokens(n) for n in catalog_by_name}

# One catalog entry maps to at most one schema industry (best score wins).
used_catalog = set()
candidates = []  # (score, schema_id, catalog_name, exact_flag)
for ind in industries:
    ns = norm_name(ind["name"])
    st = match_tokens(ind["name"])
    # exact normalized
    if ns in cat_norm:
        candidates.append((1.0, ind["id"], cat_norm[ns], True))
        continue
    if not st:
        continue
    best, best_score = None, 0.0
    for cname, ct in cat_token.items():
        if not ct:
            continue
        inter = len(st & ct)
        union = len(st | ct)
        j = inter / union if union else 0.0
        if j > best_score:
            best_score, best = j, cname
    if best is not None and best_score >= MATCH_THRESHOLD:
        candidates.append((best_score, ind["id"], best, False))

# Apply best candidates first so high-confidence wins the catalog entry.
candidates.sort(key=lambda x: -x[0])
ind_by_id = {i["id"]: i for i in industries}
matched = 0
for score, sid, cname, exact in candidates:
    if cname in used_catalog:
        continue
    ind = ind_by_id[sid]
    if ind["market"] is not None:
        continue
    used_catalog.add(cname)
    mk = catalog_by_name[cname]
    ind["market"] = {
        "catalogName": cname if not exact else None,
        "matchConfidence": round(score, 3),
        "employersByProvince": mk["employersByProvince"],
        "wage": mk["wage"],
        "demand": mk["demand"],
        "tier": mk["tier"],
        "entry": mk["entry"],
    }
    matched += 1
    pfx = f"industries.json#{sid}"
    conf = 1.0 if exact else round(score, 3)
    src_type = "legacy" if exact else "curated"
    prov(f"{pfx}.market.demand", CATALOG_REL, src_type, conf)
    prov(f"{pfx}.market.tier", CATALOG_REL, src_type, conf)
    prov(f"{pfx}.market.wage", CATALOG_REL, src_type, conf)
    prov(f"{pfx}.market.employersByProvince", CATALOG_REL, src_type, conf)
    prov(f"{pfx}.market.entry", CATALOG_REL, src_type, conf)


# ----------------------------------------------------------------------------
# 3. Verticals node (distinct verticals + industry counts)
# ----------------------------------------------------------------------------

vert_counts = {}
for ind in industries:
    if ind["verticalId"]:
        vert_counts[ind["verticalId"]] = vert_counts.get(ind["verticalId"], 0) + 1

verticals = []
seen_vert = set()
for css_key, name in vertical_order:
    vid = slugify(name)
    if vid in seen_vert:
        continue
    seen_vert.add(vid)
    declared = vertical_meta[css_key]["declaredCount"]
    verticals.append(
        {
            "id": vid,
            "name": name,
            "cssKey": css_key,
            "industryCount": vert_counts.get(vid, 0),
            "declaredIndustryCount": declared,
        }
    )
    pfx = f"verticals.json#{vid}"
    prov(f"{pfx}.name", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.declaredIndustryCount", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.industryCount", SCHEMA_REL, "curated", 1.0)


# ----------------------------------------------------------------------------
# 4. Regions node: provinces/territories table + hubs table from 07
# ----------------------------------------------------------------------------

# Provinces table is the first gen-table after "Provinces" — locate by header cells.
# Find the table that contains "Province / Territory" header.
prov_table_idx = schema_src.index("Province / Territory")
prov_tbl_start = schema_src.index("<tbody>", prov_table_idx)
prov_tbl_end = schema_src.index("</tbody>", prov_tbl_start)
prov_tbl = schema_src[prov_tbl_start:prov_tbl_end]

regions = []
for rm in re.finditer(r"<tr>(.*?)</tr>", prov_tbl, re.DOTALL):
    tds = re.findall(r"<td>(.*?)</td>", rm.group(1), re.DOTALL)
    if len(tds) < 6:
        continue
    code = clean(strip_tags(tds[0]))
    name = clean(strip_tags(tds[1]))
    rtype = clean(strip_tags(tds[2]))
    key_sectors = clean(strip_tags(tds[3]))
    notable_hubs = clean(strip_tags(tds[4]))
    privacy_reg = clean(strip_tags(tds[5]))
    rid = slugify(name)
    regions.append(
        {
            "id": rid,
            "code": code,
            "name": name,
            "type": rtype,
            "keySectors": [s.strip() for s in key_sectors.split(",") if s.strip()],
            "notableHubs": [h.strip() for h in notable_hubs.split(",") if h.strip()],
            "privacyRegulator": privacy_reg,
            "hubs": [],
        }
    )
    pfx = f"regions.json#{rid}"
    prov(f"{pfx}.code", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.name", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.type", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.keySectors", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.notableHubs", SCHEMA_REL, "legacy", 1.0)
    prov(f"{pfx}.privacyRegulator", SCHEMA_REL, "legacy", 1.0)

regions_by_code = {r["code"]: r for r in regions}

# Hubs table: find the gen-table after "Major industry hubs".
hubs_idx = schema_src.index("Major industry hubs")
hub_tbl_start = schema_src.index("<tbody>", hubs_idx)
hub_tbl_end = schema_src.index("</tbody>", hub_tbl_start)
hub_tbl = schema_src[hub_tbl_start:hub_tbl_end]

for hm in re.finditer(r"<tr>(.*?)</tr>", hub_tbl, re.DOTALL):
    tds = re.findall(r"<td>(.*?)</td>", hm.group(1), re.DOTALL)
    if len(tds) < 5:
        continue
    hub_name = clean(strip_tags(tds[0]))
    prov_code = clean(strip_tags(tds[1]))
    region_zone = clean(strip_tags(tds[2]))
    specialization = clean(strip_tags(tds[3]))
    anchors = clean(strip_tags(tds[4]))
    hub_obj = {
        "hub": hub_name,
        "provinceCode": prov_code,
        "regionZone": region_zone,
        "specialization": [
            s.strip() for s in specialization.split(",") if s.strip()
        ],
        "notableInstitutions": anchors,
    }
    if prov_code in regions_by_code:
        regions_by_code[prov_code]["hubs"].append(hub_obj)
        rid = regions_by_code[prov_code]["id"]
        prov(f"regions.json#{rid}.hubs", SCHEMA_REL, "legacy", 1.0)


# ----------------------------------------------------------------------------
# 5. Write outputs
# ----------------------------------------------------------------------------

def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


write_json(os.path.join(NODES, "industries.json"), industries)
write_json(os.path.join(NODES, "verticals.json"), verticals)
write_json(os.path.join(NODES, "regions.json"), regions)
write_json(os.path.join(PROV, "industries.json"), provenance)

print("industries:", len(industries))
print("verticals:", len(verticals))
print("regions:", len(regions))
print("market matched:", matched)
print("provenance keys:", len(provenance))
print("hubs total:", sum(len(r["hubs"]) for r in regions))
