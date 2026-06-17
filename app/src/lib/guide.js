// lib/guide.js — the KNOWLEDGE GUIDE data layer.
// Purpose: the studio TEACHES the whole platform. This surfaces the authored
// explanations (what / why / when / trade-off) for every element, so a beginner
// reads the studio and understands platform engineering start to end.
import { getG, getK, firstSentence, stripTags } from './logic.js';
import { getCatalog, getAdrs } from './data.js';
import { discipline } from './wizard.js';

const clean = (s) => stripTags(String(s == null ? '' : s)).trim();

// Field → human label maps. Drives the detail panel for each kind of element.
const FIELDS = {
  frameworks: [['whenToUse','When to use it'],['whenNot','When NOT to use it'],['tradeoff','Trade-off'],
    ['perf','Performance'],['securityPosture','Security posture'],['scaling','Scaling'],['ecosystem','Ecosystem'],
    ['renderingModes','Rendering'],['maintainedBy','Maintained by'],['license','License']],
  tools: [['whenToUse','When to use it'],['whenNot','When NOT'],['primaryTradeoff','Trade-off'],
    ['changesWhen','Changes when'],['output','Output'],['appliesTo','Applies to'],['license','License']],
  authDeep: [['what','What it is'],['howItWorks','How it works'],['whenToPick','Pick when'],['whenNot','Avoid when'],
    ['tradeoffVs','Trade-off'],['securityLevel','Security level'],['complianceFit','Compliance fit'],['implementation','In code']],
  ormDeep: [['what','What it is'],['typeSafety','Type safety'],['perf','Performance'],['migrations','Migrations'],
    ['whenToPick','Pick when'],['whenNot','Avoid when'],['tradeoffVs','Trade-off'],['complianceNote','Compliance note']],
  runtimeDeep: [['what','What it is'],['baseOs','Base OS'],['sizeMb','Size (MB)'],['fipsCertified','FIPS validated'],
    ['attackSurface','Attack surface'],['whenToPick','Pick when'],['whenNot','Avoid when'],['tradeoffVs','Trade-off']],
  observabilityDeep: [['what','What it is'],['pillars','Pillars'],['cost','Cost'],['whenToPick','Pick when'],
    ['whenNot','Avoid when'],['tradeoffVs','Trade-off']],
  pkgBuildDeep: [['what','What it is'],['lockfile','Lockfile'],['speedNote','Speed'],['whenToPick','Pick when'],
    ['whenNot','Avoid when'],['tradeoffVs','Trade-off']],
  clusters: [['what','What it is'],['cloud','Cloud'],['secretIdentity','Workload identity'],['tradeoff','Trade-off'],
    ['whenToPick','Pick when'],['whenNot','Avoid when']],
  invariants: [['guarantee','The guarantee'],['enforcedBy','Enforced by'],['checkedBy','Checked by'],['why','Why it matters']],
};

// Build the labeled explanation rows for any element.
export function detail(kind, node) {
  if (!node) return null;
  const rows = (FIELDS[kind] || []).map(([k, label]) => [label, clean(node[k])]).filter(([, v]) => v);
  const lead = clean(node.what || node.whenToUse || node.guarantee || node.name);
  return { title: node.name || node.label || node.tool || node.id, lead, rows };
}

// ── Chapter 0 — primer (what is this, in plain words) ──────────────────────
export function primer() {
  const K = getK();
  return K?.primer || null;
}

// ── Chapter 1 — frameworks, by device + category ───────────────────────────
function devOf(f){ const d=f.device; return Array.isArray(d)?d[0]:String(d||'').replace(/[[\]']/g,''); }
export function frameworkChapters() {
  const G = getG();
  const cats = G.nodes.categories || [];
  const byDevice = {};
  for (const dev of (G.nodes.devices||[])) byDevice[dev.id] = { name: dev.name||dev.label, groups: {} };
  for (const f of (G.nodes.frameworks||[])) {
    const d = devOf(f); if (!byDevice[d]) continue;
    (byDevice[d].groups[f.categoryId] ||= []).push({ id:f.id, name:f.name, lang:f.languageId, built:!!f.built });
  }
  return Object.entries(byDevice).map(([id, dv]) => ({
    device: dv.name,
    groups: Object.entries(dv.groups).map(([cid, fws]) => ({
      name: (cats.find(c=>c.id===cid)?.name || cid).replace(/^[^—]*—\s*/,''), frameworks: fws,
    })),
  }));
}

// ── Chapter 2 — the pipeline (CI), every phase → stage → tool ──────────────
export function pipeline() {
  const G = getG(); const N = G.nodes;
  return (N.phases||[]).map(p => ({
    name: p.name||p.label,
    stages: (N.stages||[]).filter(s=>s.phaseId===p.id).sort((a,b)=>(a.order||0)-(b.order||0)).map(st => ({
      id: st.id, name: st.name, parallel: st.groupKind==='parallel',
      tools: (N.tools||[]).filter(t=>t.phaseId===p.id && t.stage===st.name).map(t => ({
        id: t.id, name: t.tool||t.name, discipline: discipline((t.tool||t.name)+' '+(t.stageType||st.type||'')),
      })),
    })),
  })).filter(p=>p.stages.length);
}

// ── Chapter 3 — the decisions (each axis → options with rich nodes) ─────────
export function decisionChapters() {
  const G = getG();
  const axis = (title, plain, kind) => ({ title, plain, kind, options: (G.nodes[kind]||[]).map(n=>({id:n.id,name:n.name})) });
  return [
    axis('Authentication','How users prove who they are.','authDeep'),
    axis('Data layer (ORM)','How the app reads + writes the database.','ormDeep'),
    axis('Runtime base image','The operating-system layer the code runs on.','runtimeDeep'),
    axis('Observability','How you see what the running app is doing.','observabilityDeep'),
    axis('Package + build','How dependencies install and code bundles.','pkgBuildDeep'),
    axis('Deploy cluster','Where the app actually runs.','clusters'),
  ].filter(a=>a.options.length);
}

// ── Chapter 4 — compliance (regimes + controls + per industry) ─────────────
export function complianceChapter() {
  const cat = getCatalog(); if (!cat) return null;
  const controls = cat.compliance.controls;
  const regimes = Object.entries(cat.compliance.regimes).map(([id,r]) => ({ id, name:r.name, priority:r.priority, jurisdiction:r.jurisdiction, enforces:r.enforces||{} }));
  return { controlLabels: Object.fromEntries(Object.entries(controls).map(([k,v])=>[k,v.label])),
    controlKeys: Object.keys(controls), regimes };
}

// ── Chapter 5 — the proof (real repos) ─────────────────────────────────────
export function proofRepos() {
  return (getG().nodes.frameworks||[]).filter(f=>f.built).map(f=>({name:f.name, url:f.repoUrl}));
}

// Look up the full node by kind+id and return its labeled explanation.
export function detailFor(kind, id) {
  const node = (getG().nodes[kind] || []).find(n => n.id === id);
  return detail(kind, node);
}

// A compliance regime's explanation (regimes live in the catalog, not the graph).
export function regimeDetail(id) {
  const cat = getCatalog(); if (!cat) return null;
  const r = cat.compliance.regimes[id]; if (!r) return null;
  const ctrls = cat.compliance.controls;
  const on = Object.entries(r.enforces||{}).map(([k,v]) =>
    [ctrls[k]?.label || k, v === true ? 'on' : String(v)]);
  return { title: r.name, lead: r.jurisdiction, rows: on };
}

// ── Chapter — the decisions of record (ADRs) ───────────────────────────────
// Each ADR is one locked decision: why it exists, what was rejected, the cost.
const num = (id) => id.split('-')[0];           // "0003-..." → "0003"
const adrName = (id) => id.replace(/^\d+-/, '').replace(/-/g,' '); // slug → words
export function adrs() {
  const a = getAdrs();
  if (!a?.adrs) return [];
  return a.adrs.map(d => ({ id:d.id, num:num(d.id), title:d.title, status:d.status }));
}
// Full labeled explanation for one ADR — drives the detail drawer.
export function adrDetail(id) {
  const a = getAdrs(); if (!a?.adrs) return null;
  const d = a.adrs.find(x => x.id === id); if (!d) return null;
  const rows = [
    ['Status', clean(d.status)],
    ['The problem', clean(d.context)],
    ['The decision', clean(d.decision)],
    ['Why', clean(d.why)],
    ['Rejected alternative', clean(d.rejected)],
    ['Consequence accepted', clean(d.consequences)],
  ].filter(([,v]) => v);
  return { title: `ADR-${num(d.id)} — ${d.title}`, lead: clean(d.decision), rows };
}

// ── Chapter — the clusters (real per-cloud repos) ──────────────────────────
// Hub-and-spoke: one repo per cloud, each a runnable Terraform + platform stack.
const CLUSTER_REPOS = [
  { cloud:'AWS',        name:'Amazon EKS',        repo:'pe-cluster-eks',
    what:'Elastic Kubernetes Service — managed Kubernetes on AWS.' },
  { cloud:'Google',     name:'Google GKE',        repo:'pe-cluster-gke',
    what:'Google Kubernetes Engine — managed Kubernetes on GCP.' },
  { cloud:'Azure',      name:'Azure AKS',         repo:'pe-cluster-aks',
    what:'Azure Kubernetes Service — managed Kubernetes on Azure.' },
  { cloud:'Red Hat',    name:'OpenShift',         repo:'pe-cluster-openshift',
    what:'OpenShift — Kubernetes plus Red Hat platform tooling.' },
];
export function clusterRepos() {
  return CLUSTER_REPOS.map(c => ({ ...c, url:`https://github.com/yarova-ca/${c.repo}` }));
}

// Glossary (71 plain-English term definitions).
export function glossary() { return (getK()?.glossary || []); }

// Top-level scale (for the opening).
export { detail as _detail };
