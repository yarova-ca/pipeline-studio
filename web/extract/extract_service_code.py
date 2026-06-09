#!/usr/bin/env python3
"""
extract_service_code.py  —  group: service-code

Walks services/* and extracts REAL build/runtime/middleware facts from each
service's source tree (NOT invented). Emits:

  nodes/_shipped.json              serviceId -> shipped facts
  nodes/authOptions.json           distinct AUTH options seen in service code
  nodes/ormOptions.json            distinct ORM options seen in service code
  nodes/observabilityOptions.json  distinct OBSERVABILITY options seen

  provenance/service-code.json     "nodefile#id.field" -> {source, sourceType, confidence}

Truth comes only from the on-disk service files. sourceType = "service-code".
Re-runnable with: python3 extract_service_code.py
"""

import json
import os
import re
import glob

try:
    import yaml
except ImportError:
    yaml = None

ROOT = "/mnt/c/Users/RohithY/yarova/pipeline-studio"
SERVICES_DIR = os.path.join(ROOT, "services")
NODES_DIR = os.path.join(ROOT, "web", "graph", "nodes")
PROV_DIR = os.path.join(ROOT, "web", "graph", "provenance")

# Roots inside a service that hold source code (exclude build artifacts like dist/build/__pycache__)
SRC_ROOTS = ["src", "internal", "app", "App", "api", "lib"]
EXCLUDE_DIRS = {"dist", "build", "__pycache__", "node_modules", "target", "bin", "obj"}

# Axis dir names that are NOT real options (placeholders / caches)
AXIS_NOISE = {"active", "__pycache__"}


def rel(path):
    return os.path.relpath(path, ROOT)


# ─────────────────────────────────────────────────────────────────────────
# Dockerfile parsing — ARG defaults + FROM ... AS targets
# ─────────────────────────────────────────────────────────────────────────
ARG_RE = re.compile(r"^\s*ARG\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:=\s*(.*?))?\s*$")
FROM_AS_RE = re.compile(r"^\s*FROM\s+(\S+)(?:\s+AS\s+(\S+))?", re.IGNORECASE)


def parse_dockerfile(path):
    """Return (build_args dict {name: default-or-None}, from_targets list[str])."""
    build_args = {}
    targets = []
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            stripped = line.rstrip("\n")
            if stripped.lstrip().startswith("#"):
                continue
            m = ARG_RE.match(stripped)
            if m:
                name = m.group(1)
                default = m.group(2)
                if default is not None:
                    default = default.strip()
                    # strip surrounding quotes if present
                    if len(default) >= 2 and default[0] == default[-1] and default[0] in "\"'":
                        default = default[1:-1]
                # keep the first-seen default (don't overwrite a real default with a later bare re-decl)
                if name not in build_args or (build_args[name] is None and default is not None):
                    build_args[name] = default
                continue
            fm = FROM_AS_RE.match(stripped)
            if fm and fm.group(2):
                tgt = fm.group(2)
                if tgt not in targets:
                    targets.append(tgt)
    return build_args, targets


# ─────────────────────────────────────────────────────────────────────────
# catalog-info.yaml parsing
# ─────────────────────────────────────────────────────────────────────────
def parse_catalog(path):
    """Return dict with name, title, sourceLocation, tags, spec metadata."""
    out = {}
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            doc = yaml.safe_load(fh)
    except Exception:
        return out
    if not isinstance(doc, dict):
        return out
    meta = doc.get("metadata", {}) or {}
    out["name"] = meta.get("name")
    out["title"] = meta.get("title")
    out["tags"] = meta.get("tags") or []
    ann = meta.get("annotations", {}) or {}
    out["sourceLocation"] = ann.get("backstage.io/source-location")
    out["projectSlug"] = ann.get("github.com/project-slug")
    spec = doc.get("spec", {}) or {}
    out["type"] = spec.get("type")
    out["lifecycle"] = spec.get("lifecycle")
    out["owner"] = spec.get("owner")
    out["system"] = spec.get("system")
    spec_meta = spec.get("metadata", {}) or {}
    out["specMetadata"] = spec_meta
    return out


# ─────────────────────────────────────────────────────────────────────────
# compliance/*.yaml parsing
# ─────────────────────────────────────────────────────────────────────────
def control_key(item):
    if isinstance(item, dict):
        keys = list(item.keys())
        return keys[0] if keys else None
    if isinstance(item, str):
        return item
    return None


def parse_compliance(svc_dir):
    """Return list of shipped-compliance records from compliance/*.yaml files."""
    records = []
    comp_dir = os.path.join(svc_dir, "compliance")
    if not os.path.isdir(comp_dir):
        return records
    for fname in sorted(os.listdir(comp_dir)):
        if not (fname.endswith(".yaml") or fname.endswith(".yml")):
            continue
        standard = fname.rsplit(".", 1)[0]
        fpath = os.path.join(comp_dir, fname)
        controls = []
        build_args = {}
        try:
            with open(fpath, "r", encoding="utf-8", errors="replace") as fh:
                doc = yaml.safe_load(fh)
        except Exception:
            doc = None
        if isinstance(doc, dict):
            for item in doc.get("required_controls", []) or []:
                k = control_key(item)
                if k:
                    controls.append(k)
            ba = doc.get("build_args")
            if isinstance(ba, dict):
                build_args = {k: v for k, v in ba.items()}
        records.append({
            "standard": standard,
            "file": rel(fpath),
            "requiredControls": controls,
            "buildArgs": build_args,
        })
    return records


# ─────────────────────────────────────────────────────────────────────────
# Workflows
# ─────────────────────────────────────────────────────────────────────────
def parse_workflows(svc_dir):
    """Return list of {file, name, jobs[]} for each workflow yaml."""
    wf_dir = os.path.join(svc_dir, ".github", "workflows")
    out = []
    if not os.path.isdir(wf_dir):
        return out
    for fname in sorted(os.listdir(wf_dir)):
        if not (fname.endswith(".yml") or fname.endswith(".yaml")):
            continue
        fpath = os.path.join(wf_dir, fname)
        name = None
        jobs = []
        try:
            with open(fpath, "r", encoding="utf-8", errors="replace") as fh:
                doc = yaml.safe_load(fh)
        except Exception:
            doc = None
        if isinstance(doc, dict):
            name = doc.get("name")
            jobs_block = doc.get("jobs")
            if isinstance(jobs_block, dict):
                jobs = list(jobs_block.keys())
        out.append({"file": fname, "name": name, "jobs": jobs})
    return out


# ─────────────────────────────────────────────────────────────────────────
# Helm + Kustomize
# ─────────────────────────────────────────────────────────────────────────
def parse_helm(svc_dir):
    helm_dir = os.path.join(svc_dir, "helm")
    if not os.path.isdir(helm_dir):
        return False, []
    values_files = sorted(
        f for f in os.listdir(helm_dir)
        if f.startswith("values") and (f.endswith(".yaml") or f.endswith(".yml"))
    )
    return True, values_files


def parse_kustomize_overlays(svc_dir):
    ov_dir = os.path.join(svc_dir, "kustomize", "overlays")
    if not os.path.isdir(ov_dir):
        return []
    return sorted(
        d for d in os.listdir(ov_dir)
        if os.path.isdir(os.path.join(ov_dir, d))
    )


# ─────────────────────────────────────────────────────────────────────────
# Source code probing: axis option dirs, middleware, ORM, observability
# ─────────────────────────────────────────────────────────────────────────
def find_axis_dir(svc_dir, axis_names):
    """Find a source root holding one of the axis dirs (e.g. 'auth').
    Returns (axis_dir_path, root_used) or (None, None)."""
    for root in SRC_ROOTS:
        for axis in axis_names:
            cand = os.path.join(svc_dir, root, axis)
            if os.path.isdir(cand):
                return cand, root
    return None, None


def list_option_dirs(axis_dir):
    """Return sorted real option subdir names (excluding noise)."""
    if not axis_dir or not os.path.isdir(axis_dir):
        return []
    out = []
    for d in sorted(os.listdir(axis_dir)):
        if d in AXIS_NOISE:
            continue
        if os.path.isdir(os.path.join(axis_dir, d)):
            out.append(d)
    return out


def detect_middleware(svc_dir):
    """Detect auth/audit/rbac/circuit-breaker middleware presence.
    Looks at <root>/middleware/* and <root>/auth/* across source roots."""
    mw = {"auth": False, "audit": False, "rbac": False, "circuitBreaker": False}
    files_seen = []
    for root in SRC_ROOTS:
        mw_dir = os.path.join(svc_dir, root, "middleware")
        if os.path.isdir(mw_dir):
            for f in os.listdir(mw_dir):
                full = os.path.join(mw_dir, f)
                if not os.path.isfile(full):
                    continue
                base = f.lower()
                files_seen.append(os.path.join(root, "middleware", f))
                if base.startswith("auth"):
                    mw["auth"] = True
                if base.startswith("audit"):
                    mw["audit"] = True
                if base.startswith("require-role") or "rbac" in base or base.startswith("require_role"):
                    mw["rbac"] = True
                if base.startswith("circuit"):
                    mw["circuitBreaker"] = True
    # An auth axis dir also confirms auth middleware capability
    auth_dir, _ = find_axis_dir(svc_dir, ["auth"])
    if auth_dir:
        mw["auth"] = True
    return mw, files_seen


# ORM library signatures -> canonical orm name. Detected by scanning db code files.
ORM_SIGNATURES = [
    ("prisma", [r"@prisma/client", r"PrismaClient", r"prisma\.\$"]),
    ("sqlalchemy", [r"sqlalchemy", r"declarative_base", r"sessionmaker"]),
    ("gorm", [r"gorm\.io/gorm", r"gorm:\"", r"\*gorm\.DB"]),
    ("sqlx", [r"\bsqlx\b", r"sqlx::FromRow", r"PgPool"]),
    ("diesel", [r"\bdiesel\b", r"diesel::"]),
    ("sea-orm", [r"sea_orm", r"sea-orm"]),
    ("typeorm", [r"typeorm", r"@Entity\b"]),
    ("drizzle", [r"drizzle-orm", r"drizzle\("]),
    ("mongoose", [r"\bmongoose\b"]),
    ("ent", [r"entgo\.io/ent"]),
]


def detect_orm(svc_dir, db_options, db_dir):
    """Detect ORM usage from service code.

    Returns (detected: bool, orm_name: str|None).
    Truth sources:
      1. A non-'none' swappable db option dir (e.g. db/prisma/).
      2. ORM library signature found inside db code files.
    """
    real = [o for o in db_options if o.lower() != "none"]
    if real:
        return True, real[0]
    if db_dir and os.path.isdir(db_dir):
        for f in os.listdir(db_dir):
            full = os.path.join(db_dir, f)
            if not os.path.isfile(full):
                continue
            try:
                with open(full, "r", encoding="utf-8", errors="replace") as fh:
                    text = fh.read()
            except Exception:
                continue
            for orm_name, pats in ORM_SIGNATURES:
                for pat in pats:
                    if re.search(pat, text):
                        return True, orm_name
    return False, None


def detect_observability(svc_dir, obs_options):
    """Observability detected if a non-'none' option exists, or tracing/metrics files present."""
    real = [o for o in obs_options if o.lower() != "none"]
    if real:
        return True
    for root in SRC_ROOTS:
        for fn in ("tracing.ts", "tracing.py", "metrics.ts", "metrics.py", "tracing.go", "metrics.go"):
            if os.path.isfile(os.path.join(svc_dir, root, fn)):
                return True
    return False


# ─────────────────────────────────────────────────────────────────────────
# Main extraction
# ─────────────────────────────────────────────────────────────────────────
def main():
    if yaml is None:
        raise SystemExit("PyYAML required. pip install pyyaml")

    os.makedirs(NODES_DIR, exist_ok=True)
    os.makedirs(PROV_DIR, exist_ok=True)

    service_dirs = sorted(
        d for d in os.listdir(SERVICES_DIR)
        if os.path.isdir(os.path.join(SERVICES_DIR, d))
    )

    shipped = {}
    provenance = {}

    # Accumulators for option nodes: option-name -> set of serviceIds
    auth_seen = {}
    orm_seen = {}
    obs_seen = {}

    def prov(node_file, entity_id, field, source, conf="high"):
        provenance[f"{node_file}#{entity_id}.{field}"] = {
            "source": source,
            "sourceType": "service-code",
            "confidence": conf,
        }

    for svc in service_dirs:
        svc_dir = os.path.join(SERVICES_DIR, svc)
        rec = {"id": svc, "name": svc}

        # catalog-info.yaml
        catalog_path = os.path.join(svc_dir, "catalog-info.yaml")
        catalog_ref = None
        if os.path.isfile(catalog_path):
            cat = parse_catalog(catalog_path)
            catalog_ref = rel(catalog_path)
            if cat.get("title"):
                rec["name"] = cat["title"]
            rec["catalogRef"] = catalog_ref
            if cat.get("sourceLocation"):
                rec["sourceLocation"] = cat["sourceLocation"]
                prov("_shipped.json", svc, "sourceLocation", catalog_ref)
            rec["catalogSystem"] = cat.get("system")
            rec["catalogTags"] = cat.get("tags")
            prov("_shipped.json", svc, "name", catalog_ref)
            prov("_shipped.json", svc, "catalogTags", catalog_ref)
        else:
            rec["catalogRef"] = None

        # Dockerfile
        docker_path = os.path.join(svc_dir, "Dockerfile")
        build_args = {}
        targets = []
        runtime_variants = []
        if os.path.isfile(docker_path):
            build_args, targets = parse_dockerfile(docker_path)
            rec["dockerfileTargets"] = targets
            rec["buildArgs"] = build_args
            # runtime variants = the RUNTIME axis default + named runtime targets
            rt_default = build_args.get("RUNTIME")
            named_rt = [t for t in targets if t.startswith("runtime")]
            variants = []
            if rt_default:
                variants.append(rt_default)
            for t in named_rt:
                # runtime-fips -> fips ; runtime -> (covered by default)
                if "-" in t:
                    suffix = t.split("-", 1)[1]
                    if suffix not in variants:
                        variants.append(suffix)
            runtime_variants = variants
            rec["runtimeVariants"] = runtime_variants
            dref = rel(docker_path)
            prov("_shipped.json", svc, "dockerfileTargets", dref)
            prov("_shipped.json", svc, "buildArgs", dref)
            prov("_shipped.json", svc, "runtimeVariants", dref)
        else:
            rec["dockerfileTargets"] = []
            rec["buildArgs"] = {}
            rec["runtimeVariants"] = []

        # Workflows
        workflows = parse_workflows(svc_dir)
        rec["workflows"] = workflows
        if workflows:
            prov("_shipped.json", svc, "workflows", rel(os.path.join(svc_dir, ".github", "workflows")))

        # Compliance
        compliance = parse_compliance(svc_dir)
        rec["shippedCompliance"] = compliance
        if compliance:
            prov("_shipped.json", svc, "shippedCompliance", rel(os.path.join(svc_dir, "compliance")))

        # Helm
        has_helm, helm_values = parse_helm(svc_dir)
        rec["helm"] = has_helm
        rec["helmValuesFiles"] = helm_values
        if has_helm:
            prov("_shipped.json", svc, "helm", rel(os.path.join(svc_dir, "helm")))

        # Kustomize overlays
        overlays = parse_kustomize_overlays(svc_dir)
        rec["kustomizeOverlays"] = overlays
        if overlays:
            prov("_shipped.json", svc, "kustomizeOverlays", rel(os.path.join(svc_dir, "kustomize", "overlays")))

        # Axis option dirs (auth / db / observability)
        auth_dir, auth_root = find_axis_dir(svc_dir, ["auth"])
        db_dir, db_root = find_axis_dir(svc_dir, ["db"])
        obs_dir, obs_root = find_axis_dir(svc_dir, ["observability"])

        auth_options = list_option_dirs(auth_dir)
        db_options = list_option_dirs(db_dir)
        obs_options = list_option_dirs(obs_dir)

        rec["authOptionsAvailable"] = auth_options
        rec["ormOptionsAvailable"] = db_options
        rec["observabilityOptionsAvailable"] = obs_options

        if auth_options:
            prov("_shipped.json", svc, "authOptionsAvailable", rel(auth_dir))
        if db_options:
            prov("_shipped.json", svc, "ormOptionsAvailable", rel(db_dir))
        if obs_options:
            prov("_shipped.json", svc, "observabilityOptionsAvailable", rel(obs_dir))

        # Middleware
        mw, mw_files = detect_middleware(svc_dir)
        rec["middleware"] = mw
        if mw_files:
            prov("_shipped.json", svc, "middleware", rel(os.path.join(svc_dir, mw_files[0].rsplit("/", 1)[0])))
        elif auth_dir:
            prov("_shipped.json", svc, "middleware", rel(auth_dir))

        # ORM / Observability detection
        orm_detected, orm_name = detect_orm(svc_dir, db_options, db_dir)
        rec["ormDetected"] = orm_detected
        rec["ormName"] = orm_name
        # record signature-detected ORM into the option accumulator too
        if orm_name and orm_name not in db_options:
            orm_seen.setdefault(orm_name, set()).add(svc)
        rec["observabilityDetected"] = detect_observability(svc_dir, obs_options)
        if db_dir:
            prov("_shipped.json", svc, "ormDetected", rel(db_dir))
        if obs_dir:
            prov("_shipped.json", svc, "observabilityDetected", rel(obs_dir))

        # Accumulate options for the option-node files
        # also include the Dockerfile axis defaults (AUTH/ORM/OBSERVABILITY)
        for opt in auth_options:
            auth_seen.setdefault(opt, set()).add(svc)
        if build_args.get("AUTH"):
            auth_seen.setdefault(build_args["AUTH"], set()).add(svc)

        for opt in db_options:
            orm_seen.setdefault(opt, set()).add(svc)
        if build_args.get("ORM"):
            orm_seen.setdefault(build_args["ORM"], set()).add(svc)

        for opt in obs_options:
            obs_seen.setdefault(opt, set()).add(svc)
        if build_args.get("OBSERVABILITY"):
            obs_seen.setdefault(build_args["OBSERVABILITY"], set()).add(svc)

        shipped[svc] = rec

    # ── Build option nodes ──────────────────────────────────────────────
    def build_options(seen, axis_name, node_file):
        nodes = []
        for opt in sorted(seen.keys()):
            svc_list = sorted(seen[opt])
            entity = {
                "id": f"{axis_name}-{opt}",
                "name": opt,
                "axis": axis_name.upper(),
                "serviceCount": len(svc_list),
                "services": svc_list,
            }
            nodes.append(entity)
            prov(node_file, entity["id"], "services",
                 f"{SERVICES_DIR}/*/src(or internal)/{axis_name} + Dockerfile ARG {axis_name.upper()}")
            prov(node_file, entity["id"], "name",
                 f"{SERVICES_DIR}/*/src(or internal)/{axis_name}/{opt}")
        return nodes

    auth_nodes = build_options(auth_seen, "auth", "authOptions.json")
    orm_nodes = build_options(orm_seen, "orm", "ormOptions.json")
    obs_nodes = build_options(obs_seen, "observability", "observabilityOptions.json")

    # ── Write outputs ──────────────────────────────────────────────────
    def write_json(path, obj):
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(obj, fh, indent=2, ensure_ascii=False, sort_keys=False)
            fh.write("\n")

    write_json(os.path.join(NODES_DIR, "_shipped.json"), shipped)
    write_json(os.path.join(NODES_DIR, "authOptions.json"), auth_nodes)
    write_json(os.path.join(NODES_DIR, "ormOptions.json"), orm_nodes)
    write_json(os.path.join(NODES_DIR, "observabilityOptions.json"), obs_nodes)
    write_json(os.path.join(PROV_DIR, "service-code.json"), provenance)

    # ── Report ──────────────────────────────────────────────────────────
    print(f"services processed : {len(shipped)}")
    print(f"authOptions        : {len(auth_nodes)} -> {[n['name'] for n in auth_nodes]}")
    print(f"ormOptions         : {len(orm_nodes)} -> {[n['name'] for n in orm_nodes]}")
    print(f"observabilityOpts  : {len(obs_nodes)} -> {[n['name'] for n in obs_nodes]}")
    print(f"provenance entries : {len(provenance)}")
    with_docker = sum(1 for r in shipped.values() if r["dockerfileTargets"])
    with_helm = sum(1 for r in shipped.values() if r["helm"])
    with_kust = sum(1 for r in shipped.values() if r["kustomizeOverlays"])
    with_wf = sum(1 for r in shipped.values() if r["workflows"])
    with_comp = sum(1 for r in shipped.values() if r["shippedCompliance"])
    with_orm = sum(1 for r in shipped.values() if r["ormDetected"])
    with_obs = sum(1 for r in shipped.values() if r["observabilityDetected"])
    print(f"with Dockerfile    : {with_docker}")
    print(f"with helm          : {with_helm}")
    print(f"with kustomize     : {with_kust}")
    print(f"with workflows     : {with_wf}")
    print(f"with compliance    : {with_comp}")
    print(f"ormDetected        : {with_orm}")
    print(f"observabilityDet   : {with_obs}")


if __name__ == "__main__":
    main()
