#!/usr/bin/env python3
"""B1 — build web/data.json: the single source of truth for the navigator.

Frameworks come from the 105 services/*/catalog-info.yaml (already structured).
Dimensions (axes, pipeline, industries, compliance, clusters, invariants) are
curated from the legacy HTML pages.
"""

import glob
import json
import os
import re

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── Frameworks: from catalog-info.yaml ──────────────────────────────────────

def humanize_category(system):
    name = re.sub(r"^\d+-", "", system or "")
    special = {
        "nodejs": "Node.js", "graphql": "GraphQL", "grpc": "gRPC",
        "websocket": "WebSocket", "ssr": "SSR frameworks", "spa": "SPA frameworks",
        "ssg": "Static site generation", "dotnet": ".NET", "cpp": "C++",
        "php": "PHP", "react-patterns": "React patterns",
        "micro-frontends": "Micro-frontends", "cross-platform": "Cross-platform",
        "native-ios": "Native iOS", "native-android": "Native Android",
        "pwa": "PWA", "edge": "Edge", "islands": "Islands", "resumable": "Resumable",
        "mobile": "Mobile",
    }
    return special.get(name, name.replace("-", " ").title() if name else "Service")


def load_frameworks():
    out = []
    for path in sorted(glob.glob(os.path.join(ROOT, "services", "*", "catalog-info.yaml"))):
        with open(path) as f:
            doc = yaml.safe_load(f)
        meta = doc.get("metadata", {})
        spec = doc.get("spec", {})
        ann = meta.get("annotations", {})
        sm = spec.get("metadata", {})

        def pick(*v):
            for x in v:
                if x:
                    return x
            return None

        system = spec.get("system")
        out.append({
            "id": meta.get("name"),
            "name": meta.get("title") or meta.get("name"),
            "categoryId": system,
            "category": humanize_category(system),
            "language": pick(ann.get("pipeline-studio/language"), sm.get("language")) or "—",
            "pattern": pick(ann.get("pipeline-studio/pattern"), sm.get("pattern")) or "—",
            "port": str(pick(ann.get("pipeline-studio/port"), sm.get("port")) or "").replace("N/A", "") or None,
            "tier": pick(ann.get("pipeline-studio/tier"), sm.get("tier")) or "—",
            "tags": meta.get("tags", []),
            "repo": f"https://github.com/yarova-ca/{meta.get('name')}",
            "catalogRef": f"https://backstage.yarova.ca/catalog/default/component/{meta.get('name')}",
        })
    return out


# ── Build axes (from legacy/21-build-axes.html) ─────────────────────────────

BUILD_AXES = [
    {"id": "BUILD_IMAGE", "controls": "Builder + runtime base image", "default": "node",
     "values": ["node", "python", "golang", "java", "dotnet", "rust", "elixir", "ruby", "php"], "appliesTo": "all"},
    {"id": "RUNTIME", "controls": "Runtime base flavour", "default": "alpine",
     "values": ["alpine", "slim", "fips"], "appliesTo": "all"},
    {"id": "PKG_MGR", "controls": "Package manager + lockfile", "default": "npm / pip",
     "values": ["npm", "pnpm", "yarn", "bun", "pip", "poetry", "uv"], "appliesTo": "node, python"},
    {"id": "BUILD_TOOL", "controls": "TS compiler / bundler", "default": "tsc",
     "values": ["tsc", "esbuild", "swc"], "appliesTo": "node backends"},
    {"id": "COMPLIANCE", "controls": "Compliance profile baked in", "default": "standard",
     "values": ["standard", "hipaa", "pci", "pipeda", "fips", "soc2", "cmmc", "nerc"], "appliesTo": "all API services"},
    {"id": "OBSERVABILITY", "controls": "Telemetry stack", "default": "none",
     "values": ["none", "otel", "prometheus", "datadog"], "appliesTo": "all API services"},
    {"id": "AUTH", "controls": "Auth scheme", "default": "all",
     "values": ["none", "jwt", "oauth2", "apikey", "all"], "appliesTo": "all API services"},
    {"id": "ORM", "controls": "Database access layer", "default": "prisma / sqlalchemy / gorm",
     "values": ["prisma", "typeorm", "drizzle", "sqlalchemy", "tortoise", "gorm", "none"], "appliesTo": "all API services"},
]

# ── Pipeline phases + stages (from legacy/03-stage-types.html) ──────────────

PIPELINE = [
    {"phase": 0, "name": "Bootstrap", "stages": [
        "Branch protection", "CODEOWNERS", "OIDC trust", "Registry access",
        "Kyverno admission policy", "Dependency update automation"]},
    {"phase": 1, "name": "Local Dev", "stages": [
        "IDE plugins", "Pre-commit hooks"]},
    {"phase": 2, "name": "PR Gate", "stages": [
        "Pre-commit (CI)", "SCA", "SAST", "License scan", "IaC scan",
        "Secrets scan", "CodeQL", "Build on PR"]},
    {"phase": 3, "name": "Main Build", "stages": [
        "Build + push image", "SBOM (syft)", "Container scan (trivy)",
        "Cosign sign", "Test suite", "Release", "Notify"]},
    {"phase": 4, "name": "Registry", "stages": [
        "GHCR push", "Tag latest + sha", "Provenance"]},
    {"phase": 5, "name": "Promotions", "stages": [
        "Promote dev to test", "Promote test to staging",
        "Promote staging to prod", "Re-verify signatures"]},
]

# ── Compliance regimes — what each FORCES (from 10/12) ───────────────────────

COMPLIANCE = {
    "standard": {"label": "Standard", "region": ["all"], "forces": {}, "runtime": "alpine"},
    "hipaa": {"label": "HIPAA", "region": ["US", "CA"], "runtime": "fips",
              "forces": {"OBSERVABILITY": "audit logging", "AUTH": "oauth2", "data": "encryption at rest + in transit"}},
    "pipeda": {"label": "PIPEDA", "region": ["CA"], "runtime": "alpine",
               "forces": {"data": "Canadian data residency", "OBSERVABILITY": "access logging"}},
    "pci": {"label": "PCI-DSS", "region": ["all"], "runtime": "fips",
            "forces": {"AUTH": "oauth2 + mfa", "OBSERVABILITY": "audit logging", "data": "tokenization"}},
    "soc2": {"label": "SOC 2", "region": ["all"], "runtime": "alpine",
             "forces": {"OBSERVABILITY": "otel + audit trail", "AUTH": "oauth2"}},
    "fips": {"label": "FIPS 140-3", "region": ["US", "CA"], "runtime": "fips",
             "forces": {"RUNTIME": "fips", "crypto": "FIPS OpenSSL module"}},
    "cmmc": {"label": "CMMC", "region": ["US"], "runtime": "fips",
             "forces": {"RUNTIME": "fips", "AUTH": "oauth2 + mfa", "OBSERVABILITY": "audit logging"}},
    "nerc": {"label": "NERC CIP", "region": ["US", "CA"], "runtime": "fips",
             "forces": {"OBSERVABILITY": "audit logging", "AUTH": "oauth2 + mfa", "network": "segmentation"}},
}

# ── Clusters (from 19/23) ────────────────────────────────────────────────────

CLUSTERS = [
    {"id": "aks", "name": "Azure AKS", "provider": "Microsoft", "gitops": ["argo", "helm", "kustomize"]},
    {"id": "eks", "name": "AWS EKS", "provider": "Amazon", "gitops": ["argo", "helm", "kustomize"]},
    {"id": "gke", "name": "Google GKE", "provider": "Google", "gitops": ["argo", "helm", "kustomize"]},
    {"id": "openshift", "name": "Red Hat OpenShift", "provider": "Red Hat", "gitops": ["argo", "helm", "kustomize"]},
]

# ── Industries — grouped by vertical, each mapped to compliance ──────────────
# Vertical -> default compliance regimes + cluster fit (Canada-first).

VERTICALS = {
    "Financial Services": {"compliance": ["pci", "soc2", "pipeda"], "cluster": "openshift",
        "industries": ["Retail Banking", "Investment Banking & Capital Markets", "Insurance",
            "Wealth & Asset Management", "Fintech & Payments", "Credit Unions & Caisses",
            "Mortgage & Real Estate Finance", "Accounting & Tax Technology"]},
    "Healthcare": {"compliance": ["hipaa", "pipeda", "soc2"], "cluster": "openshift",
        "industries": ["Hospital & Health Systems IT", "Digital Health & Health IT",
            "Pharmaceutical Manufacturing", "Medical Devices & Diagnostics",
            "Biotechnology & Genomics", "Mental Health & Teletherapy",
            "Long-Term Care & Home Health", "Clinical Research & Trials"]},
    "Government": {"compliance": ["pipeda", "soc2", "fips"], "cluster": "openshift",
        "industries": ["Federal Government IT", "Provincial Government IT",
            "Municipal Government & Smart Cities", "Crown Corporations",
            "Indigenous Governments & Services", "Public Safety & Emergency Services"]},
    "Defense & Security": {"compliance": ["cmmc", "fips", "soc2"], "cluster": "openshift",
        "industries": ["Defense Systems (DND/CAF)", "Border Security & CBSA",
            "Aerospace & Defense Manufacturing", "Cybersecurity Products & Services"]},
    "Energy & Resources": {"compliance": ["nerc", "soc2", "pipeda"], "cluster": "aks",
        "industries": ["Oil & Gas Upstream", "Utilities & Power Grid", "Renewable Energy",
            "Mining & Resources Technology", "Clean Technology & Carbon Markets"]},
    "Technology": {"compliance": ["soc2", "pipeda"], "cluster": "gke",
        "industries": ["Enterprise Software & SaaS", "AI & ML Platforms",
            "Cloud Infrastructure & DevOps", "Cybersecurity Products",
            "Developer Tools & Open Source"]},
    "Telecom & Media": {"compliance": ["soc2", "pipeda"], "cluster": "aks",
        "industries": ["Wireless & Mobile Networks", "Broadband & Internet Services",
            "Broadcast Media & Streaming", "Satellite & Space Technology",
            "Video Games & Interactive", "Film & TV Production Technology",
            "Digital Media & Publishing"]},
    "Retail & Commerce": {"compliance": ["pci", "soc2", "pipeda"], "cluster": "eks",
        "industries": ["E-commerce & Online Retail", "Grocery & Consumer Goods",
            "Omnichannel Retail & POS Systems"]},
    "Manufacturing": {"compliance": ["soc2", "pipeda"], "cluster": "aks",
        "industries": ["Automotive & EV Manufacturing", "Aerospace Manufacturing",
            "Industrial Automation & Robotics", "Food & Beverage Manufacturing Tech"]},
    "Transport & Logistics": {"compliance": ["soc2", "pipeda"], "cluster": "gke",
        "industries": ["Air Transport & Airports", "Rail & Transit",
            "Trucking & Freight Technology", "Port & Marine Technology",
            "Supply Chain & 3PL Technology"]},
    "Education": {"compliance": ["pipeda", "soc2"], "cluster": "gke",
        "industries": ["EdTech & Online Learning", "Higher Education IT",
            "K-12 Education Technology"]},
    "Real Estate & Construction": {"compliance": ["soc2", "pipeda"], "cluster": "aks",
        "industries": ["Commercial Real Estate & PropTech", "Residential Real Estate Technology",
            "Construction Technology & BIM"]},
    "Agriculture": {"compliance": ["soc2", "pipeda"], "cluster": "gke",
        "industries": ["AgriTech & Precision Agriculture", "Food Processing & Safety Technology",
            "Farm Management & Rural Technology"]},
    "Professional Services": {"compliance": ["soc2", "pipeda"], "cluster": "eks",
        "industries": ["Legal Technology & Law Firms", "HR Technology & Staffing"]},
    "Nonprofit & Public Good": {"compliance": ["pipeda"], "cluster": "gke",
        "industries": ["Charities & Foundations", "Indigenous Services & NGOs"]},
}


def build_industries():
    out = []
    for vertical, info in VERTICALS.items():
        for name in info["industries"]:
            iid = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
            out.append({
                "id": iid, "name": name, "vertical": vertical, "region": "CA",
                "compliance": info["compliance"], "cluster": info["cluster"],
            })
    return out


def main():
    data = {
        "meta": {"region": "CA", "generated": "B1", "frameworkCount": 0},
        "categories": [],
        "frameworks": load_frameworks(),
        "buildAxes": BUILD_AXES,
        "pipeline": PIPELINE,
        "compliance": COMPLIANCE,
        "clusters": CLUSTERS,
        "verticals": list(VERTICALS.keys()),
        "industries": build_industries(),
        "invariants": [
            {"id": "INV-01", "rule": "COMPLIANCE=fips requires RUNTIME=fips", "appliesTo": "all"},
            {"id": "INV-02", "rule": "Every main-build image is signed (cosign) before promotion", "appliesTo": "all"},
            {"id": "INV-03", "rule": "Promotions re-verify signatures; they do not re-sign", "appliesTo": "all"},
            {"id": "INV-04", "rule": "No image is promoted without SBOM + trivy scan", "appliesTo": "all"},
        ],
    }
    # categories from frameworks
    cats = {}
    for f in data["frameworks"]:
        cid = f["categoryId"]
        if cid and cid not in cats:
            cats[cid] = {"id": cid, "name": f["category"]}
    data["categories"] = sorted(cats.values(), key=lambda c: c["id"] or "")
    data["meta"]["frameworkCount"] = len(data["frameworks"])

    out = os.path.join(ROOT, "web", "data.json")
    with open(out, "w") as f:
        json.dump(data, f, indent=2)
    print(f"frameworks: {len(data['frameworks'])}")
    print(f"categories: {len(data['categories'])}")
    print(f"industries: {len(data['industries'])}  verticals: {len(data['verticals'])}")
    print(f"build axes: {len(data['buildAxes'])}  pipeline phases: {len(data['pipeline'])}")
    print(f"compliance: {len(data['compliance'])}  clusters: {len(data['clusters'])}")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
