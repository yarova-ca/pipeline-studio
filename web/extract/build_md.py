#!/usr/bin/env python3
"""Generate the master blueprint as ONE clean Markdown progression.

Reads the real graph nodes and writes web/blueprint.md in the founder's order:
all frameworks front-end -> back-end (each with full info), then each platform
stage one after another. Source of truth for the HTML.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
N = os.path.join(ROOT, "web", "graph", "nodes")
OUT = os.path.join(ROOT, "web", "blueprint.md")


def load(name):
    p = os.path.join(N, f"{name}.json")
    return json.load(open(p)) if os.path.exists(p) else []


def catnum(cid):
    m = re.findall(r"\d+", cid or "")
    return int(m[0]) if m else 999


def cell(v):
    if v is None:
        return ""
    if isinstance(v, list):
        return ", ".join(str(x) for x in v)
    return str(v).replace("|", "/").replace("\n", " ").strip()


def code(v):
    """Raw value for code blocks — preserves newlines for copy-paste commands."""
    if v is None:
        return ""
    return str(v).strip()


def main():
    frameworks = load("frameworks")
    categories = sorted(load("categories"), key=lambda c: catnum(c["id"]))
    fw_by_cat = {}
    for f in frameworks:
        fw_by_cat.setdefault(f.get("categoryId"), []).append(f)

    L = []
    w = L.append

    w("# Pipeline Studio — Master Blueprint")
    w("")
    w("**What this is:** the complete platform knowledge, in one progression.")
    w("**How to read:** top to bottom. First every framework, front-end to back-end. Then each platform stage.")
    w("")
    w(f"Frameworks: {len(frameworks)} · Categories: {len(categories)}")
    w("")
    w("---")
    w("")
    w("# Part A — Frameworks (front-end → back-end)")
    w("")

    # ── PART A: categories in order ──────────────────────────────────────────
    for ci, cat in enumerate(categories, 1):
        fws = fw_by_cat.get(cat["id"], [])
        if not fws:
            continue
        w(f"## A.{ci} {cat.get('name') or cat['id']}")
        w("")
        w(f"{len(fws)} framework{'s' if len(fws)!=1 else ''} in this category.")
        w("")
        # summary table
        w("| Framework | Version | Language | Maturity | Performance | Security posture |")
        w("|---|---|---|---|---|---|")
        for f in fws:
            w(f"| {cell(f.get('name'))} | {cell(f.get('version'))} | {cell(f.get('languages') or f.get('languageId'))} | "
              f"{cell(f.get('maturity'))} | {cell(f.get('perf') or f.get('throughput'))} | {cell(f.get('securityPosture'))[:80]} |")
        w("")
        # per-framework detail
        for f in fws:
            w(f"### {cell(f.get('name'))}")
            w("")
            rows = [
                ("Version", f.get("version")), ("License", f.get("license")),
                ("Maintained by", f.get("maintainedBy")), ("Maturity", f.get("maturity")),
                ("Tier", f.get("tier")), ("Concurrency", f.get("concurrency")),
                ("Memory", f.get("memory")), ("Performance", f.get("perf")),
                ("Throughput", f.get("throughput")), ("Cold start", f.get("coldStart")),
                ("Container size", f.get("containerSize")), ("Thread model", f.get("threadModel")),
                ("Bundle size", f.get("bundleSize")), ("Rendering modes", f.get("renderingModes")),
                ("Hydration", f.get("hydration")), ("Runtime target", f.get("runtimeTarget")),
                ("Scaling", f.get("scaling")), ("Ecosystem", f.get("ecosystem")),
                ("Package manager", f.get("pkgMgr")), ("Build tool", f.get("buildTool")),
            ]
            for k, v in rows:
                if v:
                    w(f"- **{k}:** {cell(v)}")
            if f.get("whenToUse"):
                w(f"- **When to use:** {cell(f.get('whenToUse'))}")
            if f.get("whenNot"):
                w(f"- **When NOT:** {cell(f.get('whenNot'))}")
            if f.get("tradeoff"):
                w(f"- **Trade-off:** {cell(f.get('tradeoff'))}")
            if f.get("homepage"):
                w(f"- **Home:** {cell(f.get('homepage'))}")
            w("")
        w("---")
        w("")

    # ── PART B: platform stages ──────────────────────────────────────────────
    w("# Part B — The platform, stage by stage")
    w("")

    # B0 — swappable build axes (every option)
    axes = load("buildAxes")
    w("## B.0 Swappable build axes — every option")
    w("")
    w("Each axis is a knob. Swap any value at build time. The same service ships every combination.")
    w("")
    w("| Axis | Controls | Default | All valid options | Applies to |")
    w("|---|---|---|---|---|")
    for a in axes:
        vals = a.get("values") or a.get("validValues") or []
        w(f"| {cell(a.get('id'))} | {cell(a.get('controls'))} | {cell(a.get('default'))} | {cell(vals)} | {cell(a.get('appliesTo'))} |")
    w("")

    # B1 CI pipeline — phases, stages, then full tool catalog
    phases = load("phases"); stages = load("stages"); tools = load("tools")
    w("## B.1 CI/CD pipeline")
    w("")
    w("The pipeline runs in phases. Each phase has stages, each stage a tool.")
    w("")
    for p in phases:
        pst = sorted([s for s in stages if (s.get("phaseId") == p.get("id")) or (s.get("phase") and p.get("name") and s["phase"] in p["name"])], key=lambda x: x.get("order") or 0)
        w(f"### {cell(p.get('name') or p.get('id'))}")
        w("")
        if pst:
            w("| Stage | Type | Tool |")
            w("|---|---|---|")
            for s in pst:
                w(f"| {cell(s.get('name') or s.get('label'))} | {cell(s.get('type'))} | {cell(s.get('tool'))} |")
        w("")
    # full tool catalog
    w("### B.1.1 Tool catalog — every stage tool in detail")
    w("")
    for t in sorted(tools, key=lambda x: (x.get("phaseId") or "", x.get("order") or 0)):
        w(f"#### {cell(t.get('name') or t.get('tool') or t['id'])}")
        w("")
        if t.get("stage"): w(f"- **Stage:** {cell(t.get('stage'))} ({cell(t.get('stageType'))})")
        if t.get("license"): w(f"- **License:** {cell(t.get('license'))}")
        if t.get("appliesTo"): w(f"- **Applies to:** {cell(t.get('appliesTo'))}")
        if t.get("output"): w(f"- **Output:** {cell(t.get('output'))}")
        if t.get("ciIntegration"): w(f"- **CI integration:** {cell(t.get('ciIntegration'))}")
        if t.get("mandatory") is not None: w(f"- **Mandatory:** {cell(t.get('mandatory'))}")
        if t.get("whenToUse"): w(f"- **When to use:** {cell(t.get('whenToUse'))}")
        if t.get("whenNot"): w(f"- **When NOT:** {cell(t.get('whenNot'))}")
        if t.get("primaryTradeoff"): w(f"- **Trade-off:** {cell(t.get('primaryTradeoff'))}")
        w("")

    # B2 Compliance — full breadth (26 authored profiles)
    profs = load("complianceProfiles")
    w(f"## B.2 Compliance regimes — all {len(profs)}")
    w("")
    w("Every regime: what it forces, the controls, audit retention, data residency, how to meet it.")
    w("")
    for c in profs:
        w(f"### {cell(c.get('name') or c.get('id'))} — {cell(c.get('fullName'))}")
        w("")
        if c.get("region"): w(f"- **Region:** {cell(c.get('region'))}")
        if c.get("regulator"): w(f"- **Regulator:** {cell(c.get('regulator'))}")
        if c.get("appliesToVerticals"): w(f"- **Applies to:** {cell(c.get('appliesToVerticals'))}")
        fr = c.get("forces")
        if isinstance(fr, dict) and fr:
            w(f"- **Forces:** " + ", ".join(f"{k} = {cell(v)}" for k, v in fr.items()))
        if c.get("requiredControls"): w(f"- **Required controls:** {cell(c.get('requiredControls'))}")
        if c.get("auditRetention"): w(f"- **Audit retention:** {cell(c.get('auditRetention'))}")
        if c.get("dataResidency"): w(f"- **Data residency:** {cell(c.get('dataResidency'))}")
        if c.get("howToMeet"):
            w("- **How to meet:**")
            for step in (c.get("howToMeet") if isinstance(c.get("howToMeet"), list) else [c.get("howToMeet")]):
                w(f"  - {cell(step)}")
        w("")

    # B3 Industries by vertical — with per-vertical requirement matrix
    industries = load("industries"); verticals = load("verticals")
    req_by_v = {r["id"]: r for r in load("industryRequirements")}
    w("## B.3 Industries (Canada) — by vertical")
    w("")
    w("Each vertical states its required auth, observability, data controls, and regimes.")
    w("")
    for v in verticals:
        rq = req_by_v.get(v["id"])
        if rq:
            w(f"**{cell(v.get('name') or v['id'])} — requirements:**")
            w("")
            if rq.get("requiredAuth"): w(f"- Required auth: {cell(rq.get('requiredAuth'))}")
            if rq.get("requiredObservability"): w(f"- Required observability: {cell(rq.get('requiredObservability'))}")
            if rq.get("requiredDataControls"): w(f"- Required data controls: {cell(rq.get('requiredDataControls'))}")
            if rq.get("mandatoryRegimes"): w(f"- Mandatory regimes: {cell(rq.get('mandatoryRegimes'))}")
            if rq.get("recommendedCluster"): w(f"- Recommended cluster: {cell(rq.get('recommendedCluster'))}")
            if rq.get("keyRisks"): w(f"- Key risks: {cell(rq.get('keyRisks'))}")
            w("")
    for v in verticals:
        inds = [i for i in industries if i.get("verticalId") == v["id"]]
        if not inds:
            continue
        w(f"### {cell(v.get('name') or v['id'])}")
        w("")
        for i in inds:
            w(f"#### {cell(i.get('name'))}")
            w("")
            if i.get("mandatoryCompliance"): w(f"- **Mandatory compliance:** {cell(i.get('mandatoryCompliance'))}")
            if i.get("optionalCompliance"): w(f"- **Optional compliance:** {cell(i.get('optionalCompliance'))}")
            if i.get("regulators"): w(f"- **Regulators:** {cell(i.get('regulators'))}")
            if i.get("dataSensitivity"): w(f"- **Data sensitivity:** {cell(i.get('dataSensitivity'))}")
            if i.get("pipelineStagesAffected"): w(f"- **Pipeline stages affected:** {cell(i.get('pipelineStagesAffected'))}")
            sar = i.get("securityAuditRequirements")
            if isinstance(sar, dict):
                for k, val in sar.items():
                    w(f"- **{k}:** {cell(val)}")
            elif sar:
                w(f"- **Security/audit:** {cell(sar)}")
            if i.get("frameworkNotes"): w(f"- **Notes:** {cell(i.get('frameworkNotes'))}")
            w("")

    # B4 Images / distros
    images = load("images")
    w("## B.4 Base images & distros (compliance-rated)")
    w("")
    if images:
        keys = list((images[0].get("complianceRatings") or {}).keys())[:6]
        w("| Image | " + " | ".join(keys) + " |")
        w("|---|" + "|".join("---" for _ in keys) + "|")
        for im in images:
            r = im.get("complianceRatings") or {}
            w(f"| {cell(im.get('name') or im.get('id'))} | " + " | ".join(cell(r.get(k)) for k in keys) + " |")
    w("")

    # B5 Libraries
    libs = load("libraries")
    w("## B.5 Libraries (most used across services)")
    w("")
    w("| Library | Ecosystem | Used by |")
    w("|---|---|---|")
    for lib in libs[:40]:
        w(f"| {cell(lib.get('name'))} | {cell(lib.get('ecosystem'))} | {cell(lib.get('usedByCount'))} services |")
    w("")

    # B6 Deployment — FULL: hub-and-spoke, cluster creation, every component
    clusters = load("clusters"); comps = load("clusterComponents"); gitops = load("gitopsTools")
    comps = sorted(comps, key=lambda x: x.get("num") or "")
    w("## B.6 Deployment — clusters, GitOps hub-and-spoke, every component")
    w("")
    w("Hub-and-spoke: one central GitOps controller (the hub) manages every cluster (the spokes).")
    w("Why: one source of truth deploys to AKS, EKS, GKE, and OpenShift the same way.")
    w("")

    w("### B.6.1 Cluster creation (the spokes)")
    w("")
    w("| Cluster | Cloud | Storage class | Secret identity |")
    w("|---|---|---|---|")
    for c in clusters:
        w(f"| {cell(c.get('name') or c['id'])} | {cell(c.get('cloud'))} | {cell(c.get('defaultStorageClass'))} | {cell(c.get('secretIdentity'))} |")
    w("")
    for c in clusters:
        if c.get("evidence"):
            w(f"- **{cell(c.get('label') or c.get('name'))}:** {cell(c.get('evidence'))}")
    w("")

    w("### B.6.2 GitOps tools (the hub)")
    w("")
    for g in gitops:
        w(f"#### {cell(g.get('name') or g['id'])}")
        w("")
        if g.get("role"): w(f"- **Role:** {cell(g.get('role'))}")
        if g.get("what"): w(f"- **What:** {cell(g.get('what'))}")
        if g.get("version"): w(f"- **Version:** {cell(g.get('version'))}")
        if g.get("syncInterval"): w(f"- **Sync interval:** {cell(g.get('syncInterval'))}")
        if g.get("watchesPaths"): w(f"- **Watches:** {cell(g.get('watchesPaths'))}")
        if g.get("overlayPaths"): w(f"- **Overlays:** {cell(g.get('overlayPaths'))}")
        if g.get("installCommand") or g.get("fullCommand"):
            w("- **Install:**")
            w("")
            w("```bash")
            w(code(g.get("installCommand") or g.get("fullCommand")))
            w("```")
        if g.get("decisionChosen"): w(f"- **Decision:** {cell(g.get('decisionChosen'))}")
        if g.get("decisionRejected"): w(f"- **Rejected:** {cell(g.get('decisionRejected'))}")
        if g.get("whyRejected"): w(f"- **Not used:** {cell(g.get('whyRejected'))}")
        w("")

    w(f"### B.6.3 Cluster components — all {len(comps)}, in install order")
    w("")
    w("Each component: what, why, install, verify, failure, decision.")
    w("")
    last_layer = None
    for c in comps:
        layer = c.get("layer")
        if layer and layer != last_layer:
            w(f"#### Layer — {cell(layer)}")
            w("")
            last_layer = layer
        w(f"##### {cell(c.get('num'))}. {cell(c.get('name') or c.get('label'))}  ({cell(c.get('status'))})")
        w("")
        if c.get("what"): w(f"- **What:** {cell(c.get('what'))}")
        if c.get("why"): w(f"- **Why:** {cell(c.get('why'))}")
        if c.get("wiredTo"): w(f"- **Wired to:** {cell(c.get('wiredTo'))}")
        if c.get("installCommand"):
            w("- **Install:**")
            w("")
            w("```bash")
            w(code(c.get("installCommand")))
            w("```")
        if c.get("verifyCommand"):
            w(f"- **Verify:** `{cell(c.get('verifyCommand'))}`")
            if c.get("verifyExpected"): w(f"  - {cell(c.get('verifyExpected'))}")
        for fmode in (c.get("failures") or []):
            w(f"- **If it fails:** {cell(fmode.get('trigger'))}")
            w(f"  - System: {cell(fmode.get('system'))}")
            w(f"  - User sees: {cell(fmode.get('userSees'))}")
            w(f"  - To fix: {cell(fmode.get('userCan'))}")
        dec = c.get("decision") or {}
        if dec.get("chosen"): w(f"- **{cell(dec.get('chosen'))}**")
        if dec.get("rejected"): w(f"  - {cell(dec.get('rejected'))}")
        w("")

    # B7 — deep option intelligence (auth, ORM, observability, runtime, pkg/build)
    def deep_options(title, nodefile, fields):
        items = load(nodefile)
        if not items:
            return
        w(f"## {title}")
        w("")
        for o in items:
            w(f"### {cell(o.get('name') or o.get('id'))}")
            w("")
            for key, label in fields:
                v = o.get(key)
                if not v:
                    continue
                if isinstance(v, dict):
                    w(f"- **{label}:**")
                    for k2, v2 in v.items():
                        w(f"  - {k2}: {cell(v2)}")
                elif isinstance(v, list):
                    w(f"- **{label}:** {cell(v)}")
                else:
                    w(f"- **{label}:** {cell(v)}")
            w("")

    deep_options("B.7 Auth — every option, decided", "authDeep", [
        ("what", "What"), ("howItWorks", "How it works"), ("securityLevel", "Security level"),
        ("whenToPick", "When to pick"), ("whenNot", "When NOT"), ("tradeoffVs", "Trade-off vs"),
        ("complianceFit", "Compliance fit"), ("perIndustryNote", "Per industry"), ("implementation", "Implementation")])
    deep_options("B.7b ORM / data access — every option, decided", "ormDeep", [
        ("what", "What"), ("language", "Language"), ("typeSafety", "Type safety"),
        ("whenToPick", "When to pick"), ("whenNot", "When NOT"), ("tradeoffVs", "Trade-off vs"),
        ("migrations", "Migrations"), ("complianceNote", "Compliance"), ("implementation", "Implementation")])
    deep_options("B.7c Observability — every option, decided", "observabilityDeep", [
        ("what", "What"), ("pillars", "Pillars"), ("cost", "Cost"),
        ("whenToPick", "When to pick"), ("whenNot", "When NOT"), ("tradeoffVs", "Trade-off vs"),
        ("complianceFit", "Compliance fit"), ("perIndustryLevel", "Per industry level"), ("implementation", "Implementation")])
    deep_options("B.7d Runtime base images — every option, decided", "runtimeDeep", [
        ("baseOs", "Base OS"), ("sizeMb", "Size (MB)"), ("fipsCertified", "FIPS certified"),
        ("attackSurface", "Attack surface"), ("whenToPick", "When to pick"), ("whenNot", "When NOT"),
        ("tradeoffVs", "Trade-off vs"), ("complianceFit", "Compliance fit"), ("implementation", "FROM line")])
    deep_options("B.7e Package managers & build tools — every option, decided", "pkgBuildDeep", [
        ("kind", "Kind"), ("language", "Language"), ("what", "What"), ("lockfile", "Lockfile"),
        ("speedNote", "Speed"), ("whenToPick", "When to pick"), ("whenNot", "When NOT"),
        ("tradeoffVs", "Trade-off vs"), ("implementation", "Implementation")])

    # B8 Invariants
    inv = load("invariants")
    w("## B.8 Invariants (hard platform rules)")
    w("")
    w("| ID | Rule | Enforced by | If violated |")
    w("|---|---|---|---|")
    for i in inv:
        w(f"| {cell(i.get('id'))} | {cell(i.get('condition') or i.get('label'))} | {cell(i.get('enforcedBy'))} | {cell(i.get('ifViolated'))} |")
    w("")

    # B9 Integrations
    integ = load("integrations")
    if integ:
        w("## B.9 Integrations (per vertical) — net-new, pending review")
        w("")
        w("| System | Category | Vertical | Auth | Gateway |")
        w("|---|---|---|---|---|")
        for g in integ:
            w(f"| {cell(g.get('externalSystem'))} | {cell(g.get('category'))} | {cell(g.get('verticalId'))} | {cell(g.get('authOption'))} | {cell(g.get('apiGateway'))} |")
        w("")

    # B10 Versions
    versions = load("versions")
    w("## B.10 Version registry")
    w("")
    w("| Item | Kind | Version | Last verified |")
    w("|---|---|---|---|")
    for v in versions[:60]:
        w(f"| {cell(v.get('name') or v.get('id'))} | {cell(v.get('kind'))} | {cell(v.get('version'))} | {cell(v.get('lastVerified'))} |")
    w("")

    open(OUT, "w").write("\n".join(L))
    print(f"wrote {OUT}")
    print(f"lines: {len(L)}  frameworks: {len(frameworks)}  categories: {len([c for c in categories if fw_by_cat.get(c['id'])])}")


if __name__ == "__main__":
    main()
