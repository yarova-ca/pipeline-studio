// lib/render.js — ALL HTML generation, ported from the vanilla app.js.
// render.* functions return HTML strings for use with Svelte {@html ...}.
// No DOM access. State is read from module-level refs set via setRenderState().
import { getG, getK, find, by, nameById, reqStds, decisionsFor,
  buildConfig, genFiles, alertRulesYaml, dashboardJson,
  firstSentence, KFIELDS, STAGES_BUILD, stripTags, reqOfInd,
  resolveStack, commandsFor, gOptions as logicGOptions, optionModel } from './logic.js';

// ── Module-level render state (mirrors global vars in the static site) ────────
let RS={fw:null,industry:'',category:'',complianceFocus:'',pkg:null,buildtool:null,orm:null,auth:null,obs:null,runtime:null,cluster:null,region:null,registry:'ghcr',signer:'cosign',sbom:'syft'};
let LENS={vertical:''};
let REQ=null,RA=new Set(),RO=new Set(),RG=new Set(),RC=new Set(),RT=new Set();
let DECIDED={};
let MODE='catalog';
let LASTR={};
let GSTEP=0;
let GNAV={platform:null,category:null,all:false};
let LEVEL='beginner'; // beginner → cards arrive at Layer 1; expert → Layers 2+3 pre-opened

export function setRenderState(patch){Object.assign(RS,patch?.rs||{});if(patch?.mode)MODE=patch.mode;if(patch?.decided)DECIDED=patch.decided;if(patch?.lastr)LASTR=patch.lastr;if(patch?.level)LEVEL=patch.level;}
export function setLevel(l){LEVEL=l;}
export function setGSTEP(n){GSTEP=n;}
export function setGNAV(v){GNAV=v;}
export function getRS(){return RS;}
export function getLASTR(){return LASTR;}
export function setLens(v){
  const G=getG();
  LENS.vertical=v;
  REQ=v?(G.nodes.industryRequirements||[]).find(r=>r.id===v):null;
  RA=new Set(REQ?.requiredAuthIds||[]);
  RO=new Set(REQ?.requiredObservabilityIds||[]);
  RG=new Set(REQ?.requiredRegimeIds||[]);
  RC=new Set(REQ?.recommendedClusterIds||[]);
  RT=new Set(REQ?.recommendedRuntimeIds||[]);
}
export const lensOn=()=>!!LENS.vertical;
function st(required,universal){
  if(required)return'req';
  if(lensOn()&&universal)return'stay';
  if(lensOn())return'dim';
  return'';
}

// ── CFID — unique IDs for copy buttons ────────────────────────────────────────
let CFID=0;
export function resetCFID(){CFID=0;}

// ── HTML helpers ───────────────────────────────────────────────────────────────
const esc=(s)=>String(s==null?"":s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CAT_COLOR=(cid)=>{const n=parseInt((cid||'').replace(/\D/g,''))||0;
  if(n<=8)return'#0B7A66'; if(n<=13)return'#6D28D9'; if(n<=27)return'#3F6212'; return'#0E7490';};
export const grp=(t)=>`<div class="grp">${esc(t)}</div>`;

export function card(accent,title,meta,onclick,state,chip){
  const cls=`card${state?' '+state:''}`;
  const ch=chip?` <span class="chip ${chip.cls}">${esc(chip.text)}</span>`:'';
  return `<div class="${cls}" style="--accent:${accent}" tabindex="0" role="button"
    onclick="${onclick}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${onclick}}">
    <b>${esc(title)}</b>${ch}${meta?`<div class="meta">${esc(meta)}</div>`:''}</div>`;
}
function col(idx,n,name,accent,bodyHtml,note,wide){
  return `<section class="col${wide?' wide':''}" id="col-${idx}" data-accent="${accent}">
    <div class="colhead"><div class="n">${esc(n)}</div><h2>${esc(name)}</h2>
    <div class="bar" style="--accent:${accent}"></div>${note?`<div class="note">${esc(note)}</div>`:''}</div>
    <div class="colbody">${bodyHtml}</div><div class="arrow">→</div></section>`;
}
export function opt(axis,id,name,sub,state,info){
  return `<div class="opt ${state}" tabindex="0" role="button" aria-pressed="${state==='chosen'}"
    onclick="pickAxis('${axis}','${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();pickAxis('${axis}','${id}')}">
    <span class="optname">${esc(name)}</span>${sub?`<span class="optsub">${esc(sub)}</span>`:''}
    ${state==='chosen'?'<span class="optflag chosen">✓ chosen</span>':state==='req'?'<span class="optflag applies">applies</span>':state==='rec'?'<span class="optflag rec">recommended</span>':''}
    ${info?`<button class="opti" aria-label="details" tabindex="-1" onclick="event.stopPropagation();${info}">i</button>`:''}</div>`;
}
export function ostate(id,chosenId,reqSet,recSet){
  if(id===chosenId)return'chosen';
  if(reqSet&&reqSet.has(id))return'req';
  if(recSet&&recSet.has(id))return'rec';
  return'avail';
}

// ── Value renderers ────────────────────────────────────────────────────────────
export function renderVal(v){
  if(v==null||v==='')return'';
  if(Array.isArray(v)){
    if(v.length&&typeof v[0]==='object') return v.map(o=>failBlock(o)).join('');
    return v.map(x=>`<span class="chip">${esc(stripTags(x))}</span>`).join('');
  }
  if(typeof v==='object'){
    const ents=Object.entries(v).filter(([,val])=>val!=null&&val!=='');
    if(!ents.length)return'';
    return `<div class="kv">`+ents.map(([k,val])=>
      `<div class="k">${esc(k)}</div><div>${esc(stripTags(typeof val==='object'?JSON.stringify(val):val))}</div>`).join('')+`</div>`;
  }
  const s=String(v);
  if(/\n/.test(s)&&/(kubectl|helm|docker|npm|cosign|git |apply|install)/.test(s)) return `<pre class="cmd">${esc(s)}</pre>`;
  return esc(stripTags(s));
}
export function failBlock(o){
  if(o.trigger||o.system||o.userSees){
    return `<div class="fail">
      ${o.trigger?`<div class="fk">Trigger</div><div>${esc(stripTags(o.trigger))}</div>`:''}
      ${o.system?`<div class="fk">System</div><div>${esc(stripTags(o.system))}</div>`:''}
      ${o.userSees?`<div class="fk">User sees</div><div>${esc(stripTags(o.userSees))}</div>`:''}
      ${o.fix||o.userCan?`<div class="fk">Fix</div><div>${esc(stripTags(o.fix||o.userCan))}</div>`:''}</div>`;
  }
  return `<div class="kv">`+Object.entries(o).filter(([,val])=>val!=null&&val!=='').map(([k,val])=>`<div class="k">${esc(k)}</div><div>${esc(stripTags(val))}</div>`).join('')+`</div>`;
}
export function section(label,v){return `<h3>${esc(label)}</h3>${renderVal(v)}`;}
export function fullNode(o,labels,skip){
  skip=new Set([...(skip||[]),'id','label','name','sourceType','confidence','sourcePage','order','num']);
  let h='';
  const done=new Set();
  for(const [k,l] of (labels||[])){ if(o[k]!=null&&o[k]!==''){h+=section(l,o[k]);done.add(k);} }
  for(const [k,v] of Object.entries(o)){
    if(done.has(k)||skip.has(k)||v==null||v==='')continue;
    h+=section(k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()),v);
  }
  if(o.sourcePage)h+=`<div class="prov">source: ${esc(stripTags(String(o.sourcePage)))} · ${esc(o.sourceType||'graph')}</div>`;
  return h||'<div class="sub">No further detail.</div>';
}
export function kval(v){ if(v==null||v==='')return''; if(Array.isArray(v))return v.join(', '); if(typeof v==='object')return Object.entries(v).map(([k,x])=>`${k}: ${x}`).join('  ·  '); return String(v); }

// ── THE unified option card — one shape, three layers, everywhere ─────────────
// Layer 1 (always): name + verdict + plain line + "for you" reason.
// Layer 2 (tap / open in expert): when to pick / when to skip.
// Layer 3 (tap / open in expert): full technical detail.
const VERDICT_META={
  recommended: ['✓ pick this for you','rec'],
  required:    ['✓ required for you','req'],
  covered:     ['inside your pick','cov'],
  alternative: ['also a fit','alt'],
  available:   ['available','avail'],
  irrelevant:  ['not for your case','irr'],
};
export function optionCard(axis,id,opts={}){
  const m=optionModel(axis,id,RS,opts.s);
  const picked=opts.picked!=null?opts.picked:(RS[axis]===id);
  const open=(LEVEL==='expert')||picked;
  const [vlabel,vcls]=VERDICT_META[m.verdict]||VERDICT_META.available;
  const sel=opts.selectFn||`pickAxis('${axis}','${id}')`;
  const more=opts.drawer?`<button class="oc-more" onclick="event.stopPropagation();${opts.drawer}">full record →</button>`:'';
  const l2=(m.pickWhen||m.skipWhen)?`<div class="oc-l2">`+
    (m.pickWhen?`<div class="oc-pick"><span class="oc-k">Pick when</span><span>${linkify(firstSentence(m.pickWhen))}</span></div>`:'')+
    (m.skipWhen?`<div class="oc-skip"><span class="oc-k">Skip when</span><span>${linkify(firstSentence(m.skipWhen))}</span></div>`:'')+
    `</div>`:'';
  const l3=m.detail.length?`<div class="oc-l3">`+
    m.detail.map(([l,v])=>{const vv=kval(v);return vv?`<div class="krow"><span class="kk">${esc(l)}</span><span class="kvv">${linkify(vv)}</span></div>`:'';}).join('')+
    `</div>`:'';
  return `<div class="oc ${m.verdict}${picked?' picked':''}">
    <div class="oc-head">
      <div class="oc-name"><b>${esc(m.name)}</b><span class="oc-badge ${vcls}">${vlabel}</span></div>
      <button class="oc-pick${picked?' on':''}" onclick="event.preventDefault();event.stopPropagation();${sel}">${picked?'✓ chosen':'choose'}</button>
    </div>
    <div class="oc-plain">${linkify(m.plain)}${m.scope?` <span class="oc-scope">${esc(m.scope)}</span>`:''}</div>
    <div class="oc-foryou ${m.verdict}"><span class="oc-fy">For you</span><span>${linkify(m.forYou)}</span></div>
    ${l2?`<details class="oc-exp"${open?' open':''}><summary>When to pick / when to skip</summary>${l2}</details>`:''}
    ${l3?`<details class="oc-exp"${open?' open':''}><summary>Full technical detail</summary>${l3}${more}</details>`:(more?`<div class="oc-l3">${more}</div>`:'')}
  </div>`;
}
function essence(node,o){
  if(node==='runtimeDeep')return `${o.baseOs||''} · ${o.sizeMb?o.sizeMb+' MB':''} · ${o.fipsCertified==='yes'?'FIPS':'no FIPS'}`;
  if(node==='clusters')return `${o.cloud||''} · ${o.secretIdentity||''}`;
  if(node==='ormDeep')return `${(o.language||[]).join('/')||''}${o.typeSafety?' · '+firstSentence(o.typeSafety):''}`;
  if(node==='pkgBuildDeep')return `${o.language||''} · ${firstSentence(o.what)}`;
  return firstSentence(o.what||o.howItWorks||'');
}
function discipline(text){
  const t=String(text||'').toLowerCase();
  if(/sast|sca|codeql|secret|sign|cosign|sbom|trivy|iac|scan|compliance|vuln|license-scan/.test(t))return'DevSecOps';
  if(/observ|otel|metric|prom|slo|sla|incident|alert|notify|rollout|monitor/.test(t))return'SRE';
  return'DevOps';
}
function discTag(text){const d=discipline(text);return `<span class="disc ${d.toLowerCase()}">${d}</span>`;}

// ── Block components — accRow/altRow/kcardRO now delegate to the unified card ──
export function accRow(node,axis,o,state,tag,open){
  // every scene option list (auth, orm, obs, runtime, cluster, pkg, buildtool) → one card
  return optionCard(axis, o.id, {selectFn:`pickAxis('${axis}','${o.id}')`});
}
export function fileAcc(name,text,open){
  if(!text||typeof text!=='string')return'';
  const id='cf'+(CFID++);
  return `<details class="facc"${open?' open':''}><summary><span class="caret">▸</span><span class="genname">${esc(name)}</span><span class="sub">${text.split('\n').length} lines</span><button class="gencopy" onclick="event.preventDefault();event.stopPropagation();copyCode('${id}',this)">copy</button></summary><pre class="gencode" id="${id}">${esc(text)}</pre></details>`;
}
export function kcardRO(node,o,tag,drawer){
  const axis = node==='frameworks'?'fw':node;
  return optionCard(axis, o.id, {picked:true, drawer});
}
export function altRow(o,extra,axis,chosenId){
  // signer / sbom / registry carry a real axis → unified card.
  if(axis) return optionCard(axis, o.id, {selectFn:`pickAxis('${axis}','${o.id}')`});
  // No axis: CI-tool alternatives + frontend-observability — not in the option model. Legacy read-only.
  const fields=[['what','what'],['pick','pick when'],['avoid','avoid when'],['tradeoff','trade-off'],['setup','setup'],['login','login command'],['command','command'],['format','format'],['residency','residency'],['license','license']];
  const rows=fields.map(([k,l])=>o[k]?`<div class="krow"><span class="kk">${esc(l)}</span><span class="kvv">${linkify(o[k])}</span></div>`:'').join('');
  return `<details class="acc fit"><summary><span class="caret">▸</span><span class="an">${esc(o.name)}</span><span class="am">${esc(firstSentence(o.what||o.pick||''))}</span>${extra||''}</summary><div class="accbody">${rows}</div></details>`;
}
export function cmdBlock(title,arr){ if(!arr||!arr.length)return'';
  return grp(title)+arr.map((c,i)=>{const id='cmd'+(CFID++);
    return `<div class="cmd"><div class="cmdlabel"><span><span class="cmdn">${i+1}</span>${esc(c.label)}</span><button class="gencopy" onclick="copyCode('${id}',this)">copy</button></div><pre class="cmdcode" id="${id}">${esc(c.cmd)}</pre>${c.expect?`<div class="expect">you'll see: ${esc(c.expect)}</div>`:''}</div>`;}).join(''); }
export function codeFile(name,text){
  if(!text||typeof text!=='string')return'';
  const id='cf'+(CFID++);
  return `<div class="genfile"><div class="genhead"><span class="genname">${esc(name)}</span>`+
    `<button class="gencopy" onclick="copyCode('${id}',this)">copy</button></div>`+
    `<pre class="gencode" id="${id}">${esc(text)}</pre></div>`;
}
export function libBlock(s){
  const libs=((s.fw.shipped&&s.fw.shipped.libraries)||[]).filter(l=>l.direct);
  if(!libs.length)return'';
  return grp(`shipped libraries (${libs.length} direct)`)+`<div class="libwrap">`+libs.map(l=>`<span class="lib">${esc(l.name)} <span class="libv">${esc(l.version)}</span></span>`).join('')+`</div>`;
}
export function sceneNote(K,n){return K.sceneNotes&&K.sceneNotes[n]?`<div class="scenenote">${esc(K.sceneNotes[n])}</div>`:'';}
export function industryMatrix(G,K,RS,kind){
  const rows=(G.nodes.industryRequirements||[]).map(r=>{
    let v='';
    if(kind==='regimes')v=(r.requiredRegimeIds||[]).length+' — '+(r.requiredRegimeIds||[]).slice(0,4).map(id=>nameById('complianceProfiles',id)).join(', ')+((r.requiredRegimeIds||[]).length>4?'…':'');
    if(kind==='auth')v=(r.requiredAuthIds||[]).map(id=>nameById('authDeep',id).split(' (')[0]).join(' · ');
    if(kind==='obs')v=(r.requiredObservabilityIds||[]).map(id=>nameById('observabilityDeep',id).split(' —')[0].split(' (')[0]).join(' · ');
    if(kind==='runtime')v=(r.recommendedRuntimeIds||[]).join(' · ');
    if(kind==='clusters')v=(r.recommendedClusterIds||[]).map(id=>nameById('clusters',id)).join(' · ');
    const sel=r.id===RS.industry;
    return `<tr class="${sel?'sel':''}" onclick="pickAxis('industry','${r.id}')"><td>${esc(r.name)}</td><td>${esc(v||'—')}</td></tr>`;
  }).join('');
  const TITLES={regimes:'regimes that apply',auth:'auth required',obs:'observability required',runtime:'base image',clusters:'recommended cluster'};
  return `<table class="mx"><thead><tr><th>industry</th><th>${TITLES[kind]||kind}</th></tr></thead><tbody>${rows}</tbody></table>`;
}
export function checklistBlock(G,K,s,DEC){
  const items=[];
  (DEC.compliance||[]).forEach(d=>items.push({area:'Compliance',q:d.q,state:d.verdict==='gap'?'gap':'ok',note:d.why}));
  (DEC.build||[]).filter(d=>d.verdict==='forced').forEach(d=>items.push({area:'Security · build',q:`${d.q} → ${d.answer}`,state:'forced',note:d.why}));
  (DEC.platform||[]).filter(d=>/Auth|Audit|RBAC|Observability/.test(d.q)).forEach(d=>items.push({area:'Security · platform',q:`${d.q}: ${d.answer}`,state:d.verdict==='gap'?'gap':(d.verdict==='required'?'ok':'note'),note:d.why}));
  if(!items.length)return'<div class="sub">Pick an industry to generate the checklist.</div>';
  const SCENE_OF={'Compliance':[1,'Scene 1'],'Security · build':[6,'Scene 6'],'Security · platform':[4,'Scene 4']};
  const ic={ok:'✓',gap:'✗',forced:'🔒',note:'•'};
  const byArea={}; items.forEach(i=>{(byArea[i.area]||=[]).push(i);});
  const gaps=items.filter(i=>i.state==='gap').length;
  return `<div class="sub" style="margin-bottom:8px">${items.length} decisions · <b style="color:${gaps?'#B42318':'var(--accent)'}">${gaps} open gap${gaps===1?'':'s'}</b> for ${esc(s.rq?s.rq.name:'this stack')}.</div>`+
    Object.entries(byArea).map(([area,arr])=>grp(area)+arr.map(i=>
      `<div class="chk ${i.state}"><span class="chki">${ic[i.state]}</span><div><div class="chkq">${esc(i.q)}</div>${i.note?`<div class="chkn">${esc(stripTags(i.note))}</div>`:''}</div>${SCENE_OF[area]?`<button class="scjump" onclick="goCol(${SCENE_OF[area][0]-1})">${SCENE_OF[area][1]} →</button>`:''}</div>`).join('')).join('');
}

// ── Catalog columns ────────────────────────────────────────────────────────────
export function colFrameworks(){
  const G=getG();
  const cats=[...(G.nodes.categories||[])].sort((a,b)=>(parseInt(a.id.replace(/\D/g,''))||0)-(parseInt(b.id.replace(/\D/g,''))||0));
  const fwByCat=by(G.nodes.frameworks,'categoryId');
  let h='';
  for(const cat of cats){const fws=fwByCat[cat.id]||[]; if(!fws.length)continue;
    h+=`<div class="grp" style="color:${CAT_COLOR(cat.id)}">${esc(cat.name)}</div>`;
    for(const f of fws) h+=card(CAT_COLOR(cat.id),f.name,`${(f.languages||[f.languageId]).filter(Boolean).join('/')} · ${f.maturity||f.tier||''}`,`openFw('${f.id}')`,'', f.built?{cls:'built',text:'✓ Built'}:{cls:'soon',text:'planned'});
  }
  const nBuilt=(G.nodes.frameworks||[]).filter(f=>f.built).length;
  return col(0,'01 · catalog','Frameworks','#0B7A66',h,`${(G.nodes.frameworks||[]).length} frameworks · ${nBuilt} golden repos built, rest planned. Any one is a valid start.`);
}
export function colPipeline(){
  const G=getG();
  const phases=(G.nodes.phases||[]).sort((a,b)=>(+a.order||0)-(+b.order||0));
  const stages=G.nodes.stages||[], invs=G.nodes.invariants||[];
  let h='';
  for(const p of phases){
    const st_=stages.filter(s=>s.phaseId===p.id);
    const iv=invs.filter(x=>x.phaseId===p.id);
    h+=`<div class="grp">${esc(p.label||p.name)} · ${esc(p.trigger||'')}</div>`;
    for(const s of st_){const sec=(s.type||'').toLowerCase().includes('sec');
      h+=card(sec?'#6B7DB3':'#0B7A66',s.name||s.label,s.type||'',`openStage('${s.id}')`,lensOn()?'stay':'',null);}
    if(iv.length){
      h+=`<div class="sub" style="margin:2px 0 6px">Invariants enforced this phase:</div>`;
      for(const x of iv) h+=card('#0B7A66',`${x.name} — ${stripTags(x.condition)}`,`enforced by ${x.enforcedBy||'CI'}`,`openInvariant('${x.id}')`,'',null);
    }
  }
  h+=`<div class="grp">Swappable build knobs (8 ARGs)</div>`;
  for(const a of (G.nodes.buildAxes||[])) h+=card('#B45309',`--${a.arg} (${a.name})`,`default: ${a.default} · ${a.implStatus}`,`openAxis('${a.id}')`,'',null);
  return col(1,'02 · build','CI/CD Pipeline','#0B7A66',h,`${stages.length} stages over ${phases.length} phases + ${invs.length} invariants. Identical for every industry.`);
}
export function colCompliance(){
  const G=getG();
  const profs=(G.nodes.complianceProfiles||[]);
  let h='';
  if(lensOn()){
    const reqList=profs.filter(c=>RG.has(c.id));
    const other=profs.filter(c=>!RG.has(c.id));
    h+=`<div class="grp" style="color:var(--scarcity)">Required for ${esc(REQ?.name||'')} (${reqList.length})</div>`;
    for(const c of reqList) h+=card('#B45309',c.name,c.fullName||c.regulator||'',`openProfile('${c.id}')`,'req',{cls:'req',text:'required'});
    h+=`<div class="grp">Not required for this industry (${other.length})</div>`;
    for(const c of other) h+=card('rgba(14,15,17,.2)',c.name,c.fullName||'',`openProfile('${c.id}')`,'dim',null);
  }else{
    h+=`<div class="sub" style="margin-bottom:8px">Pick an industry lens to see which of these 26 apply. All shown until then.</div>`;
    for(const c of profs) h+=card('rgba(14,15,17,.2)',c.name,c.fullName||c.regulator||'',`openProfile('${c.id}')`,'',null);
  }
  return col(2,'03 · governance','Compliance — 26 regimes','#B45309',h,
    lensOn()?`${RG.size} of 26 regimes apply to ${REQ?.name}.`:`All 26 regulatory regimes. Lens marks which apply.`);
}
export function colRegistry(){
  const G=getG();
  const imgs=(G.nodes.images||[]);
  let h=`<div class="grp">Pipeline output</div>`+
    card('#C2610C','GHCR — ghcr.io/yarova-ca','signed image + SBOM · :latest :sha :sha-fips','openRegistry()','',null);
  h+=`<div class="grp">Base images — 22 options</div>`;
  for(const im of imgs){
    const req=RT.has(im.id);
    const chip = req?{cls:'req',text:'recommended'} : (im.fips==='Yes'?{cls:'keep',text:'FIPS'}:null);
    h+=card('#C2610C',im.name,`${im.familyLabel||im.family||''} · ${im.minImage||''}${im.fips==='Yes'?' · FIPS':''}`,`openImage('${im.id}')`,st(req,false),chip);
  }
  h+=`<div class="grp">Runtime base — decision depth</div>`;
  for(const r of (G.nodes.runtimeDeep||[])){
    const req=RT.has(r.id);
    h+=card('#C2610C',r.name,`${r.baseOs||''} · ${r.sizeMb?r.sizeMb+'MB':''}${r.fipsCertified==='yes'?' · FIPS':''}`,`openDeep('runtimeDeep','${r.id}')`,st(req,false),req?{cls:'req',text:'recommended'}:null);
  }
  h+=`<div class="grp">Package + build managers (${(G.nodes.pkgBuildDeep||[]).length})</div>`;
  for(const p of (G.nodes.pkgBuildDeep||[])) h+=card('#C2610C',p.name,`${p.kind||''} · ${p.language||''}`,`openPkg('${p.id}')`,'',null);
  return col(3,'04 · artifact','Registry & Build','#C2610C',h,
    lensOn()?`Recommended base for ${REQ?.name}: ${[...RT].join(', ')}.`:`22 base images + 9 runtime profiles + pkg managers.`);
}
export function colGitops(){
  const G=getG();
  let h='<div class="sub" style="margin-bottom:8px">Registry image → Git declares desired state → controller syncs to clusters. Same for every industry.</div>';
  for(const t of (G.nodes.gitopsTools||[])) h+=card('#7C3AED',t.name,`${t.role||''}${t.version?' · v'+t.version:''}`,`openGitops('${t.id}')`,lensOn()?'stay':'',null);
  return col(4,'05 · GitOps','GitOps — Helm + Kustomize','#7C3AED',h,`${(G.nodes.gitopsTools||[]).length} tools. Declarative delivery — identical across industries.`);
}
export function colClusters(){
  const G=getG();
  const comps=[...(G.nodes.clusterComponents||[])].sort((a,b)=>(a.num||'').localeCompare(b.num||''));
  const layers_=by(comps,'layer');
  const clusters=G.nodes.clusters||[];
  const cx=180,cy=70;
  const pts=clusters.map((c,i)=>{const ang=(-90+i*(360/clusters.length))*Math.PI/180;
    return {c,x:cx+Math.cos(ang)*120,y:cy+Math.sin(ang)*46};});
  let svg=`<svg viewBox="0 0 360 150" width="100%" height="150" role="img" aria-label="Argo CD hub connected to clusters">`;
  for(const p of pts){const on=RC.has(p.c.id);
    svg+=`<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${on?'#B45309':'rgba(14,15,17,.15)'}" stroke-width="${on?2:1}"/>`;}
  for(const p of pts){const on=RC.has(p.c.id);
    svg+=`<g style="cursor:pointer" role="button" tabindex="0" aria-label="${esc(p.c.name||p.c.id)} cluster — open details"
      onclick="openCluster('${p.c.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openCluster('${p.c.id}')}">
      <circle cx="${p.x}" cy="${p.y}" r="22" fill="${on?'rgba(180,83,9,.10)':'#FFFFFF'}" stroke="${on?'#B45309':'#0B7A66'}" stroke-width="${on?2:1.2}"/>
      <text x="${p.x}" y="${p.y+4}" text-anchor="middle" fill="${on?'#B45309':'rgba(14,15,17,.68)'}" font-size="11" font-family="Outfit">${esc(p.c.name||p.c.id)}</text></g>`;}
  svg+=`<circle cx="${cx}" cy="${cy}" r="26" fill="rgba(25,200,168,.12)" stroke="#0B7A66" stroke-width="1.6"/>
    <text x="${cx}" y="${cy-2}" text-anchor="middle" fill="#0B7A66" font-size="11" font-family="Outfit">Argo CD</text>
    <text x="${cx}" y="${cy+11}" text-anchor="middle" fill="rgba(14,15,17,.56)" font-size="9" font-family="Outfit">hub</text></svg>`;
  let h=`<div class="hubwrap">${svg}<div class="sub">Hub-and-spoke: one Argo CD controller syncs every cluster.${lensOn()?` Recommended for ${esc(REQ?.name)}: <span style="color:var(--scarcity)">${[...RC].map(x=>esc(x)).join(', ')}</span>.`:''}</div></div>`;
  const order=['Foundation','Networking','Security','Storage','Observability','Delivery','Scaling','Platform'];
  const keys=Object.keys(layers_).sort((a,b)=>{const ia=order.indexOf(a),ib=order.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib);});
  for(const layer of keys){const cs=layers_[layer];
    h+=`<div class="layer"><h4>Layer — ${esc(layer)} · ${cs.length}</h4>`;
    for(const c of cs) h+=card('#0E7490',`${c.num}. ${c.name}`,(c.status||'')+(c.what?' · '+stripTags(c.what).slice(0,48):''),`openCluster2('${c.id}')`,lensOn()?'stay':'',null);
    h+=`</div>`;}
  return col(5,'06 · runtime','Clusters — hub-and-spoke','#0E7490',h,`${clusters.length} clusters · ${comps.length} components in ${keys.length} stacked layers.`,true);
}
export function colPlatform(){
  const G=getG();
  const map=[['Auth','authDeep',RA],['Observability','observabilityDeep',RO],['ORM','ormDeep',null],['Runtime base','runtimeDeep',RT]];
  let h='';
  for(const [label,node,reqSet] of map){
    const items=G.nodes[node]||[];
    const reqCount=reqSet?items.filter(o=>reqSet.has(o.id)).length:0;
    h+=`<div class="grp">${label}${reqSet&&lensOn()?` · ${reqCount} required`:''}</div>`;
    for(const o of items){
      const req=reqSet?reqSet.has(o.id):false;
      const universal=!reqSet;
      h+=card('#BE185D',o.name,stripTags(o.what||'').slice(0,68),`openDeep('${node}','${o.id}')`,st(req,universal),req?{cls:'req',text:'required'}:null);
    }
  }
  return col(6,'07 · platform','Auth · Observability · ORM · Runtime','#BE185D',h,
    lensOn()?`${REQ?.name}: auth ${[...RA].length}, observability ${[...RO].length} required.`:`Every swappable platform option, full decision depth.`,true);
}
export function colIntegrations(){
  const G=getG();
  const ig=G.nodes.integrations||[];
  const list=lensOn()?ig.filter(g=>g.verticalId===LENS.vertical):ig;
  let h=lensOn()?`<div class="sub" style="margin-bottom:8px">${list.length} integrations for ${esc(REQ?.name||'')}.</div>`
    :`<div class="sub" style="margin-bottom:8px">All ${ig.length} integrations. Pick an industry to focus.</div>`;
  const byCat=by(list,'category');
  for(const [cat,arr] of Object.entries(byCat)){
    h+=`<div class="grp">${esc(cat)}</div>`;
    for(const g of arr) h+=card('#1D4ED8',g.externalSystem,`auth ${g.authOption||''} · ${g.apiGateway||''}`,`openIntegration('${g.id}')`,lensOn()?'req':'',null);
  }
  return col(7,'08 · connect','Integrations','#1D4ED8',h,`${ig.length} external systems across ${Object.keys(by(ig,'category')).length} categories.`);
}
export function colReference(){
  const G=getG();
  let h=`<div class="grp">Concepts (${(G.nodes.conceptNotes||[]).length})</div>`;
  for(const c of (G.nodes.conceptNotes||[])) h+=card('#6D28D9',c.title,stripTags(c.body||'').slice(0,60),`openConcept('${c.id}')`,'',null);
  h+=`<div class="grp">Languages (${(G.nodes.languages||[]).length})</div>`;
  for(const l of (G.nodes.languages||[])) h+=card('#6D28D9',l.name||l.id,l.useFor||l.note||'',`openRef('languages','${l.id}')`,'',null);
  h+=`<div class="grp">API gateways (${(G.nodes.apiGateways||[]).length})</div>`;
  for(const a of (G.nodes.apiGateways||[])) h+=card('#6D28D9',a.name||a.id,a.role||a.note||'',`openRef('apiGateways','${a.id}')`,'',null);
  h+=`<div class="grp">Target devices (${(G.nodes.devices||[]).length})</div>`;
  for(const d of (G.nodes.devices||[])) h+=card('#6D28D9',d.name||d.id,d.note||'',`openRef('devices','${d.id}')`,'',null);
  h+=`<div class="grp">Regions (${(G.nodes.regions||[]).length})</div>`;
  for(const r of (G.nodes.regions||[])) h+=card('#6D28D9',r.name||r.id,r.note||r.residency||'',`openRef('regions','${r.id}')`,'',null);
  h+=`<div class="grp">Pinned tool versions (${(G.nodes.versions||[]).length})</div>`;
  for(const v of (G.nodes.versions||[]).slice(0,40)) h+=card('#6D28D9',`${v.name||v.tool||v.id}${v.version?' '+v.version:''}`,v.note||'',`openRef('versions','${v.id}')`,'',null);
  if((G.nodes.versions||[]).length>40) h+=`<div class="sub">+ ${(G.nodes.versions||[]).length-40} more pinned versions.</div>`;
  return col(8,'09 · reference','Reference & Concepts','#6D28D9',h,`Concepts, languages, gateways, devices, regions, pinned versions — every supporting fact.`);
}
export function renderBoard(){
  return [colFrameworks(),colPipeline(),colCompliance(),colRegistry(),colGitops(),colClusters(),colPlatform(),colIntegrations(),colReference()].join('');
}

// ── Hero rail ──────────────────────────────────────────────────────────────────
const STAGES_CATALOG=[
  ['catalog','Frameworks','#19C8A8'],['build','Pipeline','#2FCD9D'],['governance','Compliance','#44D292'],
  ['artifact','Registry & Build','#5AD886'],['gitops','GitOps','#70DD7B'],['runtime','Clusters','#85E270'],
  ['platform','Platform','#9BE864'],['connect','Integrations','#B0ED59'],['reference','Reference','#C6F24E'],
];
export { STAGES_CATALOG, STAGES_BUILD };
function heroCounts(G,modeStr){
  const n=G.nodes;
  const integ=lensOn()?(n.integrations||[]).filter(g=>g.verticalId===LENS.vertical).length:(n.integrations||[]).length;
  if(modeStr==='build'){
    const lens=!!RS.industry;
    return [{c:'16 industries · 26 regimes',req:lens},{c:(n.frameworks||[]).length+' to pick from'},{c:'repo + 13 managers'},{c:'auth · ORM · observability',req:lens},
      {c:'build tools + hooks'},{c:(n.runtimeDeep||[]).length+' runtimes',req:lens},{c:'every scan, all tools'},{c:'sign · SBOM · 9 registries'},
      {c:'Helm + Kustomize'},{c:(n.clusters||[]).length+' clusters · '+(n.clusterComponents||[]).length+' comps',req:lens},
      {c:'SRE: signals · SLOs',req:lens},{c:'integrations',req:lens},{c:'audit + release',req:lens},
      {c:'weekly · auto-PRs'},{c:'quarterly · k8s'},{c:'certs · backups · drills'},{c:'the 2am runbook'},{c:'EOL · cost · sunset'}];
  }
  return [{c:(n.frameworks||[]).length+' frameworks'},{c:(n.stages||[]).length+' stages · '+(n.invariants||[]).length+' invariants'},
    {c:lensOn()?RG.size+' of 26 apply':'26 regimes',req:lensOn()},{c:(n.images||[]).length+' base images',req:lensOn()&&RT.size>0},
    {c:(n.gitopsTools||[]).length+' tools'},{c:(n.clusters||[]).length+' clusters · '+(n.clusterComponents||[]).length+' comps',req:lensOn()&&RC.size>0},
    {c:((n.authDeep||[]).length+(n.observabilityDeep||[]).length+(n.ormDeep||[]).length)+' options',req:lensOn()&&(RA.size+RO.size)>0},
    {c:integ+' integrations',req:lensOn()},{c:(n.conceptNotes||[]).length+' concepts +'}];
}
export function renderHeroHtml(G,STAGES,modeStr,rsv,decided){
  const counts=heroCounts(G,modeStr);
  return STAGES.map((s,i)=>{
    const done=modeStr==='build'&&decided['s'+(i+1)];
    return `<div class="hnode${counts[i].req?' req':''}${done?' done':''}" data-i="${i}" style="--accent:${s[2]}" tabindex="0" role="button"
       aria-label="${esc(s[1])}, jump to column"
       onclick="goCol(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goCol(${i})}">
       <span class="dotn">${done?'✓':i+1}</span><span class="hl">${esc(s[1])}</span><span class="hc">${esc(counts[i].c)}</span>
    </div>`}).join('');
}
export function renderLensInfoHtml(){
  if(!lensOn())return'';
  return `<b>${esc(REQ?.name||'')}</b>
    <span class="pill">${RG.size} regimes</span>
    <span class="pill">auth: ${[...RA].map(x=>x.replace('auth-','')).join(', ')}</span>
    <span class="pill">obs: ${[...RO].map(x=>x.replace('observability-','')).join(', ')}</span>
    <span class="pill">clusters: ${[...RC].join(', ')}</span>
    <span class="pill">base: ${[...RT].join(', ')}</span>
    <span class="sub">Amber = required · green = same everywhere · dimmed = not required here.</span>`;
}
export function renderStackBarHtml(G,K,s,DEC){
  const gaps=[...(DEC.compliance||[]),...(DEC.platform||[])].filter(d=>d.verdict==='gap').length;
  const rt=(G.nodes.runtimeDeep||[]).find(r=>r.id===s.base);
  const short=(t)=>String(t||'').split(' (')[0].split(' — ')[0];
  const chips=[[0,RS.industry?short(nameById('verticals',RS.industry)):'no industry'],[1,s.fw.name],[2,short(nameById('pkgBuildDeep',s.pkg))],[3,short(nameById('authDeep',s.auth))],[3,short(nameById('ormDeep',s.orm))],[3,short(nameById('observabilityDeep',s.obs))],[5,short(rt?rt.name:s.base)],[9,short(nameById('clusters',s.cluster))]];
  return `<span class="sblabel">your stack</span>`+
    chips.map(([i,n])=>`<button class="sbchip" onclick="goCol(${i})">${esc(n)}</button>`).join('<span class="sbsep">›</span>')+
    `<span class="sbhealth ${gaps?'bad':'good'}">${s.rq?s.regimes.length+' regimes · '+gaps+' gap'+(gaps===1?'':'s'):'no industry lens'}</span>`;
}

// ── Builder bar ────────────────────────────────────────────────────────────────
const REGIME_TO_STD_LOCAL={'fips-140-3':['fips','fedramp'],'fedramp-mod':['fedramp'],'fedramp-high':['fedramp'],'pci-dss-4':['pci'],'hipaa':['hipaa'],'pipeda':['pipeda'],'soc2-typeii':['soc2'],'iso27001':['iso27001'],'cmmc-l2':['cmmc'],'nerc-cip':['nerccip']};
export function renderBuilderHtml(){
  const G=getG(), K=getK();
  const s=resolveStack(RS);
  const cats=[...(G.nodes.categories||[])].sort((a,b)=>(parseInt(a.id.replace(/\D/g,''))||0)-(parseInt(b.id.replace(/\D/g,''))||0));
  const fws=G.nodes.frameworks||[];
  const fwList=RS.category?fws.filter(f=>f.categoryId===RS.category):
    RS.complianceFocus?fws.filter(f=>(f.shipped?.shippedCompliance||[]).some(c=>c.standard===RS.complianceFocus)):fws;
  const oo=(arr,val,fn)=>arr.map(o=>`<option value="${esc(o.id)}" ${o.id===val?'selected':''}>${esc(fn?fn(o):(o.name||o.id))}</option>`).join('');
  return `
    <div class="pick"><label>Filter · category</label><select id="pCat" onchange="builderChange('category',this.value)"><option value="">All categories</option>${oo(cats,RS.category)}</select></div>
    <div class="pick"><label>Filter · compliance</label><select id="pComp" onchange="builderChange('complianceFocus',this.value)"><option value="">Any</option>${oo(G.nodes.complianceProfiles||[],RS.complianceFocus)}</select></div>
    <div class="pick lead"><label>Framework — the service (${fwList.length})</label><select id="pFw" onchange="pickAxis('fw',this.value)">${oo(fwList,s.fw.id)}</select></div>
    <div class="pick lead"><label>Lens · industry</label><select id="pInd" onchange="pickAxis('industry',this.value)"><option value="">— none —</option>${oo(G.nodes.industryRequirements||[],RS.industry)}</select></div>
    <div class="filterhint"><b>${esc(s.fw.name)}</b> — its own build journey below, left to right.<br>Decisions · commands · files. Pick any option inside to change it.</div>
    <div class="applegend"><span class="lg gold">applies / forced</span><span class="lg teal">available</span><span class="lg dim">not here</span><span class="lg red">gap</span></div>`;
}

// ── rpanel: one build scene panel ─────────────────────────────────────────────
function rtag(kind,txt){return `<span class="rtag ${kind}">${esc(txt)}</span>`;}
function rpanel(K,idx,accent,n,name,tagHtml,valHtml,whyHtml,bodyHtml,changed){
  const sn=String(idx+1);
  const sc=(K.scenes||{})[sn]||{}, st=(K.sceneStd||{})[sn]||{};
  const plain=sc.plain?`<div class="plain"><span class="plainlabel">in plain words</span>${linkify(sc.plain)}</div>`:'';
  const pre=(st.who||st.prereqs)?`<div class="prereq"><div class="krow"><span class="kk">who · when</span><span class="kvv">${esc(st.who||'')} — ${esc(st.when||'')}</span></div>${(st.prereqs&&st.prereqs.length)?`<div class="krow"><span class="kk">before you start</span><span class="kvv">${st.prereqs.map(esc).join(' · ')}</span></div>`:''}</div>`:'';
  const threat=st.threat?`<div class="threat"><span class="tlabel">the threat this stops</span>${esc(st.threat)}</div>`:'';
  const rej=st.rejected?`<div class="rejected"><b>The road not taken:</b> ${esc(st.rejected.path)}<div class="sub">Why not: ${esc(st.rejected.why)}</div></div>`:'';
  const skip=st.skipWhen?`<div class="skipwhen"><b>Skip when:</b> ${esc(st.skipWhen)}</div>`:'';
  const done=st.doneWhen?`<div class="donewhen"><span class="dlabel">✓ done when</span>${esc(st.doneWhen)}</div>`:'';
  const brk=(st.breaks&&st.breaks.length)?`<div class="breaks"><span class="blabel">when it breaks</span>${st.breaks.map(b=>`<div class="brow"><span class="bsym">${esc(b.symptom)}</span><span class="bfix">→ ${esc(b.fix)}</span></div>`).join('')}</div>`:'';
  const docsUrl=st.docs==='dynamic:framework'?'':st.docs;
  const meta=(st.time||st.cost||st.docs)?`<div class="metastrip"><span class="mt">⏱ ${esc(st.time||'')}</span><span class="mt">💲 ${esc(st.cost||'')}</span>${docsUrl?`<a class="mt" href="${esc(docsUrl)}" target="_blank" rel="noopener">official docs ↗</a>`:''}<span class="mt sub">verified ${esc((K._meta||{}).updated||'')}</span></div>`:'';
  const youhave=sc.youHave?`<div class="youhave"><b>✓ You now have:</b> ${esc(sc.youHave)}${sc.next?` <span class="nexthint">· Next: ${esc(sc.next)} →</span>`:''}</div>`:'';
  return `<section class="col rcol${changed?' changed':''}" id="col-${idx}" style="--accent:${accent}">
    <div class="rhead">${tagHtml}<div class="n" style="color:${accent}">${esc(n)} · ${esc(name)}</div>
      <div class="rval">${valHtml}</div><div class="rwhy">${whyHtml}</div></div>
    <div class="colbody">${plain}${pre}${threat}${bodyHtml}${rej}${skip}${done}${brk}${meta}${youhave}</div>${idx<17?'<div class="rconn">→</div>':''}</section>`;
}

// ── renderResolver: all 18 build scenes ───────────────────────────────────────
export function renderResolver(){
  const G=getG(), K=getK();
  resetCFID();
  const s=resolveStack(RS);
  const CFG=buildConfig(s,RS), GF=genFiles(CFG);
  const DEC=decisionsFor(s);
  const rdBase=(G.nodes.runtimeDeep||[]).find(x=>x.id===s.base);
  const baseName=rdBase?rdBase.name:s.base;
  const reqRun=new Set([...(s.rq?.recommendedRuntimeIds||[])]);
  const cur={who:RS.industry||'',fw:s.fw.id,scaffold:s.pkg,app:`${s.auth}|${s.orm}|${s.obs}`,local:s.buildtool||'',
    img:s.base,pr:'pr',main:'main',declare:'d',cluster:s.cluster,observe:s.obs,connect:s.integ.length+':'+RS.industry,signoff:s.regimes.join(','),update:'u',upgrade:s.cluster,protect:'p',respond:RS.industry||'',evolve:'e'};
  const prev=LASTR;   // capture BEFORE overwrite — else ch() compares cur to cur (always false)
  const ch=(k)=>prev[k]!=null&&prev[k]!==cur[k];
  LASTR=cur;
  const P=[];
  const CMD=commandsFor(s,RS);
  const cmdScaffold=cmdBlock('commands — scaffold',CMD.scaffold);
  const cmdDeps=cmdBlock('commands — install',CMD.deps);
  const cmdDocker=cmdBlock('commands — build & run locally',CMD.docker);
  const cmdGitops=cmdBlock('commands — deploy',CMD.gitops);
  const cmdCluster=cmdBlock('commands — cluster',CMD.cluster);
  const forced=(DEC.build||[]).filter(d=>d.verdict==='forced');
  const forcedNote=forced.length?`<div class="forcenote">🔒 ${forced.map(d=>`<b>${esc(d.q)}</b> → ${esc(d.answer)}`).join(' · ')}<div class="sub">${esc(stripTags(forced[0].why||''))}</div></div>`:'';
  const stackBarHtml=renderStackBarHtml(G,K,s,DEC);
  const allC=(G.nodes.complianceProfiles||[]);
  const reqSet=new Set(s.regimes);
  const shComp={};((s.fw.shipped&&s.fw.shipped.shippedCompliance)||[]).forEach(c=>{shComp[c.standard]=c;});
  const REGIME_TO_STD={'fips-140-3':['fips','fedramp'],'fedramp-mod':['fedramp'],'fedramp-high':['fedramp'],'pci-dss-4':['pci'],'hipaa':['hipaa'],'pipeda':['pipeda'],'soc2-typeii':['soc2'],'iso27001':['iso27001'],'cmmc-l2':['cmmc'],'nerc-cip':['nerccip']};
  const toolsByStage={};(G.nodes.tools||[]).forEach(t=>{(toolsByStage[t.stage]||=[]).push(t);});
  const stByPhase={};(G.nodes.stages||[]).forEach(st=>{(stByPhase[st.phaseId]||=[]).push(st);});
  const phases=(G.nodes.phases||[]).sort((a,b)=>(+a.order||0)-(+b.order||0));
  const deltaSrc=((G.pipelines||[]).find(p=>p.complianceDeltas&&p.complianceDeltas.length)||{}).complianceDeltas||[];
  const myStds=[...reqStds(s)];
  const myDeltas=deltaSrc.filter(d=>myStds.some(std=>String(d.standardId||d.standard||'').toLowerCase().includes(std)));
  const stageRow=(st_)=>{const tools=toolsByStage[st_.name]||[];
    const d=(st_.type||'').toLowerCase().includes('sec')?'DevSecOps':discipline(st_.name+' '+tools.map(t=>t.tool).join(' '));
    const toolNames=tools.map(t=>t.tool).join(' · ')||'process step';
    const body=tools.length?tools.map(t=>
      `<div class="krow"><span class="kk">tool</span><span class="kvv"><b>${esc(t.tool)}</b> · ${esc(t.license||'')}${/yes/i.test(t.mandatory||'')?' · mandatory':''}</span></div>`+
      (t.whenToUse?`<div class="krow"><span class="kk">use when</span><span class="kvv">${esc(stripTags(t.whenToUse))}</span></div>`:'')+
      (t.whenNot?`<div class="krow"><span class="kk">skip when</span><span class="kvv">${esc(stripTags(t.whenNot))}</span></div>`:'')+
      (t.output?`<div class="krow"><span class="kk">output</span><span class="kvv">${esc(t.output)}${t.ciIntegration?' · '+esc(t.ciIntegration):''}</span></div>`:'')+
      (t.primaryTradeoff?`<div class="krow"><span class="kk">trade-off</span><span class="kvv">${esc(stripTags(t.primaryTradeoff))}</span></div>`:'')
    ).join('<div style="height:8px"></div>'):'<div class="sub">Process step — enforced by configuration, no external tool.</div>';
    return `<details class="acc fit"><summary><span class="caret">▸</span><span class="an">${esc(st_.name)}</span><span class="am">${esc(toolNames)}</span><span class="disc ${d.toLowerCase()}">${d}</span></summary><div class="accbody">${body}</div></details>`;};
  const phaseScene=(pid)=>{const ph=phases.find(p=>p.id===pid);if(!ph)return{rows:'',adds:'',ph:null};
    const rows=(stByPhase[pid]||[]).map(stageRow).join('');
    const adds=myDeltas.map(d=>{const txt=(d.phases||{})[ph.phaseNum||('Phase '+ph.order)]||(d.phases||{})[ph.name];
      return txt?`<div class="forcenote" style="margin-top:6px">🔶 <b>${esc(d.standard||d.standardId)}</b> adds: ${esc(stripTags(txt))}</div>`:'';}).join('');
    return {rows,adds,ph};};
  const slotBlock=(slot)=>grp(`${slot.slot} — ${slot.what}`)+slot.options.map(o=>altRow(o)).join('');
  const ind=(G.nodes.industryRequirements||[]);
  const rqSel=s.rq;
  const regimeChip=(id)=>{const c=(G.nodes.complianceProfiles||[]).find(x=>x.id===id)||{};
    return `<button class="regchip" onclick="openProfile('${id}')" title="${esc(c.fullName||'')}">${esc(c.name||id)}<span class="regfull">${esc(c.fullName||'')}</span></button>`;};
  const bar_=(label,text,where)=>{text=stripTags(String(text||''));
    return `<details class="rbbar"><summary><span class="kk">${esc(label)}</span><span class="kvv">${esc(firstSentence(text))}</span><span class="caret">▸</span></summary><div class="rbfull">${esc(text)}<div class="rbwhere">${esc(where)}</div></div></details>`;};
  const rulebook=rqSel?`<div class="rulebook"><div class="rbt">THE RULEBOOK — born from your choice, enforced in every scene</div>
    <div class="kk" style="margin:2px 0 5px">the ${(rqSel.requiredRegimeIds||[]).length} rule-sets that apply — tap any to read it plainly</div>
    <div class="regwrap">${(rqSel.requiredRegimeIds||[]).map(regimeChip).join('')}</div>
    ${bar_('auth bar',rqSel.requiredAuth,'This bites in Scene 4 — Write the app.')}
    ${bar_('observability bar',rqSel.requiredObservability,'This bites in Scenes 4 and 11.')}
    ${bar_('data & residency',rqSel.requiredDataControls,'This bites in Scenes 6 and 10.')}
    <div class="krow"><span class="kk">image bar</span><span class="kvv">${esc((rqSel.recommendedRuntimeIds||[]).join(' · '))} <i>(Scene 6)</i></span></div>
    <div class="krow"><span class="kk">cluster bar</span><span class="kvv">${esc((rqSel.recommendedClusterIds||[]).map(id=>nameById('clusters',id)).join(' · '))} <i>(Scene 10)</i></span></div>
    </div>
    <div class="decided"><span>✓ Decision made — <b>${esc(rqSel.name)}</b></span>
      <button class="continue" onclick="goCol(1)">Continue to Scene 2 — pick your framework →</button></div>`
  :`<div class="decision-ask"><div class="dnum">DECISION №1</div>
     <div class="dq2">Who are you building for?</div>
     <div class="sub">Nothing is chosen for you. Pick below — your rulebook appears the moment you choose.</div>
     <div class="sub" style="margin-top:6px">Not sure yet? <button class="kmore" onclick="pickAxis('industry','technology')">Technology / SaaS is the safe general start →</button></div>
   </div>`;
  const LANG_HUMAN_L={ts:'TypeScript',js:'JavaScript',py:'Python',go:'Go',rust:'Rust',java:'Java',kotlin:'Kotlin',php:'PHP',ruby:'Ruby',csharp:'.NET',elixir:'Elixir'};
  const langName=(l)=>LANG_HUMAN_L[l]||l;
  const orderOpts=(arr,chosenId,reqS,fitFn)=>[...arr].sort((a,b)=>{const w=(o)=>o.id===chosenId?0:(reqS&&reqS.has(o.id)?1:(fitFn&&fitFn(o)?2:3));return w(a)-w(b);});
  const authReqS=new Set(s.rq?.requiredAuthIds||[]), obsReqS=new Set(s.rq?.requiredObservabilityIds||[]);
  const mw=(s.fw.shipped&&s.fw.shipped.middleware)||{};
  const needAudit_=myStds.some(x=>['hipaa','pci'].includes(x));
  const mwCell=(label,on,gap)=>`<span class="mw ${on?'on':(gap?'gapped':'')}">${on?'✓':(gap?'✗':'—')} ${label}${gap?' · gap':''}</span>`;
  const sib=(G.nodes.frameworks||[]).filter(f=>f.categoryId===s.fw.categoryId);
  const fitOrm=(o)=>(o.language||o.languages||[]).some(L=>{const h=(LANG_HUMAN_L[s.lang]||s.lang||'').toLowerCase();const sv=String(L||'').toLowerCase();if(s.lang==='ts'||s.lang==='js')return sv.includes('javascript')||sv.includes('typescript');return sv.includes(h);})||o.id==='orm-none';

  // SCENE 1
  P.push(rpanel(K,0,'#19C8A8','SCENE 1','Who it\'s for',rqSel?rtag('you','your decision'):rtag('def','undecided'),
    rqSel?esc(rqSel.name):'Decide: who is this for?',
    rqSel?'Your choice wrote the rulebook below. Every scene now reads it.':'Before any code exists, the customer decides the rules. This is the first decision — yours.',
    rulebook+grp('pick your industry (16)')+ind.map(r=>{const sel=r.id===RS.industry;
      return `<div class="irow ${sel?'sel':''}" tabindex="0" role="button" onclick="pickAxis('industry','${r.id}')" onkeydown="if(event.key==='Enter'){pickAxis('industry','${r.id}')}"><b>${esc(r.name)}</b><span class="am">${(r.requiredRegimeIds||[]).length} regimes · ${esc(firstSentence((r.keyRisks||[])[0]||''))}</span>${sel?'<span class="kchk">✓ selected</span>':''}</div>`;}).join('')+
    grp('the full picture — every industry, its regimes')+industryMatrix(G,K,RS,'regimes'),ch('who')));

  // SCENE 2
  P.push(rpanel(K,1,'#23CB9F','SCENE 2','Pick the framework',rtag('you','your choice'),
    esc(s.fw.name),`${esc(langName(s.lang))} · ${esc(s.fw.maturity||'')} · ${esc(s.fw.license||'')}`,
    grp('about this framework')+kcardRO('frameworks',s.fw,langName(s.lang),`openFw('${s.fw.id}')`)+
    libBlock(s)+grp(`alternatives in ${esc(nameById('categories',s.fw.categoryId))} (${sib.length-1}) — all ${(G.nodes.frameworks||[]).length} in the top picker`)+
    sib.filter(f=>f.id!==s.fw.id).map(f=>opt('fw',f.id,f.name,(f.languages||[]).join('/'),ostate(f.id,s.fw.id),`openFw('${f.id}')`)).join(''),ch('fw')));

  // SCENE 3
  const p0=phaseScene('phase-0');
  P.push(rpanel(K,2,'#2FCD9D','SCENE 3','Scaffold the repo',rtag(s.pkgUser?'you':'rec',s.pkgUser?'your choice':'recommended'),
    esc(nameById('pkgBuildDeep',s.pkg)),'The repo is born: scaffold, lockfile, branch protection, CODEOWNERS.',
    cmdScaffold+cmdDeps+
    grp(`package managers for ${langName(s.lang)} — the lockfile is born here`)+
    (()=>{const all=(G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='pkg-mgr');
      const fits=all.filter(p=>{const h=(LANG_HUMAN_L[s.lang]||s.lang||'').toLowerCase();const sv=String(p.language||'').toLowerCase();if(s.lang==='ts'||s.lang==='js')return sv.includes('javascript')||sv.includes('typescript');return sv.includes(h);});
      const others=all.filter(p=>!fits.includes(p));
      return fits.map(p=>accRow('pkgBuildDeep','pkg',p,p.id===s.pkg?'chosen':'fit',p.id===s.pkg?'selected':'applies',p.id===s.pkg)).join('')+
        grp(`other languages (${others.length})`)+others.map(p=>accRow('pkgBuildDeep','pkg',p,'dim','not here',false)).join('');})()+
    grp(`repo rules — ${esc(p0.ph?p0.ph.trigger:'once, at setup')}`)+p0.rows+p0.adds+sceneNote(K,'3'),ch('scaffold')));

  // SCENE 4
  P.push(rpanel(K,3,'#3BD096','SCENE 4','Write the app',rqSel?rtag('req','rulebook bites here'):rtag('def','app code'),
    esc(nameById('authDeep',s.auth).split(' (')[0]),
    'Auth, data layer and observability are CODE, written into the app now — not deployment config.',
    grp('shipped middleware — this service today')+`<div class="mwstrip">`+
      mwCell('auth',mw.auth,!mw.auth&&authReqS.size>0)+mwCell('audit log',mw.audit,!mw.audit&&needAudit_)+
      mwCell('RBAC',mw.rbac,false)+mwCell('circuit breaker',mw.circuitBreaker,false)+
      `<span class="mw ${s.fw.shipped&&s.fw.shipped.observabilityDetected?'on':''}">${s.fw.shipped&&s.fw.shipped.observabilityDetected?'✓':'—'} observability</span></div>`+
    grp(`auth (${(G.nodes.authDeep||[]).length})`)+
    orderOpts(G.nodes.authDeep||[],s.auth,authReqS).map(a=>{const req=authReqS.has(a.id);return accRow('authDeep','auth',a,a.id===s.auth?'chosen':(req?'req':'avail'),a.id===s.auth?'selected':(req?'rulebook requires':'available'),a.id===s.auth);}).join('')+
    grp('what each industry requires — auth')+industryMatrix(G,K,RS,'auth')+
    grp(`ORM / data layer (${(G.nodes.ormDeep||[]).length})`)+
    orderOpts(G.nodes.ormDeep||[],s.orm,null,fitOrm).map(o=>{const fit=fitOrm(o);return accRow('ormDeep','orm',o,o.id===s.orm?'chosen':(fit?'fit':'dim'),o.id===s.orm?'selected':(fit?'fits '+langName(s.lang):'other language'),o.id===s.orm);}).join('')+
    grp(`backend observability wiring (${(G.nodes.observabilityDeep||[]).length})`)+
    orderOpts(G.nodes.observabilityDeep||[],s.obs,obsReqS).map(o=>{const req=obsReqS.has(o.id);return accRow('observabilityDeep','obs',o,o.id===s.obs?'chosen':(req?'req':'avail'),o.id===s.obs?'selected':(req?'rulebook requires':'available'),o.id===s.obs);}).join('')+
    grp(`frontend observability (${(K.frontendObservability||[]).length})`)+
    (K.frontendObservability||[]).map(o=>altRow(o)).join('')+
    (()=>{const LANG_GROUP_={ts:'nodejs',js:'nodejs',py:'python',go:'go',rust:'rust',java:'java',kotlin:'kotlin',php:'php',ruby:'ruby',elixir:'elixir',swift:'swift',csharp:'dotnet'};
      const g=LANG_GROUP_[s.lang]||'nodejs';const snips=(K.appImpl||{})[g]||(K.appImpl||{}).nodejs||[];
      return snips.length?grp(`write this code — starters for ${langName(s.lang)} (${snips.length})`)+
        snips.map(sn=>`<div class="sub" style="margin:2px 0 4px">${esc(sn.what)}</div>`+fileAcc(sn.file,sn.code)).join(''):'';})(),ch('app')));

  // SCENE 5
  const p1=phaseScene('phase-1');
  const devCmds=cmdBlock('commands — the loop',[
    {label:'Run the dev server',cmd:(s.lang==='py'?'uvicorn app:app --reload':s.lang==='go'?'go run ./...':s.lang==='rust'?'cargo run':'npm run dev')},
    {label:'Production build',cmd:(s.lang==='py'?'# no build step — Python ships source':s.lang==='go'?'go build ./...':s.lang==='rust'?'cargo build --release':'npm run build')},
    {label:'Install the git hooks',cmd:'pre-commit install'}]);
  P.push(rpanel(K,4,'#44D292','SCENE 5','Local dev loop',rtag('same','same for every industry'),
    s.buildtool?esc(nameById('pkgBuildDeep',s.buildtool)):'build + hooks',
    'The inner loop: build tool runs dev/build; hooks catch problems before they reach a PR.',
    devCmds+grp(`build tools for ${langName(s.lang)} (${s.btList.length}) — invoked via your package scripts`)+
    s.btList.map(p=>accRow('pkgBuildDeep','buildtool',p,p.id===s.buildtool?'chosen':'fit',p.id===s.buildtool?'selected':'applies',p.id===s.buildtool)).join('')+
    grp(`hooks on every commit — ${esc(p1.ph?p1.ph.trigger:'on git commit')}`)+p1.rows+p1.adds+
    grp('files (1)')+fileAcc('.pre-commit-config.yaml',GF.precommit,true)+sceneNote(K,'5'),ch('local')));

  // SCENE 6
  const runAll=(G.nodes.runtimeDeep||[]);
  P.push(rpanel(K,5,'#52D58C','SCENE 6','Containerize',rtag(s.baseTag,s.baseTag==='req'?'rulebook forces this':s.baseTag==='you'?'your choice':'framework default'),
    esc(baseName),esc(s.baseWhy)+' The compliance thread bites again here.',
    forcedNote+cmdDocker+
    grp(`base image — every option (${runAll.length})`)+
    runAll.map(r=>{const req=reqRun.has(r.id);return accRow('runtimeDeep','runtime',r,r.id===s.base?'chosen':(req?'req':'avail'),r.id===s.base?'selected':(req?'rulebook recommends':'available'),r.id===s.base);}).join('')+
    grp('what each industry gets — base image')+industryMatrix(G,K,RS,'runtime')+
    grp('files (2)')+fileAcc('Dockerfile',GF.dockerfile,true)+fileAcc('.dockerignore',GF.dockerignore),ch('img')));

  // SCENE 7
  const p2=phaseScene('phase-2');
  P.push(rpanel(K,6,'#5AD886','SCENE 7','PR gate',rtag('same','every PR, every framework'),
    `${(stByPhase['phase-2']||[]).length} gates`,
    'Nothing unreviewed or unscanned reaches main. Every gate, every tool — and its alternatives.',
    grp(`the gates — ${esc(p2.ph?p2.ph.trigger:'on every PR push')}`)+p2.rows+p2.adds+
    grp('files (1)')+fileAcc('.github/workflows/pr.yml',GF.prwf)+
    grp('the market — alternatives for every slot')+
    (K.ciAlternatives||[]).map(slotBlock).join(''),ch('pr')));

  // SCENE 8
  const p3=phaseScene('phase-3'); const pReg=phaseScene('registry');
  const ciCmds=cmdBlock('commands — what the pipeline runs',[...CMD.deps,CMD.docker[0],...CMD.registry]);
  P.push(rpanel(K,7,'#6ADA80','SCENE 8','Main build → registry',rtag('same','on merge to main'),
    'sign · SBOM · push','The merge builds the image, signs it, attaches the SBOM, and pushes it.',
    grp(`main build — ${esc(p3.ph?p3.ph.trigger:'on merge')}`)+p3.rows+p3.adds+
    (pReg.rows?grp('registry stage')+pReg.rows+pReg.adds:'')+
    grp(`signers (${(K.signers||[]).length}) — your choice flows into main.yml`)+(K.signers||[]).map(o=>altRow(o,'','signer',RS.signer)).join('')+
    grp(`SBOM tools (${(K.sbomTools||[]).length}) — your choice flows into main.yml`)+(K.sbomTools||[]).map(o=>altRow(o,'','sbom',RS.sbom)).join('')+
    grp(`registries — all ${(K.registries||[]).length}; your choice rewrites the workflow + commands`)+(K.registries||[]).map(o=>altRow(o,o.oidc?'<span class="ktag fit">OIDC — no stored secrets</span>':'','registry',RS.registry)).join('')+
    grp('files (1)')+fileAcc('.github/workflows/main.yml',GF.mainwf)+ciCmds,ch('main')));

  // SCENE 9
  const gtools=(G.nodes.gitopsTools||[]);
  const helmKust=gtools.filter(t=>/helm|kustomize/i.test(t.name));
  P.push(rpanel(K,8,'#7CDF78','SCENE 9','Declare the deployment',rtag('same','Git is the truth'),
    'Helm + Kustomize','What runs is what Git says. Values per environment; overlays patch per env.',
    grp('the mechanisms')+helmKust.map(t=>`<details class="acc fit"><summary><span class="caret">▸</span><span class="an">${esc(t.name)}</span><span class="am">${esc(t.role||'')}</span></summary><div class="accbody">${t.what?`<div class="krow"><span class="kk">what</span><span class="kvv">${esc(stripTags(t.what))}</span></div>`:''}${t.decisionChosen?`<div class="krow"><span class="kk">decision</span><span class="kvv">${esc(t.decisionChosen)}</span></div>`:''}</div></details>`).join('')+
    `<div class="sub" style="margin:8px 0">This service ships ${((s.fw.shipped&&s.fw.shipped.helmValuesFiles)||[]).length} Helm values files and overlays for ${esc(((s.fw.shipped&&s.fw.shipped.kustomizeOverlays)||[]).join(' / '))}.</div>`+
    grp('files (3)')+fileAcc('helm/values-prod.yaml',GF.helm,true)+fileAcc('kustomize/base/kustomization.yaml',GF.kbase)+fileAcc('kustomize/base/deployment.yaml',GF.kdeploy)+sceneNote(K,'9'),ch('declare')));

  // SCENE 10
  const clReq=new Set(s.rq?.recommendedClusterIds||[]);
  const comps_=[...(G.nodes.clusterComponents||[])].sort((a,b)=>(a.num||'').localeCompare(b.num||''));
  const layers2=by(comps_,'layer');
  const argo=gtools.find(t=>/argo ?cd/i.test(t.name))||gtools[0];
  const layerOrder=['Foundation','Networking','Security','Storage','Observability','Delivery','Scaling','Platform'];
  const layerKeys=Object.keys(layers2).sort((a,b)=>{const ia=layerOrder.indexOf(a),ib=layerOrder.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib);});
  const compBlocks=layerKeys.map(L=>`<details class="acc"><summary><span class="caret">▸</span><span class="an">Layer — ${esc(L)}</span><span class="am">${layers2[L].length} components</span></summary><div class="accbody">`+
    layers2[L].map(c=>`<div class="compline"><b>${esc(c.num)}. ${esc(c.name)}</b><div class="sub">${esc(firstSentence(c.what||''))}</div>${c.installCommand?`<pre class="cmdcode" style="margin-top:4px">${esc(c.installCommand)}</pre>`:''}${c.verifyCommand?`<div class="krow"><span class="kk">verify</span><span class="kvv">${esc(c.verifyCommand)}</span></div>`:''}</div>`).join('<div style="height:10px"></div>')+`</div></details>`).join('');
  P.push(rpanel(K,9,'#8FE46E','SCENE 10','GitOps sync → cluster',rqSel?rtag('req','rulebook shapes the cluster'):rtag('def','pick a cluster'),
    esc(nameById('clusters',s.cluster)),
    (argo?esc(argo.name):'Argo CD')+' watches Git and syncs every cluster — hub-and-spoke, one controller.',
    (argo?grp('the controller')+`<details class="acc fit" open><summary><span class="caret">▸</span><span class="an">${esc(argo.name)}</span><span class="am">${esc(argo.role||'')} · v${esc(argo.version||'')}</span></summary><div class="accbody">${argo.what?`<div class="krow"><span class="kk">what</span><span class="kvv">${esc(stripTags(argo.what))}</span></div>`:''}${argo.syncInterval?`<div class="krow"><span class="kk">sync interval</span><span class="kvv">${esc(argo.syncInterval)}</span></div>`:''}${argo.decisionChosen?`<div class="krow"><span class="kk">decision</span><span class="kvv">${esc(argo.decisionChosen)} — ${esc(firstSentence(argo.decisionRejected||''))}</span></div>`:''}</div></details>`:'')+
    grp(`clusters (${(G.nodes.clusters||[]).length})`)+
    (G.nodes.clusters||[]).map(c=>{const req=clReq.has(c.id);return accRow('clusters','cluster',c,c.id===s.cluster?'chosen':(req?'req':'avail'),c.id===s.cluster?'selected':(req?'rulebook recommends':'available'),c.id===s.cluster);}).join('')+
    grp('what each industry gets — cluster')+industryMatrix(G,K,RS,'clusters')+
    grp(`create the cluster — ${esc(nameById('clusters',s.cluster))} (${((K.clusterProvision||{})[s.cluster]||{}).tool||''})`)+
    cmdBlock('commands — provision',(((K.clusterProvision||{})[s.cluster]||{}).commands)||[])+
    `<details class="acc"><summary><span class="caret">▸</span><span class="an">How the other clusters are created</span><span class="am">eksctl · gcloud · az · openshift-install</span></summary><div class="accbody">${Object.entries(K.clusterProvision||{}).filter(([id])=>id!==s.cluster).map(([id,v])=>`<div class="krow"><span class="kk">${esc(nameById('clusters',id))}</span><span class="kvv">${esc((v.commands[0]||{}).cmd||'')}</span></div>`).join('')}</div></details>`+
    grp(`inside the cluster — ${comps_.length} components, stacked`)+compBlocks+
    grp(`manifests (${Object.keys(GF.deploy||{}).length})`)+Object.entries(GF.deploy||{}).map(([n,c])=>fileAcc(n,c)).join('')+
    cmdGitops+cmdCluster,ch('cluster')));

  // SCENE 11
  const sre=K.sre||{};
  const gs=(sre.goldenSignals||[]).map(g=>`<tr><td><b>${esc(g.signal)}</b></td><td>${esc(g.measure)}</td><td>${esc(g.alertWhen)}</td></tr>`).join('');
  P.push(rpanel(K,10,'#A3E863','SCENE 11','Run + observe',rqSel?rtag('req','retention is regime-driven'):rtag('def','SRE'),
    esc(nameById('observabilityDeep',s.obs).split(' —')[0]),
    'The service is live. Watch the four golden signals; alert on the budget, not the noise.',
    grp('the four golden signals')+`<table class="mx"><thead><tr><th>signal</th><th>measure</th><th>alert when</th></tr></thead><tbody>${gs}</tbody></table>`+
    grp('SLO starter')+`<div class="scenenote">${esc(sre.sloStarter||'')}</div>`+
    grp('alert starter pack')+`<div class="accbody" style="border:0;padding:0">${(sre.alertPack||[]).map(a=>`<div class="krow"><span class="kk">alert</span><span class="kvv">${esc(a)}</span></div>`).join('')}</div>`+
    grp(`backend stacks (${(G.nodes.observabilityDeep||[]).length}) — full knowledge`)+
    orderOpts(G.nodes.observabilityDeep||[],s.obs,obsReqS).map(o=>{const req=obsReqS.has(o.id);return accRow('observabilityDeep','obs',o,o.id===s.obs?'chosen':(req?'req':'avail'),o.id===s.obs?'selected':(req?'rulebook requires':'available'),false);}).join('')+
    grp('what each industry requires — observability')+industryMatrix(G,K,RS,'obs')+
    `<div class="scenenote">${esc(sre.retentionNote||'')}</div>`+
    grp('files (2) — drop into your repo')+fileAcc('observability/alert-rules.yaml',alertRulesYaml(s))+fileAcc('observability/dashboard.json',dashboardJson(s)),ch('observe')));

  // SCENE 12
  let intBody;
  if(rqSel){const bc=by(s.integ,'category');
    intBody=s.integ.length?Object.entries(bc).map(([c,a])=>grp(c)+a.map(g=>
      `<details class="acc fit"><summary><span class="caret">▸</span><span class="an">${esc(g.externalSystem)}</span><span class="am">auth ${esc(g.authOption||'')} · via ${esc(g.apiGateway||'')}</span></summary><div class="accbody">`+
      (g.dataFlow?`<div class="krow"><span class="kk">data flow</span><span class="kvv">${esc(stripTags(g.dataFlow))}</span></div>`:'')+
      (g.tools?`<div class="krow"><span class="kk">tools</span><span class="kvv">${esc(Array.isArray(g.tools)?g.tools.join(', '):stripTags(g.tools))}</span></div>`:'')+
      `<div class="krow"><span class="kk">gateway</span><span class="kvv">${esc(g.apiGateway||'')} — the guarded front door this call goes through</span></div>`+
      `<div style="margin-top:6px"><button class="kmore" onclick="openIntegration('${g.id}')">full record →</button></div></div></details>`).join('')).join(''):'<div class="sub">No catalogued integrations for this industry yet.</div>';
  } else intBody='<div class="sub">Pick an industry in Scene 1 to see its integrations.</div>';
  P.push(rpanel(K,11,'#B4EE58','SCENE 12','Connect',rqSel?rtag('req',`${s.integ.length} systems`):rtag('def','no industry'),
    rqSel?`${s.integ.length} integrations`:'Pick an industry',
    'The external systems this industry actually talks to — each through a gateway, with auth.',
    intBody+grp(`gateways (${(G.nodes.apiGateways||[]).length})`)+(G.nodes.apiGateways||[]).map(a=>`<span class="chip">${esc(a.name||a.id)}</span>`).join(''),ch('connect')));

  // SCENE 13
  P.push(rpanel(K,12,'#C6F24E','SCENE 13','Sign-off',rqSel?rtag('req','release gate'):rtag('def','no industry'),
    'the audit','Every rule from Scene 1 — met, forced, or gap. Release when the gaps are closed.',
    (rqSel?rulebook:'')+`<button class="gencopy" style="margin-bottom:10px" onclick="copyAudit(this)">copy the audit</button>`+
    grp('the audit — every decision, traced to its scene')+checklistBlock(G,K,s,DEC),ch('signoff')));

  // ACT III
  const A3=K.act3||{};
  const avu=(rows)=>rows&&rows.length?grp('the platform does · you do')+`<table class="mx"><thead><tr><th>the platform does</th><th>you do</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table>`:'';
  const a3cmds=(n,title)=>cmdBlock(title||'commands',((A3[n]||{}).commands)||[]);

  P.push(rpanel(K,13,'#98E64E','SCENE 14','Update loop',rtag('same','weekly, forever'),
    'small, safe, weekly','A robot opens the update PRs; you merge while they are small.',
    avu((A3['14']||{}).auto)+a3cmds('14','commands — the weekly pass')+
    grp('files (1)')+fileAcc('renovate.json',JSON.stringify({"$schema":"https://docs.renovatebot.com/renovate-schema.json","extends":["config:recommended",":semanticCommitsDisabled"],"schedule":["before 9am on monday"],"packageRules":[{"matchUpdateTypes":["minor","patch"],"groupName":"weekly minors"},{"matchUpdateTypes":["major"],"dependencyDashboardApproval":true}],"vulnerabilityAlerts":{"labels":["security"],"schedule":["at any time"]}},null,2)),ch('update')));
  P.push(rpanel(K,14,'#A3E847','SCENE 15','Upgrade the platform',rqSel?rtag('req','on YOUR calendar'):rtag('same','quarterly'),
    esc(nameById('clusters',s.cluster))+' · quarterly','Kubernetes minors retire on the provider\'s schedule. Staging first, soak, then prod.',
    avu((A3['15']||{}).auto)+grp('the order — never improvise it')+`<div class="runbook"><ol><li>Read the release notes for the next minor.</li><li>pluto detect — fix removed APIs in your manifests first.</li><li>Upgrade STAGING control plane → nodes → addons.</li><li>Soak one week — watch Scene 11 signals.</li><li>Prod by the exact same path.</li></ol></div>`+a3cmds('15','commands — upgrade')+
    grp('what else upgrades on this cadence')+`<div class="scenenote">Argo CD + the ${(G.nodes.clusterComponents||[]).length} cluster components (Scene 10) upgrade by Helm, same staging-first path. Framework majors (e.g. Next 15→16) ride Scene 14 as major-update PRs gated by the dashboard.</div>`,ch('upgrade')));
  P.push(rpanel(K,15,'#AEEA41','SCENE 16','Protect',rtag('same','expiry does not negotiate'),
    'rotate · back up · DRILL','Certificates renew themselves; backups happen on schedule; the restore is only real once you have drilled it.',
    avu((A3['16']||{}).auto)+a3cmds('16','commands — protect + the drill')+
    grp('files (1)')+fileAcc('velero-schedule.yaml','apiVersion: velero.io/v1\nkind: Schedule\nmetadata:\n  name: prod-nightly\n  namespace: velero\nspec:\n  schedule: "0 3 * * *"   # 3am nightly\n  template:\n    includedNamespaces: [prod]\n    ttl: 720h   # keep 30 days\n'),ch('protect')));
  const sev=((A3['17']||{}).sev)||[];
  P.push(rpanel(K,16,'#B9EC3B','SCENE 17','Respond',rqSel?rtag('req','the regulator clock is real'):rtag('same','when, not if'),
    'page → mitigate → learn','Calm beats clever at 2am. The path is written before the pager fires.',
    grp('severity — agree on it BEFORE the incident')+`<table class="mx"><thead><tr><th>level</th><th>meaning</th><th>response</th></tr></thead><tbody>${sev.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table>`+
    grp('the 2am runbook')+`<div class="runbook"><ol>${(((A3['17']||{}).runbook)||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`+
    a3cmds('17','commands — roll back fast')+
    grp('files (1)')+fileAcc('postmortem-template.md','# Postmortem — <incident title>\n\nBlameless. We fix systems, not people.\n\n## Impact\nWho/what was affected, for how long.\n\n## Timeline (UTC)\n- 02:13 page fired (alert: ...)\n- 02:15 acknowledged\n- 02:31 mitigated by ...\n- 03:02 resolved\n\n## Causes\nWhat allowed this (not "who").\n\n## What went well / what hurt\n\n## Action items\n- [ ] item — owner — due date\n')+
    (rqSel&&myStds.length?`<div class="forcenote">🔶 Your rulebook: ${esc(s.rq.name)} — check incident-reporting duties (e.g. OSFI B-13: report material incidents within 24h).</div>`:''),ch('respond')));
  P.push(rpanel(K,17,'#C6F24E','SCENE 18','Evolve & retire',rtag('same','quarterly, half a day'),
    'EOL · cost · sunset','Look up every quarter: what dies soon, what bleeds money, what should retire with dignity.',
    avu((A3['18']||{}).auto)+a3cmds('18','commands — the quarterly look')+
    grp('the maintenance calendar — the whole of Act III on one card')+
    `<table class="mx"><thead><tr><th>cadence</th><th>what happens</th></tr></thead><tbody>${(K.maintCalendar||[]).map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table>`+
    `<div class="scenenote">Retiring a service: freeze writes → archive data per your retention rules (the rulebook) → keep the audit evidence (Scene 13 export) → tear down compute → keep the DNS tombstone 90 days.</div>`,ch('evolve')));

  return {html:P.join(''), stackBarHtml};
}

// ── Guided interview HTML ──────────────────────────────────────────────────────
// linkify: wrap EVERY glossary term (longest first) on its first occurrence so hard
// terms are tappable wherever they appear. Skips text already inside a term span.
let _glossSorted=null;
function glossSorted(){
  if(_glossSorted)return _glossSorted;
  _glossSorted=[...(getK()?.glossary||[])].filter(t=>t.term&&t.term.length>=2)
    .sort((a,b)=>b.term.length-a.term.length);
  return _glossSorted;
}
// Match every glossary term ONCE against the ORIGINAL text (longest first, non-overlapping),
// then build the output in a single pass. Inserted spans are never re-scanned — so a term
// inside another term's definition can't corrupt the markup.
function linkify(text){
  const raw=String(text==null?'':text);
  const taken=new Array(raw.length).fill(false);
  const slots=[];
  for(const t of glossSorted()){
    const re=new RegExp('(?<![\\w])('+t.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?![\\w])','i');
    const m=re.exec(raw);
    if(!m)continue;
    const start=m.index, end=start+m[0].length;
    let clash=false; for(let i=start;i<end;i++){ if(taken[i]){clash=true;break;} }
    if(clash)continue;
    for(let i=start;i<end;i++) taken[i]=true;
    slots.push({start,end,text:m[0],def:t.def,term:t.term});
  }
  slots.sort((a,b)=>a.start-b.start);
  let out='', pos=0;
  for(const s of slots){
    out+=esc(raw.slice(pos,s.start));
    out+=`<span class="term" onclick="event.stopPropagation();showPop(this)" data-def="${esc(s.def)}" data-t="${esc(s.term)}">${esc(s.text)}</span>`;
    pos=s.end;
  }
  out+=esc(raw.slice(pos));
  return out;
}
export function resetGloss(){_glossSorted=null;}
function juriLine(rq){
  const K=getK();
  const J=K.jurisdictions||{};
  const groups={'Canada — federal':[], 'Provincial':[], 'If you serve the US':[], 'If you serve the EU':[], 'Global / contractual':[]};
  for(const id of (rq.requiredRegimeIds||[])){
    const j=J[id]||''; const name=nameById('complianceProfiles',id);
    if(/^Federal Canada/.test(j))groups['Canada — federal'].push(name);
    else if(/only —|only$|Québec only|Ontario only|Alberta only|British Columbia only/.test(j))groups['Provincial'].push(name.replace('-Quebec',''));
    else if(/^United States|^California/.test(j))groups['If you serve the US'].push(name);
    else if(/^European Union/.test(j))groups['If you serve the EU'].push(name);
    else groups['Global / contractual'].push(name);
  }
  return Object.entries(groups).filter(([,v])=>v.length).map(([k,v])=>`<b>${k}:</b> ${v.join(', ')}`).join(' · ');
}
// delegate to logic.js — uses module-level RS so callers need no params
export function gOptions(axis){ return logicGOptions(axis, RS); }
function gCard(axis,o){
  // Industry keeps its jurisdiction-rich card (industry is not in the option model).
  if(axis==='industry'){
    const picked=RS.industry===o.id;
    const open=(LEVEL==='expert')||picked;
    return `<div class="oc${picked?' picked':''}">
      <div class="oc-head"><div class="oc-name"><b>${esc(o.name)}</b></div>
        <button class="oc-pick${picked?' on':''}" onclick="event.preventDefault();event.stopPropagation();gPick('industry','${o.id}')">${picked?'✓ chosen':'choose'}</button></div>
      <div class="oc-plain">${linkify(o.plain||'')}</div>
      ${o.juri?`<details class="oc-exp"${open?' open':''}><summary>Which laws apply to you</summary><div class="oc-l2 oc-juri">${o.juri}</div></details>`:''}
    </div>`;
  }
  // Everything else → the unified three-layer card, with the guided pick handler.
  return optionCard(axis, o.id, {selectFn:`gPick('${axis}','${o.id}')`});
}
function gChosenName(st){const o=gOptions(st.axis).find(x=>x.id===RS[st.axis]);return o?o.name:'';}
function gHasRec(st){const o=gOptions(st.axis);return o.some(x=>x.req||x.rec);}

export function renderGuidedHtml(){
  const G=getG(), K=getK();
  const steps=(K.guided&&K.guided.steps)||[];
  const total=steps.length+1;
  if(GSTEP>=steps.length) return gReview(G,K,total,steps);
  const st=steps[GSTEP];
  const opts=gOptions(st.axis);
  const picked=!!RS[st.axis];
  const pairHtml=st.pair?`<div class="gq" style="font-size:20px;margin-top:26px">…and the ingredient list (SBOM)</div>`+gOptions(st.pair).map(o=>gCard(st.pair,o)).join(''):'';
  const LANG_HUMAN_G2={ts:'TypeScript',js:'JavaScript',py:'Python',go:'Go',rust:'Rust',java:'Java',kotlin:'Kotlin',php:'PHP',ruby:'Ruby',csharp:'.NET',elixir:'Elixir'};
  let cascade='', filter='';
  if(st.axis==='fw'&&!GNAV.all){
    const fws=G.nodes.frameworks||[];
    const cats=[...(G.nodes.categories||[])].sort((a,b)=>(parseInt(a.id.slice(1))||0)-(parseInt(b.id.slice(1))||0));
    const devOf=(f)=>{try{const d=f.device;return Array.isArray(d)?d[0]:String(d).replace(/[\[\]']/g,'');}catch(e){return ''}};
    const catsOf=(plat)=>cats.filter(c=>fws.some(f=>f.categoryId===c.id&&devOf(f)===plat));
    const fwsOf=(cid)=>fws.filter(f=>f.categoryId===cid);
    const dots=(n)=>`<span class="subdots">${[0,1,2].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
    const crumb=()=>{const parts=[];
      if(GNAV.platform)parts.push(`<button class="crumb" onclick="gNav('platform',null)">${esc((K.platformPlain[GNAV.platform]||{}).name||GNAV.platform)}</button>`);
      if(GNAV.category)parts.push(`<button class="crumb" onclick="gNav('category',null)">${esc(nameById('categories',GNAV.category).replace(/^[^—]+— /,''))}</button>`);
      return parts.length?`<div class="crumbs">${parts.join('<span class="sbsep">›</span>')}</div>`:''};
    if(!GNAV.platform){
      cascade=dots(1)+crumb()+
        `<h3 class="gsub">First — what are you building?</h3>`+
        Object.entries(K.platformPlain||{}).map(([id,pp])=>{
          const pc=catsOf(id), n=fws.filter(f=>devOf(f)===id).length;
          return `<details class="gcard"><summary><span class="gname">${esc(pp.name)}</span><span class="gplain">${esc(pp.plain)} <b>${n} frameworks · ${pc.length} kinds.</b></span><button class="gpick" onclick="event.preventDefault();event.stopPropagation();gNav('platform','${id}')">Explore ${esc(pp.name)} →</button></summary><div class="gbody"><div class="gjuri">${pc.map(c=>esc(c.name.replace(/^[^—]+— /,''))).join(' · ')}</div></div></details>`;}).join('')+
        `<div class="scenenote">Not covered yet (honestly): ${(K.platformsMissing||[]).map(esc).join(' · ')}. These platforms arrive after this walk is perfect.</div>`+
        `<div class="sub" style="margin-top:10px">Already know your framework? <button class="kmore" onclick="gNavAll()">see all ${fws.length} →</button></div>`;
    } else if(!GNAV.category){
      cascade=dots(2)+crumb()+
        `<h3 class="gsub">Which kind of ${esc((K.platformPlain[GNAV.platform]||{}).name||'').toLowerCase()}?</h3>`+
        catsOf(GNAV.platform).map(c=>{const list=fwsOf(c.id);
          return `<details class="gcard"><summary><span class="gname">${esc(c.name.replace(/^[^—]+— /,''))}</span><span class="gplain">${esc((K.catPlain||{})[c.id]||'')} <b>${list.length} framework${list.length===1?'':'s'}.</b></span><button class="gpick" onclick="event.preventDefault();event.stopPropagation();gNav('category','${c.id}')">Compare these ${list.length} →</button></summary><div class="gbody"><div class="gjuri"><b>${list.length} frameworks:</b> ${list.map(f=>esc(f.name)).join(' · ')}</div></div></details>`;}).join('');
    } else {
      const list=fwsOf(GNAV.category);
      cascade=dots(3)+crumb()+
        `<h3 class="gsub">Now compare — the ${list.length} that actually compete</h3>`+
        list.map(f=>gCard('fw',{id:f.id,name:f.name,plain:`${LANG_HUMAN_G2[f.languageId]||f.languageId} · ${firstSentence(f.whenToUse||'')}`,node:'frameworks'})).join('');
    }
  }
  if(st.axis==='fw'&&GNAV.all) filter=`<input class="gfilter" placeholder="Type to filter the ${opts.length} frameworks… (e.g. next, fastapi, go)" oninput="gFilter(this.value)">`;
  const rqSel2=resolveStack(RS).rq;
  const rl=(K.ruleLine||{})[st.axis];
  return `<div class="gwrap">
    <div class="gtop"><button class="gback" onclick="${GSTEP===0?"setMode('catalog');showWelcome()":'gGo(-1)'}">← back</button>
      <span class="gcount">decision ${GSTEP+1} of ${total}</span></div>
    <div class="gprog"><i style="width:${Math.round((GSTEP)/total*100)}%"></i></div>
    ${RS._industryChanged?`<div class="forcenote">🔶 Industry changed to <b>${esc(RS._industryChanged)}</b> — the rulebook re-derived sign-in, observability, base image and cluster. Review them as you continue.</div>`:''}
    <h2 class="gq">${esc(st.title)}</h2>
    <p class="gwhy">${linkify(st.why)}</p>
    ${(rl&&rqSel2)?`<div class="rulehint">📜 ${esc(rl.replace('{IND}',rqSel2.name))}</div>`:''}
    ${filter}
    <div id="gcards">${(st.axis==='fw'&&!GNAV.all)?cascade:opts.map(o=>gCard(st.axis,o)).join('')}</div>
    ${pairHtml}
    <div class="gfoot">
      ${picked?`<div class="gcons">✓ Locked in: <b>${esc(gChosenName(st))}</b>. ${esc(st.consequence)}</div>`:''}
      <button class="gnext" ${picked?'':'disabled'} onclick="gGo(1)">Continue →</button>
      ${gHasRec(st)?`<button class="gskip" onclick="gUseRec()">use the recommended and continue</button>`:''}
    </div>
  </div>`;
}
// ── The real deliverable: a complete pipeline repo as a {path: contents} map ──
const REPO_LANG={ts:'TypeScript',js:'JavaScript',py:'Python',go:'Go',rust:'Rust',java:'Java',kotlin:'Kotlin',php:'PHP',ruby:'Ruby',csharp:'.NET',elixir:'Elixir',swift:'Swift'};
export function getRepoName(){
  const s=resolveStack(RS);
  return (s.fw.serviceSlug||s.fw.id||'my-service').replace(/[^a-z0-9-]/gi,'-').toLowerCase();
}
export function getRepoFiles(){
  const G=getG(), K=getK();
  const s=resolveStack(RS);
  const CFG=buildConfig(s,RS), GF=genFiles(CFG), CMD=commandsFor(s,RS);
  const files={};
  const put=(p,c)=>{ if(c&&typeof c==='string'&&c.trim()) files[p]=c; };
  put('Dockerfile',GF.dockerfile);
  put('.dockerignore',GF.dockerignore);
  put('.github/workflows/pr.yml',GF.prwf);
  put('.github/workflows/main.yml',GF.mainwf);
  put('.pre-commit-config.yaml',GF.precommit);
  put('observability/alert-rules.yaml',alertRulesYaml(s));
  put('observability/dashboard.json',dashboardJson(s));
  // The deploy bundle is the canonical GitOps tree (Argo CD + Helm chart + Kustomize overlays).
  // Its keys already carry their own paths, so write them verbatim.
  if(GF.deploy&&typeof GF.deploy==='object') for(const [n,c] of Object.entries(GF.deploy)) put(n,c);
  // Fallback if the bundle is empty: ship the simple Helm + Kustomize files.
  if(!(GF.deploy&&Object.keys(GF.deploy).length)){
    put('helm/values-prod.yaml',GF.helm);
    put('kustomize/base/kustomization.yaml',GF.kbase);
    put('kustomize/base/deployment.yaml',GF.kdeploy);
  }
  put('renovate.json', JSON.stringify({$schema:'https://docs.renovatebot.com/renovate-schema.json',extends:['config:recommended',':semanticCommitsDisabled'],schedule:['before 9am on monday'],packageRules:[{matchUpdateTypes:['minor','patch'],groupName:'weekly minors'},{matchUpdateTypes:['major'],dependencyDashboardApproval:true}],vulnerabilityAlerts:{labels:['security'],schedule:['at any time']}},null,2));
  files['README.md']=repoReadme(s,K,CMD);
  return files;
}
function repoReadme(s,K,CMD){
  const app=s.fw.serviceSlug||s.fw.id||'my-service';
  const lang=REPO_LANG[s.lang]||s.lang||'';
  const ind=s.rq?.name, regimes=(s.regimes||[]).map(id=>nameById('complianceProfiles',id));
  const cmd=(arr)=>(arr||[]).map(c=>`  ${c.cmd}`).join('\n');
  const baseName=(getG().nodes.runtimeDeep||[]).find(r=>r.id===s.base)?.name||s.base;
  return `# ${app} — your delivery pipeline

Generated by Yarova Pipeline Studio.

**Stack:** ${s.fw.name}${lang?` (${lang})`:''}${ind?` · for ${ind}`:''}
**Auth:** ${nameById('authDeep',s.auth)} · **Runs on:** ${nameById('clusters',s.cluster)} · **Base image:** ${baseName}
${regimes.length?`**Compliance built in:** ${regimes.join(', ')}\n`:''}
## What's in here
- \`Dockerfile\` — multi-stage build on a ${baseName} base.
- \`.github/workflows/pr.yml\` — tests + security scans on every pull request.
- \`.github/workflows/main.yml\` — build, sign, SBOM, and push on merge.
- \`deploy/\` — GitOps deploy tree: Argo CD app, Helm chart, Kustomize overlays (dev / staging / prod).
- \`.pre-commit-config.yaml\` — local checks before each commit.
- \`observability/\` — starter alert rules + dashboard.
- \`renovate.json\` — automatic dependency updates.

## Run it

1. Create the app
\`\`\`
${cmd(CMD.scaffold)}
\`\`\`
2. Install dependencies
\`\`\`
${cmd(CMD.deps)}
\`\`\`
3. Build and run the container locally
\`\`\`
${cmd(CMD.docker)}
\`\`\`
4. Deploy
\`\`\`
${cmd(CMD.gitops)}
\`\`\`

Then: create a repo on GitHub, commit these files, and push. The workflows run on your first push.
`;
}

function gReview(G,K,total,steps){
  const s=resolveStack(RS);
  resetCFID();
  const PLAIN_ECHO={'GHCR':'GitHub\'s image warehouse','Amazon ECR':'AWS\'s image warehouse','Google Artifact Registry':'Google Cloud\'s image warehouse','Azure ACR':'Azure\'s image warehouse','Harbor':'your own self-hosted warehouse','EKS':'Kubernetes on AWS','GKE':'Kubernetes on Google Cloud','AKS':'Kubernetes on Azure','OpenShift':'Red Hat\'s hardened Kubernetes','pnpm':'fast installs, strict dependencies','npm':'Node\'s built-in installer','cosign (Sigstore)':'keyless tamper-proof seal','syft':'the standard ingredient-list tool'};
  const row=(label,axis,val)=>{const echo=PLAIN_ECHO[String(val).split(' + ')[0]]||'';
    return `<div class="grev"><span class="k2">${esc(label)}</span><div><b>${esc(val)}</b>${echo?`<div class="sub">${esc(echo)}</div>`:''}</div>
    <button onclick="gJump(${steps.findIndex(x=>x.axis===axis)})">change</button></div>`;};
  const CFG=buildConfig(s,RS), GF=genFiles(CFG), CMD=commandsFor(s,RS);
  const repo=getRepoFiles();
  const fileList=Object.entries(repo);
  const app=getRepoName();
  const regimes=(s.regimes||[]).map(id=>nameById('complianceProfiles',id));
  const runCmds=[...(CMD.scaffold||[]),...(CMD.deps||[]),...(CMD.docker||[]).slice(0,1),...(CMD.gitops||[]).slice(0,1)];
  return `<div class="gwrap">
    <div class="gtop"><button class="gback" onclick="gGo(-1)">← back</button>
      <span class="gcount">your pipeline repo</span></div>
    <div class="gprog"><i style="width:100%"></i></div>

    <div class="repo-hero">
      <div class="repo-badge">✓ Your pipeline repo is ready</div>
      <div class="repo-name">${esc(app)}</div>
      <div class="repo-meta">${fileList.length} files · Dockerfile · CI · deploy · signing · SBOM${regimes.length?` · ${esc(regimes.slice(0,3).join(', '))}${regimes.length>3?'…':''}-ready`:''}</div>
      <div class="repo-actions">
        <button class="repo-dl" onclick="downloadRepo(this)">⬇  Download repo (.zip)</button>
        <button class="repo-copy" onclick="copyAllFiles(this)">copy all files</button>
      </div>
      <div class="repo-stack">${esc(s.fw.name)} · ${esc(nameById('authDeep',s.auth).split(' (')[0])} · ${esc(nameById('clusters',s.cluster))}</div>
    </div>

    ${grp('Run it — 4 commands')}
    ${cmdBlock('',runCmds)}

    <h2 class="gq" style="font-size:20px;margin-top:26px">Your choices — change any</h2>
    ${row('built for','industry',RS.industry?nameById('verticals',RS.industry):'—')}
    ${row('framework','fw',s.fw.name)}
    ${row('packages','pkg',nameById('pkgBuildDeep',s.pkg))}
    ${row('sign-in','auth',nameById('authDeep',s.auth))}
    ${row('database','orm',nameById('ormDeep',s.orm))}
    ${row('health signals','obs',nameById('observabilityDeep',s.obs))}
    ${row('container base','runtime',(G.nodes.runtimeDeep||[]).find(r=>r.id===s.base)?.name||s.base)}
    ${row('image warehouse','registry',(K.registries||[]).find(r=>r.id===RS.registry)?.name||'GHCR')}
    ${row('proof of origin','signer',((K.signers||[]).find(x=>x.id===RS.signer)?.name||'cosign')+' + '+((K.sbomTools||[]).find(x=>x.id===RS.sbom)?.name||'syft'))}
    ${row('runs on','cluster',nameById('clusters',s.cluster))}

    <details class="repo-files"><summary>Every file in the repo (${fileList.length})</summary>
      <textarea id="allfiles" style="position:absolute;left:-9999px" aria-hidden="true">${esc(fileList.map(([n,c])=>`# ===== ${n} =====\n${c}`).join('\n\n'))}</textarea>
      ${fileList.map(([n,c])=>fileAcc(n,c)).join('')}
    </details>

    <div class="gfoot">
      <button class="gskip" onclick="setMode('build');setTimeout(()=>goCol(0),250)">Why each choice? Walk the map →</button>
    </div>
  </div>`;
}
