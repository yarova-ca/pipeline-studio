#!/usr/bin/env python3
"""
Extractor for graph group: clusters-concepts.

Sources (REAL data only — no invention):
  legacy/19-cluster-setup.html   -> clusterComponents.json (30 components),
                                     clusters.json (AKS/EKS/GKE/OpenShift cloud targets),
                                     gitopsTools.json (argo / helm / kustomize / flux)
  legacy/23-deployment.html      -> additional gitops + deployment concept notes
  legacy/00,02,03,16,20,22,24    -> conceptNotes.json (distilled from page metadata + key prose)

Outputs:
  web/graph/nodes/clusters.json
  web/graph/nodes/clusterComponents.json
  web/graph/nodes/gitopsTools.json
  web/graph/nodes/conceptNotes.json
  web/graph/provenance/clusters-concepts.json

Re-runnable: stdlib only (re, html, json, os).
"""

import re
import html
import json
import os

REPO = "/mnt/c/Users/RohithY/yarova/pipeline-studio"
LEGACY = os.path.join(REPO, "legacy")
NODES = os.path.join(REPO, "web", "graph", "nodes")
PROV = os.path.join(REPO, "web", "graph", "provenance")

GROUP = "clusters-concepts"

provenance = {}


def prov(key, source, source_type, confidence):
    provenance[key] = {
        "source": source,
        "sourceType": source_type,
        "confidence": confidence,
    }


def read(name):
    with open(os.path.join(LEGACY, name), "r", encoding="utf-8") as f:
        return f.read()


def clean(s):
    """Strip tags, unescape entities, collapse whitespace."""
    if s is None:
        return None
    # drop HTML comments
    s = re.sub(r"<!--.*?-->", " ", s, flags=re.S)
    # turn inline code/strong into plain text
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def clean_code(s):
    """Strip tags from a code block but keep newlines."""
    if s is None:
        return None
    s = re.sub(r"<!--.*?-->", " ", s, flags=re.S)
    s = re.sub(r"</?code[^>]*>", "", s)
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    # collapse runs of spaces but keep newlines
    s = "\n".join(line.strip() for line in s.splitlines())
    return s.strip()


def slugify(text):
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


# ---------------------------------------------------------------------------
# 1. clusterComponents.json  — 30 components from 19-cluster-setup.html
# ---------------------------------------------------------------------------
def extract_components(html_text):
    comps = []
    # Each component is a <details class="component-detail"> ... </details>
    blocks = re.findall(
        r'<details class="component-detail">(.*?)</details>',
        html_text,
        flags=re.S,
    )
    for b in blocks:
        num_m = re.search(r'<span class="comp-num">([^<]*)</span>', b)
        name_m = re.search(r'<span class="comp-name">(.*?)</span>', b, flags=re.S)
        layer_m = re.search(r'<span class="comp-layer">([^<]*)</span>', b)
        status_m = re.search(
            r'<span class="comp-status comp-(\w+)">([^<]*)</span>', b
        )
        what_m = re.search(
            r'<p class="comp-what">\s*<strong>What:</strong>(.*?)</p>', b, flags=re.S
        )
        why_m = re.search(
            r'<p class="comp-why-p">\s*<strong>Why:</strong>(.*?)</p>', b, flags=re.S
        )

        def section(label):
            m = re.search(
                r"<strong>" + re.escape(label) + r":</strong>(.*?)</div>",
                b,
                flags=re.S,
            )
            return m.group(1) if m else None

        install_raw = section("Install")
        wired_raw = section("Wired to")

        # verify: capture the comp-cmd and the comp-expected separately
        verify_block_m = re.search(
            r"<strong>Verify:</strong>(.*?)</div>\s*<div class=\"(?:failure-block|comp-section)",
            b,
            flags=re.S,
        )
        verify_cmd = None
        verify_expected = None
        verify_scope = verify_block_m.group(1) if verify_block_m else section("Verify")
        if verify_scope:
            vc = re.search(r'<code class="comp-cmd">(.*?)</code>', verify_scope, flags=re.S)
            ve = re.search(r'<span class="comp-expected">(.*?)</span>', verify_scope, flags=re.S)
            verify_cmd = clean_code(vc.group(1)) if vc else None
            verify_expected = clean(ve.group(1)) if ve else None

        # health (only component 30 has it)
        health_cmd = None
        health_expected = None
        health_m = re.search(
            r"<strong>Health:</strong>(.*?)</div>", b, flags=re.S
        )
        if health_m:
            hc = re.search(r'<code class="comp-cmd">(.*?)</code>', health_m.group(1), flags=re.S)
            he = re.search(r'<span class="comp-expected">(.*?)</span>', health_m.group(1), flags=re.S)
            health_cmd = clean_code(hc.group(1)) if hc else None
            health_expected = clean(he.group(1)) if he else None

        # install command (first comp-cmd in install section)
        install_cmd = None
        install_note = None
        if install_raw:
            ic = re.search(r'<code class="comp-cmd">(.*?)</code>', install_raw, flags=re.S)
            install_cmd = clean_code(ic.group(1)) if ic else None
            # text outside code = note
            note = re.sub(r'<code class="comp-cmd">.*?</code>', " ", install_raw, flags=re.S)
            note = clean(note)
            note = re.sub(r"^Install:?\s*", "", note)
            install_note = note or None

        # failure modes (may be multiple, e.g. component 30 has two)
        failures = []
        for fb in re.findall(r'<div class="failure-block">(.*?)</div>\s*(?=<div class="(?:failure-block|decision-block)")', b + '<div class="decision-block">', flags=re.S):
            def field(lbl):
                fm = re.search(r"<strong>" + re.escape(lbl) + r":</strong>(.*?)</div>", fb, flags=re.S)
                return clean(fm.group(1)) if fm else None
            failures.append({
                "trigger": field("Trigger"),
                "system": field("System"),
                "userSees": field("User sees"),
                "userCan": field("User can"),
            })

        # decision block
        decision = None
        dec_m = re.search(r'<div class="decision-block">(.*?)</div>\s*</div>', b, flags=re.S)
        if dec_m:
            db = dec_m.group(1)
            ch = re.search(r'decision-chosen">(.*?)</div>', db, flags=re.S)
            rj = re.search(r'decision-rejected">(.*?)</div>', db, flags=re.S)
            tr = re.search(r'decision-tradeoff">(.*?)</div>', db, flags=re.S)
            decision = {
                "chosen": clean(ch.group(1)) if ch else None,
                "rejected": clean(rj.group(1)) if rj else None,
                "tradeoff": clean(tr.group(1)) if tr else None,
            }

        num = clean(num_m.group(1)) if num_m else None
        name = clean(name_m.group(1)) if name_m else None
        cid = "comp-%s-%s" % (num, slugify(name)) if num and name else slugify(name or "")

        comp = {
            "id": cid,
            "num": num,
            "name": name,
            "label": name,
            "layer": clean(layer_m.group(1)) if layer_m else None,
            "status": clean(status_m.group(2)) if status_m else None,
            "what": clean(what_m.group(1)) if what_m else None,
            "why": clean(why_m.group(1)) if why_m else None,
            "installCommand": install_cmd,
            "installNote": install_note,
            "wiredTo": clean(wired_raw) if wired_raw else None,
            "verifyCommand": verify_cmd,
            "verifyExpected": verify_expected,
            "healthCommand": health_cmd,
            "healthExpected": health_expected,
            "failures": failures,
            "decision": decision,
            "sourcePage": "19-cluster-setup.html",
        }
        # drop None-valued optional keys for cleanliness but keep required ones
        comp = {k: v for k, v in comp.items() if v not in (None, [], "")}
        comps.append(comp)

        for fld in comp:
            if fld in ("id", "label", "sourcePage"):
                continue
            prov("clusterComponents.json#%s.%s" % (cid, fld),
                 "legacy/19-cluster-setup.html", "legacy", "high")
    return comps


# ---------------------------------------------------------------------------
# 2. clusters.json  — cloud cluster targets (AKS/EKS/GKE/OpenShift)
#    Real evidence pulled from 19-cluster-setup.html.
# ---------------------------------------------------------------------------
def extract_clusters(html19):
    # Real provisioning fact: Terraform (Component 27) creates the cluster on EKS/GKE/AKS/OpenShift.
    # StorageClass (Component 2): "EKS uses gp3, GKE uses pd-ssd, AKS uses managed-premium."
    # ESO (Component 12): IRSA (EKS), Workload Identity (GKE), Managed Identity (AKS).
    clusters = [
        {
            "id": "eks",
            "name": "EKS",
            "label": "Amazon EKS",
            "cloud": "AWS",
            "defaultStorageClass": "gp3",
            "secretIdentity": "IRSA",
            "sourcePage": "19-cluster-setup.html",
            "evidence": "Terraform creates the Kubernetes cluster on EKS/GKE/AKS/OpenShift. EKS uses gp3 StorageClass; ESO authenticates via IRSA.",
        },
        {
            "id": "gke",
            "name": "GKE",
            "label": "Google GKE",
            "cloud": "GCP",
            "defaultStorageClass": "pd-ssd",
            "secretIdentity": "Workload Identity",
            "sourcePage": "19-cluster-setup.html",
            "evidence": "Terraform creates the Kubernetes cluster on EKS/GKE/AKS/OpenShift. GKE uses pd-ssd StorageClass; ESO authenticates via Workload Identity.",
        },
        {
            "id": "aks",
            "name": "AKS",
            "label": "Azure AKS",
            "cloud": "Azure",
            "defaultStorageClass": "managed-premium",
            "secretIdentity": "Managed Identity",
            "sourcePage": "19-cluster-setup.html",
            "evidence": "Terraform creates the Kubernetes cluster on EKS/GKE/AKS/OpenShift. AKS uses managed-premium StorageClass; ESO authenticates via Managed Identity.",
        },
        {
            "id": "openshift",
            "name": "OpenShift",
            "label": "Red Hat OpenShift",
            "cloud": "Multi/On-prem",
            "sourcePage": "19-cluster-setup.html",
            "evidence": "Terraform (Component 27) creates the Kubernetes cluster on EKS/GKE/AKS/OpenShift.",
        },
    ]
    # Verify the cloud-target string is actually present before emitting (anti-fabrication guard).
    assert "EKS/GKE/AKS/OpenShift" in html19, "cluster target string not found in source"
    assert "EKS uses gp3" in html19
    assert "GKE uses pd-ssd" in html19
    assert "AKS uses managed-premium" in html19
    assert "IRSA (EKS)" in html19 and "Workload Identity (GKE)" in html19 and "Managed Identity (AKS)" in html19
    for c in clusters:
        for fld in c:
            if fld in ("id", "label", "sourcePage"):
                continue
            prov("clusters.json#%s.%s" % (c["id"], fld),
                 "legacy/19-cluster-setup.html", "legacy", "high")
    return clusters


# ---------------------------------------------------------------------------
# 3. gitopsTools.json  — argo / helm / kustomize / flux
#    All fields are REAL quotes/derived facts from the two source docs.
# ---------------------------------------------------------------------------
def extract_gitops(html19, html23):
    tools = []

    # ArgoCD — Component 10 in 19; central actor in 23.
    assert "ArgoCD over Flux v2" in html19
    tools.append({
        "id": "argocd",
        "name": "ArgoCD",
        "label": "ArgoCD",
        "role": "GitOps controller",
        "what": "GitOps controller that watches Git repositories and automatically deploys changes to Kubernetes — reconciling actual cluster state with desired state in Git.",
        "installCommand": "helm repo add argo https://argoproj.github.io/argo-helm\nhelm upgrade --install argocd argo/argo-cd \\\n  --namespace argocd --create-namespace \\\n  --values infra/argocd/values.yaml \\\n  --version 6.7.3",
        "version": "6.7.3",
        "syncInterval": "3 minutes (default ArgoCD polling interval)",
        "watchesPaths": ["infra/argocd/", "services/*/helm/values.yaml"],
        "decisionChosen": "ArgoCD over Flux v2",
        "decisionRejected": "Flux v2 — no built-in UI, harder to debug sync failures for non-Kubernetes-expert developers",
        "sourcePage": ["19-cluster-setup.html", "23-deployment.html"],
    })

    # Argo Rollouts — Component 11 in 19.
    assert "Argo Rollouts" in html19
    tools.append({
        "id": "argo-rollouts",
        "name": "Argo Rollouts",
        "label": "Argo Rollouts",
        "role": "Progressive delivery (canary / blue-green)",
        "what": "Extends Kubernetes Deployments with canary and blue-green release strategies — sends a small percentage of traffic to the new version and auto-rolls back if error rate or latency exceeds thresholds.",
        "installCommand": "helm upgrade --install argo-rollouts argo/argo-rollouts \\\n  --namespace argo-rollouts --create-namespace \\\n  --version 2.35.1",
        "version": "2.35.1",
        "decisionChosen": "Argo Rollouts canary with Prometheus analysis",
        "decisionRejected": "Manual canary via ingress weight annotations — requires human watching metrics and manually adjusting weights; no automatic rollback",
        "sourcePage": ["19-cluster-setup.html"],
    })

    # Helm — used in install commands + manual deploy in 23.
    assert "--install" in html23
    tools.append({
        "id": "helm",
        "name": "Helm",
        "label": "Helm",
        "role": "Kubernetes package manager / chart templating",
        "what": "Packages Kubernetes manifests as charts; ArgoCD runs helm template with per-service values.yaml then diffs against the cluster. Manual deploy uses helm upgrade --install.",
        "fullCommand": "helm upgrade --install <release> <chart> \\\n  --namespace <env-namespace> \\\n  --values values.yaml \\\n  --values values.<env>.yaml \\\n  --set image.tag=<sha>",
        "flagsNote": "--install creates the release if missing; --values base then --values values.<env>.yaml override; --set image.tag=<sha> takes precedence over all values files; never use latest.",
        "sourcePage": ["19-cluster-setup.html", "23-deployment.html"],
    })

    # Kustomize — overlays per environment in 23.
    assert "Kustomize overlays" in html23
    tools.append({
        "id": "kustomize",
        "name": "Kustomize",
        "label": "Kustomize",
        "role": "Per-environment config overlays",
        "what": "Per-environment config patches layered on top of the base Helm values — lets dev/staging/prod diverge on exactly the fields they need (replicaCount, resources, image tag) while inheriting everything else.",
        "overlayPaths": [
            "kustomize/overlays/staging/kustomization.yaml",
            "kustomize/overlays/prod/kustomization.yaml",
        ],
        "promotionField": "images[].newTag is updated with the validated git SHA per environment.",
        "sourcePage": ["23-deployment.html"],
    })

    # Flux — appears ONLY as the rejected alternative to ArgoCD. Real, not invented.
    assert "Flux v2" in html19
    tools.append({
        "id": "flux",
        "name": "Flux v2",
        "label": "Flux v2",
        "role": "GitOps controller (rejected alternative)",
        "status": "rejected",
        "what": "Considered as the GitOps controller but rejected in favor of ArgoCD.",
        "whyRejected": "Flux v2 — no built-in UI, harder to debug sync failures for non-Kubernetes-expert developers.",
        "sourcePage": ["19-cluster-setup.html"],
    })

    for t in tools:
        for fld in t:
            if fld in ("id", "label", "sourcePage"):
                continue
            prov("gitopsTools.json#%s.%s" % (t["id"], fld),
                 "legacy/19-cluster-setup.html;legacy/23-deployment.html", "legacy", "high")
    return tools


# ---------------------------------------------------------------------------
# 4. conceptNotes.json — distilled prose from page metadata + key sections
# ---------------------------------------------------------------------------
def page_meta(name):
    txt = read(name)
    title_m = re.search(r'<div class="page-title">(.*?)</div>', txt, flags=re.S)
    covers_m = re.search(r'<div class="page-covers">(.*?)</div>', txt, flags=re.S)
    when_m = re.search(r'<div class="page-when">(.*?)</div>', txt, flags=re.S)
    title = clean(title_m.group(1)) if title_m else None
    covers = clean(covers_m.group(1)) if covers_m else None
    when = clean(when_m.group(1)) if when_m else None
    return title, covers, when


def extract_concept_notes():
    pages = [
        "00-getting-started.html",
        "02-pipeline-schema.html",
        "03-stage-types.html",
        "16-maintainability-runbook.html",
        "20-local-dev.html",
        "22-add-a-service.html",
        "24-debugging.html",
    ]
    notes = []
    for p in pages:
        title, covers, when = page_meta(p)
        if not title:
            continue
        nid = slugify(p.replace(".html", ""))
        body_parts = []
        if covers:
            body_parts.append(covers)
        if when:
            body_parts.append(when)
        notes.append({
            "id": nid,
            "title": title,
            "body": " ".join(body_parts),
            "sourcePage": p,
        })
        prov("conceptNotes.json#%s.title" % nid, "legacy/" + p, "legacy", "high")
        prov("conceptNotes.json#%s.body" % nid, "legacy/" + p, "legacy", "high")

    # Deployment concept notes distilled from 23-deployment.html real content.
    html23 = read("23-deployment.html")

    # promotion flow (real env table dev/staging/prod)
    notes.append({
        "id": "deploy-environments",
        "title": "Deployment environments — dev / staging / prod",
        "body": ("Three environments promote in order: dev -> staging -> prod. "
                 "Each is a separate Git path that ArgoCD watches independently. "
                 "replicaCount: dev 1, staging 2, prod 3+. "
                 "resources.requests.cpu: dev 50m, staging 100m, prod 200m. "
                 "resources.limits.memory: dev 256Mi, staging 512Mi, prod 1Gi. "
                 "image.tag: dev latest dev SHA, staging validated SHA, prod release SHA. "
                 "Each environment points to a different commit, enabling staged promotion."),
        "sourcePage": "23-deployment.html",
    })
    assert "<td>50m</td>" in html23 and "<td>200m</td>" in html23

    notes.append({
        "id": "deploy-promotion-flow",
        "title": "Image promotion — Git is the source of truth",
        "body": ("git push -> GitHub Actions builds and pushes image -> GHCR stores it -> "
                 "developer edits values.yaml / kustomize overlay with the new SHA -> "
                 "ArgoCD detects the Git diff and syncs within 3 minutes -> Helm chart applied -> "
                 "Kubernetes rolling update -> pod running. "
                 "Image tag is the git SHA, never :latest, because :latest is mutable and breaks rollback. "
                 "ArgoCD is the only actor that applies changes to the cluster; developers do not run kubectl apply in normal operation."),
        "sourcePage": "23-deployment.html",
    })
    assert "Git SHA as image tag" in html23

    notes.append({
        "id": "deploy-rollback-options",
        "title": "Rollback — three options",
        "body": ("Option A Helm rollback: <60 seconds, NOT Git source of truth (cluster drifts until ArgoCD syncs), "
                 "Helm history only; use when the cluster is on fire and follow up with C immediately. "
                 "Option B Git revert: ~3 minutes (ArgoCD sync), Git is source of truth from the first second, "
                 "full git log audit trail; preferred in all non-emergency cases. "
                 "Option C Pin previous tag: ~3 minutes, Git source of truth, explicit rollback commit message; "
                 "use when you want a clear commit naming the SHA rather than a generic revert commit."),
        "sourcePage": "23-deployment.html",
    })
    assert "Helm rollback" in html23 and "Git revert" in html23

    notes.append({
        "id": "deploy-gitops-watch",
        "title": "GitOps — what ArgoCD watches",
        "body": ("ArgoCD watches two Git paths, both on a 3-minute polling interval: "
                 "infra/argocd/ controls ArgoCD Application definitions (which apps exist and which cluster/namespace they deploy to); "
                 "services/*/helm/values.yaml controls per-service Helm values including image.tag. "
                 "Separate Application resources exist per environment, so updating the staging overlay only affects staging."),
        "sourcePage": "23-deployment.html",
    })
    assert "infra/argocd/" in html23

    for n in notes[-4:]:
        prov("conceptNotes.json#%s.title" % n["id"], "legacy/23-deployment.html", "legacy", "high")
        prov("conceptNotes.json#%s.body" % n["id"], "legacy/23-deployment.html", "legacy", "high")

    return notes


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main():
    os.makedirs(NODES, exist_ok=True)
    os.makedirs(PROV, exist_ok=True)

    html19 = read("19-cluster-setup.html")
    html23 = read("23-deployment.html")

    components = extract_components(html19)
    clusters = extract_clusters(html19)
    gitops = extract_gitops(html19, html23)
    notes = extract_concept_notes()

    write_json(os.path.join(NODES, "clusterComponents.json"), components)
    write_json(os.path.join(NODES, "clusters.json"), clusters)
    write_json(os.path.join(NODES, "gitopsTools.json"), gitops)
    write_json(os.path.join(NODES, "conceptNotes.json"), notes)
    write_json(os.path.join(PROV, "%s.json" % GROUP), provenance)

    print("clusterComponents:", len(components))
    print("clusters:", len(clusters))
    print("gitopsTools:", len(gitops))
    print("conceptNotes:", len(notes))
    print("provenance entries:", len(provenance))


if __name__ == "__main__":
    main()
