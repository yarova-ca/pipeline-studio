import * as GEN from "./generators.js";
let G=null, LENS={vertical:""}, REQ=null;
let RA=new Set(),RO=new Set(),RG=new Set(),RC=new Set(),RT=new Set();
const $=(s,r=document)=>r.querySelector(s);
const esc=(s)=>String(s==null?"":s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const stripTags=(s)=>String(s==null?"":s).replace(/<[^>]*>/g,"").trim();
const by=(arr,k)=>{const m={};(arr||[]).forEach(x=>{(m[x[k]]||=[]).push(x)});return m;};
const lensOn=()=>!!LENS.vertical;

// ── lens state ────────────────────────────────────────────────────────────────
function setLens(v){
  LENS.vertical=v;
  REQ=v?(G.nodes.industryRequirements||[]).find(r=>r.id===v):null;
  RA=new Set(REQ?.requiredAuthIds||[]);
  RO=new Set(REQ?.requiredObservabilityIds||[]);
  RG=new Set(REQ?.requiredRegimeIds||[]);
  RC=new Set(REQ?.recommendedClusterIds||[]);
  RT=new Set(REQ?.recommendedRuntimeIds||[]);
}
// state→class. 'req' amber, 'stay' green universal, 'dim' not-required-while-lensed, '' normal
function st(required, universal){
  if(required) return 'req';
  if(lensOn() && universal) return 'stay';
  if(lensOn()) return 'dim';
  return '';
}

// ── building blocks ─────────────────────────────────────────────────────────
const CAT_COLOR=(cid)=>{const n=parseInt((cid||'').replace(/\D/g,''))||0;
  if(n<=8)return'var(--teal)'; if(n<=13)return'var(--violet)'; if(n<=27)return'var(--lime)'; return'var(--cyan)';};

function card(accent,title,meta,onclick,state,chip){
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

// stage names of the journey (drives stepper + columns)
// 9 stages ride the brand teal→lime gradient, left to right (on-brand progression)
const STAGES=[
  ['catalog','Frameworks','#19C8A8'],
  ['build','Pipeline','#2FCD9D'],
  ['governance','Compliance','#44D292'],
  ['artifact','Registry & Build','#5AD886'],
  ['gitops','GitOps','#70DD7B'],
  ['runtime','Clusters','#85E270'],
  ['platform','Platform','#9BE864'],
  ['connect','Integrations','#B0ED59'],
  ['reference','Reference','#C6F24E'],
];

// ── columns ──────────────────────────────────────────────────────────────────
function colFrameworks(){
  const cats=[...(G.nodes.categories||[])].sort((a,b)=>(parseInt(a.id.replace(/\D/g,''))||0)-(parseInt(b.id.replace(/\D/g,''))||0));
  const fwByCat=by(G.nodes.frameworks,'categoryId');
  let h='';
  for(const cat of cats){
    const fws=fwByCat[cat.id]||[]; if(!fws.length)continue;
    h+=`<div class="grp" style="color:${CAT_COLOR(cat.id)}">${esc(cat.name)}</div>`;
    for(const f of fws) h+=card(CAT_COLOR(cat.id),f.name,`${(f.languages||[f.languageId]).filter(Boolean).join('/')} · ${f.maturity||f.tier||''}`,`openFw('${f.id}')`,'',null);
  }
  return col(0,'01 · catalog','Frameworks','var(--teal)',h,
    `${(G.nodes.frameworks||[]).length} frameworks · front-end → back-end. Any one is a valid start — choose by need.`);
}

function colPipeline(){
  const phases=(G.nodes.phases||[]).sort((a,b)=>(+a.order||0)-(+b.order||0));
  const stages=G.nodes.stages||[], invs=G.nodes.invariants||[];
  let h='';
  for(const p of phases){
    const st_=stages.filter(s=>s.phaseId===p.id);
    const iv=invs.filter(x=>x.phaseId===p.id);
    h+=`<div class="grp">${esc(p.label||p.name)} · ${esc(p.trigger||'')}</div>`;
    for(const s of st_){const sec=(s.type||'').toLowerCase().includes('sec');
      h+=card(sec?'var(--blue)':'var(--green)',s.name||s.label,s.type||'',`openStage('${s.id}')`,lensOn()?'stay':'',null);}
    if(iv.length){
      h+=`<div class="sub" style="margin:2px 0 6px">Invariants enforced this phase:</div>`;
      for(const x of iv) h+=card('var(--teal)',`${x.name} — ${stripTags(x.condition)}`,`enforced by ${x.enforcedBy||'CI'}`,`openInvariant('${x.id}')`,'',null);
    }
  }
  // swappable build knobs (buildAxes) reachable here
  h+=`<div class="grp">Swappable build knobs (8 ARGs)</div>`;
  for(const a of (G.nodes.buildAxes||[])) h+=card('var(--lime)',`--${a.arg} (${a.name})`,`default: ${a.default} · ${a.implStatus}`,`openAxis('${a.id}')`,'',null);
  return col(1,'02 · build','CI/CD Pipeline','var(--green)',h,
    `${stages.length} stages over ${phases.length} phases + ${invs.length} invariants. Identical for every industry.`);
}

function colCompliance(){
  const profs=(G.nodes.complianceProfiles||[]);
  let h='';
  if(lensOn()){
    const reqList=profs.filter(c=>RG.has(c.id));
    const other=profs.filter(c=>!RG.has(c.id));
    h+=`<div class="grp" style="color:var(--amber)">Required for ${esc(REQ?.name||'')} (${reqList.length})</div>`;
    for(const c of reqList) h+=card('var(--amber)',c.name,c.fullName||c.regulator||'',`openProfile('${c.id}')`,'req',{cls:'req',text:'required'});
    h+=`<div class="grp">Not required for this industry (${other.length})</div>`;
    for(const c of other) h+=card('var(--line)',c.name,c.fullName||'',`openProfile('${c.id}')`,'dim',null);
  }else{
    h+=`<div class="sub" style="margin-bottom:8px">Pick an industry lens to see which of these 26 apply. All shown until then.</div>`;
    for(const c of profs) h+=card('var(--line)',c.name,c.fullName||c.regulator||'',`openProfile('${c.id}')`,'',null);
  }
  return col(2,'03 · governance','Compliance — 26 regimes','var(--amber)',h,
    lensOn()?`${RG.size} of 26 regimes apply to ${REQ?.name}.`:`All 26 regulatory regimes. Lens marks which apply.`);
}

function colRegistry(){
  const imgs=(G.nodes.images||[]);
  let h=`<div class="grp">Pipeline output</div>`+
    card('var(--orange)','GHCR — ghcr.io/yarova-ca','signed image + SBOM · :latest :sha :sha-fips','openRegistry()','',null);
  h+=`<div class="grp">Base images — 22 options</div>`;
  for(const im of imgs){
    const req=RT.has(im.id);
    const chip = req?{cls:'req',text:'recommended'} : (im.fips==='Yes'?{cls:'keep',text:'FIPS'}:null);
    h+=card('var(--orange)',im.name,`${im.familyLabel||im.family||''} · ${im.minImage||''}${im.fips==='Yes'?' · FIPS':''}`,`openImage('${im.id}')`,st(req,false),chip);
  }
  // runtime deep bases + package managers reachable
  h+=`<div class="grp">Runtime base — decision depth</div>`;
  for(const r of (G.nodes.runtimeDeep||[])){
    const req=RT.has(r.id);
    h+=card('var(--orange)',r.name,`${r.baseOs||''} · ${r.sizeMb?r.sizeMb+'MB':''}${r.fipsCertified==='yes'?' · FIPS':''}`,`openDeep('runtimeDeep','${r.id}')`,st(req,false),req?{cls:'req',text:'recommended'}:null);
  }
  h+=`<div class="grp">Package + build managers (${(G.nodes.pkgBuildDeep||[]).length})</div>`;
  for(const p of (G.nodes.pkgBuildDeep||[])) h+=card('var(--orange)',p.name,`${p.kind||''} · ${p.language||''}`,`openPkg('${p.id}')`,'',null);
  return col(3,'04 · artifact','Registry & Build','var(--orange)',h,
    lensOn()?`Recommended base for ${REQ?.name}: ${[...RT].join(', ')}.`:`22 base images + 9 runtime profiles + pkg managers.`);
}

function colGitops(){
  let h='<div class="sub" style="margin-bottom:8px">Registry image → Git declares desired state → controller syncs to clusters. Same for every industry.</div>';
  for(const t of (G.nodes.gitopsTools||[])) h+=card('var(--purple)',t.name,`${t.role||''}${t.version?' · v'+t.version:''}`,`openGitops('${t.id}')`,lensOn()?'stay':'',null);
  return col(4,'05 · GitOps','GitOps — Helm + Kustomize','var(--purple)',h,
    `${(G.nodes.gitopsTools||[]).length} tools. Declarative delivery — identical across industries.`);
}

function colClusters(){
  const comps=[...(G.nodes.clusterComponents||[])].sort((a,b)=>(a.num||'').localeCompare(b.num||''));
  const layers=by(comps,'layer');
  const clusters=G.nodes.clusters||[];
  // SVG hub-and-spoke
  const cx=180,cy=70,R=58;
  const pts=clusters.map((c,i)=>{const ang=(-90 + i*(360/clusters.length))*Math.PI/180;
    return {c,x:cx+Math.cos(ang)*120,y:cy+Math.sin(ang)*46};});
  let svg=`<svg viewBox="0 0 360 150" width="100%" height="150" role="img" aria-label="Argo CD hub connected to clusters">`;
  for(const p of pts){const on=RC.has(p.c.id);
    svg+=`<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${on?'#FFB800':'rgba(244,243,239,.14)'}" stroke-width="${on?2:1}"/>`;}
  for(const p of pts){const on=RC.has(p.c.id);
    svg+=`<g style="cursor:pointer" onclick="openCluster('${p.c.id}')">
      <circle cx="${p.x}" cy="${p.y}" r="22" fill="${on?'rgba(255,184,0,.14)':'#1C1F28'}" stroke="${on?'#FFB800':'#19C8A8'}" stroke-width="${on?2:1.2}"/>
      <text x="${p.x}" y="${p.y+4}" text-anchor="middle" fill="${on?'#FFB800':'rgba(244,243,239,.62)'}" font-size="11" font-family="Outfit">${esc(p.c.name||p.c.id)}</text></g>`;}
  svg+=`<circle cx="${cx}" cy="${cy}" r="26" fill="rgba(198,242,78,.14)" stroke="#C6F24E" stroke-width="1.6"/>
    <text x="${cx}" y="${cy-2}" text-anchor="middle" fill="#C6F24E" font-size="11" font-family="Outfit">Argo CD</text>
    <text x="${cx}" y="${cy+11}" text-anchor="middle" fill="rgba(244,243,239,.55)" font-size="9" font-family="Outfit">hub</text></svg>`;
  let h=`<div class="hubwrap">${svg}<div class="sub">Hub-and-spoke: one Argo CD controller syncs every cluster.${lensOn()?` Recommended for ${esc(REQ?.name)}: <span style="color:var(--amber)">${[...RC].map(x=>esc(x)).join(', ')}</span>.`:''}</div></div>`;
  // layered rail of 30 components
  const order=['Foundation','Networking','Security','Storage','Observability','Delivery','Scaling','Platform'];
  const keys=Object.keys(layers).sort((a,b)=>{const ia=order.indexOf(a),ib=order.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib);});
  for(const layer of keys){const cs=layers[layer];
    h+=`<div class="layer"><h4>Layer — ${esc(layer)} · ${cs.length}</h4>`;
    for(const c of cs) h+=card('var(--cyan)',`${c.num}. ${c.name}`,(c.status||'')+(c.what?' · '+stripTags(c.what).slice(0,48):''),`openCluster2('${c.id}')`,lensOn()?'stay':'',null);
    h+=`</div>`;
  }
  return col(5,'06 · runtime','Clusters — hub-and-spoke','var(--cyan)',h,
    `${clusters.length} clusters · ${comps.length} components in ${keys.length} stacked layers.`,true);
}

function colPlatform(){
  const map=[['Auth','authDeep',RA],['Observability','observabilityDeep',RO],['ORM','ormDeep',null],['Runtime base','runtimeDeep',RT]];
  let h='';
  for(const [label,node,reqSet] of map){
    const items=G.nodes[node]||[];
    const reqCount=reqSet?items.filter(o=>reqSet.has(o.id)).length:0;
    h+=`<div class="grp">${label}${reqSet&&lensOn()?` · ${reqCount} required`:''}</div>`;
    for(const o of items){
      const req=reqSet?reqSet.has(o.id):false;
      const universal=!reqSet; // ORM stays the same across industries
      h+=card('var(--pink)',o.name,stripTags(o.what||'').slice(0,68),`openDeep('${node}','${o.id}')`,st(req,universal),req?{cls:'req',text:'required'}:null);
    }
  }
  return col(6,'07 · platform','Auth · Observability · ORM · Runtime','var(--pink)',h,
    lensOn()?`${REQ?.name}: auth ${[...RA].length}, observability ${[...RO].length} required.`:`Every swappable platform option, full decision depth.`,true);
}

function colIntegrations(){
  const ig=G.nodes.integrations||[];
  const list=lensOn()?ig.filter(g=>g.verticalId===LENS.vertical):ig;
  let h=lensOn()?`<div class="sub" style="margin-bottom:8px">${list.length} integrations for ${esc(REQ?.name||'')}.</div>`
    :`<div class="sub" style="margin-bottom:8px">All ${ig.length} integrations. Pick an industry to focus.</div>`;
  const byCat=by(list,'category');
  for(const [cat,arr] of Object.entries(byCat)){
    h+=`<div class="grp">${esc(cat)}</div>`;
    for(const g of arr) h+=card('var(--blue)',g.externalSystem,`auth ${g.authOption||''} · ${g.apiGateway||''}`,`openIntegration('${g.id}')`,lensOn()?'req':'',null);
  }
  return col(7,'08 · connect','Integrations','var(--blue)',h,
    `${ig.length} external systems across ${Object.keys(by(ig,'category')).length} categories.`);
}

function colReference(){
  let h=`<div class="grp">Concepts (${(G.nodes.conceptNotes||[]).length})</div>`;
  for(const c of (G.nodes.conceptNotes||[])) h+=card('var(--violet)',c.title,stripTags(c.body||'').slice(0,60),`openConcept('${c.id}')`,'',null);
  h+=`<div class="grp">Languages (${(G.nodes.languages||[]).length})</div>`;
  for(const l of (G.nodes.languages||[])) h+=card('var(--violet)',l.name||l.id,l.useFor||l.note||'',`openRef('languages','${l.id}')`,'',null);
  h+=`<div class="grp">API gateways (${(G.nodes.apiGateways||[]).length})</div>`;
  for(const a of (G.nodes.apiGateways||[])) h+=card('var(--violet)',a.name||a.id,a.role||a.note||'',`openRef('apiGateways','${a.id}')`,'',null);
  h+=`<div class="grp">Target devices (${(G.nodes.devices||[]).length})</div>`;
  for(const d of (G.nodes.devices||[])) h+=card('var(--violet)',d.name||d.id,d.note||'',`openRef('devices','${d.id}')`,'',null);
  h+=`<div class="grp">Regions (${(G.nodes.regions||[]).length})</div>`;
  for(const r of (G.nodes.regions||[])) h+=card('var(--violet)',r.name||r.id,r.note||r.residency||'',`openRef('regions','${r.id}')`,'',null);
  h+=`<div class="grp">Pinned tool versions (${(G.nodes.versions||[]).length})</div>`;
  for(const v of (G.nodes.versions||[]).slice(0,40)) h+=card('var(--violet)',`${v.name||v.tool||v.id}${v.version?' '+v.version:''}`,v.note||'',`openRef('versions','${v.id}')`,'',null);
  if((G.nodes.versions||[]).length>40) h+=`<div class="sub">+ ${(G.nodes.versions||[]).length-40} more pinned versions.</div>`;
  return col(8,'09 · reference','Reference & Concepts','var(--violet)',h,
    `Concepts, languages, gateways, devices, regions, pinned versions — every supporting fact.`);
}

function renderBoard(){
  const cols=[colFrameworks(),colPipeline(),colCompliance(),colRegistry(),colGitops(),colClusters(),colPlatform(),colIntegrations(),colReference()];
  $("#track").innerHTML=cols.join("");
  observeColumns();
}

// ── hero overview rail + lens banner ───────────────────────────────────────
function heroCounts(){
  const n=G.nodes;
  const integ=lensOn()?(n.integrations||[]).filter(g=>g.verticalId===LENS.vertical).length:(n.integrations||[]).length;
  return [
    {c:(n.frameworks||[]).length+' frameworks'},
    {c:(n.stages||[]).length+' stages · '+(n.invariants||[]).length+' invariants'},
    {c:lensOn()?RG.size+' of 26 apply':'26 regimes',req:lensOn()},
    {c:(n.images||[]).length+' base images',req:lensOn()&&RT.size>0},
    {c:(n.gitopsTools||[]).length+' tools'},
    {c:(n.clusters||[]).length+' clusters · '+(n.clusterComponents||[]).length+' comps',req:lensOn()&&RC.size>0},
    {c:((n.authDeep||[]).length+(n.observabilityDeep||[]).length+(n.ormDeep||[]).length)+' options',req:lensOn()&&(RA.size+RO.size)>0},
    {c:integ+' integrations',req:lensOn()},
    {c:(n.conceptNotes||[]).length+' concepts +'},
  ];
}
function renderHero(){
  const counts=heroCounts();
  $("#hrail").innerHTML=STAGES.map((s,i)=>
    `<div class="hnode${counts[i].req?' req':''}" data-i="${i}" style="--accent:${s[2]}" tabindex="0" role="button"
       aria-label="${esc(s[1])}, jump to column"
       onclick="goCol(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goCol(${i})}">
       <span class="dotn">${i+1}</span><span class="hl">${esc(s[1])}</span><span class="hc">${esc(counts[i].c)}</span>
    </div>`
  ).join('');
}
window.goCol=(i)=>{const c=$(`#col-${i}`);if(c)c.scrollIntoView({behavior:'smooth',inline:'start',block:'nearest'});};
function observeColumns(){
  const nodes=[...document.querySelectorAll('.hnode')];
  const obs=new IntersectionObserver((ents)=>{
    ents.forEach(e=>{if(e.isIntersecting){
      const i=+e.target.id.split('-')[1];
      nodes.forEach(s=>s.classList.toggle('active',+s.dataset.i===i));
    }});
  },{root:$("#track"),threshold:.5});
  for(let i=0;i<STAGES.length;i++){const c=$(`#col-${i}`);if(c)obs.observe(c);}
}
function renderLensInfo(){
  const el=$("#lensInfo"), tr=$("#track");
  if(!lensOn()){el.classList.remove('on');tr.classList.remove('lensed');return;}
  el.classList.add('on');tr.classList.add('lensed');
  el.innerHTML=`<b>${esc(REQ?.name||'')}</b>
    <span class="pill">${RG.size} regimes</span>
    <span class="pill">auth: ${[...RA].map(x=>x.replace('auth-','')).join(', ')}</span>
    <span class="pill">obs: ${[...RO].map(x=>x.replace('observability-','')).join(', ')}</span>
    <span class="pill">clusters: ${[...RC].join(', ')}</span>
    <span class="pill">base: ${[...RT].join(', ')}</span>
    <span class="sub">Amber = required · green = same everywhere · dimmed = not required here.</span>`;
}

// ── drawer + value rendering ────────────────────────────────────────────────
let lastFocus=null;
function openDrawer(title,bodyHtml){
  lastFocus=document.activeElement;
  $("#dTitle").innerHTML=title;$("#dBody").innerHTML=bodyHtml;
  $("#drawer").classList.add("open");$("#scrim").classList.add("on");
  $("#drawer").focus();
}
window.closeDrawer=()=>{$("#drawer").classList.remove("open");$("#scrim").classList.remove("on");if(lastFocus)lastFocus.focus();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

function renderVal(v){
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
function failBlock(o){
  if(o.trigger||o.system||o.userSees){
    return `<div class="fail">
      ${o.trigger?`<div class="fk">Trigger</div><div>${esc(stripTags(o.trigger))}</div>`:''}
      ${o.system?`<div class="fk">System</div><div>${esc(stripTags(o.system))}</div>`:''}
      ${o.userSees?`<div class="fk">User sees</div><div>${esc(stripTags(o.userSees))}</div>`:''}
      ${o.fix||o.userCan?`<div class="fk">Fix</div><div>${esc(stripTags(o.fix||o.userCan))}</div>`:''}</div>`;
  }
  return `<div class="kv">`+Object.entries(o).filter(([,val])=>val!=null&&val!=='').map(([k,val])=>`<div class="k">${esc(k)}</div><div>${esc(stripTags(val))}</div>`).join('')+`</div>`;
}
// render a full node: every field, labelled, ordered by a preferred list then the rest
function fullNode(o,labels,skip){
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
function section(label,v){return `<h3>${esc(label)}</h3>${renderVal(v)}`;}

const find=(node,id)=>(G.nodes[node]||[]).find(x=>x.id===id);

window.openFw=(id)=>{const f=find('frameworks',id);if(!f)return;
  openDrawer(esc(f.name),fullNode(f,[['version','Version'],['license','License'],['maintainedBy','Maintained by'],['maturity','Maturity'],['languages','Languages'],['whenToUse','When to use'],['whenNot','When NOT'],['tradeoff','Trade-off'],['perf','Performance'],['securityPosture','Security posture'],['pkgMgr','Package mgr'],['buildTool','Build tool'],['repo','Repo']]));};
window.openProfile=(id)=>{const c=find('complianceProfiles',id);if(!c)return;
  const req=RG.has(id);
  openDrawer(`${esc(c.name)}${req?' <span class="chip req">required by lens</span>':''}`,fullNode(c,[['fullName','Full name'],['region','Region'],['regulator','Regulator'],['appliesToVerticals','Applies to'],['forces','Forces'],['requiredControls','Required controls'],['howToMeet','How to meet'],['auditRetention','Audit retention'],['dataResidency','Data residency'],['penalties','Penalties']]));};
window.openStage=(id)=>{const s=find('stages',id);if(!s)return;
  const iv=(G.nodes.invariants||[]).filter(x=>x.stage===s.name);
  let h=fullNode(s,[['phase','Phase'],['type','Type'],['label','Stage']]);
  if(iv.length)h+=`<h3>Invariants on this stage</h3>`+iv.map(x=>`<div class="fail" style="border-left-color:var(--red)"><div class="fk">${esc(x.name)}</div><div>${esc(stripTags(x.condition))}</div><div class="sub">if violated: ${esc(stripTags(x.ifViolated||''))} · enforced by ${esc(x.enforcedBy||'')}</div></div>`).join('');
  openDrawer(esc(s.name),h);};
window.openInvariant=(id)=>{const x=find('invariants',id);if(!x)return;
  openDrawer(esc(x.name),fullNode(x,[['phase','Phase'],['stage','Stage'],['condition','Condition'],['ifViolated','If violated'],['enforcedBy','Enforced by'],['controlClass','Control class']]));};
window.openAxis=(id)=>{const a=find('buildAxes',id);if(!a)return;
  openDrawer(`--${esc(a.arg)} · ${esc(a.name)}`,fullNode(a,[['arg','ARG'],['default','Default'],['validValues','Valid values'],['valueNotes','Value notes'],['appliesTo','Applies to'],['scope','Scope'],['implStatus','Status']]));};
window.openImage=(id)=>{const im=find('images',id);if(!im)return;
  const req=RT.has(id);
  openDrawer(`${esc(im.name)}${req?' <span class="chip req">recommended</span>':''}`,fullNode(im,[['familyLabel','Family'],['fromTag','FROM tag'],['minImage','Min size'],['libc','libc'],['pkgMgr','Package mgr'],['defaultUser','Default user'],['caCerts','CA certs'],['fips','FIPS'],['disaStig','DISA STIG'],['cis','CIS'],['architecture','Architecture'],['eolSupport','EOL / support'],['whenToUse','When to use'],['whenNot','When NOT'],['primaryTradeoff','Trade-off'],['complianceRatings','Compliance ratings'],['vendor','Vendor']],['familyId','family','useContext']));};
window.openDeep=(node,id)=>{const o=find(node,id);if(!o)return;
  const req=(node==='authDeep'&&RA.has(id))||(node==='observabilityDeep'&&RO.has(id))||(node==='runtimeDeep'&&RT.has(id));
  openDrawer(`${esc(o.name)}${req?' <span class="chip req">required by lens</span>':''}`,fullNode(o,[['what','What'],['howItWorks','How it works'],['baseOs','Base OS'],['sizeMb','Size MB'],['shell','Shell'],['fipsCertified','FIPS certified'],['attackSurface','Attack surface'],['pillars','Pillars'],['cost','Cost'],['whenToPick','When to pick'],['whenNot','When NOT'],['tradeoffVs','Trade-off vs'],['complianceFit','Compliance fit'],['implementation','Implementation']]));};
window.openPkg=(id)=>{const p=find('pkgBuildDeep',id);if(!p)return;
  openDrawer(esc(p.name),fullNode(p,[['kind','Kind'],['language','Language'],['what','What'],['whenToPick','When to pick'],['whenNot','When NOT'],['lockfile','Lockfile'],['speedNote','Speed'],['tradeoffVs','Trade-off vs'],['implementation','Implementation']]));};
window.openGitops=(id)=>{const t=find('gitopsTools',id);if(!t)return;
  openDrawer(esc(t.name),fullNode(t,[['role','Role'],['version','Version'],['what','What'],['syncInterval','Sync interval'],['watchesPaths','Watches paths'],['decisionChosen','Decision — chosen'],['decisionRejected','Rejected'],['installCommand','Install']]));};
window.openCluster=(id)=>{const c=find('clusters',id);if(!c)return;
  const req=RC.has(id);
  openDrawer(`${esc(c.label||c.name)}${req?' <span class="chip req">recommended</span>':''}`,fullNode(c,[['cloud','Cloud'],['secretIdentity','Workload identity'],['defaultStorageClass','Default storage class'],['evidence','Evidence']]));};
window.openCluster2=(id)=>{const c=find('clusterComponents',id);if(!c)return;
  openDrawer(`${esc(c.num)}. ${esc(c.name)}`,fullNode(c,[['layer','Layer'],['status','Status'],['what','What'],['why','Why'],['installCommand','Install'],['verifyCommand','Verify'],['verifyExpected','Expected'],['wiredTo','Wired to'],['decision','Decision'],['failures','Failure modes']]));};
window.openIntegration=(id)=>{const g=find('integrations',id);if(!g)return;
  openDrawer(esc(g.externalSystem||g.name||id),fullNode(g,[['category','Category'],['vertical','Vertical'],['authOption','Auth'],['apiGateway','API gateway'],['protocol','Protocol'],['dataClass','Data class'],['note','Note']]));};
window.openConcept=(id)=>{const c=find('conceptNotes',id);if(!c)return;
  openDrawer(esc(c.title),`<div style="white-space:pre-wrap;line-height:1.6">${esc(stripTags(c.body||''))}</div>`+(c.sourcePage?`<div class="prov">source: ${esc(c.sourcePage)}</div>`:''));};
window.openRef=(node,id)=>{const o=find(node,id);if(!o)return;openDrawer(esc(o.name||o.tool||o.id),fullNode(o,[]));};
window.openRegistry=()=>openDrawer('GHCR — ghcr.io/yarova-ca',
  `<h3>What</h3><div>Every merge to main builds a container image, signs it with cosign, attaches an SBOM, and pushes to GitHub Container Registry.</div>
   <h3>Tags</h3><span class="chip">:latest</span><span class="chip">:sha</span><span class="chip">:sha-fips</span>
   <h3>Supply chain</h3><div>Signed (cosign) · SBOM (syft) · provenance attestation · no direct push (invariant I-P0-1).</div>`);

// ── boot ────────────────────────────────────────────────────────────────────
// ── resolver — Build a stack ────────────────────────────────────────────────
// Every stage shows ALL its options, marked applies/recommended/chosen/available.
// Click any option = pick it; the whole path reflows.
let MODE='catalog';
const RS={fw:null,industry:'financial-services',category:'',complianceFocus:'',pkg:null,buildtool:null,orm:null,auth:null,obs:null,runtime:null,cluster:null,region:null};
let LASTR={};
const LANG_DEFPKG={ts:'pnpm',js:'pnpm',py:'uv',go:'gomod',rust:'cargo',java:'maven',kotlin:'gradle',php:'composer',ruby:'bundler',csharp:'gomod',elixir:'gomod'};
const LANG_ORM={ts:'orm-prisma',js:'orm-prisma',py:'orm-sqlalchemy',go:'orm-gorm',rust:'orm-sqlx'};
const LANG_HUMAN={ts:'TypeScript',js:'JavaScript',py:'Python',go:'Go',rust:'Rust',java:'Java',kotlin:'Kotlin',php:'PHP',ruby:'Ruby',csharp:'.NET',elixir:'Elixir'};
const nameById=(node,id)=>{const o=(G.nodes[node]||[]).find(x=>x.id===id);return o?(o.name||o.label||id):id;};
const fwById=(id)=>(G.nodes.frameworks||[]).find(f=>f.id===id);
const reqOfInd=(ind)=>ind?(G.nodes.industryRequirements||[]).find(r=>r.id===ind):null;
function langMatch(str,lang){const h=(LANG_HUMAN[lang]||lang||'').toLowerCase();const s=String(str||'').toLowerCase();
  if(lang==='ts'||lang==='js')return s.includes('javascript')||s.includes('typescript');
  if(!h)return false; return s.includes(h);}
const pkgsFor=(lang)=>(G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='pkg-mgr'&&langMatch(p.language,lang));
const buildToolsFor=(lang)=>(G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='build-tool'&&langMatch(p.language,lang));
const ormsFor=(lang)=>(G.nodes.ormDeep||[]).filter(o=>o.id==='orm-none'||(o.language||o.languages||[]).some(L=>langMatch(L,lang)));

function resolveStack(){
  const fw=fwById(RS.fw)||(G.nodes.frameworks||[])[0];
  const lang=fw.languageId;
  const rq=reqOfInd(RS.industry);
  const pkgList=pkgsFor(lang), pkgDef=LANG_DEFPKG[lang]||(pkgList[0]&&pkgList[0].id)||'npm';
  const pkg=RS.pkg||pkgDef;
  const btList=buildToolsFor(lang);
  const buildtool=RS.buildtool||(btList[0]&&btList[0].id)||null;
  const ormList=ormsFor(lang), ormDef=LANG_ORM[lang]||'orm-none';
  const orm=RS.orm||ormDef;
  const auth=RS.auth||(rq?.requiredAuthIds?.[0])||'auth-oauth2';
  const obs=RS.obs||(rq?.requiredObservabilityIds?.[0])||'observability-otel';
  const cluster=RS.cluster||(rq?.recommendedClusterIds?.[0])||'eks';
  const tmpl=(G.nodes.dockerfileTemplates||[]).find(t=>t.frameworkId===fw.id);
  let base,baseWhy,baseTag;
  if(RS.runtime){base=RS.runtime;baseWhy='Your choice of base image.';baseTag='you';}
  else if(rq?.recommendedRuntimeIds?.includes('fips')){base='fips';baseWhy=`${rq.name} requires FIPS-validated crypto — UBI9 FIPS base.`;baseTag='req';}
  else if(rq?.recommendedRuntimeIds?.length){base=rq.recommendedRuntimeIds[0];baseWhy=`${rq.name} recommends a ${base} base image.`;baseTag='req';}
  else{base=(G.nodes.runtimeDeep||[]).some(r=>r.id==='distroless')?'distroless':base;base=base||tmpl?.runtimeFrom||'distroless';baseWhy='Framework default base image.';baseTag='def';}
  const region=RS.region||'';
  return {fw,lang,rq,
    pkg,pkgUser:!!RS.pkg,pkgDef,pkgList,
    buildtool,btList,
    orm,ormUser:!!RS.orm,ormDef,ormList,
    auth,authUser:!!RS.auth,authReq:!!rq?.requiredAuthIds?.includes(auth),
    obs,obsUser:!!RS.obs,obsReq:!!rq?.requiredObservabilityIds?.includes(obs),
    cluster,clusterUser:!!RS.cluster,clusterReq:!!rq?.recommendedClusterIds?.includes(cluster),
    base,baseWhy,baseTag,tmpl,region,
    regimes:rq?.requiredRegimeIds||[],
    integ:RS.industry?(G.nodes.integrations||[]).filter(g=>g.verticalId===RS.industry):[]};
}

// one selectable option row
function opt(axis,id,name,sub,state,info){
  return `<div class="opt ${state}" tabindex="0" role="button" aria-pressed="${state==='chosen'}"
    onclick="pickAxis('${axis}','${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();pickAxis('${axis}','${id}')}">
    <span class="optname">${esc(name)}</span>${sub?`<span class="optsub">${esc(sub)}</span>`:''}
    ${state==='chosen'?'<span class="optflag chosen">✓ chosen</span>':state==='req'?'<span class="optflag applies">applies</span>':state==='rec'?'<span class="optflag rec">recommended</span>':''}
    ${info?`<button class="opti" aria-label="details" tabindex="-1" onclick="event.stopPropagation();${info}">i</button>`:''}</div>`;
}
function ostate(id,chosenId,reqSet,recSet){
  if(id===chosenId)return'chosen';
  if(reqSet&&reqSet.has(id))return'req';
  if(recSet&&recSet.has(id))return'rec';
  return'avail';
}
window.pickAxis=(axis,id)=>{
  RS[axis]=id;
  if(axis==='industry'){RS.auth=null;RS.obs=null;RS.cluster=null;RS.runtime=null;}
  if(axis==='fw'){RS.pkg=null;RS.buildtool=null;RS.orm=null;}
  refreshBuild();
};
function rtag(kind,txt){return `<span class="rtag ${kind}">${esc(txt)}</span>`;}
function pickTag(user,req){return user?['you','your choice']:req?['req','required by industry']:['def','default'];}
function rpanel(idx,accent,n,name,tagHtml,valHtml,whyHtml,bodyHtml,changed){
  return `<section class="col rcol${changed?' changed':''}" id="col-${idx}" style="--accent:${accent}">
    <div class="rhead">${tagHtml}<div class="n" style="color:${accent}">${esc(n)} · ${esc(name)}</div>
      <div class="rval">${valHtml}</div><div class="rwhy">${whyHtml}</div></div>
    <div class="colbody">${bodyHtml}</div>${idx<8?'<div class="rconn">→</div>':''}</section>`;
}
const grp=(t)=>`<div class="grp">${esc(t)}</div>`;

// ── real-code generators (bundled studio-v2 generators.js) ──────────────────
let CFID=0;
const FE_KEYS=new Set(['nextjs','react','vue','angular','svelte','nuxt','remix','react-vite','gatsby','vue-vite','astro','solid','solid-vite','qwik','tanstack','preact-vite','lit','redwood','fresh','mobile','mobile-expo']);
const BE_LIST=['nodejs-express','nodejs-fastify','nodejs-nest','nodejs-hono','nodejs-koa','python-fastapi','python-django','python-flask','python-litestar','python-starlette','java-spring','java-quarkus','java-micronaut','java-javalin','go-gin','go-echo','go-chi','go-stdlib','go-fiber','rust-axum','rust-actix','rust-rocket','rust-warp','ruby-rails','ruby-sinatra','php-laravel','php-symfony','php-slim','elixir-phoenix','elixir-live','kotlin-ktor','bun-elysia','deno-fresh-api','swift-vapor'];
const LANG_GROUP={ts:'nodejs',js:'nodejs',py:'python',go:'go',rust:'rust',java:'java',kotlin:'kotlin',php:'php',ruby:'ruby',elixir:'elixir',swift:'swift',csharp:'dotnet'};
function fwToKeys(fw){
  const short=(fw.id||'').replace(/^\d+-/,'');
  if(FE_KEYS.has(short))return{feKey:short,beKey:'none'};
  let be=BE_LIST.find(k=>k.split('-')[1]===short)||BE_LIST.find(k=>k.endsWith('-'+short));
  if(!be){const g=LANG_GROUP[fw.languageId]||'nodejs';be=BE_LIST.find(k=>k.startsWith(g+'-'))||'nodejs-express';}
  return{feKey:'none',beKey:be};
}
const PKG_MAP={gomod:'go'};
const REGIME_TO_COMP={'pci-dss-4':'pci','hipaa':'hipaa','fedramp-mod':'fedramp','fedramp-high':'fedramp','soc2-typeii':'soc2','gdpr':'gdpr','iso27001':'iso27001','cmmc-l2':'cmmc','nerc-cip':'nerccip','fips-140-3':'fedramp'};
function industryToCompliance(rq){
  if(!rq)return['none','none'];const ks=[];
  for(const id of (rq.requiredRegimeIds||[])){const c=REGIME_TO_COMP[id];if(c&&!ks.includes(c))ks.push(c);}
  return[ks[0]||'none',ks[1]||'none'];
}
function buildConfig(s){
  const k=fwToKeys(s.fw), comp=industryToCompliance(s.rq);
  return{feKey:k.feKey,beKey:k.beKey,ciKey:'github-actions',regKey:'ghcr',
    compliance:comp[0],compliance2:comp[1],industry:s.rq?s.rq.id:'',
    cd:'argocd',gitops:'same-repo',scanner:'trivy',signing:'cosign',sbom:'syft',
    baseimage:s.base,pkgMgr:(PKG_MAP[s.pkg]||s.pkg),appName:s.fw.serviceSlug||s.fw.id,
    port:(s.tmpl&&s.tmpl.port)?String(s.tmpl.port):undefined};
}
function genFiles(cfg){
  const safe=(fn)=>{try{const v=fn();return v==null?'':v;}catch(e){return '';}};
  return{
    dockerfile:safe(()=>GEN.generateDockerfile(cfg)),
    dockerignore:safe(()=>GEN.generateDockerIgnore(cfg)),
    prwf:safe(()=>GEN.generatePRWorkflow(cfg)),
    mainwf:safe(()=>GEN.generateMainWorkflow(cfg)),
    helm:safe(()=>GEN.generateHelmValues(cfg,'prod')),
    kbase:safe(()=>GEN.generateBaseKustomization(cfg)),
    kdeploy:safe(()=>GEN.generateBaseDeployment(cfg)),
    precommit:safe(()=>GEN.generatePreCommitConfig(cfg)),
    deploy:safe(()=>GEN.generateDeploy(cfg))||{},
  };
}
function codeFile(name,text){
  if(!text||typeof text!=='string')return'';
  const id='cf'+(CFID++);
  return `<div class="genfile"><div class="genhead"><span class="genname">${esc(name)}</span>`+
    `<button class="gencopy" onclick="copyCode('${id}',this)">copy</button></div>`+
    `<pre class="gencode" id="${id}">${esc(text)}</pre></div>`;
}
window.copyCode=(id,btn)=>{const el=document.getElementById(id);if(!el)return;
  navigator.clipboard.writeText(el.textContent).then(()=>{if(btn){const t=btn.textContent;btn.textContent='copied ✓';setTimeout(()=>btn.textContent=t,1200);}});};

// ── decision journey: every real decision = options + lens verdict + answer ──
const REGIME_TO_STD={'fips-140-3':['fips','fedramp'],'fedramp-mod':['fedramp'],'fedramp-high':['fedramp'],'pci-dss-4':['pci'],'hipaa':['hipaa'],'pipeda':['pipeda'],'soc2-typeii':['soc2'],'iso27001':['iso27001'],'cmmc-l2':['cmmc'],'nerc-cip':['nerccip']};
function reqStds(s){const out=new Set();for(const id of (s.regimes||[])){(REGIME_TO_STD[id]||[]).forEach(x=>out.add(x));}return out;}
function axisValues(arg){const a=(G.nodes.buildAxes||[]).find(x=>x.arg===arg||x.id===arg);return a&&a.validValues?a.validValues:[];}
function decisionCard(d){
  const vc={forced:'amber',gap:'red',required:'teal',recommended:'teal',you:'teal',set:'',off:'dim'};
  const cls=vc[d.verdict]||'';
  const opts=(d.options||[]).slice(0,7).map(o=>`<span class="dopt${(''+o).toLowerCase()===(''+d.answer).toLowerCase()?' on':''}">${esc(o)}</span>`).join('');
  return `<div class="dcard ${cls}"><div class="dq">${esc(d.q)}</div>`+
    `<div class="da"><span class="dans">${esc(d.answer)}</span>${(d.verdict&&d.verdict!=='set')?`<span class="dv ${cls}">${esc(d.verdict)}</span>`:''}</div>`+
    `${d.why?`<div class="dwhy">${esc(d.why)}</div>`:''}${opts?`<div class="dopts">${opts}</div>`:''}</div>`;
}
function decisionsFor(s){
  const sh=(s.fw.shipped)||{}, ba=sh.buildArgs||{}, mw=sh.middleware||{};
  const stds=reqStds(s);
  const compByStd={}; (sh.shippedCompliance||[]).forEach(c=>compByStd[c.standard]=c);
  let rtForced=null, rtWhy='';
  for(const std of stds){const c=compByStd[std]; if(c&&c.buildArgs&&c.buildArgs.RUNTIME){rtForced=c.buildArgs.RUNTIME; rtWhy=std.toUpperCase()+' forces RUNTIME='+c.buildArgs.RUNTIME+' (services/'+(s.fw.serviceSlug||s.fw.id)+'/compliance/'+std+'.yaml).';}}
  const reqAuth=stds.has('pci')||stds.has('hipaa')||((s.rq?.requiredAuthIds||[]).length>0);
  const needAudit=stds.has('hipaa')||stds.has('pci');
  const needObs=stds.has('soc2')||stds.has('hipaa')||stds.has('pci')||stds.has('fedramp');
  const D={deps:[],build:[],compliance:[],ci:[],gitops:[],cluster:[],platform:[]};
  // dependencies
  D.deps.push({q:'Package manager',answer:nameById('pkgBuildDeep',s.pkg),options:(s.fw.pkgMgr||'').split(/[,/]+/).map(x=>x.trim()).filter(Boolean),verdict:s.pkgUser?'you':'set',why:'Frozen-lockfile install in CI.'});
  if(s.fw.buildTool)D.deps.push({q:'Build tool',answer:s.fw.buildTool,options:[],verdict:'set',why:''});
  // build / image
  if(ba.BUILD_IMAGE)D.build.push({q:'Build image (compile stage)',answer:ba.BUILD_IMAGE,options:axisValues('BUILD_IMAGE'),verdict:'set',why:'Builder layer — discarded from the final image.'});
  const rtAns=rtForced||ba.RUNTIME||s.base;
  D.build.push({q:'Runtime variant',answer:rtAns,options:sh.runtimeVariants||['alpine','fips'],verdict:rtForced?'forced':'set',why:rtForced?rtWhy:'Shipped default runtime base.'});
  const tgt=(rtAns==='fips')?'runtime-fips':'runtime';
  D.build.push({q:'Dockerfile target',answer:tgt,options:(sh.dockerfileTargets||[]).filter(t=>/^runtime|^base-(alpine|fips|slim)/.test(t)),verdict:rtForced?'forced':'set',why:'Final image stage built.'});
  // compliance
  for(const id of (s.regimes||[])){
    const std=(REGIME_TO_STD[id]||[])[0], c=std&&compByStd[std];
    D.compliance.push({q:nameById('complianceProfiles',id),answer:c?'profile shipped':'no shipped profile',options:[],verdict:c?'required':'gap',
      why:c?('Forces '+((c.buildArgs&&Object.keys(c.buildArgs).length)?Object.entries(c.buildArgs).map(([k,v])=>k+'='+v).join(', '):'controls only')+'. Controls: '+((c.requiredControls||[]).slice(0,4).join(', ')||'—')+'.'):'Required by industry, but the service ships no profile for it.'});
  }
  // platform middleware
  D.platform.push({q:'Auth',answer:mw.auth?nameById('authDeep',s.auth):'none',options:(G.nodes.authDeep||[]).map(a=>a.name),verdict:mw.auth?(reqAuth?'required':'set'):(reqAuth?'gap':'off'),why:reqAuth?(mw.auth?'Required by compliance — present.':'Required by '+[...stds].join('/')+' — MISSING.'):'Auth middleware shipped.'});
  D.platform.push({q:'Audit logging',answer:mw.audit?'on':'off',options:['on','off'],verdict:mw.audit?(needAudit?'required':'set'):(needAudit?'gap':'off'),why:needAudit?(mw.audit?'Required and present.':'HIPAA/PCI require immutable audit logs — OFF in this service.'):'Not enabled.'});
  D.platform.push({q:'RBAC',answer:mw.rbac?'on':'off',options:['on','off'],verdict:mw.rbac?'set':'off',why:'Role-based access control middleware.'});
  D.platform.push({q:'Circuit breaker',answer:mw.circuitBreaker?'on':'off',options:['on','off'],verdict:mw.circuitBreaker?'set':'off',why:'Resilience on downstream calls.'});
  D.platform.push({q:'Observability',answer:sh.observabilityDetected?'enabled (logs + metrics)':'none',options:(G.nodes.observabilityDeep||[]).map(o=>o.name),verdict:sh.observabilityDetected?(needObs?'required':'set'):(needObs?'gap':'off'),why:sh.observabilityDetected?'Detected: structured logs + Prometheus metrics.':(needObs?'Audit/telemetry required by compliance — none detected.':'None detected.')});
  D.platform.push({q:'ORM / data layer',answer:sh.ormDetected?(sh.ormName||'detected'):'none (raw SQL / no DB)',options:(s.ormList||[]).map(o=>o.name),verdict:'set',why:''});
  // ci — the real shipped workflows
  for(const w of (sh.workflows||[]))D.ci.push({q:w.name||w.file,answer:'enabled',options:[],verdict:'set',why:(w.jobs||[]).length?'Jobs: '+(w.jobs||[]).join(', '):''});
  // gitops / deploy
  if(sh.helm)D.gitops.push({q:'Helm values',answer:(sh.helmValuesFiles||[]).length+' env files',options:sh.helmValuesFiles||[],verdict:'set',why:'Per-environment values shipped.'});
  if(sh.kustomizeOverlays)D.gitops.push({q:'Kustomize overlays',answer:(sh.kustomizeOverlays||[]).join(' / '),options:sh.kustomizeOverlays,verdict:'set',why:'Per-environment patches.'});
  // cluster
  D.cluster.push({q:'Deploy cluster',answer:nameById('clusters',s.cluster),options:(G.nodes.clusters||[]).map(c=>c.name),verdict:s.clusterUser?'you':(s.clusterReq?'recommended':'set'),why:s.rq?(s.clusterReq?s.rq.name+' recommends it.':'Default cluster.'):'Default cluster.'});
  return D;
}
const decBlock=(arr)=>arr&&arr.length?grp('decisions — options · lens · answer')+arr.map(decisionCard).join(''):'';

// ── command progression — authored templates (ONE place) + derived ──────────
const SCAFFOLD={
  nextjs:'npx create-next-app@latest {app} --typescript --app --eslint',
  react:'npm create vite@latest {app} -- --template react-ts','react-vite':'npm create vite@latest {app} -- --template react-ts',
  vue:'npm create vue@latest {app}','vue-vite':'npm create vite@latest {app} -- --template vue-ts',
  angular:'npx -p @angular/cli ng new {app} --routing --style=scss',svelte:'npx sv create {app}',
  nuxt:'npx nuxi@latest init {app}',remix:'npx create-remix@latest {app}',astro:'npm create astro@latest {app}',
  solid:'npm create solid@latest {app}','solid-vite':'npm create vite@latest {app} -- --template solid-ts',
  qwik:'npm create qwik@latest {app}',gatsby:'npx create-gatsby@latest {app}','preact-vite':'npm create vite@latest {app} -- --template preact-ts',
  tanstack:'npm create @tanstack/router@latest {app}',fresh:'deno run -A -r https://fresh.deno.dev {app}',redwood:'npx create-redwood-app@latest {app}',
  'nodejs-express':'mkdir {app} && cd {app} && npm init -y && npm i express && npm i -D typescript @types/express tsx',
  'nodejs-fastify':'mkdir {app} && cd {app} && npm init -y && npm i fastify','nodejs-nest':'npx @nestjs/cli new {app}',
  'nodejs-hono':'npm create hono@latest {app}','nodejs-koa':'mkdir {app} && cd {app} && npm init -y && npm i koa',
  'python-fastapi':'mkdir {app} && cd {app} && python -m venv .venv && . .venv/bin/activate && pip install "fastapi[standard]"',
  'python-django':'pip install django && django-admin startproject {app}','python-flask':'mkdir {app} && cd {app} && python -m venv .venv && . .venv/bin/activate && pip install flask',
  'python-litestar':'mkdir {app} && cd {app} && pip install litestar uvicorn','python-starlette':'mkdir {app} && cd {app} && pip install starlette uvicorn',
  'go-gin':'mkdir {app} && cd {app} && go mod init {app} && go get github.com/gin-gonic/gin',
  'go-echo':'mkdir {app} && cd {app} && go mod init {app} && go get github.com/labstack/echo/v4',
  'go-fiber':'mkdir {app} && cd {app} && go mod init {app} && go get github.com/gofiber/fiber/v2',
  'go-chi':'mkdir {app} && cd {app} && go mod init {app} && go get github.com/go-chi/chi/v5','go-stdlib':'mkdir {app} && cd {app} && go mod init {app}',
  'rust-axum':'cargo new {app} && cd {app} && cargo add axum tokio --features tokio/full','rust-actix':'cargo new {app} && cd {app} && cargo add actix-web','rust-rocket':'cargo new {app} && cd {app} && cargo add rocket',
  'ruby-rails':'gem install rails && rails new {app} --api','ruby-sinatra':'mkdir {app} && cd {app} && bundle init && bundle add sinatra',
  'php-laravel':'composer create-project laravel/laravel {app}','php-symfony':'composer create-project symfony/skeleton {app}',
  'kotlin-ktor':'# Scaffold at start.ktor.io, or the IntelliJ Ktor plugin','elixir-phoenix':'mix archive.install hex phx_new && mix phx.new {app}','bun-elysia':'bun create elysia {app}',
};
const INSTALL={npm:'npm ci',pnpm:'pnpm install --frozen-lockfile',yarn:'yarn install --immutable',bun:'bun install --frozen-lockfile',pip:'pip install -r requirements.txt',poetry:'poetry install',uv:'uv sync --frozen',go:'go mod download',cargo:'cargo fetch',maven:'mvn -q dependency:resolve',gradle:'./gradlew dependencies',bundler:'bundle install',composer:'composer install --no-dev',dotnet:'dotnet restore'};
function scaffoldCmd(s){
  const k=fwToKeys(s.fw), key=k.feKey!=='none'?k.feKey:k.beKey;
  let t=SCAFFOLD[key];
  if(!t){const g=LANG_GROUP[s.lang]||'nodejs'; t=SCAFFOLD[BE_LIST.find(x=>x.startsWith(g+'-'))]||SCAFFOLD['nodejs-express'];}
  return t.replace(/\{app\}/g,s.fw.serviceSlug||'my-app');
}
function commandsFor(s){
  const app=s.fw.serviceSlug||'my-app', port=(s.tmpl&&s.tmpl.port)||'8080', reg='ghcr.io/yarova-ca/'+app;
  const stds=reqStds(s), shippedComp=(s.fw.shipped&&s.fw.shipped.shippedCompliance)||[], ba=(s.fw.shipped&&s.fw.shipped.buildArgs)||{};
  let rt=ba.RUNTIME||'alpine';
  for(const std of stds){const c=shippedComp.find(x=>x.standard===std); if(c&&c.buildArgs&&c.buildArgs.RUNTIME)rt=c.buildArgs.RUNTIME;}
  const tgt=rt==='fips'?'runtime-fips':'runtime';
  return {
    scaffold:[{label:'Scaffold the service',cmd:scaffoldCmd(s)}],
    deps:[{label:'Install dependencies (frozen lockfile)',cmd:INSTALL[(PKG_MAP[s.pkg]||s.pkg)]||'npm ci'}],
    docker:[{label:'Build the image',cmd:`docker build -t ${reg}:dev --target ${tgt} .`},{label:'Run it locally',cmd:`docker run --rm -p ${port}:${port} ${reg}:dev`}],
    registry:[{label:'Log in to GHCR',cmd:'echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin'},{label:'Push the image',cmd:`docker push ${reg}:$(git rev-parse --short HEAD)`},{label:'Sign it (cosign, keyless)',cmd:`cosign sign --yes ${reg}@$DIGEST`},{label:'Attach an SBOM',cmd:`syft ${reg}:dev -o spdx-json > sbom.spdx.json`}],
    gitops:[{label:'Helm — install / upgrade',cmd:`helm upgrade --install ${app} ./helm -n prod --create-namespace -f helm/values-prod.yaml`},{label:'Kustomize — render + apply',cmd:'kustomize build kustomize/overlays/prod | kubectl apply -f -'},{label:'Argo CD — register the app',cmd:`argocd app create ${app} --repo https://github.com/yarova-ca/${app}.git --path kustomize/overlays/prod --dest-server https://kubernetes.default.svc --dest-namespace prod --sync-policy automated`}],
    cluster:[{label:'Point kubectl at the cluster',cmd:`kubectl config use-context ${s.cluster}`},{label:'Verify the rollout',cmd:`kubectl rollout status deploy/${app} -n prod`}],
  };
}
function cmdBlock(title,arr){ if(!arr||!arr.length)return'';
  return grp(title)+arr.map((c,i)=>{const id='cmd'+(CFID++);
    return `<div class="cmd"><div class="cmdlabel"><span><span class="cmdn">${i+1}</span>${esc(c.label)}</span><button class="gencopy" onclick="copyCode('${id}',this)">copy</button></div><pre class="cmdcode" id="${id}">${esc(c.cmd)}</pre></div>`;}).join(''); }

// ── rich knowledge cards: show ALL options, full info each, applies/available ─
const KFIELDS={
  pkgBuildDeep:[['what','what it is'],['lockfile','lockfile'],['speedNote','speed'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs']],
  runtimeDeep:[['what','what it is'],['baseOs','distro / kernel base'],['sizeMb','size (MB)'],['shell','shell'],['fipsCertified','FIPS validated'],['attackSurface','attack surface'],['whenToPick','pick when'],['whenNot','avoid when'],['complianceFit','compliance fit']],
  authDeep:[['what','what it is'],['howItWorks','how it works'],['whenToPick','pick when'],['whenNot','avoid when'],['complianceFit','compliance fit']],
  observabilityDeep:[['what','what it is'],['pillars','pillars'],['cost','cost'],['whenToPick','pick when'],['whenNot','avoid when']],
  ormDeep:[['what','what it is'],['typeSafety','type safety'],['perf','performance'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs']],
  clusters:[['cloud','cloud'],['secretIdentity','workload identity'],['defaultStorageClass','storage class'],['evidence','notes']],
};
function kval(v){ if(v==null||v==='')return''; if(Array.isArray(v))return v.join(', '); if(typeof v==='object')return Object.entries(v).slice(0,4).map(([k,x])=>`${k}: ${x}`).join(' · '); return String(v); }
function richCard(node,axis,o,state,tag){
  const rows=(KFIELDS[node]||[]).map(([k,l])=>{const v=kval(o[k]);return v?`<div class="krow"><span class="kk">${esc(l)}</span><span class="kvv">${esc(v.length>180?v.slice(0,180)+'…':v)}</span></div>`:'';}).join('');
  return `<div class="kcard ${state}" tabindex="0" role="button" aria-pressed="${state==='chosen'}" onclick="pickAxis('${axis}','${o.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();pickAxis('${axis}','${o.id}')}">`+
    `<div class="khead"><b>${esc(o.name)}</b>${tag?`<span class="ktag ${state}">${esc(tag)}</span>`:''}${state==='chosen'?'<span class="kchk">✓ selected</span>':''}`+
    `<button class="kmore" tabindex="-1" onclick="event.stopPropagation();openDeep('${node}','${o.id}')">full knowledge →</button></div>${rows}</div>`;
}
const langName=(l)=>LANG_HUMAN[l]||l;

function renderResolver(){
  const s=resolveStack();
  const rdBase=(G.nodes.runtimeDeep||[]).find(x=>x.id===s.base);
  const baseName=rdBase?rdBase.name:s.base;
  const reqRun=new Set([...(s.rq?.recommendedRuntimeIds||[])]);
  const cur={repo:s.fw.id,deps:`${s.pkg}|${s.buildtool}`,pipe:`${s.auth}|${s.orm}|${s.base}`,comp:s.regimes.join(','),
    img:s.base,gitops:'std',cluster:s.cluster,plat:`${s.auth}|${s.obs}|${s.orm}`,integ:s.integ.length+':'+RS.industry};
  const ch=(k)=>LASTR[k]!=null&&LASTR[k]!==cur[k];
  const P=[];

  // real-code files for the current cursor — regenerated live on every change
  CFID=0;
  const CFG=buildConfig(s), GF=genFiles(CFG);
  const genCI=grp('Generated files — copy & ship')+codeFile('.github/workflows/main.yml',GF.mainwf)+codeFile('.github/workflows/pr.yml',GF.prwf)+codeFile('.pre-commit-config.yaml',GF.precommit);
  const genImg=grp('Generated files')+codeFile('Dockerfile',GF.dockerfile)+codeFile('.dockerignore',GF.dockerignore);
  const genGit=grp('Generated files')+codeFile('helm/values-prod.yaml',GF.helm)+codeFile('kustomize/base/kustomization.yaml',GF.kbase)+codeFile('kustomize/base/deployment.yaml',GF.kdeploy);
  const genCluster=grp('Generated manifests')+Object.entries(GF.deploy||{}).map(([n,c])=>codeFile(n,c)).join('');

  // every real decision for this service+lens, grouped by stage
  const DEC=decisionsFor(s);
  const decDeps=decBlock(DEC.deps), decBuild=decBlock(DEC.build), decComp=decBlock(DEC.compliance),
        decCI=decBlock(DEC.ci), decGit=decBlock(DEC.gitops), decCluster=decBlock(DEC.cluster), decPlat=decBlock(DEC.platform);
  // run-these commands for this service+lens
  const CMD=commandsFor(s);
  const cmdScaffold=cmdBlock('commands — scaffold',CMD.scaffold), cmdDeps=cmdBlock('commands — install',CMD.deps),
        cmdDocker=cmdBlock('commands — build & run',CMD.docker), cmdReg=cmdBlock('commands — push · sign · sbom',CMD.registry),
        cmdGitops=cmdBlock('commands — deploy',CMD.gitops), cmdCluster=cmdBlock('commands — cluster',CMD.cluster);

  // 0 Repository — switch within the same category, all 106 in the top picker
  const sib=(G.nodes.frameworks||[]).filter(f=>f.categoryId===s.fw.categoryId);
  P.push(rpanel(0,'#19C8A8','01','Repository',rtag('you','you starred this'),
    esc(s.fw.name),`${esc(LANG_HUMAN[s.lang]||s.lang)} · ${esc(s.fw.maturity||'')} · ${esc(s.fw.license||'')} · git ${esc(s.fw.serviceSlug||s.fw.id)}`,
    grp(`alternatives in ${esc(nameById('categories',s.fw.categoryId))} (${sib.length}) — all 106 in the top picker`)+
    sib.map(f=>opt('fw',f.id,f.name,(f.languages||[]).join('/'),ostate(f.id,s.fw.id),`openFw('${f.id}')`)).join('')+cmdScaffold,ch('repo')));

  // 1 Dependencies — every package manager for the language, choosable
  const pkgReq=new Set(), pkgRec=new Set([s.pkgDef]);
  P.push(rpanel(1,'#2FCD9D','02','Dependencies',rtag(s.pkgUser?'you':'rec',s.pkgUser?'your choice':'recommended default'),
    esc(nameById('pkgBuildDeep',s.pkg)),`Package manager + build tool for ${esc(LANG_HUMAN[s.lang]||s.lang)}. Lockfile committed; CI uses frozen install.`,
    decDeps+grp(`package managers (${s.pkgList.length})`)+
    (G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='pkg-mgr').map(p=>{const fit=langMatch(p.language,s.lang);return richCard('pkgBuildDeep','pkg',p,p.id===s.pkg?'chosen':(fit?'fit':'dim'),p.id===s.pkg?'selected':(fit?'applies · '+langName(s.lang):'other language'));}).join('')+
    (s.btList.length?grp(`build tools (${s.btList.length})`)+s.btList.map(p=>opt('buildtool',p.id,p.name,p.what?String(p.what).slice(0,40):'',ostate(p.id,s.buildtool,new Set(),new Set()),`openPkg('${p.id}')`)).join(''):'')+cmdDeps,ch('deps')));

  // 2 CI/CD pipeline — same for all; ARGs resolved from your picks
  P.push(rpanel(2,'#44D292','03','CI/CD pipeline',rtag('same','same for every framework'),
    `${(G.nodes.stages||[]).length}-stage pipeline`,'Standard platform pipeline. Your choices flow in as build args:',
    `<div class="rchips"><span class="chip">AUTH=${esc(s.auth.replace('auth-',''))}</span><span class="chip">ORM=${esc(s.orm.replace('orm-',''))}</span><span class="chip">RUNTIME=${esc(s.base)}</span><span class="chip">PKG=${esc(s.pkg)}</span></div>`+
    decCI+grp('phases')+(G.nodes.phases||[]).sort((a,b)=>(+a.order||0)-(+b.order||0)).map(p=>card('#44D292',p.label||p.name,p.trigger||'',`goCol(1)`,'',null)).join('')+genCI,ch('pipe')));

  // 3 Compliance — ALL 26, what applies vs what does not
  const reqSet=new Set(s.regimes);
  const allC=(G.nodes.complianceProfiles||[]);
  let compBody;
  if(s.rq){
    compBody=grp(`applies to ${esc(s.rq.name)} (${s.regimes.length})`)+
      allC.filter(c=>reqSet.has(c.id)).map(c=>card('#FFB800',c.name,c.fullName||c.regulator||'','openProfile(\''+c.id+'\')','req',null)).join('')+
      grp(`available, not required here (${allC.length-s.regimes.length})`)+
      allC.filter(c=>!reqSet.has(c.id)).map(c=>card('var(--hair)',c.name,c.fullName||'','openProfile(\''+c.id+'\')','dim',null)).join('');
  } else {
    compBody=grp(`all regimes (${allC.length}) — pick an industry to see which apply`)+
      allC.map(c=>card('var(--hair)',c.name,c.fullName||'','openProfile(\''+c.id+'\')','',null)).join('');
  }
  P.push(rpanel(3,'#5AD886','04','Compliance',s.rq?rtag('req',`${s.regimes.length} of ${allC.length} apply`):rtag('def','no industry'),
    s.rq?`${s.regimes.length} of ${allC.length} apply`:'Pick an industry',
    s.rq?`${esc(s.rq.name)} mandates the gold ones. Each forces controls into the pipeline.`:'Compliance depends on the industry you serve.',decComp+compBody,ch('comp')));

  // 4 Image & registry — every base image, choosable
  const runAll=(G.nodes.runtimeDeep||[]);
  P.push(rpanel(4,'#70DD7B','05','Image & registry',rtag(s.baseTag,s.baseTag==='req'?'required by industry':s.baseTag==='you'?'your choice':'framework default'),
    esc(baseName),esc(s.baseWhy)+' Built, signed (cosign) + SBOM, pushed to GHCR.',
    decBuild+grp(`base image (${runAll.length})`)+
    runAll.map(r=>{const req=reqRun.has(r.id);return richCard('runtimeDeep','runtime',r,r.id===s.base?'chosen':(req?'req':'avail'),r.id===s.base?'selected':(req?'recommended · lens':'available'));}).join('')+
    grp('registry')+card('#70DD7B','GHCR — ghcr.io/yarova-ca','signed image + SBOM · :sha :sha-fips','openRegistry()','',null)+genImg+cmdDocker+cmdReg,ch('img')));

  // 5 GitOps — info
  P.push(rpanel(5,'#85E270','06','GitOps delivery',rtag('same','same for every framework'),
    'Argo CD + Helm + Kustomize','Git declares desired state. Argo CD syncs it to the cluster.',
    decGit+grp(`tools (${(G.nodes.gitopsTools||[]).length})`)+(G.nodes.gitopsTools||[]).map(t=>card('#85E270',t.name,`${t.role||''} · open detail`,`openGitops('${t.id}')`,'',null)).join('')+genGit+cmdGitops,ch('gitops')));

  // 6 Cluster — every cluster, choosable
  const [ct,ctx]=pickTag(s.clusterUser,s.clusterReq);
  const clReq=new Set(s.rq?.recommendedClusterIds||[]);
  P.push(rpanel(6,'#9BE864','07','Deploy cluster',rtag(ct,ctx),
    esc(nameById('clusters',s.cluster)),s.rq?`${esc(s.rq.name)} recommends the gold ones. ${(G.nodes.clusterComponents||[]).length} platform components run here.`:`${(G.nodes.clusterComponents||[]).length} platform components.`,
    decCluster+grp(`clusters (${(G.nodes.clusters||[]).length})`)+
    (G.nodes.clusters||[]).map(c=>{const req=clReq.has(c.id);return richCard('clusters','cluster',c,c.id===s.cluster?'chosen':(req?'req':'avail'),c.id===s.cluster?'selected':(req?'recommended · lens':'available'));}).join('')+
    `<div class="sub" style="margin-top:8px">Hub-and-spoke: one Argo CD → every cluster.</div>`+genCluster+cmdCluster,ch('cluster')));

  // 7 Platform — auth, observability, ORM, all choosable
  const [at,atx]=pickTag(s.authUser,s.authReq);
  const authReqS=new Set(s.rq?.requiredAuthIds||[]), obsReqS=new Set(s.rq?.requiredObservabilityIds||[]), ormRec=new Set([s.ormDef]);
  P.push(rpanel(7,'#B0ED59','08','Platform',rtag(at,'auth: '+atx),
    esc(nameById('authDeep',s.auth)),'Auth, observability and database layer — pick any:',
    decPlat+grp(`auth (${(G.nodes.authDeep||[]).length})`)+
    (G.nodes.authDeep||[]).map(a=>{const req=authReqS.has(a.id);return richCard('authDeep','auth',a,a.id===s.auth?'chosen':(req?'req':'avail'),a.id===s.auth?'selected':(req?'required · lens':'available'));}).join('')+
    grp(`observability (${(G.nodes.observabilityDeep||[]).length})`)+
    (G.nodes.observabilityDeep||[]).map(o=>{const req=obsReqS.has(o.id);return richCard('observabilityDeep','obs',o,o.id===s.obs?'chosen':(req?'req':'avail'),o.id===s.obs?'selected':(req?'required · lens':'available'));}).join('')+
    grp(`ORM for ${esc(LANG_HUMAN[s.lang]||s.lang)} (${s.ormList.length})`)+
    (G.nodes.ormDeep||[]).map(o=>{const fit=(o.language||o.languages||[]).some(L=>langMatch(L,s.lang))||o.id==='orm-none';return richCard('ormDeep','orm',o,o.id===s.orm?'chosen':(fit?'fit':'dim'),o.id===s.orm?'selected':(fit?'fits '+langName(s.lang):'other language'));}).join(''),ch('plat')));

  // 8 Integrations — info, by industry
  let intBody,intVal,intTag;
  if(s.rq){intTag=rtag('req',`${s.integ.length} systems`);intVal=`${s.integ.length} integrations`;
    intBody=s.integ.length?(()=>{const bc=by(s.integ,'category');return Object.entries(bc).map(([c,a])=>grp(c)+a.map(g=>card('#C6F24E',g.externalSystem,`auth ${g.authOption||''} · ${g.apiGateway||''}`,`openIntegration('${g.id}')`,'',null)).join('')).join('');})():'<div class="sub">No catalogued integrations for this industry yet.</div>';}
  else{intTag=rtag('def','no industry');intVal='Pick an industry';intBody='<div class="sub">Select an industry to see its integrations.</div>';}
  P.push(rpanel(8,'#C6F24E','09','Integrations',intTag,intVal,
    s.rq?`External systems ${esc(s.rq.name)} commonly connects.`:'Integrations depend on the industry.',intBody,ch('integ')));

  LASTR=cur;
  $("#track").innerHTML=P.join('');
  observeColumns();
}

// the top bar = FILTERS. the per-axis choices (pkg, auth, orm, base, cluster)
// live INSIDE the framework's flow as decision options — pick them there.
function filteredFrameworks(){
  let list=G.nodes.frameworks||[];
  if(RS.category)list=list.filter(f=>f.categoryId===RS.category);
  if(RS.complianceFocus){const std=(REGIME_TO_STD[RS.complianceFocus]||[RS.complianceFocus])[0];
    list=list.filter(f=>((f.shipped&&f.shipped.shippedCompliance)||[]).some(c=>c.standard===std));}
  return list;
}
function renderBuilder(){
  const s=resolveStack();
  const opt=(arr,val,fn)=>arr.map(o=>`<option value="${esc(o.id)}" ${o.id===val?'selected':''}>${esc(fn?fn(o):(o.name||o.id))}</option>`).join('');
  const cats=[...(G.nodes.categories||[])].sort((a,b)=>(parseInt(a.id.replace(/\D/g,''))||0)-(parseInt(b.id.replace(/\D/g,''))||0));
  const fwList=filteredFrameworks();
  $("#builder").innerHTML=`
    <div class="pick"><label>Filter · category</label><select id="pCat"><option value="">All categories</option>${opt(cats,RS.category)}</select></div>
    <div class="pick"><label>Filter · compliance</label><select id="pComp"><option value="">Any</option>${opt(G.nodes.complianceProfiles||[],RS.complianceFocus)}</select></div>
    <div class="pick lead"><label>Framework — the service (${fwList.length})</label><select id="pFw">${opt(fwList,s.fw.id)}</select></div>
    <div class="pick lead"><label>Lens · industry</label><select id="pInd"><option value="">— none —</option>${opt(G.nodes.verticals||[],RS.industry)}</select></div>
    <div class="filterhint"><b>${esc(s.fw.name)}</b> — its own build journey below, left to right.<br>Decisions · commands · files. Pick any option inside to change it.</div>
    <div class="applegend"><span class="lg gold">applies / forced</span><span class="lg teal">available</span><span class="lg dim">not here</span><span class="lg red">gap</span></div>`;
  $("#pCat").onchange=e=>{RS.category=e.target.value;const l=filteredFrameworks();if(l.length&&!l.some(f=>f.id===RS.fw)){RS.fw=l[0].id;RS.pkg=RS.orm=RS.buildtool=null;}refreshBuild();};
  $("#pComp").onchange=e=>{RS.complianceFocus=e.target.value;const l=filteredFrameworks();if(l.length&&!l.some(f=>f.id===RS.fw)){RS.fw=l[0].id;RS.pkg=RS.orm=RS.buildtool=null;}refreshBuild();};
  $("#pFw").onchange=e=>pickAxis('fw',e.target.value);
  $("#pInd").onchange=e=>pickAxis('industry',e.target.value);
}
function refreshBuild(){renderBuilder();renderResolver();}
window.setMode=(m)=>{
  MODE=m;
  document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  const build=m==='build';
  $("#builder").classList.toggle('on',build);
  document.querySelector('.legend').style.display=build?'none':'';
  document.querySelector('.lens').style.display=build?'none':'';
  if(build){ if(!RS.fw)RS.fw=(G.nodes.frameworks||[])[0]?.id;
    $("#lensInfo").classList.remove('on');$("#track").classList.remove('lensed');
    LASTR={};renderBuilder();renderResolver();
  } else { renderLensInfo();renderBoard(); }
};

async function boot(){
  try{ G=await (await fetch("graph.json")).json(); }
  catch(e){ $("#track").innerHTML=`<div class="err">Could not load graph.json.<br>${e}</div>`; return; }
  const lv=$("#lensV");
  for(const v of (G.nodes.verticals||[])){const o=document.createElement("option");o.value=v.id;o.textContent=v.name||v.id;lv.appendChild(o);}
  // restore lens from hash
  const h=new URLSearchParams(location.hash.slice(1));
  if(h.get('lens')&&(G.nodes.verticals||[]).some(v=>v.id===h.get('lens'))){lv.value=h.get('lens');setLens(h.get('lens'));}
  lv.onchange=e=>{setLens(e.target.value);location.hash=e.target.value?`lens=${e.target.value}`:'';renderLensInfo();renderHero();renderBoard();};
  renderHero();renderLensInfo();renderBoard();
}
boot();
