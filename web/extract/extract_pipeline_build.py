#!/usr/bin/env python3
"""Extractor for pipeline-build group.

Source: legacy/13-pipeline-build-catalog.html
Output: web/graph/nodes/frameworkPipelines.json
Provenance: web/graph/provenance/pipeline-build.json

Strategy: pure stdlib (re + html). The source is hand-written HTML with a
predictable shape, so we slice it by anchors and parse the framework
<details class="fw-details"> blocks directly. No values are invented; when a
field is absent in the source it is set to null or omitted.

Per-framework structure in the source:
  <details class="fw-details">
    <summary>
      <span class="sum-label">NAME <span ...>VERSION</span></span>
      <span ...>LANGUAGE</span>
      <span class="... pat-chip">PATTERN</span>
    </summary>
    <div class="expand-content">
      <p class="note-info"><strong>X note:</strong> ...</p>   (env instructions)
      <div class="phase-strip">...</div>
      <table>
        <tr><td colspan="4" class="phase-hdr phN">PHASE NAME</td></tr>
        <tr><td class="row-label">STAGE</td>
            <td><span class="type-...">TYPE</span></td>
            <td>TOOL</td>
            <td><code ...>COMMAND</code></td></tr>
        ...
      </table>
    </div>
  </details>

The stage table has 4 columns (Stage, Type, Tool, Command). There is NO
"What it catches" column in this source, so whatItCatches is set to null
for every stage rather than fabricated.

complianceDeltas: the source has ONE global "Compliance Standard Pipeline
Deltas" table (id="compliance-deltas") that the doc states applies to every
framework ("Apply these on top of the base pipeline shown in each framework
section"). We attach that same delta set to each framework's complianceDeltas.
"""

import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)            # web/
PROJ = os.path.dirname(ROOT)            # pipeline-studio/
SRC = os.path.join(PROJ, "legacy", "13-pipeline-build-catalog.html")
OUT = os.path.join(ROOT, "graph", "nodes", "frameworkPipelines.json")
PROV = os.path.join(ROOT, "graph", "provenance", "pipeline-build.json")
SRC_REL = "legacy/13-pipeline-build-catalog.html"

TAG_RE = re.compile(r"<[^>]+>")


def strip_tags(s):
    s = TAG_RE.sub("", s)
    return html.unescape(s).strip()


def slugify(s):
    s = s.lower().strip()
    s = s.replace("+", "plus").replace("#", "sharp").replace(".", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


# Phase header class -> canonical phase id + name. Names taken verbatim from
# the phase-hdr cell text in the source.
PHASE_CLASS = {
    "ph0": "phase-0",
    "ph1": "phase-1",
    "ph2": "phase-2",
    "ph3": "phase-3",
    "phreg": "registry",
    "ph-reg": "registry",
    "phpromo": "promotions",
    "ph-promo": "promotions",
}


def parse_compliance_deltas(html_text):
    """Parse the global compliance-deltas table.

    Returns a list of dicts, one per standard, with the per-phase delta text.
    """
    start = html_text.find('id="compliance-deltas"')
    if start == -1:
        return []
    # The table sits between this h2 and the next h2 (id="registries").
    end = html_text.find('id="registries"', start)
    block = html_text[start:end]

    # Column headers (Phase 0, Phase 2, Phase 3, Registry, Promotions).
    thead = re.search(r"<thead>(.*?)</thead>", block, re.S)
    headers = []
    if thead:
        headers = [strip_tags(h) for h in re.findall(r"<th[^>]*>(.*?)</th>", thead.group(1), re.S)]
    # headers like: Standard, Applies to, Phase 0, Phase 2, Phase 3, Registry, Promotions

    tbody = re.search(r"<tbody>(.*?)</tbody>", block, re.S)
    deltas = []
    if not tbody:
        return deltas
    rows = re.findall(r"<tr>(.*?)</tr>", tbody.group(1), re.S)
    for row in rows:
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
        if len(cells) < 7:
            continue
        vals = [strip_tags(c) for c in cells]
        standard = vals[0]
        applies_to = vals[1]
        delta = {
            "standard": standard,
            "standardId": slugify(standard),
            "appliesTo": applies_to,
            "phases": {},
        }
        # Map remaining columns by header name (Phase 0, Phase 2, ...).
        for i in range(2, len(vals)):
            hdr = headers[i] if i < len(headers) else f"col{i}"
            delta["phases"][hdr] = vals[i]
        deltas.append(delta)
    return deltas


def parse_group_sections(html_text):
    """Return list of (group_slug, group_name, start_idx, end_idx) for the 30
    framework groups (the <h2 id> sections after the registries section)."""
    skip = {"phase0", "compliance-deltas", "registries"}
    h2s = list(re.finditer(r'<h2 id="([^"]+)">(.*?)</h2>', html_text))
    groups = []
    for i, m in enumerate(h2s):
        gid = m.group(1)
        if gid in skip:
            continue
        gname = strip_tags(m.group(2))
        start = m.end()
        end = h2s[i + 1].start() if i + 1 < len(h2s) else len(html_text)
        groups.append((gid, gname, start, end))
    return groups


def parse_framework_details(block_html):
    """Parse one <details class="fw-details"> ... </details> inner content.

    Returns dict with name, version, language, pattern, envInstructions,
    phases. Returns None if the block has no phase-hdr stage table (i.e. it is
    an explainer block, not a framework)."""
    if "phase-hdr" not in block_html:
        return None

    # --- summary: name + version + language + pattern ---
    summ = re.search(r"<summary>(.*?)</summary>", block_html, re.S)
    name = version = language = pattern = None
    if summ:
        s = summ.group(1)
        # sum-label content = "NAME <span ...>VERSION</span>"
        # The nested version span makes simple non-greedy matching fail, so we
        # anchor on the start of sum-label and the start of the language span.
        label = re.search(
            r'<span class="sum-label">(.*?)</span>\s*<span style="font-size:10px',
            s, re.S)
        if not label:
            label = re.search(r'<span class="sum-label">(.*)$', s, re.S)
        if label:
            inner = label.group(1)
            ver = re.search(r"<span[^>]*>(.*?)</span>", inner, re.S)
            if ver:
                version = strip_tags(ver.group(1)) or None
            name = strip_tags(re.sub(r"<span[^>]*>.*?</span>", "", inner, flags=re.S))
        # language span (font-size:10px ... margin-left:4px)
        lang = re.search(r'margin-left:4px">(.*?)</span>', s, re.S)
        if lang:
            language = strip_tags(lang.group(1)) or None
        # pattern chip
        pat = re.search(r'class="[^"]*pat-chip">(.*?)</span>', s, re.S)
        if pat:
            pattern = strip_tags(pat.group(1)) or None

    # --- env instructions: note-info paragraphs before the stage table ---
    env = []
    for p in re.findall(r'<p class="note-info">(.*?)</p>', block_html, re.S):
        label_m = re.search(r"<strong>(.*?)</strong>", p, re.S)
        label_txt = strip_tags(label_m.group(1)) if label_m else None
        body = strip_tags(re.sub(r"<strong>.*?</strong>", "", p, count=1, flags=re.S))
        full = strip_tags(p)
        item = {"text": full}
        if label_txt:
            item["label"] = label_txt
            item["instruction"] = body
        env.append(item)

    # --- verify steps (some frameworks include a vfy-block) ---
    verify = []
    vblock = re.search(r'<div class="vfy-block">(.*?)</div>\s*</div>',
                       block_html, re.S)
    if vblock:
        for step in re.finditer(
                r'<span class="vfy-n">(.*?)</span>\s*'
                r'<span class="vfy-desc">(.*?)</span>\s*'
                r'<code class="vfy-cmd">(.*?)</code>',
                vblock.group(1), re.S):
            verify.append({
                "n": strip_tags(step.group(1)),
                "desc": strip_tags(step.group(2)),
                "command": strip_tags(step.group(3)),
            })

    # --- stage table grouped by phase ---
    tbody = re.search(r"<tbody>(.*?)</tbody>", block_html, re.S)
    phases = []
    if tbody:
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tbody.group(1), re.S)
        current = None
        for row in rows:
            ph = re.search(r'class="phase-hdr (ph[\w-]+)"[^>]*>(.*?)</td>', row, re.S)
            if ph:
                cls = ph.group(1)
                pname = strip_tags(ph.group(2))
                current = {
                    "phase": PHASE_CLASS.get(cls, cls),
                    "name": pname,
                    "stages": [],
                }
                phases.append(current)
                continue
            cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
            if len(cells) < 4 or current is None:
                continue
            stage = strip_tags(cells[0])
            ctype = strip_tags(cells[1])
            tool = strip_tags(cells[2])
            command = strip_tags(cells[3])
            current["stages"].append({
                "stage": stage,
                "type": ctype or None,
                "tool": tool or None,
                "command": command or None,
                "whatItCatches": None,  # source table has no such column
            })

    return {
        "name": name,
        "version": version,
        "language": language,
        "pattern": pattern,
        "envInstructions": env,
        "verifySteps": verify,
        "phases": phases,
    }


def main():
    with open(SRC, encoding="utf-8") as f:
        text = f.read()

    compliance = parse_compliance_deltas(text)
    groups = parse_group_sections(text)

    prov = {}
    out = []
    seen = set()

    for gid, gname, gstart, gend in groups:
        section = text[gstart:gend]
        # find each <details class="fw-details"> ... </details>
        for dm in re.finditer(r'<details class="fw-details">(.*?)</details>',
                              section, re.S):
            parsed = parse_framework_details(dm.group(1))
            if parsed is None or not parsed.get("name"):
                continue

            fw_slug = slugify(parsed["name"])
            fid = f"{gid}--{fw_slug}"
            # guard against any accidental dup
            base = fid
            n = 2
            while fid in seen:
                fid = f"{base}-{n}"
                n += 1
            seen.add(fid)

            label = parsed["name"]
            if parsed.get("version"):
                label = f"{parsed['name']} {parsed['version']}"

            entry = {
                "id": fid,
                "frameworkId": fid,
                "name": parsed["name"],
                "label": label,
                "version": parsed["version"],
                "language": parsed["language"],
                "pattern": parsed["pattern"],
                "groupId": gid,
                "groupName": gname,
                "phases": parsed["phases"],
                "envInstructions": parsed["envInstructions"],
                "verifySteps": parsed["verifySteps"],
                "complianceDeltas": compliance,
            }
            out.append(entry)

            # provenance
            nf = "frameworkPipelines.json"
            for field in ("name", "label", "version", "language", "pattern",
                          "phases", "envInstructions", "verifySteps"):
                prov[f"{nf}#{fid}.{field}"] = {
                    "source": SRC_REL,
                    "sourceType": "legacy",
                    "confidence": 1.0,
                }
            prov[f"{nf}#{fid}.complianceDeltas"] = {
                "source": SRC_REL + " (global #compliance-deltas table, applies to all frameworks)",
                "sourceType": "legacy",
                "confidence": 1.0,
            }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    os.makedirs(os.path.dirname(PROV), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    with open(PROV, "w", encoding="utf-8") as f:
        json.dump(prov, f, indent=2, ensure_ascii=False)

    total_phases = sum(len(e["phases"]) for e in out)
    total_stages = sum(len(p["stages"]) for e in out for p in e["phases"])
    print(f"frameworks={len(out)}")
    print(f"phases_total={total_phases}")
    print(f"stages_total={total_stages}")
    print(f"compliance_standards={len(compliance)}")
    print(f"prov_keys={len(prov)}")
    # sanity sample
    if out:
        e = out[0]
        print(f"sample id={e['id']} name={e['name']} ver={e['version']} "
              f"phases={len(e['phases'])} env={len(e['envInstructions'])}")


if __name__ == "__main__":
    main()
