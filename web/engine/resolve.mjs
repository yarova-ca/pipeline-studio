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

  // image -> set of compliance ids it is rated for; compliance id -> rated images
  idx.imageRatedFor = {};
  idx.imagesByCompliance = {};       // cid -> [{id, rating}]
  for (const e of edges) if (e.type === "RATED_ON") {
    (idx.imageRatedFor[e.to] ||= new Set()).add(e.from);
    (idx.imagesByCompliance[e.to] ||= []).push({ id: e.from, rating: e.attrs?.rating });
  }
  // dockerfile template by framework key (byId is taken by the framework on id collision)
  idx.templateByFw = {};
  for (const t of (nodes.dockerfileTemplates || [])) {
    idx.templateByFw[normFwKey(t.frameworkId || t.id)] = t;
  }
  // standard (global) pipeline phases — fallback for frameworks with no per-fw rows
  idx.standardPhases = (idx.phases || []).map((p) => ({
    phase: p.name || p.id,
    stages: (idx.stages || []).filter((s) => (s.phaseId && s.phaseId === p.id) ||
      (s.phase && slug(s.phase) === slug(p.name || ""))).map((s) => ({ stage: s.name || s.label, type: s.type, tool: s.tool })),
  })).filter((p) => p.stages.length);
  // edges grouped
  idx.usesStageByFw = {};
  for (const e of edges) if (e.type === "USES_STAGE") (idx.usesStageByFw[e.from] ||= []).push(e);
  return idx;
}

// rating key in images.complianceRatings for one of our compliance ids
const RATING_KEY = { fips: "FIPS", pci: "PCI-DSS", hipaa: "HIPAA", soc2: "SOC 2",
  cmmc: "DISA STIG", nerc: "DISA STIG", pipeda: "ISO 27001" };
const stripRef = (s) => String(s || "").replace(/^(url:|dir:)/, "");

const cell = (value, state = "green", reason = "") => ({ value, state, reason });

// pick the language-relevant part of a prose default like
// "prisma (Node) / sqlalchemy (Python) / gorm (Go)"
const LANG_WORD = { ts: "node", js: "node", py: "python", go: "go", rust: "rust",
  java: "java", kotlin: "java", csharp: "dotnet", php: "php", ruby: "ruby", elixir: "elixir" };
function langDefault(def, langId) {
  if (!def || !String(def).includes("/")) return def;
  const want = LANG_WORD[langId] || "";
  for (const part of String(def).split("/")) {
    const m = part.match(/^\s*([^(]+?)\s*\(([^)]+)\)/);
    if (m && want && m[2].toLowerCase().includes(want)) return m[1].trim();
  }
  return String(def).split("/")[0].replace(/\(.*\)/, "").trim();
}

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
    let value = baseAxes[key] != null ? baseAxes[key] : langDefault(a.default, fw.languageId);
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
    const detected = baseAxes[key] != null && baseAxes[key] !== "";
    axes[a.id] = { ...cell(value, state, reason), detected, origin: detected ? "detected" : "default" };
  }

  // ── compliance section ─────────────────────────────────────────────────────
  // Every regulatory requirement on the industry gets a row — never silently dropped.
  const complianceRows = [];
  const seenComp = new Set();
  // 1) explicit compliance ids + mapped industry standards that DO ship
  for (const cid of reqStds) {
    if (seenComp.has(cid)) continue; seenComp.add(cid);
    const c = idx.byId[cid] || { id: cid, label: cid };
    const sc = shippedComp[cid];
    if (sc) {
      complianceRows.push({ id: cid, label: c.label || cid, state: "green", ships: true,
        file: stripRef(sc.file), requiredControls: sc.requiredControls || [],
        forcedBuildArgs: sc.buildArgs || {}, pipelineAdditions: idx.deltaByComp[cid]?.phases || {} });
    } else {
      gaps.push(`requires ${cid} but ${fw.serviceSlug} ships no compliance/${cid}.yaml`);
      complianceRows.push({ id: cid, label: c.label || cid, state: "red", ships: false,
        reason: `Required, but service ships no compliance/${cid}.yaml.` });
    }
  }
  // 2) raw regulatory strings that map to NO shipped control — show as explicit gaps
  for (const r of rawReqs) {
    const cid = mapCompliance(r.text, idx.complianceIds);
    if (cid) continue; // already represented above
    const key = `raw:${r.text}`; if (seenComp.has(key)) continue; seenComp.add(key);
    complianceRows.push({ id: key, label: r.text, state: "red", ships: false, regulator: true,
      reason: "No shipped control profile yet — needs a compliance profile for this regulator." });
    gaps.push(`regulator "${r.text}" has no shipped control profile`);
  }

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
  let pipeline = Object.entries(phaseMap).map(([phase, stages]) => ({ phase, stages }));
  let pipelineIsStandard = false;
  if (!pipeline.length) {            // no per-framework rows → show the standard platform pipeline
    pipeline = idx.standardPhases || [];
    pipelineIsStandard = true;
  }
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

  // ── invariants — evaluate ALL against real shipped CI signals ──────────────
  const runtime = axes["runtime"]?.value;
  const wfJobs = new Set();
  for (const w of (shipped.workflows || [])) { (w.jobs || []).forEach((j) => wfJobs.add(j.toLowerCase())); (w.file ? wfJobs.add(w.file.toLowerCase()) : 0); }
  const wfHas = (...keys) => keys.some((k) => [...wfJobs].some((j) => j.includes(k)));
  // map an invariant's enforcing mechanism to a shipped CI signal we can verify
  const verifyInv = (inv) => {
    const t = `${inv.condition || ""} ${inv.enforcedBy || ""}`.toLowerCase();
    if (t.includes("signed") || t.includes("cosign") || t.includes("kyverno")) return wfHas("sign", "cosign", "build-push") ? "verified" : "platform";
    if (t.includes("sbom") || t.includes("syft")) return wfHas("sbom", "sign", "build-push") ? "verified" : "platform";
    if (t.includes("secret")) return wfHas("secret") ? "verified" : "platform";
    if (t.includes("sast") || t.includes("codeql")) return wfHas("codeql", "sast") ? "verified" : "platform";
    if (t.includes("sca") || t.includes("dependency")) return wfHas("sca", "dependabot", "renovate") ? "verified" : "platform";
    if (t.includes("iac") || t.includes("checkov") || t.includes("hadolint") || t.includes("lint")) return wfHas("iac", "pre-commit") ? "verified" : "platform";
    if (t.includes("test")) return wfHas("test") ? "verified" : "platform";
    return "platform"; // branch protection, OIDC, registry policy — platform-enforced
  };
  const invariantResults = (idx.invariants || []).map((inv) => {
    const v = verifyInv(inv);
    return { id: inv.id, rule: inv.condition || inv.label || inv.id,
      enforcedBy: inv.enforcedBy, controlClass: inv.controlClass,
      state: v === "verified" ? "green" : "amber",
      reason: v === "verified" ? "Enforced — verified in this service's CI." : `Enforced by ${inv.enforcedBy || "platform CI"} (platform control).` };
  });

  // ── base image (per framework; compliance lens may require a rated distro) ──
  const tmpl = idx.templateByFw[normFwKey(frameworkId)] || idx.templateByFw[normFwKey(fw.serviceSlug || "")];
  let baseImage = cell(tmpl?.runtimeFrom || "—", "green", "");
  for (const cid of reqStds) {
    const key = RATING_KEY[cid];
    // ONLY images certified "Yes" for this standard qualify (Par/— do not)
    const certified = key ? (idx.imagesByCompliance[cid] || []).filter((x) => /^yes$/i.test(String(x.rating).trim())) : [];
    if (key && certified.length) {
      const cur = (tmpl?.runtimeFrom || "").toLowerCase();
      const curRated = certified.some((x) => cur.includes((idx.byId[x.id]?.name || x.id).split(/[ :]/)[0].toLowerCase()));
      if (!curRated) {
        const suggest = idx.byId[certified[0].id]?.name || certified[0].id;
        baseImage = cell(suggest, "amber", `${cid.toUpperCase()} requires a certified base image — current ${tmpl?.runtimeFrom||'?'} is not ${key}-certified.`);
      }
    }
  }

  // ── deploy ──────────────────────────────────────────────────────────────────
  const clusterId = lens.clusterId || null;
  const clusters = clusterId ? [idx.byId[clusterId]].filter(Boolean) : (idx.clusters || []);
  const deploy = {
    baseImage,
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

  // resolve readable names — never display raw ids
  const categoryName = idx.byId[fw.categoryId]?.name || idx.byId[fw.categoryId]?.label || fw.category || fw.categoryId;
  const languageName = idx.byId[fw.languageId]?.name || idx.byId[fw.languageId]?.label || fw.languages || fw.languageId;

  return {
    framework: { id: fw.id, name: fw.name,
      category: categoryName, categoryId: fw.categoryId,
      language: languageName, languageId: fw.languageId,
      tier: fw.tier, repo: stripRef(shipped.sourceLocation), catalogRef: stripRef(shipped.catalogRef),
      sources: fw.provSources || null,
      version: fw.version, license: fw.license, maturity: fw.maturity, perf: fw.perf,
      memory: fw.memory, concurrency: fw.concurrency, securityPosture: fw.securityPosture },
    lens: { industryId: lens.industryId || null, clusterId: clusterId,
      industry: lens.industryId ? (idx.byId[lens.industryId]?.name) : null,
      requiredStandards: reqStds, regulatoryRequirements: rawReqs,
      guidance: lens.industryId ? (() => { const i = idx.byId[lens.industryId] || {};
        return { dataSensitivity: i.dataSensitivity, regulators: i.regulators,
          frameworkNotes: i.frameworkNotes, securityAuditRequirements: i.securityAuditRequirements }; })() : null },
    buildAxes: axes,
    compliance: complianceRows,
    pipeline, pipelineIsStandard, pipelineAdditions: pipelineAdds,
    authOrmObs,
    invariants: invariantResults,
    deploy,
    integrations,
    libraries: (shipped.libraries || []).map((l) => ({ name: l.name, version: l.version, ecosystem: l.ecosystem, direct: l.direct })),
    gaps, drift,
  };
}
