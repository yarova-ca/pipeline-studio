#!/usr/bin/env python3
"""Phase B — assemble the interconnected graph.

Loads every node file, normalizes cross-file id mismatches, merges shipped
service-code into frameworks, derives compliance forcing, emits:
  web/graph/edges/edges.json
  web/graph/manifest.json
  web/graph/provenance/provenance.json  (merged)
Validates: every edge endpoint resolves to a real node id.
"""

import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, "web", "graph")
N = os.path.join(G, "nodes")


def load(name):
    p = os.path.join(N, f"{name}.json")
    return json.load(open(p)) if os.path.exists(p) else []


# ── normalization ────────────────────────────────────────────────────────────
def norm_fw_key(s):
    """Reduce any framework reference to a stable join key (trailing slug)."""
    if not s:
        return ""
    s = str(s).lower()
    if "--" in s:
        s = s.split("--")[-1]
    s = re.sub(r"^\d+-", "", s)          # drop NN- prefix
    s = re.sub(r"-c\d+$", "", s)         # drop dockerfile -cNN suffix
    s = re.sub(r"[^a-z0-9]", "", s)      # collapse to alnum
    return s


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")


# Map a real regulatory / compliance string to a build-axis compliance id.
COMPLIANCE_KEYS = {
    "pipeda": "pipeda", "phipa": "pipeda", "hipaa": "hipaa", "pci": "pci",
    "soc 2": "soc2", "soc2": "soc2", "fips": "fips", "cmmc": "cmmc",
    "nerc": "nerc", "iso 27001": "soc2", "fedramp": "fips",
}


def map_compliance(text, valid_ids):
    t = str(text).lower()
    for kw, cid in COMPLIANCE_KEYS.items():
        if kw in t and cid in valid_ids:
            return cid
    return None


def main():
    frameworks = load("frameworks")
    categories = load("categories")
    devices = load("devices")
    languages = load("languages")
    phases = load("phases")
    stages = load("stages")
    tools = load("tools")
    build_axes = load("buildAxes")
    images = load("images")
    dockerfile_templates = load("dockerfileTemplates")
    compliance = load("compliance")
    industries = load("industries")
    verticals = load("verticals")
    regions = load("regions")
    clusters = load("clusters")
    cluster_components = load("clusterComponents")
    gitops_tools = load("gitopsTools")
    invariants = load("invariants")
    versions = load("versions")
    fw_pipelines = load("frameworkPipelines")
    shipped = load("_shipped")  # dict keyed by service id

    # node id sets for validation
    def ids(arr):
        return {x.get("id") for x in arr if isinstance(x, dict)}

    fw_ids = ids(frameworks)
    stage_ids = ids(stages)
    tool_ids = ids(tools)
    axis_ids = ids(build_axes)
    image_ids = ids(images)
    comp_ids = ids(compliance) if isinstance(compliance, list) else set(compliance.keys())
    cat_ids = ids(categories)
    lang_ids = ids(languages)
    dev_ids = ids(devices)
    cluster_ids = ids(clusters)
    comp_node_ids = ids(cluster_components)
    gitops_ids = ids(gitops_tools)
    inv_ids = ids(invariants)
    industry_ids = ids(industries)
    vertical_ids = ids(verticals)
    version_ids = ids(versions)

    # indexes
    fw_by_key = {}
    for f in frameworks:
        fw_by_key.setdefault(norm_fw_key(f.get("id")), f["id"])
        if f.get("serviceSlug"):
            fw_by_key.setdefault(norm_fw_key(f["serviceSlug"]), f["id"])
        fw_by_key.setdefault(norm_fw_key(f.get("name")), f["id"])

    stage_by_name = {}
    for s in stages:
        stage_by_name[slugify(s.get("name") or s.get("label") or "")] = s["id"]
    tool_by_name = {}
    for t in tools:
        tool_by_name[slugify(t.get("name") or t.get("label") or t.get("tool") or "")] = t["id"]
    version_by_key = {}
    for v in versions:
        version_by_key.setdefault(norm_fw_key(v.get("name") or v.get("id")), v["id"])

    edges = []
    prov = {}

    def edge(frm, typ, to, attrs=None, src="derived"):
        edges.append({"from": frm, "type": typ, "to": to, "attrs": attrs or {}})

    # merge shipped into frameworks (join by serviceSlug)
    merged_shipped = 0
    for f in frameworks:
        svc = f.get("serviceSlug") or f.get("id")
        sh = shipped.get(svc) if isinstance(shipped, dict) else None
        if sh:
            f["shipped"] = sh
            merged_shipped += 1
    # write frameworks back with shipped merged
    json.dump(frameworks, open(os.path.join(N, "frameworks.json"), "w"), indent=2)

    # attach dockerfile template to framework
    tmpl_by_fw = {}
    for t in dockerfile_templates:
        k = norm_fw_key(t.get("frameworkId") or t.get("id"))
        tmpl_by_fw.setdefault(k, t)

    # ── structural edges ─────────────────────────────────────────────────────
    for f in frameworks:
        fid = f["id"]
        if f.get("categoryId") in cat_ids:
            edge(fid, "IN_CATEGORY", f["categoryId"])
        if f.get("languageId") in lang_ids:
            edge(fid, "USES_LANGUAGE", f["languageId"])
        for d in (f.get("device") or []):
            did = d if d in dev_ids else slugify(d)
            if did in dev_ids:
                edge(fid, "ON_DEVICE", did)
        # version
        vk = norm_fw_key(f.get("name"))
        if vk in version_by_key:
            edge(fid, "PINNED_AT", version_by_key[vk])
        # build image (from dockerfile template runtimeFrom -> image)
        tmpl = tmpl_by_fw.get(norm_fw_key(fid)) or tmpl_by_fw.get(norm_fw_key(f.get("serviceSlug") or ""))
        if tmpl:
            rt = tmpl.get("runtimeFrom") or ""
            for img in images:
                base = (img.get("name") or img.get("id") or "").split()[0].lower()
                if base and base in rt.lower():
                    edge(fid, "BUILDS_IMAGE", img["id"], {"runtimeFrom": rt})
                    break
        # deploy to all clusters (cluster-agnostic services)
        for c in clusters:
            edge(fid, "DEPLOYS_TO", c["id"])

    # framework -> pipeline stages (the real per-framework difference)
    fw_stage_edges = 0
    for p in fw_pipelines:
        fid = fw_by_key.get(norm_fw_key(p.get("frameworkId")))
        if not fid:
            continue
        for ph in p.get("phases", []):
            for st in ph.get("stages", []):
                sid = stage_by_name.get(slugify(st.get("stage") or ""))
                if sid:
                    edge(fid, "USES_STAGE", sid,
                         {"tool": st.get("tool"), "command": st.get("command"),
                          "type": st.get("type"), "phase": ph.get("name")})
                    fw_stage_edges += 1
                tn = slugify(st.get("tool") or "")
                if tn in tool_by_name:
                    edge(sid or fid, "USES_TOOL", tool_by_name[tn])

    # phase contains stage
    for s in stages:
        ph = s.get("phase") or s.get("phaseId")
        for p in phases:
            if ph and (slugify(str(ph)) in slugify(p.get("name", "")) or str(ph) == str(p.get("id"))):
                edge(p["id"], "CONTAINS", s["id"])
                break

    # compliance forces axis
    comp_list = compliance if isinstance(compliance, list) else [{**v, "id": k} for k, v in compliance.items()]
    for c in comp_list:
        for ax, val in (c.get("forces") or {}).items():
            axid = ax.lower().replace("_", "-")
            if axid in axis_ids:
                edge(c["id"], "FORCES", axid, {"value": val})
    # image rated on compliance
    rating_ok = {"yes", "y", "par", "partial"}
    for img in images:
        for std, rating in (img.get("complianceRatings") or {}).items():
            cid = map_compliance(std, comp_ids)
            if cid and str(rating).strip().lower() in rating_ok:
                edge(img["id"], "RATED_ON", cid, {"rating": rating})

    # industry -> compliance (mapped subset) + vertical
    industry_comp_edges = 0
    for ind in industries:
        for req in (ind.get("mandatoryCompliance") or []):
            cid = map_compliance(req, comp_ids)
            if cid:
                edge(ind["id"], "REQUIRES", cid, {"mandatory": True, "raw": req})
                industry_comp_edges += 1
        for req in (ind.get("optionalCompliance") or []):
            cid = map_compliance(req, comp_ids)
            if cid:
                edge(ind["id"], "REQUIRES", cid, {"mandatory": False, "raw": req})
        vid = ind.get("verticalId")
        if vid in vertical_ids:
            edge(vid, "CONTAINS", ind["id"])

    # vertical -> integration -> auth/gateway (net-new dimension)
    integrations = load("integrations")
    api_gateways = load("apiGateways")
    gw_ids = ids(api_gateways)
    auth_ids = ids(load("authOptions"))
    for ig in integrations:
        if ig.get("verticalId") in vertical_ids:
            edge(ig["verticalId"], "HAS_INTEGRATION", ig["id"], {"system": ig.get("externalSystem")})
        if ig.get("apiGateway") in gw_ids:
            edge(ig["id"], "USES_GATEWAY", ig["apiGateway"])
        au = ig.get("authOption")
        if au in auth_ids:
            edge(ig["id"], "USES_AUTH", au)

    # cluster -> components + gitops
    for c in clusters:
        for comp in cluster_components:
            edge(c["id"], "HAS_COMPONENT", comp["id"])
        for g in gitops_tools:
            edge(c["id"], "USES_GITOPS", g["id"])

    # invariant guards stage
    for inv in invariants:
        sname = slugify(inv.get("stage") or "")
        sid = stage_by_name.get(sname)
        if sid:
            edge(inv["id"], "GUARDS_STAGE", sid)

    # ── validation ───────────────────────────────────────────────────────────
    all_ids = set()
    for arr in [frameworks, categories, devices, languages, phases, stages, tools,
                build_axes, images, comp_list, industries, verticals, regions,
                clusters, cluster_components, gitops_tools, invariants, versions,
                load("integrations"), load("apiGateways")]:
        all_ids |= ids(arr)
    dangling = [e for e in edges if e["from"] not in all_ids or e["to"] not in all_ids]

    # ── manifest ─────────────────────────────────────────────────────────────
    from collections import Counter
    edge_types = Counter(e["type"] for e in edges)
    manifest = {
        "schemaVersion": 1,
        "nodeCounts": {
            "frameworks": len(frameworks), "categories": len(categories),
            "industries": len(industries), "verticals": len(verticals),
            "stages": len(stages), "tools": len(tools), "invariants": len(invariants),
            "images": len(images), "compliance": len(comp_list), "clusters": len(clusters),
            "versions": len(versions), "buildAxes": len(build_axes),
        },
        "edgeTotal": len(edges),
        "edgeTypes": dict(edge_types),
        "merges": {"frameworksWithShipped": merged_shipped,
                   "fwStageEdges": fw_stage_edges,
                   "industryComplianceEdges": industry_comp_edges},
        "danglingEdges": len(dangling),
    }

    os.makedirs(os.path.join(G, "edges"), exist_ok=True)
    json.dump(edges, open(os.path.join(G, "edges", "edges.json"), "w"), indent=2)
    json.dump(manifest, open(os.path.join(G, "manifest.json"), "w"), indent=2)

    # browser bundle — single fetch for the navigator
    node_bundle = {
        "frameworks": frameworks, "categories": categories, "devices": devices,
        "languages": languages, "phases": phases, "stages": stages, "tools": tools,
        "buildAxes": build_axes, "images": images, "dockerfileTemplates": dockerfile_templates,
        "compliance": comp_list, "industries": industries, "verticals": verticals,
        "regions": regions, "clusters": clusters, "clusterComponents": cluster_components,
        "gitopsTools": gitops_tools, "authOptions": load("authOptions"),
        "ormOptions": load("ormOptions"), "observabilityOptions": load("observabilityOptions"),
        "invariants": invariants, "versions": versions, "conceptNotes": load("conceptNotes"),
        "integrations": load("integrations"), "apiGateways": load("apiGateways"),
    }
    bundle = {"nodes": node_bundle, "edges": edges, "pipelines": fw_pipelines, "manifest": manifest}
    json.dump(bundle, open(os.path.join(ROOT, "web", "graph.json"), "w"))

    # merge provenance files
    merged = {}
    for pf in glob.glob(os.path.join(G, "provenance", "*.json")):
        if os.path.basename(pf) == "provenance.json":
            continue
        try:
            merged.update(json.load(open(pf)))
        except Exception:
            pass
    json.dump(merged, open(os.path.join(G, "provenance", "provenance.json"), "w"), indent=2)

    print(json.dumps(manifest, indent=2))
    if dangling:
        print(f"\nDANGLING ({len(dangling)}) sample:")
        for e in dangling[:10]:
            print("  ", e["from"], e["type"], e["to"])
    else:
        print("\n0 dangling edges.")


if __name__ == "__main__":
    main()
