#!/usr/bin/env python3
"""Generate per-service TechDocs from each service's real files.

For every services/* directory this writes:
  - docs/index.md   (format-compliant, built from real metadata)
  - mkdocs.yml      (techdocs-core, single Home page)
and sets the catalog-info.yaml techdocs-ref annotation to `dir:.`.
"""

import glob
import os
import re

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVICES = sorted(glob.glob(os.path.join(ROOT, "services", "*")))

# Plain-English label for each build axis.
AXIS_PURPOSE = {
    "RUNTIME": "Base runtime image (standard or FIPS).",
    "BUILD_IMAGE": "Builder base image family.",
    "BUILD_BASE": "Builder base image tag.",
    "PKG_MGR": "Package manager used at build.",
    "BUILD_TOOL": "Compiler or bundler used.",
    "COMPLIANCE": "Compliance profile baked in.",
    "OBSERVABILITY": "Telemetry stack wired in.",
    "AUTH": "Auth scheme wired in.",
    "ORM": "Database access layer.",
}

COMPLIANCE_LABEL = {
    "fedramp": "FedRAMP",
    "fips": "FIPS 140-3",
    "hipaa": "HIPAA",
    "pci": "PCI-DSS",
    "pipeda": "PIPEDA",
    "soc2": "SOC 2",
    "cmmc": "CMMC",
    "nerc": "NERC CIP",
}

WORKFLOW_LABEL = {
    "01-pre-commit": "Pre-commit checks",
    "02-security-gates": "Security gates",
    "03-build-pr": "Build on PR",
    "04-build-push-sign": "Build, push, sign image",
    "05-test": "Test suite",
    "06-release": "Release",
    "07-notify": "Notify",
}


def humanize_system(system):
    # "14-nodejs" -> "Node.js"; "29-graphql" -> "GraphQL"
    name = re.sub(r"^\d+-", "", system or "")
    special = {
        "nodejs": "Node.js",
        "graphql": "GraphQL",
        "grpc": "gRPC",
        "websocket": "WebSocket",
        "ssr": "Server-side rendering",
        "spa": "Single-page app",
        "ssg": "Static site generation",
        "dotnet": ".NET",
        "cpp": "C++",
        "php": "PHP",
        "ios": "iOS",
    }
    return special.get(name, name.capitalize() if name else "Service")


def read_meta(service_dir):
    path = os.path.join(service_dir, "catalog-info.yaml")
    with open(path) as f:
        doc = yaml.safe_load(f)
    meta = doc.get("metadata", {})
    spec = doc.get("spec", {})
    ann = meta.get("annotations", {})
    spec_meta = spec.get("metadata", {})

    def pick(*vals):
        for v in vals:
            if v:
                return v
        return None

    return {
        "doc": doc,
        "path": path,
        "name": meta.get("name"),
        "title": meta.get("title") or meta.get("name"),
        "description": (meta.get("description") or "").strip().splitlines()[0]
        if meta.get("description")
        else "",
        "language": pick(ann.get("pipeline-studio/language"), spec_meta.get("language")),
        "pattern": pick(ann.get("pipeline-studio/pattern"), spec_meta.get("pattern")),
        "port": pick(ann.get("pipeline-studio/port"), spec_meta.get("port")),
        "system": spec.get("system"),
    }


def read_build_args(service_dir):
    dockerfile = os.path.join(service_dir, "Dockerfile")
    args = []
    seen = set()
    if not os.path.exists(dockerfile):
        return args
    with open(dockerfile) as f:
        for line in f:
            m = re.match(r"^ARG\s+([A-Z_]+)(?:=(.*))?\s*$", line.strip())
            if not m:
                continue
            key = m.group(1)
            if key in seen:
                continue
            seen.add(key)
            args.append((key, (m.group(2) or "").strip()))
    return args


def list_compliance(service_dir):
    files = sorted(glob.glob(os.path.join(service_dir, "compliance", "*.yaml")))
    out = []
    for f in files:
        stem = os.path.splitext(os.path.basename(f))[0]
        out.append((COMPLIANCE_LABEL.get(stem, stem.upper()), f"compliance/{os.path.basename(f)}"))
    return out


def list_workflows(service_dir):
    files = sorted(glob.glob(os.path.join(service_dir, ".github", "workflows", "*.yml")))
    out = []
    for f in files:
        stem = os.path.splitext(os.path.basename(f))[0]
        out.append((WORKFLOW_LABEL.get(stem, stem), f".github/workflows/{os.path.basename(f)}"))
    return out


def yes_no(present):
    return "✅" if present else "❌"


def build_index(service_dir, m):
    name = m["name"]
    title = m["title"]
    language = m["language"] or "polyglot"
    pattern = m["pattern"] or "service"
    raw_port = (str(m["port"]).strip() if m["port"] is not None else "")
    has_port = raw_port not in ("", "—", "N/A", "n/a", "none", "None")
    port = raw_port if has_port else None
    system_label = humanize_system(m["system"])

    has_compose = os.path.exists(os.path.join(service_dir, "docker-compose.yml"))
    has_package_json = os.path.exists(os.path.join(service_dir, "package.json"))

    has_helm = os.path.isdir(os.path.join(service_dir, "helm"))
    has_kustomize = os.path.isdir(os.path.join(service_dir, "kustomize"))
    has_tests = os.path.isdir(os.path.join(service_dir, "tests")) or bool(
        glob.glob(os.path.join(service_dir, "*_test.*"))
    )
    compliance = list_compliance(service_dir)
    workflows = list_workflows(service_dir)
    build_args = read_build_args(service_dir)

    L = []
    L.append(f"# {title}")
    L.append("")
    if m["description"]:
        L.append(m["description"])
        L.append("")

    L.append("## What this is")
    L.append("")
    L.append(f"{title} is a {language} {pattern} service starter.")
    L.append("")
    L.append("Runnable today. Production-shaped. One command to start.")
    L.append("")
    if has_port:
        L.append(f"Port: {port}.")
    else:
        L.append("Port: not applicable (client-side build).")
    L.append(f"Category: {system_label}.")
    L.append("")

    L.append("## What is included")
    L.append("")
    L.append("Every row below ships inside this service.")
    L.append("")
    L.append("| Component | Included |")
    L.append("|---|---|")
    L.append("| Dockerfile (multi-axis build) | ✅ |")
    L.append(f"| Helm chart (per-environment values) | {yes_no(has_helm)} |")
    L.append(f"| Kustomize overlays | {yes_no(has_kustomize)} |")
    L.append(
        f"| Compliance configs | {('%d regimes' % len(compliance)) if compliance else '❌'} |"
    )
    L.append(f"| Test suite | {yes_no(has_tests)} |")
    L.append(
        f"| GitHub Actions pipeline | {('%d phases' % len(workflows)) if workflows else '❌'} |"
    )
    L.append("")

    if build_args:
        L.append("## Docker build axes")
        L.append("")
        L.append("This service accepts these Docker build-args.")
        L.append("")
        L.append("Build-arg: a value passed at image build time.")
        L.append("")
        L.append("| Axis | Default | Purpose |")
        L.append("|---|---|---|")
        for key, default in build_args:
            purpose = AXIS_PURPOSE.get(key, "Build option.")
            L.append(f"| {key} | {default or '—'} | {purpose} |")
        L.append("")

    if compliance:
        L.append("## Compliance regimes")
        L.append("")
        L.append("Each regime has a config file in `compliance/`.")
        L.append("")
        L.append("| Regime | File |")
        L.append("|---|---|")
        for label, path in compliance:
            L.append(f"| {label} | {path} |")
        L.append("")

    if workflows:
        L.append("## CI/CD pipeline")
        L.append("")
        L.append("The pipeline runs in numbered phases.")
        L.append("")
        L.append("| Phase | File |")
        L.append("|---|---|")
        for label, path in workflows:
            L.append(f"| {label} | {path} |")
        L.append("")

    L.append("## Run locally")
    L.append("")
    if has_compose:
        L.append("Start the service with one command.")
        L.append("")
        L.append("```bash")
        L.append("docker compose up")
        L.append("```")
        L.append("")
        if has_port:
            L.append(f"Health endpoint: `http://localhost:{port}/health`.")
            L.append("")
    elif has_package_json:
        L.append("Install dependencies, then start the dev server.")
        L.append("")
        L.append("```bash")
        L.append("npm install")
        L.append("npm run dev")
        L.append("```")
        L.append("")
    else:
        L.append(f"Build with the {language} platform toolchain.")
        L.append("")
        L.append("See the files in this service for exact build steps.")
        L.append("")

    L.append("## Source")
    L.append("")
    L.append(f"All files live in `services/{name}/` in the pipeline-studio repo.")
    L.append("")

    return "\n".join(L)


def build_mkdocs(m):
    title = m["title"]
    desc = m["description"] or f"{title} service starter."
    return (
        f"site_name: {title}\n"
        f"site_description: {desc}\n"
        "\n"
        "plugins:\n"
        "  - techdocs-core\n"
        "\n"
        "nav:\n"
        "  - Home: index.md\n"
    )


def set_techdocs_ref(m):
    # Rewrite the techdocs-ref annotation to dir:. via text edit (preserve formatting).
    with open(m["path"]) as f:
        content = f.read()
    new = re.sub(
        r"(backstage\.io/techdocs-ref:\s*).*",
        r"\1dir:.",
        content,
    )
    if new != content:
        with open(m["path"], "w") as f:
            f.write(new)
        return True
    return False


def main():
    docs_written = 0
    mkdocs_written = 0
    refs_updated = 0

    for service_dir in SERVICES:
        if not os.path.isdir(service_dir):
            continue
        if not os.path.exists(os.path.join(service_dir, "catalog-info.yaml")):
            continue
        m = read_meta(service_dir)

        docs_dir = os.path.join(service_dir, "docs")
        os.makedirs(docs_dir, exist_ok=True)
        with open(os.path.join(docs_dir, "index.md"), "w") as f:
            f.write(build_index(service_dir, m))
        docs_written += 1

        with open(os.path.join(service_dir, "mkdocs.yml"), "w") as f:
            f.write(build_mkdocs(m))
        mkdocs_written += 1

        if set_techdocs_ref(m):
            refs_updated += 1

    print(f"docs/index.md written: {docs_written}")
    print(f"mkdocs.yml written:    {mkdocs_written}")
    print(f"techdocs-ref updated:  {refs_updated}")


if __name__ == "__main__":
    main()
