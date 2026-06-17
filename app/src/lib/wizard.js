// lib/wizard.js — the linear studio wizard.
// One straight path: device → framework → decisions → full pipeline blueprint.
// Reuses logic.js (resolveStack, gOptions, decisionsFor, commandsFor) — no new truth here.
import { getG, resolveStack, gOptions, decisionsFor, commandsFor, nameById, firstSentence, stripTags } from './logic.js';
import { getCatalog } from './data.js';

// Map a framework's coarse device to a catalog device type.
function catalogDevice(fw){
  const d = Array.isArray(fw.device) ? fw.device[0] : String(fw.device||'');
  if (d === 'frontend-web') return 'web-ssr';
  if (d === 'mobile') return 'mobile-app';
  if (d === 'protocol') return 'protocol';
  if ((fw.id||'').includes('hono') || d === 'edge') return 'edge';
  return 'backend';
}

// Catalog-backed options for a decision step — device + language filtered.
// Returns null when no catalog or the axis is not catalog-backed (App falls back to gOptions).
const CAT_AXIS = { pkg:'package_managers', auth:'auth', orm:'orm', obs:'observability', cluster:'deploy_targets' };
const LANG_DEFAULT_PKG = { ts:'pnpm', js:'pnpm', py:'uv', go:'gomod', rust:'cargo', java:'maven', kotlin:'gradle', csharp:'nuget', elixir:'mix', ruby:'bundler', php:'composer', swift:'swiftpm' };
const LANG_DEFAULT_ORM = { ts:'orm-prisma', js:'orm-prisma', py:'orm-sqlalchemy', go:'orm-gorm', rust:'orm-sqlx', java:'orm-jpa-hibernate', kotlin:'orm-exposed', csharp:'orm-efcore', elixir:'orm-ecto', ruby:'orm-activerecord', php:'orm-eloquent' };

export function catalogOptions(axis, rs){
  const cat=getCatalog(); if(!cat) return null;
  const key=CAT_AXIS[axis]; if(!key) return null;
  const s=resolveStack(rs); const device=catalogDevice(s.fw); const lang=s.lang;
  let items=(cat.axes[key]||[]).filter(o=>!o.applies_to || o.applies_to.includes(device));
  if(axis==='pkg' || axis==='orm'){
    items=items.filter(o=>!o.languages || o.languages.includes('all') || o.languages.includes(lang));
  }
  if(!items.length) return null;
  let recId;
  if(axis==='pkg') recId=LANG_DEFAULT_PKG[lang];
  else if(axis==='orm') recId=LANG_DEFAULT_ORM[lang];
  else if(axis==='auth') recId = device==='mobile-app' ? 'auth-oauth2-pkce' : 'auth-oidc';
  else if(axis==='obs') recId = device==='mobile-app' ? 'observability-mobile-rum' : device==='edge' ? 'observability-edge-analytics' : 'observability-otel';
  else if(axis==='cluster') recId = device==='edge' ? 'cloudflare-workers' : device==='mobile-app' ? 'app-stores' : (device==='web-ssr'||device==='web-static') ? 'vercel' : 'eks';
  if(!items.some(o=>o.id===recId)) recId=items[0].id;
  return items.map(o=>({ id:o.id, name:o.name, plain:o.note||o.cloud||'', rec:o.id===recId }));
}

// Integrations the golden repo can connect to (from the canonical catalog).
// Each ships a placeholder client + config keys; the developer fills them in.
export function integrationsList(){
  const cat=getCatalog();
  if(!cat || !cat.axes) return null;
  const ca=cat.axes.integrations_canada||[];
  const common=cat.axes.integrations_common||[];
  if(!ca.length && !common.length) return null;
  return { canada:ca, common };
}

// The compliance matrix for the result step: controls × the industry's regimes,
// filtered to the framework's device. Same keys for every industry — just on/off.
export function buildComplianceMatrix(rs){
  const G=getG(); const cat=getCatalog();
  if(!cat) return null;
  const fw=resolveStack(rs).fw;
  const device=catalogDevice(fw);
  const controls=cat.compliance.controls;
  const keys=Object.keys(controls).filter(c=>controls[c].applies_to.includes(device));

  const ind=(G.nodes.industryRequirements||[]).find(r=>r.id===rs.industry);
  let regimeIds=(ind?.requiredRegimeIds||[]).filter(id=>cat.compliance.regimes[id]);
  if(!regimeIds.length) regimeIds=['pipeda']; // no industry → show the Canadian baseline regime

  const fmt=(v)=> v===true?'on' : v===false?'off' : (v===0||v==='none')?'—' : String(v);
  const rows=keys.map(k=>({
    key:k, label:controls[k].label,
    cells: regimeIds.map(rid=>{
      const enf=cat.compliance.regimes[rid].enforces||{};
      const v = (k in enf) ? enf[k] : controls[k].default;
      return { regime:rid, value:fmt(v), on:!(v===false||v===0||v==='none') };
    })
  }));
  return {
    device,
    regimes: regimeIds.map(id=>({ id, name:cat.compliance.regimes[id].name, priority:cat.compliance.regimes[id].priority })),
    rows,
    controlCount:keys.length,
  };
}

// ── The decision steps, in order. Each is one screen. ──────────────────────────
// axis matches an rs key + a gOptions(axis) case. plain = ≤10-word meaning.
export const DECISION_STEPS = [
  { axis:'pkg',      title:'Package manager',        plain:'how dependencies install in CI.',
    why:'A locked install means the same versions every build — no "works on my machine".' },
  { axis:'auth',     title:'How users log in',       plain:'who is allowed in, and how.',
    why:'Every route is authenticated by default. Tokens are verified for signature, expiry, issuer.' },
  { axis:'orm',      title:'How the app reads data',  plain:'the database access layer.',
    why:'Typed queries stop SQL injection and catch schema mistakes at build time.' },
  { axis:'obs',      title:'Logs, metrics, traces',  plain:'how you see what the app does.',
    why:'Structured JSON logs + metrics ship on day one — you can debug production from the start.' },
  { axis:'runtime',  title:'Container base image',   plain:'the OS layer your code runs on.',
    why:'A minimal base shrinks the attack surface; FIPS bases satisfy government crypto rules.' },
  { axis:'registry', title:'Where images live',      plain:'the store for built containers.',
    why:'Images are pushed signed, with an SBOM attached — the supply chain is provable.' },
  { axis:'signer',   title:'Proving the image is yours', plain:'a signature stops tampering.',
    why:'Keyless signing ties each image to the exact CI run that built it. No stored keys.' },
  { axis:'cluster',  title:'Where it deploys',       plain:'the server it runs on.',
    why:'Helm + Kustomize ship per-environment; the cluster admits only signed images.' },
];

// Classify a tool/stage into an engineering discipline (for color-coding).
// DevSecOps = security/supply-chain. SRE = reliability/observability. DevOps = the rest.
export function discipline(text){
  const t=String(text||'').toLowerCase();
  if(/sast|sca\b|codeql|secret|sign|cosign|sbom|trivy|iac|scan|compliance|vuln|license|slsa|kyverno|gitleaks|semgrep|checkov|snyk|dependabot|attest/.test(t)) return 'DevSecOps';
  if(/observ|otel|metric|prom|grafana|loki|tempo|slo|sla|incident|alert|notif|rollout|monitor|dast|perf|datadog|elastic/.test(t)) return 'SRE';
  return 'DevOps';
}

// The WHOLE platform, one structure — every phase, stage, tool, axis, regime.
// Powers the comprehensive blueprint view (nothing hidden).
export function platformMap(){
  const G=getG(); const cat=getCatalog();
  if(!G) return null;
  const N=G.nodes;
  const counts={ DevOps:0, DevSecOps:0, SRE:0 };

  const phases=(N.phases||[]).map(p=>{
    const stages=(N.stages||[]).filter(s=>s.phaseId===p.id).sort((a,b)=>(a.order||0)-(b.order||0)).map(st=>{
      const tools=(N.tools||[]).filter(t=>t.phaseId===p.id && t.stage===st.name).map(t=>{
        const d=discipline((t.tool||t.name)+' '+(t.stageType||st.type||''));
        counts[d]=(counts[d]||0)+1;
        return { name:t.tool||t.name, discipline:d, mandatory:!!t.mandatory };
      });
      return { name:st.name, discipline:discipline(st.name+' '+(st.type||'')), tools };
    });
    return { id:p.id, name:p.name||p.label, stages };
  }).filter(p=>p.stages.length);

  const axis=(label, arr, fmt)=>({ label, count:(arr||[]).length, options:(arr||[]).map(fmt) });
  const axes=[
    axis('Frameworks', N.frameworks, f=>({name:f.name, built:!!f.built})),
    axis('Languages', N.languages, l=>({name:l.name||l.label||l.id})),
    axis('Auth', cat?.axes?.auth, a=>({name:a.name})),
    axis('Data / ORM', cat?.axes?.orm, o=>({name:o.name})),
    axis('Package managers', cat?.axes?.package_managers, p=>({name:p.name})),
    axis('Runtime bases', N.runtimeDeep, r=>({name:r.name})),
    axis('Observability', cat?.axes?.observability, o=>({name:o.name})),
    axis('Deploy targets', cat?.axes?.deploy_targets, d=>({name:d.name})),
    axis('Clusters', N.clusters, c=>({name:c.name})),
  ].filter(a=>a.count);

  let compliance=null;
  if(cat){
    const ctrls=Object.keys(cat.compliance.controls);
    const regimes=Object.entries(cat.compliance.regimes).map(([id,r])=>({id,name:r.name,priority:r.priority}));
    const rows=ctrls.map(c=>({
      key:c, label:cat.compliance.controls[c].label,
      cells:regimes.map(rg=>{
        const v=(cat.compliance.regimes[rg.id].enforces||{})[c];
        const on=!(v===undefined||v===false||v===0||v==='none');
        return { on, regime:rg.id };
      })
    }));
    compliance={ controls:ctrls.length, regimes, rows };
  }

  const integrations = cat ? [...(cat.axes.integrations_canada||[]), ...(cat.axes.integrations_common||[])]
    .map(i=>({name:i.name, ca:(i.verticals? cat.axes.integrations_canada.includes(i):false)})) : [];
  const builtRepos=(N.frameworks||[]).filter(f=>f.built).map(f=>({name:f.name, url:f.repoUrl}));

  return {
    scale:{ frameworks:(N.frameworks||[]).length, built:builtRepos.length,
      phases:phases.length, stages:phases.reduce((n,p)=>n+p.stages.length,0),
      tools:phases.reduce((n,p)=>n+p.stages.reduce((m,s)=>m+s.tools.length,0),0),
      regimes:compliance?compliance.regimes.length:0, integrations:integrations.length },
    disciplines:counts, phases, axes, compliance, integrations, builtRepos,
  };
}

// Data-driven scale of the whole platform — proof of completeness, not hardcoded.
export function platformScale(){
  const G=getG(); const cat=getCatalog();
  const fw=(G?.nodes?.frameworks)||[];
  return {
    frameworks: fw.length,
    built: fw.filter(f=>f.built).length,
    languages: (G?.nodes?.languages||[]).length,
    regimes: cat ? Object.keys(cat.compliance.regimes).length : (G?.nodes?.complianceProfiles||[]).length,
    phases: (G?.nodes?.phases||[]).length,
    stages: (G?.nodes?.stages||[]).length,
    tools: (G?.nodes?.tools||[]).length,
    integrations: cat ? ((cat.axes.integrations_canada||[]).length + (cat.axes.integrations_common||[]).length) : 0,
  };
}

// The full ordered path the wizard walks. 'device' + 'fw' + 'industry' are special.
export const STEP_ORDER = ['device','fw','industry', ...DECISION_STEPS.map(s=>s.axis), 'result'];

// ── Top-level device groups (4): Backend, Frontend Web, Mobile, Protocol ───────
export function deviceGroups(){
  const G=getG();
  return (G.nodes.devices||[]).map(d=>{
    const fws=(G.nodes.frameworks||[]).filter(f=>devOf(f)===d.id);
    return { id:d.id, name:d.name||d.label, total:fws.length, built:fws.filter(f=>f.built).length };
  });
}
function devOf(f){ const d=f.device; return Array.isArray(d)?d[0]:String(d||'').replace(/[[\]']/g,''); }

// Frameworks for a device, grouped by category. All shown. Badge = built / planned.
export function frameworksForDevice(deviceId){
  const G=getG();
  const cats=(G.nodes.categories||[]);
  const fws=(G.nodes.frameworks||[]).filter(f=>devOf(f)===deviceId);
  const byCat={};
  for(const f of fws){ (byCat[f.categoryId] ||= []).push(f); }
  return Object.keys(byCat).map(cid=>{
    const cat=cats.find(c=>c.id===cid);
    return {
      id:cid,
      name:(cat?.name||cat?.label||cid).replace(/^[^—]*—\s*/,''), // drop the device prefix
      frameworks: byCat[cid].map(f=>({
        id:f.id, name:f.name, lang:f.languageId, built:!!f.built,
        plain: firstSentence(f.whenToUse||'')
      }))
    };
  }).filter(g=>g.frameworks.length);
}

// ── Step 9 — the full pipeline blueprint: 6 phases → 46 stages → 98 tools ───────
export function buildBlueprint(rs){
  const G=getG();
  const s=resolveStack(rs);
  const fw=s.fw;
  const repoBase = fw.built ? fw.repoUrl : null;

  const phases=(G.nodes.phases||[]).map(p=>{
    const stages=(G.nodes.stages||[])
      .filter(st=>st.phaseId===p.id)
      .sort((a,b)=>(a.order||0)-(b.order||0))
      .map(st=>{
        const tools=(G.nodes.tools||[])
          .filter(t=>t.phaseId===p.id && t.stage===st.name)
          .map(t=>({
            name:t.tool||t.name, license:t.license, output:t.output,
            mandatory:t.mandatory, appliesTo:t.appliesTo,
            why:firstSentence(t.whenToUse||''), changesWhen:t.changesWhen,
            tradeoff:t.primaryTradeoff
          }));
        return {
          id:st.id, name:st.name, type:st.type,
          parallel: st.groupKind==='parallel',
          tools
        };
      });
    return { id:p.id, name:p.name||p.label, stages };
  }).filter(p=>p.stages.length);

  return {
    fw, built:!!fw.built, repoBase,
    stack:s,
    summary:stackSummary(s, rs),
    phases,
    decisions:safe(()=>decisionsFor(s), {}),
    commands:safe(()=>commandsFor(s, rs), {}),
    stageCount:phases.reduce((n,p)=>n+p.stages.length,0),
    toolCount:phases.reduce((n,p)=>n+p.stages.reduce((m,st)=>m+st.tools.length,0),0),
  };
}

function stackSummary(s, rs){
  const G=getG();
  return [
    ['Framework', s.fw.name],
    ['Language',  s.lang],
    ['Package',   nameById('pkgBuildDeep', s.pkg)],
    ['Auth',      nameById('authDeep', s.auth)],
    ['Data',      nameById('ormDeep', s.orm)],
    ['Observability', nameById('observabilityDeep', s.obs)],
    ['Base image', nameById('runtimeDeep', s.base)],
    ['Registry',  (rs.registry||'ghcr').toUpperCase()],
    ['Signing',   (rs.signer||'cosign')],
    ['Cluster',   nameById('clusters', s.cluster)],
    ['Industry',  s.rq ? s.rq.name : 'General (no lens)'],
  ].filter(([,v])=>v);
}

function safe(fn, fb){ try{ const v=fn(); return v==null?fb:v; }catch(e){ return fb; } }

// Build a GitHub link into the real repo subtree (built frameworks only).
export function repoLink(repoBase, path){
  if(!repoBase) return null;
  return path ? repoBase.replace(/\/$/,'') + '/' + path.replace(/^\//,'') : repoBase;
}

export { resolveStack, gOptions };
