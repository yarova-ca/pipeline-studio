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
  { axis:'pkg',      title:'Package manager',        plain:'how dependencies install in CI.' },
  { axis:'auth',     title:'How users log in',       plain:'who is allowed in, and how.' },
  { axis:'orm',      title:'How the app reads data',  plain:'the database access layer.' },
  { axis:'obs',      title:'Logs, metrics, traces',  plain:'how you see what the app does.' },
  { axis:'runtime',  title:'Container base image',   plain:'the OS layer your code runs on.' },
  { axis:'registry', title:'Where images live',      plain:'the store for built containers.' },
  { axis:'signer',   title:'Proving the image is yours', plain:'a signature stops tampering.' },
  { axis:'cluster',  title:'Where it deploys',       plain:'the server it runs on.' },
];

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
