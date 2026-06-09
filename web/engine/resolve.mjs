// Phase C — the resolution engine. Pure. Runs in browser and Node.
// resolveBundle walks the real graph per framework. No universal hardcoded rule.

function normFwKey(s) {
  if (!s) return "";
  s = String(s).toLowerCase();
  if (s.includes("--")) s = s.split("--").pop();
  s = s.replace(/^\d+-/, "").replace(/-c\d+$/, "").replace(/[^a-z0-9]/g, "");
  return s;
}
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const COMPLIANCE_KEYS = {
  pipeda: "pipeda", phipa: "pipeda", phia: "pipeda", hipaa: "hipaa", pci: "pci",
  "soc 2": "soc2", soc2: "soc2", fips: "fips", cmmc: "cmmc", nerc: "nerc",
  "iso 27001": "soc2", fedramp: "fips",
};
function mapCompliance(text, validIds) {
  const t = String(text).toLowerCase();
  for (const [kw, cid] of Object.entries(COMPLIANCE_KEYS))
    if (t.includes(kw) && validIds.has(cid)) return cid;
  return null;
}

// Build fast lookups from the raw graph.
export function buildIndex(graph) {
  const { nodes, edges, pipelines } = graph;
  const idx = { nodes, edges };
  const byId = {};
  // Index frameworks first so they win any id collision (e.g. a dockerfileTemplate
  // sharing a framework id must NOT overwrite the framework's shipped data).
  const order = ["frameworks", ...Object.keys(nodes).filter((t) => t !== "frameworks")];
  for (const type of order) {
    const arr = nodes[type];
    if (!arr) continue;
    const list = Array.isArray(arr) ? arr : Object.entries(arr).map(([id, v]) => ({ id, ...v }));
    idx[type] = list;
    for (const n of list) if (n && n.id && !byId[n.id]) byId[n.id] = { ...n, _type: type };
  }
  idx.byId = byId;
  idx.complianceIds = new Set((idx.compliance || []).map((c) => c.id));

  // pipelines keyed by normalized framework key
  idx.pipelineByFw = {};
  let deltas = null;
  for (const p of pipelines || []) {
    idx.pipelineByFw[normFwKey(p.frameworkId)] = p;
    if (!deltas && p.complianceDeltas && p.complianceDeltas.length) deltas = p.complianceDeltas;
  }
  // global compliance deltas mapped to our compliance ids
  idx.deltaByComp = {};
  for (const d of deltas || []) {
    const cid = mapCompliance(d.standardId || d.standard, idx.complianceIds);
    if (cid) idx.deltaByComp[cid] = d;
  }

  // image -> set of compliance ids it is rated for
  idx.imageRatedFor = {};
  for (const e of edges) if (e.type === "RATED_ON") {
    (idx.imageRatedFor[e.to] ||= new Set()).add(e.from);
  }
  // edges grouped
  idx.usesStageByFw = {};
  for (const e of edges) if (e.type === "USES_STAGE") (idx.usesStageByFw[e.from] ||= []).push(e);
  return idx;
}

const cell = (value, state = "green", reason = "") => ({ value, state, reason });

// requiredStandards: which compliance ids a lens demands, plus the raw regulatory text.
function requiredStandards(idx, lens) {
  const ids = new Set(lens.complianceIds || []);
  const raw = [];
  if (lens.industryId) {
    const ind = idx.byId[lens.industryId];
    if (ind) {
      for (const r of (ind.mandatoryCompliance || [])) {
        raw.push({ text: r, mandatory: true });
        const c = mapCompliance(r, idx.complianceIds); if (c) ids.add(c);
      }
      for (const r of (ind.optionalCompliance || [])) {
        const c = mapCompliance(r, idx.complianceIds); if (c) ids.add(c);
      }
    }
  }
  return { ids: [...ids], raw };
}

export function resolveBundle(idx, frameworkId, lens = {}) {
  const fw = idx.byId[frameworkId];
  if (!fw) return { error: `framework ${frameworkId} not found` };
  const shipped = fw.shipped || {};
  const baseAxes = shipped.buildArgs || {};
  const { ids: reqStds, raw: rawReqs } = requiredStandards(idx, lens);

  // shipped compliance map: standard -> {requiredControls, buildArgs, file}
  const shippedComp = {};
  for (const sc of (shipped.shippedCompliance || [])) shippedComp[String(sc.standard).toLowerCase()] = sc;

  const gaps = [];
  const drift = [];

  // ── build axes (per framework, real baseline; lens may force) ──────────────
  const axes = {};
  for (const a of (idx.buildAxes || [])) {
    const key = a.id.toUpperCase().replace(/-/g, "_");
    let value = baseAxes[key] != null ? baseAxes[key] : a.default;
    let state = "green", reason = "";
    // a required standard that ships buildArgs forcing this axis
    for (const cid of reqStds) {
      const sc = shippedComp[cid];
      const forced = sc && sc.buildArgs && sc.buildArgs[key];
      if (forced && String(forced) !== String(value)) {
        value = forced; state = "amber";
        reason = `${cid.toUpperCase()} forces ${key}=${forced} (services/${fw.serviceSlug}/compliance/${cid}.yaml).`;
      }
    }
    if (value == null || value === "") { state = "red"; value = "not defined"; reason = "Gap — no value."; gaps.push(`buildAxis ${key} undefined`); }
    axes[a.id] = cell(value, state, reason);
  }

  // ── compliance section ─────────────────────────────────────────────────────
  const complianceRows = reqStds.map((cid) => {
    const c = idx.byId[cid] || { id: cid, label: cid };
    const sc = shippedComp[cid];
    if (sc) {
      return {
        id: cid, label: c.label || cid, state: "green",
        ships: true, file: sc.file, requiredControls: sc.requiredControls || [],
        forcedBuildArgs: sc.buildArgs || {},
        pipelineAdditions: idx.deltaByComp[cid]?.phases || {},
      };
    }
    gaps.push(`industry requires ${cid} but ${fw.serviceSlug} ships no compliance/${cid}.yaml`);
    return { id: cid, label: c.label || cid, state: "red", ships: false,
      reason: `Required by industry; service ships no compliance/${cid}.yaml.` };
  });

  // ── per-framework pipeline (real USES_STAGE edges) + compliance additions ──
  const stageEdges = idx.usesStageByFw[frameworkId] || [];
  const phaseMap = {};
  for (const e of stageEdges) {
    const ph = e.attrs?.phase || "Pipeline";
    (phaseMap[ph] ||= []).push({
      stage: idx.byId[e.to]?.name || e.to, type: e.attrs?.type,
      tool: e.attrs?.tool, command: e.attrs?.command,
    });
  }
  const pipeline = Object.entries(phaseMap).map(([phase, stages]) => ({ phase, stages }));
  const pipelineAdds = reqStds.map((cid) => ({ standard: cid, phases: idx.deltaByComp[cid]?.phases || {} }))
    .filter((x) => Object.keys(x.phases).length);

  // ── auth / orm / observability (real shipped) vs required ──────────────────
  const mw = shipped.middleware || {};
  const authState = reqStds.includes("pci") || reqStds.includes("cmmc")
    ? (mw.auth ? "amber" : "red") : (mw.auth ? "green" : "amber");
  const authReason = (reqStds.includes("pci") || reqStds.includes("cmmc"))
    ? "PCI/CMMC require oauth2 + MFA; service ships auth middleware — verify MFA." : "";
  const obsRequired = reqStds.some((c) => ["hipaa", "pci", "soc2", "cmmc", "nerc"].includes(c));
  const authOrmObs = {
    auth: cell(baseAxes.AUTH || (mw.auth ? "all" : "none"), authState, authReason),
    orm: cell(shipped.ormName || baseAxes.ORM || "none", "green", shipped.ormDetected ? "Detected in service code." : ""),
    observability: cell(
      shipped.observabilityDetected ? "otel (detected)" : (baseAxes.OBSERVABILITY || "none"),
      obsRequired && !shipped.observabilityDetected ? "red" : (obsRequired ? "amber" : "green"),
      obsRequired ? "Audit logging required by a selected compliance regime." : ""),
  };
  if (obsRequired && !shipped.observabilityDetected) gaps.push("compliance requires observability/audit logging; none detected");

  // ── invariants validation ──────────────────────────────────────────────────
  const runtime = axes["runtime"]?.value;
  const invariantResults = [];
  for (const inv of (idx.invariants || [])) {
    const rule = `${inv.rule || inv.invariant || inv.condition || ""}`.toLowerCase();
    if (rule.includes("fips")) {
      const fipsReq = reqStds.includes("fips") || reqStds.some((c) => (shippedComp[c]?.buildArgs?.RUNTIME === "fips"));
      const pass = !fipsReq || runtime === "fips";
      invariantResults.push({ id: inv.id, rule: inv.rule || inv.invariant, state: pass ? "green" : "red",
        reason: pass ? "" : `Runtime is ${runtime} but a FIPS regime is required.` });
      if (!pass) gaps.push(`invariant ${inv.id} violated: ${inv.rule || inv.invariant}`);
    }
  }

  // ── deploy ──────────────────────────────────────────────────────────────────
  const clusterId = lens.clusterId || null;
  const clusters = clusterId ? [idx.byId[clusterId]].filter(Boolean) : (idx.clusters || []);
  const deploy = {
    clusters: clusters.map((c) => c.name || c.id),
    components: (idx.clusterComponents || []).map((c) => c.name || c.label || c.id),
    gitops: (idx.gitopsTools || []).map((g) => g.name || g.label || g.id),
    helm: !!shipped.helm, kustomizeOverlays: shipped.kustomizeOverlays || [],
  };

  // ── integrations (by the lens industry's vertical) ─────────────────────────
  let integrations = [];
  if (lens.industryId) {
    const ind = idx.byId[lens.industryId];
    const vid = ind?.verticalId;
    if (vid) integrations = (idx.integrations || []).filter((g) => g.verticalId === vid)
      .map((g) => ({ system: g.externalSystem, category: g.category,
        auth: g.authOption, gateway: g.apiGateway, tools: g.tools,
        dataFlow: g.dataFlow, sourceType: g.sourceType || "net-new" }));
  }

  // ── drift (shipped vs default) ──────────────────────────────────────────────
  for (const a of (idx.buildAxes || [])) {
    const key = a.id.toUpperCase().replace(/-/g, "_");
    if (baseAxes[key] != null && a.default != null && String(baseAxes[key]) !== String(a.default)
        && !String(a.default).includes("/")) {
      drift.push({ axis: key, shipped: baseAxes[key], blueprintDefault: a.default });
    }
  }

  return {
    framework: { id: fw.id, name: fw.name, category: fw.categoryId, language: fw.languageId,
      tier: fw.tier, repo: shipped.sourceLocation, catalogRef: shipped.catalogRef,
      version: fw.version, license: fw.license, maturity: fw.maturity, perf: fw.perf,
      memory: fw.memory, concurrency: fw.concurrency, securityPosture: fw.securityPosture },
    lens: { industryId: lens.industryId || null, clusterId: clusterId,
      industry: lens.industryId ? (idx.byId[lens.industryId]?.name) : null,
      requiredStandards: reqStds, regulatoryRequirements: rawReqs },
    buildAxes: axes,
    compliance: complianceRows,
    pipeline, pipelineAdditions: pipelineAdds,
    authOrmObs,
    invariants: invariantResults,
    deploy,
    integrations,
    gaps, drift,
  };
}
