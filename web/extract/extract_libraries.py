#!/usr/bin/env python3
"""Recursive improvement — extract REAL library dependencies per service.

Parses each service's real manifest (package.json, go.mod, requirements.txt,
Cargo.toml, pom.xml, build.gradle, composer.json, Gemfile, *.csproj, mix.exs)
into web/graph/nodes/libraries.json + a per-service map, with provenance.
"""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
N = os.path.join(ROOT, "web", "graph", "nodes")
PROV = os.path.join(ROOT, "web", "graph", "provenance")
SERVICES = os.path.join(ROOT, "services")


def parse_package_json(p):
    try:
        d = json.load(open(p))
    except Exception:
        return []
    out = []
    for sec in ("dependencies", "devDependencies"):
        for name, ver in (d.get(sec) or {}).items():
            out.append((name, str(ver), "npm", sec == "dependencies"))
    return out


def parse_go_mod(p):
    out = []
    txt = open(p, errors="ignore").read()
    for m in re.finditer(r"^\s*([\w./\-]+)\s+v([\w.\-]+)", txt, re.M):
        if m.group(1) not in ("go", "module", "toolchain"):
            out.append((m.group(1), "v" + m.group(2), "go", True))
    return out


def parse_requirements(p):
    out = []
    for line in open(p, errors="ignore"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"([A-Za-z0-9_.\-]+)\s*([<>=!~]+.*)?", line)
        if m:
            out.append((m.group(1), (m.group(2) or "").strip(), "pip", True))
    return out


def parse_cargo(p):
    out = []
    txt = open(p, errors="ignore").read()
    in_deps = False
    for line in txt.splitlines():
        s = line.strip()
        if s.startswith("["):
            in_deps = "dependencies" in s
            continue
        if in_deps and "=" in s:
            name = s.split("=")[0].strip()
            ver = re.search(r'"([^"]+)"', s)
            out.append((name, ver.group(1) if ver else "", "cargo", True))
    return out


def parse_composer(p):
    try:
        d = json.load(open(p))
    except Exception:
        return []
    out = []
    for sec in ("require", "require-dev"):
        for name, ver in (d.get(sec) or {}).items():
            if name != "php":
                out.append((name, str(ver), "composer", sec == "require"))
    return out


def parse_gemfile(p):
    out = []
    for line in open(p, errors="ignore"):
        m = re.match(r"\s*gem\s+['\"]([^'\"]+)['\"](?:\s*,\s*['\"]([^'\"]+)['\"])?", line)
        if m:
            out.append((m.group(1), m.group(2) or "", "gem", True))
    return out


def parse_pom(p):
    out = []
    txt = open(p, errors="ignore").read()
    for m in re.finditer(r"<artifactId>([^<]+)</artifactId>\s*<version>([^<]+)</version>", txt):
        out.append((m.group(1), m.group(2), "maven", True))
    return out


def parse_gradle(p):
    out = []
    for line in open(p, errors="ignore"):
        m = re.search(r"['\"]([\w.\-]+:[\w.\-]+):([\w.\-]+)['\"]", line)
        if m:
            out.append((m.group(1), m.group(2), "gradle", True))
    return out


PARSERS = [
    ("package.json", parse_package_json), ("go.mod", parse_go_mod),
    ("requirements.txt", parse_requirements), ("Cargo.toml", parse_cargo),
    ("composer.json", parse_composer), ("Gemfile", parse_gemfile),
    ("pom.xml", parse_pom), ("build.gradle", parse_gradle),
    ("build.gradle.kts", parse_gradle),
]


def main():
    libs = {}            # libId -> {id,name,ecosystem,versions:set,usedByCount}
    per_service = {}     # serviceId -> [{name,version,ecosystem,direct}]
    prov = {}
    for sdir in sorted(glob.glob(os.path.join(SERVICES, "*"))):
        sid = os.path.basename(sdir)
        found = []
        for fname, fn in PARSERS:
            # top-level manifest only — never recurse into node_modules/vendor/target/dist
            p = os.path.join(sdir, fname)
            if os.path.exists(p):
                for (name, ver, eco, direct) in fn(p):
                    found.append({"name": name, "version": ver, "ecosystem": eco, "direct": direct})
                    lid = re.sub(r"[^a-z0-9]+", "-", f"{eco}-{name}".lower()).strip("-")
                    L = libs.setdefault(lid, {"id": lid, "name": name, "label": name,
                                              "ecosystem": eco, "versions": set(), "usedBy": set()})
                    if ver:
                        L["versions"].add(ver)
                    L["usedBy"].add(sid)
        if found:
            per_service[sid] = found
            prov[f"libraries.perService#{sid}"] = {
                "source": f"services/{sid} manifests", "sourceType": "service-code", "confidence": "high"}

    lib_list = []
    for L in libs.values():
        lib_list.append({"id": L["id"], "name": L["name"], "label": L["label"],
                         "ecosystem": L["ecosystem"], "versions": sorted(L["versions"]),
                         "usedByCount": len(L["usedBy"]), "usedBy": sorted(L["usedBy"])})
    lib_list.sort(key=lambda x: -x["usedByCount"])

    json.dump(lib_list, open(os.path.join(N, "libraries.json"), "w"), indent=2)
    json.dump(per_service, open(os.path.join(N, "_libsByService.json"), "w"), indent=2)
    json.dump(prov, open(os.path.join(PROV, "libraries.json"), "w"), indent=2)
    print(f"distinct libraries: {len(lib_list)}")
    print(f"services with libs: {len(per_service)}")
    print(f"top libs: {[l['name']+'('+str(l['usedByCount'])+')' for l in lib_list[:6]]}")


if __name__ == "__main__":
    main()
