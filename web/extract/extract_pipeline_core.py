#!/usr/bin/env python3
"""
Extractor for the pipeline-core node group.

Sources (legacy HTML, sourceType="legacy"):
  legacy/02-pipeline-schema.html  -> nodes/phases.json
  legacy/03-stage-types.html      -> nodes/stages.json
  legacy/04-tool-catalog.html     -> nodes/tools.json
  legacy/05-invariants.html       -> nodes/invariants.json

All values are extracted from the HTML. Nothing is invented.
Re-runnable: python3 extract_pipeline_core.py
"""

import json
import os
import re
import html
from html.parser import HTMLParser

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)          # .../web
REPO = os.path.dirname(ROOT)          # .../pipeline-studio
LEGACY = os.path.join(REPO, "legacy")
NODES = os.path.join(ROOT, "graph", "nodes")
PROV = os.path.join(ROOT, "graph", "provenance")

SRC_02 = os.path.join(LEGACY, "02-pipeline-schema.html")
SRC_03 = os.path.join(LEGACY, "03-stage-types.html")
SRC_04 = os.path.join(LEGACY, "04-tool-catalog.html")
SRC_05 = os.path.join(LEGACY, "05-invariants.html")

os.makedirs(NODES, exist_ok=True)
os.makedirs(PROV, exist_ok=True)

provenance = {}  # "nodefile#id.field" -> {source, sourceType, confidence}


def prov(nodefile, _id, field, source, sourcetype="legacy", confidence=1.0):
    provenance["%s#%s.%s" % (nodefile, _id, field)] = {
        "source": source,
        "sourceType": sourcetype,
        "confidence": confidence,
    }


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def slug(text):
    s = text.lower().strip()
    s = s.replace("&amp;", "and").replace("&", "and")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def strip_tags(s):
    """Remove HTML tags, unescape entities, collapse whitespace."""
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = s.replace("\xa0", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


# ===========================================================================
# 02 — PHASES
# ===========================================================================
def extract_phases():
    src = read(SRC_02)
    base = os.path.basename(SRC_02)
    out = []

    # --- Phase summary text (trigger conditions + outputs) from expand-content ---
    # Maps each phase heading (<h4>...) to the following paragraph lines.
    summary = {}
    m = re.search(
        r'Phase summary — trigger conditions and outputs.*?'
        r'<div class="expand-content">(.*?)</div>\s*</details>',
        src, re.DOTALL)
    if m:
        block = m.group(1)
        parts = re.split(r'<h4>(.*?)</h4>', block)
        # parts[0] is preamble; then alternating heading, body
        for i in range(1, len(parts), 2):
            heading = strip_tags(parts[i])
            body_html = parts[i + 1] if i + 1 < len(parts) else ""
            paras = [strip_tags(p) for p in re.findall(r'<p>(.*?)</p>', body_html, re.DOTALL)]
            paras = [p for p in paras if p]
            summary[heading] = paras

    # --- Phase blocks from the visual flow diagram ---
    # Each .phase-block has phase-num, phase-name, phase-trigger, and stage rows.
    block_re = re.compile(
        r'<div class="phase-block ([^"]+)">\s*'
        r'<div class="phase-header">(.*?)</div>\s*</div>\s*'  # header inner up to its close
        , re.DOTALL)

    # Simpler: split on phase-block occurrences and parse each chunk individually.
    chunks = re.split(r'<!--\s*(PHASE \d|REGISTRY|PROMOTIONS)\s*-->', src)
    # chunks alternate: text, marker, text, marker, ...
    phase_chunks = []
    for i in range(1, len(chunks), 2):
        marker = chunks[i]
        body = chunks[i + 1] if i + 1 < len(chunks) else ""
        phase_chunks.append((marker, body))

    # Heading-to-summary key resolution
    def summary_for(name):
        # name like "Bootstrap" / "Local Dev"; summary keys like "Phase 0 — Bootstrap"
        for k, v in summary.items():
            if name and name.lower() in k.lower():
                return v
            if k.lower().endswith(name.lower()):
                return v
        # Registry / Promotions match by exact word
        for k, v in summary.items():
            if k.strip().lower() == name.strip().lower():
                return v
        return []

    order = 0
    for marker, body in phase_chunks:
        # phase-num
        mn = re.search(r'<div class="phase-num [^"]*">(.*?)</div>', body)
        nm = re.search(r'<div class="phase-name">(.*?)</div>', body)
        tr = re.search(r'<div class="phase-trigger">(.*?)</div>', body)
        if not nm:
            continue
        num_label = strip_tags(mn.group(1)) if mn else ""
        name = strip_tags(nm.group(1))
        trigger = strip_tags(tr.group(1)) if tr else None

        pid = slug(num_label) if num_label else slug(name)
        if not pid:
            pid = slug(name)

        # Stages inside the flow block (non-promo): stage-item rows
        flow_stages = []
        for sm in re.finditer(
                r'<div class="stage-item"[^>]*><div class="stage-dot (\w+)"[^>]*></div>'
                r'<div class="stage-name">(.*?)</div></div>', body):
            stype = "DevSecOps" if sm.group(1) == "devsec" else "DevOps"
            sname = strip_tags(sm.group(2))
            flow_stages.append({"name": sname, "type": stype})

        # Parallel group label inside this phase block
        par = re.search(r'<div class="par-header">(.*?)</div>', body)
        parallel_group = strip_tags(par.group(1)) if par else None

        # Promotion environments (only present for PROMOTIONS chunk).
        # Split the env grid into cards by the promo-env-label markers, then
        # capture every promo-env-stage row inside each card.
        envs = []
        grid_inner = body
        parts = re.split(r'(<div class="promo-env-label \w+">)', grid_inner)
        for pi in range(1, len(parts), 2):
            card = parts[pi] + (parts[pi + 1] if pi + 1 < len(parts) else "")
            lab = re.search(r'<div class="promo-env-label (\w+)">(.*?)</div>', card)
            if not lab:
                continue
            env_key = lab.group(1)
            env_label = strip_tags(lab.group(2))
            env_stages = []
            for st in re.finditer(
                    r'<div class="promo-env-stage"[^>]*>\s*'
                    r'<div class="stage-dot (\w+)[^"]*"[^>]*></div>\s*([^<]*)</div>',
                    card):
                stype = "DevSecOps" if "devsec" in st.group(1) else "DevOps"
                sname = strip_tags(st.group(2))
                if sname:
                    env_stages.append({"name": sname, "type": stype})
            if env_stages:
                envs.append({"id": env_key, "label": env_label, "stages": env_stages})

        summ = summary_for(name if name not in ("Image store", "4 environments") else marker)
        # For Registry/Promotions the phase-name differs; resolve by marker
        if marker == "REGISTRY":
            summ = summary_for("Registry")
        elif marker == "PROMOTIONS":
            summ = summary_for("Promotions")

        rec = {
            "id": pid,
            "name": name,
            "label": (num_label + " — " + name).strip(" —") if num_label else name,
            "phaseNum": num_label or None,
            "marker": marker,
            "trigger": trigger,
            "order": order,
            "stages": flow_stages,
        }
        if parallel_group:
            rec["parallelGroup"] = parallel_group
        if envs:
            rec["promotionEnvironments"] = envs
        if summ:
            rec["summary"] = summ

        # provenance
        prov("phases.json", pid, "name", base)
        prov("phases.json", pid, "phaseNum", base)
        prov("phases.json", pid, "trigger", base)
        prov("phases.json", pid, "stages", base)
        if parallel_group:
            prov("phases.json", pid, "parallelGroup", base)
        if envs:
            prov("phases.json", pid, "promotionEnvironments", base)
        if summ:
            prov("phases.json", pid, "summary", base)

        out.append(rec)
        order += 1

    return out


# ===========================================================================
# 03 — STAGES
# ===========================================================================
def extract_stages():
    src = read(SRC_03)
    base = os.path.basename(SRC_03)
    out = []

    # Split the document into phase sections by <h2 ...>Phase / Registry / Promotions
    h2_re = re.compile(r'<h2 id="[^"]*">(.*?)</h2>(.*?)(?=<h2 |<hr>|<div class="totals-row")', re.DOTALL)
    seq = 0
    for hm in h2_re.finditer(src):
        phase_label = strip_tags(hm.group(1))
        section = hm.group(2)

        # The phase id slug
        phase_id = slug(phase_label.split("—")[0].strip())

        # Track parallel / track grouping as we walk rows in order.
        current_group = None  # parallel / sec-track / test-track / prod-only

        # Walk all <tr> rows (group markers and data rows) in document order.
        for tr in re.finditer(r'<tr([^>]*)>(.*?)</tr>', section, re.DOTALL):
            attrs = tr.group(1)
            inner = tr.group(2)

            # Skip the header row (contains <th>)
            if "<th" in inner:
                continue

            # Group marker rows
            cls = re.search(r'class="([^"]*)"', attrs)
            if cls and "grp-row" in cls.group(1):
                gtext = strip_tags(inner)
                gclasses = cls.group(1)
                if "parallel" in gclasses:
                    current_group = {"kind": "parallel", "label": gtext}
                elif "sec-track" in gclasses:
                    current_group = {"kind": "security-track", "label": gtext}
                elif "test-track" in gclasses:
                    current_group = {"kind": "test-track", "label": gtext}
                elif "prod-only" in gclasses:
                    current_group = {"kind": "prod-only", "label": gtext}
                else:
                    current_group = {"kind": "group", "label": gtext}
                continue

            tds = re.findall(r'<td([^>]*)>(.*?)</td>', inner, re.DOTALL)
            if not tds:
                continue

            stage_name = strip_tags(tds[0][1])
            if not stage_name:
                continue

            # Type from the badge in column 2
            stage_type = None
            if len(tds) >= 2:
                if "badge-devsec" in tds[1][1]:
                    stage_type = "DevSecOps"
                elif "badge-devops" in tds[1][1]:
                    stage_type = "DevOps"

            # Environments (promotions table 3rd column)
            environments = None
            if len(tds) >= 3:
                env_txt = strip_tags(tds[2][1])
                if env_txt:
                    environments = env_txt

            # "replaces" tag inside stage name cell (Argo Rollouts / Monitor)
            replaces = None
            rm = re.search(r'class="replaces-tag">(.*?)</span>', tds[0][1])
            if rm:
                replaces = strip_tags(rm.group(1))
                # strip the tag from the stage name
                stage_name = strip_tags(re.sub(r'<span class="replaces-tag">.*?</span>', '', tds[0][1]))

            sid = "%s-%s" % (phase_id, slug(stage_name))
            rec = {
                "id": sid,
                "name": stage_name,
                "label": stage_name,
                "type": stage_type,
                "phase": phase_label,
                "phaseId": phase_id,
                "order": seq,
            }
            if current_group:
                rec["parallelGroup"] = current_group["label"]
                rec["groupKind"] = current_group["kind"]
            if environments:
                rec["environments"] = environments
            if replaces:
                rec["replaces"] = replaces

            prov("stages.json", sid, "name", base)
            prov("stages.json", sid, "type", base)
            prov("stages.json", sid, "phase", base)
            if current_group:
                prov("stages.json", sid, "parallelGroup", base)
                prov("stages.json", sid, "groupKind", base)
            if environments:
                prov("stages.json", sid, "environments", base)
            if replaces:
                prov("stages.json", sid, "replaces", base)

            out.append(rec)
            seq += 1

    return out


# ===========================================================================
# 04 — TOOLS
# ===========================================================================
TOOL_COLS = [
    "tool", "license", "appliesTo", "changesWhen", "output",
    "ciIntegration", "mandatory", "whenToUse", "whenNot", "primaryTradeoff",
]


def extract_tools():
    src = read(SRC_04)
    base = os.path.basename(SRC_04)
    out = []

    # Track phase via <h2>, and split into stage-hd regions. A single stage-hd
    # region can contain MULTIPLE tool-tables (sub-tools). Capture every
    # 10-column data row across all tables inside the region.
    phase_marks = [(m.start(), strip_tags(m.group(1)))
                   for m in re.finditer(r'<h2 id="[^"]*"[^>]*>(.*?)</h2>', src)]

    def phase_at(pos):
        cur = None
        for p, name in phase_marks:
            if p <= pos:
                cur = name
            else:
                break
        return cur

    head_marks = [(m.start(), m.end(), m.group(1))
                  for m in re.finditer(r'<h3 class="stage-hd"[^>]*>(.*?)</h3>', src, re.DOTALL)]

    seq = 0
    used_ids = set()
    for i, (hstart, hend, head_html) in enumerate(head_marks):
        region_end = head_marks[i + 1][0] if i + 1 < len(head_marks) else len(src)
        region = src[hend:region_end]

        if "badge-devsec" in head_html:
            stage_type = "DevSecOps"
        elif "badge-devops" in head_html:
            stage_type = "DevOps"
        else:
            stage_type = None
        stage_name = strip_tags(head_html)
        stage_name = re.sub(r'^(DevSecOps|DevOps)\s+', '', stage_name)

        current_phase = phase_at(hstart)
        phase_id = slug(current_phase.split("—")[0].strip()) if current_phase else "unknown"

        row_idx = 0
        for tr in re.finditer(r'<tr[^>]*>(.*?)</tr>', region, re.DOTALL):
            tds = re.findall(r'<td[^>]*>(.*?)</td>', tr.group(1), re.DOTALL)
            if len(tds) < 10:
                continue
            values = [strip_tags(td) for td in tds[:10]]
            tool_name = values[0]
            tid = "%s-%s" % (slug(stage_name), slug(tool_name))
            base_tid = tid
            dup = 1
            while tid in used_ids:
                tid = "%s-%d" % (base_tid, dup)
                dup += 1
            used_ids.add(tid)

            rec = {
                "id": tid,
                "name": tool_name,
                "label": tool_name,
                "stage": stage_name,
                "stageType": stage_type,
                "phase": current_phase,
                "phaseId": phase_id,
                "order": seq,
            }
            for ci, col in enumerate(TOOL_COLS):
                rec[col] = values[ci]
                prov("tools.json", tid, col, base)
            prov("tools.json", tid, "stage", base)
            prov("tools.json", tid, "stageType", base)
            prov("tools.json", tid, "phase", base)

            out.append(rec)
            seq += 1
            row_idx += 1

    return out


# ===========================================================================
# 05 — INVARIANTS
# ===========================================================================
def extract_invariants():
    src = read(SRC_05)
    base = os.path.basename(SRC_05)
    out = []

    # Map phase via the most recent <h2 id=...>.
    events = []
    for m in re.finditer(r'<h2 id="[^"]*">(.*?)</h2>', src):
        events.append((m.start(), "phase", strip_tags(m.group(1))))
    for m in re.finditer(r'<tr id="(I-[^"]+)">(.*?)</tr>', src, re.DOTALL):
        events.append((m.start(), "inv", (m.group(1), m.group(2))))
    events.sort(key=lambda e: e[0])

    current_phase = None
    seq = 0
    for _pos, kind, payload in events:
        if kind == "phase":
            current_phase = payload
            continue
        inv_id, inner = payload
        cells = {}
        for cm in re.finditer(r'<td class="(col-\w+)">(.*?)</td>', inner, re.DOTALL):
            cells[cm.group(1)] = cm.group(2)

        stage = strip_tags(cells.get("col-stage", ""))
        condition = strip_tags(cells.get("col-inv", ""))
        if_violated = strip_tags(cells.get("col-viol", ""))
        enforced_by = strip_tags(cells.get("col-enf", ""))

        # Control class from badge
        class_html = cells.get("col-class", "")
        if "badge-sec" in class_html:
            control_class = "Security"
        elif "badge-comp" in class_html:
            control_class = "Compliance"
        elif "badge-proc" in class_html:
            control_class = "Process"
        else:
            control_class = strip_tags(class_html) or None

        phase_id = slug(current_phase.split("—")[0].strip()) if current_phase else None

        rec = {
            "id": inv_id,
            "name": inv_id,
            "label": "%s — %s" % (inv_id, condition) if condition else inv_id,
            "stage": stage,
            "condition": condition,
            "ifViolated": if_violated,
            "enforcedBy": enforced_by,
            "controlClass": control_class,
            "phase": current_phase,
            "phaseId": phase_id,
            "order": seq,
        }
        for field, val in (("stage", stage), ("condition", condition),
                           ("ifViolated", if_violated), ("enforcedBy", enforced_by),
                           ("controlClass", control_class), ("phase", current_phase)):
            prov("invariants.json", inv_id, field, base)

        out.append(rec)
        seq += 1

    return out


# ===========================================================================
# Write
# ===========================================================================
def write_json(name, data):
    path = os.path.join(NODES, name)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
    return path


def main():
    phases = extract_phases()
    stages = extract_stages()
    tools = extract_tools()
    invariants = extract_invariants()

    write_json("phases.json", phases)
    write_json("stages.json", stages)
    write_json("tools.json", tools)
    write_json("invariants.json", invariants)

    prov_path = os.path.join(PROV, "pipeline-core.json")
    with open(prov_path, "w", encoding="utf-8") as fh:
        json.dump(provenance, fh, indent=2, ensure_ascii=False)

    print("phases:     %d" % len(phases))
    print("stages:     %d" % len(stages))
    print("tools:      %d" % len(tools))
    print("invariants: %d" % len(invariants))
    print("provenance: %d keys" % len(provenance))


if __name__ == "__main__":
    main()
