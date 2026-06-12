import * as GEN from "./generators.js";
let G=null, K={}, LENS={vertical:""}, REQ=null;
// the user's decisions — made explicitly, persisted, never pre-made
const DECIDED=JSON.parse(localStorage.getItem('ys-decided')||'{}');
function decide(scene){DECIDED[scene]=true;localStorage.setItem('ys-decided',JSON.stringify(DECIDED));}

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
// journey rails — catalog browses; build follows the real order:
// repo → deps → container image → CI/CD → compliance → registry/gitops → cluster → platform → sign-off
const STAGES_CATALOG=[
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
// the 13 scenes — reality's order, locked with the founder
const STAGES_BUILD=[
  ['who','1 · Who it’s for','#19C8A8'],
  ['fw','2 · Framework','#21CAA1'],
  ['scaffold','3 · Scaffold','#2ACD9A'],
  ['app','4 · Write the app','#33CF93'],
  ['local','5 · Local loop','#3CD18C'],
  ['image','6 · Containerize','#45D385'],
  ['pr','7 · PR gate','#4ED67E'],
  ['main','8 · Build → registry','#58D877'],
  ['declare','9 · Declare deploy','#62DA70'],
  ['cluster','10 · GitOps → cluster','#6CDC69'],
  ['observe','11 · Run + observe','#77DF62'],
  ['connect','12 · Connect','#82E15B'],
  ['signoff','13 · Sign-off','#8DE354'],
  ['update','14 · Update loop','#98E64E'],
  ['upgrade','15 · Upgrade','#A3E847'],
  ['protect','16 · Protect','#AEEA41'],
  ['respond','17 · Respond','#B9EC3B'],
  ['evolve','18 · Evolve & retire','#C6F24E'],
];
let STAGES=STAGES_CATALOG;

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
    svg+=`<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${on?'#B45309':'rgba(14,15,17,.15)'}" stroke-width="${on?2:1}"/>`;}
  for(const p of pts){const on=RC.has(p.c.id);
    svg+=`<g style="cursor:pointer" onclick="openCluster('${p.c.id}')">
      <circle cx="${p.x}" cy="${p.y}" r="22" fill="${on?'rgba(180,83,9,.10)':'#FFFFFF'}" stroke="${on?'#B45309':'#0B7A66'}" stroke-width="${on?2:1.2}"/>
      <text x="${p.x}" y="${p.y+4}" text-anchor="middle" fill="${on?'#B45309':'rgba(14,15,17,.68)'}" font-size="11" font-family="Outfit">${esc(p.c.name||p.c.id)}</text></g>`;}
  svg+=`<circle cx="${cx}" cy="${cy}" r="26" fill="rgba(25,200,168,.12)" stroke="#0B7A66" stroke-width="1.6"/>
    <text x="${cx}" y="${cy-2}" text-anchor="middle" fill="#0B7A66" font-size="11" font-family="Outfit">Argo CD</text>
    <text x="${cx}" y="${cy+11}" text-anchor="middle" fill="rgba(14,15,17,.56)" font-size="9" font-family="Outfit">hub</text></svg>`;
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
  if(MODE==='build'){
    const lens=!!RS.industry;
    return [
      {c:'16 industries · 26 regimes',req:lens},
      {c:(n.frameworks||[]).length+' to pick from'},
      {c:'repo + 13 managers'},
      {c:'auth · ORM · observability',req:lens},
      {c:'build tools + hooks'},
      {c:(n.runtimeDeep||[]).length+' runtimes',req:lens},
      {c:'every scan, all tools'},
      {c:'sign · SBOM · 9 registries'},
      {c:'Helm + Kustomize'},
      {c:(n.clusters||[]).length+' clusters · '+(n.clusterComponents||[]).length+' comps',req:lens},
      {c:'SRE: signals · SLOs',req:lens},
      {c:'integrations',req:lens},
      {c:'audit + release',req:lens},
      {c:'weekly · auto-PRs'},
      {c:'quarterly · k8s'},
      {c:'certs · backups · drills'},
      {c:'the 2am runbook'},
      {c:'EOL · cost · sunset'},
    ];
  }
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
  $("#hrail").innerHTML=STAGES.map((s,i)=>{
    const done=MODE==='build'&&DECIDED['s'+(i+1)];
    return `<div class="hnode${counts[i].req?' req':''}${done?' done':''}" data-i="${i}" style="--accent:${s[2]}" tabindex="0" role="button"
       aria-label="${esc(s[1])}, jump to column"
       onclick="goCol(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goCol(${i})}">
       <span class="dotn">${done?'✓':i+1}</span><span class="hl">${esc(s[1])}</span><span class="hc">${esc(counts[i].c)}</span>
    </div>`}
  ).join('');
}
window.goCol=(i)=>{const c=$(`#col-${i}`);if(c)c.scrollIntoView({behavior:'smooth',inline:'start',block:'nearest'});
  if(MODE==='build'){const h=new URLSearchParams(location.hash.slice(1));h.set('scene',String(i+1));if(RS.industry)h.set('industry',RS.industry);history.replaceState(null,'','#'+h.toString());}};
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
const RS={fw:null,industry:'',category:'',complianceFocus:'',pkg:null,buildtool:null,orm:null,auth:null,obs:null,runtime:null,cluster:null,region:null,registry:'ghcr',signer:'cosign',sbom:'syft'};
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
  if(axis==='industry'&&id){decide('s1');localStorage.setItem('ys-industry',id);}
  if(axis==='industry'){RS.auth=null;RS.obs=null;RS.cluster=null;RS.runtime=null;}
  if(axis==='fw'){RS.pkg=null;RS.buildtool=null;RS.orm=null;}
  refreshBuild();
};
function rtag(kind,txt){return `<span class="rtag ${kind}">${esc(txt)}</span>`;}
function pickTag(user,req){return user?['you','your choice']:req?['req','required by industry']:['def','default'];}
function rpanel(idx,accent,n,name,tagHtml,valHtml,whyHtml,bodyHtml,changed){
  const sn=String(idx+1);
  const sc=(K.scenes||{})[sn]||{}, st=(K.sceneStd||{})[sn]||{};
  const plain=sc.plain?`<div class="plain"><span class="plainlabel">in plain words</span>${esc(sc.plain)}</div>`:'';
  // Q3 who/when/prereqs — before you start
  const pre=(st.who||st.prereqs)?`<div class="prereq"><div class="krow"><span class="kk">who · when</span><span class="kvv">${esc(st.who||'')} — ${esc(st.when||'')}</span></div>${(st.prereqs&&st.prereqs.length)?`<div class="krow"><span class="kk">before you start</span><span class="kvv">${st.prereqs.map(esc).join(' · ')}</span></div>`:''}</div>`:'';
  // Q6 threat
  const threat=st.threat?`<div class="threat"><span class="tlabel">the threat this stops</span>${esc(st.threat)}</div>`:'';
  // Q4b rejected + Q2b skip
  const rej=st.rejected?`<div class="rejected"><b>The road not taken:</b> ${esc(st.rejected.path)}<div class="sub">Why not: ${esc(st.rejected.why)}</div></div>`:'';
  const skip=st.skipWhen?`<div class="skipwhen"><b>Skip when:</b> ${esc(st.skipWhen)}</div>`:'';
  // Q9 done when + Q10 breaks
  const done=st.doneWhen?`<div class="donewhen"><span class="dlabel">✓ done when</span>${esc(st.doneWhen)}</div>`:'';
  const brk=(st.breaks&&st.breaks.length)?`<div class="breaks"><span class="blabel">when it breaks</span>${st.breaks.map(b=>`<div class="brow"><span class="bsym">${esc(b.symptom)}</span><span class="bfix">→ ${esc(b.fix)}</span></div>`).join('')}</div>`:'';
  // Q11+12 meta strip
  const docsUrl=st.docs==='dynamic:framework'?'':st.docs;
  const meta=(st.time||st.cost||st.docs)?`<div class="metastrip"><span class="mt">⏱ ${esc(st.time||'')}</span><span class="mt">💲 ${esc(st.cost||'')}</span>${docsUrl?`<a class="mt" href="${esc(docsUrl)}" target="_blank" rel="noopener">official docs ↗</a>`:''}<span class="mt sub">verified ${esc((K._meta||{}).updated||'')}</span></div>`:'';
  const youhave=sc.youHave?`<div class="youhave"><b>✓ You now have:</b> ${esc(sc.youHave)}${sc.next?` <span class="nexthint">· Next: ${esc(sc.next)} →</span>`:''}</div>`:'';
  return `<section class="col rcol${changed?' changed':''}" id="col-${idx}" style="--accent:${accent}">
    <div class="rhead">${tagHtml}<div class="n" style="color:${accent}">${esc(n)} · ${esc(name)}</div>
      <div class="rval">${valHtml}</div><div class="rwhy">${whyHtml}</div></div>
    <div class="colbody">${plain}${pre}${threat}${bodyHtml}${rej}${skip}${done}${brk}${meta}${youhave}</div>${idx<17?'<div class="rconn">→</div>':''}</section>`;
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
  return{feKey:k.feKey,beKey:k.beKey,ciKey:'github-actions',regKey:RS.registry||'ghcr',
    compliance:comp[0],compliance2:comp[1],industry:s.rq?s.rq.id:'',
    cd:'argocd',gitops:'same-repo',scanner:'trivy',signing:RS.signer||'cosign',sbom:RS.sbom||'syft',
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
  return `<div class="dcard ${cls}"><div class="dq">${esc(d.q)}${d.disc?` <span class="disc ${d.disc.toLowerCase()}">${d.disc}</span>`:''}</div>`+
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
  D.build.push({q:'Runtime variant',answer:rtAns,options:sh.runtimeVariants||['alpine','fips'],verdict:rtForced?'forced':'set',why:rtForced?rtWhy:'Shipped default runtime base.',disc:rtForced?'DevSecOps':'DevOps'});
  const tgt=(rtAns==='fips')?'runtime-fips':'runtime';
  D.build.push({q:'Dockerfile target',answer:tgt,options:(sh.dockerfileTargets||[]).filter(t=>/^runtime|^base-(alpine|fips|slim)/.test(t)),verdict:rtForced?'forced':'set',why:'Final image stage built.'});
  // compliance
  for(const id of (s.regimes||[])){
    const std=(REGIME_TO_STD[id]||[])[0], c=std&&compByStd[std];
    D.compliance.push({q:nameById('complianceProfiles',id),answer:c?'profile shipped':'no shipped profile',options:[],verdict:c?'required':'gap',
      why:c?('Forces '+((c.buildArgs&&Object.keys(c.buildArgs).length)?Object.entries(c.buildArgs).map(([k,v])=>k+'='+v).join(', '):'controls only')+'. Controls: '+((c.requiredControls||[]).slice(0,4).join(', ')||'—')+'.'):'Needs a compliance profile.'});
  }
  // platform middleware
  D.platform.push({q:'Auth',answer:mw.auth?nameById('authDeep',s.auth):'none',options:(G.nodes.authDeep||[]).map(a=>a.name),verdict:mw.auth?(reqAuth?'required':'set'):(reqAuth?'gap':'off'),why:reqAuth?(mw.auth?'Required by compliance — present.':'Required by '+[...stds].join('/')+' — MISSING.'):'Auth middleware shipped.',disc:'DevSecOps'});
  D.platform.push({q:'Audit logging',answer:mw.audit?'on':'off',options:['on','off'],verdict:mw.audit?(needAudit?'required':'set'):(needAudit?'gap':'off'),why:needAudit?(mw.audit?'Required and present.':'HIPAA/PCI require immutable audit logs — OFF in this service.'):'Not enabled.',disc:'DevSecOps'});
  D.platform.push({q:'RBAC',answer:mw.rbac?'on':'off',options:['on','off'],verdict:mw.rbac?'set':'off',why:'Role-based access control middleware.',disc:'DevSecOps'});
  D.platform.push({q:'Circuit breaker',answer:mw.circuitBreaker?'on':'off',options:['on','off'],verdict:mw.circuitBreaker?'set':'off',why:'Resilience on downstream calls.',disc:'SRE'});
  D.platform.push({q:'Observability',answer:sh.observabilityDetected?'enabled (logs + metrics)':'none',options:(G.nodes.observabilityDeep||[]).map(o=>o.name),verdict:sh.observabilityDetected?(needObs?'required':'set'):(needObs?'gap':'off'),why:sh.observabilityDetected?'Detected: structured logs + Prometheus metrics.':(needObs?'Audit/telemetry required by compliance — none detected.':'None detected.'),disc:'SRE'});
  D.platform.push({q:'ORM / data layer',answer:sh.ormDetected?(sh.ormName||'detected'):'none (raw SQL / no DB)',options:(s.ormList||[]).map(o=>o.name),verdict:'set',why:'',disc:'DevOps'});
  // ci — the real shipped workflows
  for(const w of (sh.workflows||[]))D.ci.push({q:w.name||w.file,answer:'enabled',options:[],verdict:'set',why:(w.jobs||[]).length?'Jobs: '+(w.jobs||[]).join(', '):'',disc:discipline((w.name||'')+' '+(w.jobs||[]).join(' '))});
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
  const app=s.fw.serviceSlug||'my-app', port=(s.tmpl&&s.tmpl.port)||'8080';
  const regMeta=(K.registries||[]).find(r=>r.id===(RS.registry||'ghcr'))||{};
  const regHost=regMeta.host||'ghcr.io/yarova-ca', regName=regMeta.name||'GHCR', regLogin=regMeta.login||'docker login';
  const stds=reqStds(s), shippedComp=(s.fw.shipped&&s.fw.shipped.shippedCompliance)||[], ba=(s.fw.shipped&&s.fw.shipped.buildArgs)||{};
  let rt=ba.RUNTIME||'alpine';
  for(const std of stds){const c=shippedComp.find(x=>x.standard===std); if(c&&c.buildArgs&&c.buildArgs.RUNTIME)rt=c.buildArgs.RUNTIME;}
  const tgt=rt==='fips'?'runtime-fips':'runtime';
  return {
    scaffold:[{label:'Scaffold the service',cmd:scaffoldCmd(s),expect:'a new folder with the project files inside'}],
    deps:[{label:'Install dependencies (frozen lockfile)',cmd:INSTALL[(PKG_MAP[s.pkg]||s.pkg)]||'npm ci',expect:'packages install with zero version drift'}],
    docker:[{label:'Build the image',cmd:`docker build -t ${regHost}/${app}:dev --target ${tgt} .`,expect:'ends with: naming to '+regHost+'/'+app+':dev'},{label:'Run it locally',cmd:`docker run --rm -p ${port}:${port} ${regHost}/${app}:dev`,expect:'the app answers on http://localhost:'+port}],
    registry:[{label:'Log in to '+regName,cmd:regLogin,expect:'Login Succeeded'},{label:'Push the image',cmd:`docker push ${regHost}/${app}:$(git rev-parse --short HEAD)`,expect:'layers pushed; digest printed'},{label:'Sign it ('+(RS.signer||'cosign')+')',cmd:(RS.signer==='notation'?`notation sign ${regHost}/${app}@$DIGEST`:`cosign sign --yes ${regHost}/${app}@$DIGEST`),expect:'signature stored alongside the image'},{label:'Attach an SBOM ('+(RS.sbom||'syft')+')',cmd:(RS.sbom==='cdxgen'?'cdxgen -o sbom.cdx.json':RS.sbom==='trivy'?`trivy image --format spdx-json -o sbom.json ${regHost}/${app}:dev`:`syft ${regHost}/${app}:dev -o spdx-json > sbom.spdx.json`),expect:'an SBOM file — the ingredient list'}],
    gitops:[{label:'Helm — install / upgrade',cmd:`helm upgrade --install ${app} ./helm -n prod --create-namespace -f helm/values-prod.yaml`,expect:'STATUS: deployed'},{label:'Kustomize — render + apply',cmd:'kustomize build kustomize/overlays/prod | kubectl apply -f -',expect:'deployment.apps/'+app+' created'},{label:'Argo CD — register the app',cmd:`argocd app create ${app} --repo https://github.com/yarova-ca/${app}.git --path kustomize/overlays/prod --dest-server https://kubernetes.default.svc --dest-namespace prod --sync-policy automated`,expect:"application '"+app+"' created"}],
    cluster:[{label:'Point kubectl at the cluster',cmd:`kubectl config use-context ${s.cluster}`,expect:'Switched to context'},{label:'Verify the rollout',cmd:`kubectl rollout status deploy/${app} -n prod`,expect:'deployment "'+app+'" successfully rolled out'}],
  };
}
function cmdBlock(title,arr){ if(!arr||!arr.length)return'';
  return grp(title)+arr.map((c,i)=>{const id='cmd'+(CFID++);
    return `<div class="cmd"><div class="cmdlabel"><span><span class="cmdn">${i+1}</span>${esc(c.label)}</span><button class="gencopy" onclick="copyCode('${id}',this)">copy</button></div><pre class="cmdcode" id="${id}">${esc(c.cmd)}</pre>${c.expect?`<div class="expect">you'll see: ${esc(c.expect)}</div>`:''}</div>`;}).join(''); }

// ── rich knowledge cards: show ALL options, full info each, applies/available ─
// full knowledge, inline in the flow — nothing summarized away.
const KFIELDS={
  pkgBuildDeep:[['what','what it is'],['lockfile','lockfile'],['speedNote','speed'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['implementation','implementation']],
  runtimeDeep:[['what','what it is'],['baseOs','distro / kernel base'],['sizeMb','size (MB)'],['shell','shell'],['fipsCertified','FIPS validated'],['attackSurface','attack surface'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['complianceFit','compliance fit'],['implementation','FROM line']],
  authDeep:[['what','what it is'],['howItWorks','how it works'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['complianceFit','compliance fit'],['implementation','implementation']],
  observabilityDeep:[['what','what it is'],['pillars','pillars'],['cost','cost'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['implementation','implementation']],
  ormDeep:[['what','what it is'],['typeSafety','type safety'],['perf','performance'],['migrations','migrations'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['complianceNote','compliance note'],['implementation','implementation']],
  clusters:[['cloud','cloud'],['secretIdentity','workload identity'],['defaultStorageClass','storage class'],['evidence','notes']],
  frameworks:[['renderingModes','rendering modes'],['hydration','hydration'],['runtimeTarget','runtime target'],['perf','performance'],['memory','memory'],['concurrency','concurrency'],['scaling','scaling'],['securityPosture','security posture'],['bundleSize','bundle size'],['ecosystem','ecosystem'],['whenToUse','when to use'],['whenNot','when NOT'],['tradeoff','trade-off'],['maintainedBy','maintained by'],['license','license'],['version','version']],
};
// discipline classification — which engineering practice owns this step
function discipline(text){
  const t=String(text||'').toLowerCase();
  if(/sast|sca|codeql|secret|sign|cosign|sbom|trivy|iac|scan|compliance|vuln|license-scan/.test(t))return'DevSecOps';
  if(/observ|otel|metric|prom|slo|sla|incident|alert|notify|rollout|monitor/.test(t))return'SRE';
  return'DevOps';
}
function discTag(text){const d=discipline(text);return `<span class="disc ${d.toLowerCase()}">${d}</span>`;}
function kval(v){ if(v==null||v==='')return''; if(Array.isArray(v))return v.join(', '); if(typeof v==='object')return Object.entries(v).map(([k,x])=>`${k}: ${x}`).join('  ·  '); return String(v); }
const langName=(l)=>LANG_HUMAN[l]||l;
// one clean line for a collapsed row — a complete sentence, never a mid-word cut
function firstSentence(t){t=stripTags(String(t||''));
  let i=-1,from=0;
  while(true){const j=t.indexOf('. ',from);if(j<0)break;
    const back=t.slice(Math.max(0,j-4),j+1);
    if(/(e\.g|i\.e|etc|vs|cf)\.$/.test(back)){from=j+2;continue;}
    i=j;break;}
  if(i>0&&i<150)return t.slice(0,i+1);
  if(t.length<=150)return t;
  const sp=t.lastIndexOf(' ',147);return t.slice(0,sp>60?sp:147)+'…';}
function essence(node,o){
  if(node==='runtimeDeep')return `${o.baseOs||''} · ${o.sizeMb?o.sizeMb+' MB':''} · ${o.fipsCertified==='yes'?'FIPS':'no FIPS'}`;
  if(node==='clusters')return `${o.cloud||''} · ${o.secretIdentity||''}`;
  if(node==='ormDeep')return `${(o.language||[]).join('/')||''}${o.typeSafety?' · '+firstSentence(o.typeSafety):''}`;
  if(node==='pkgBuildDeep')return `${o.language||''} · ${firstSentence(o.what)}`;
  return firstSentence(o.what||o.howItWorks||'');
}
// option as an accordion row: one-line summary, full knowledge expands in flow
function accRow(node,axis,o,state,tag,open){
  const rows=(KFIELDS[node]||[]).map(([k,l])=>{const v=kval(o[k]);return v?`<div class="krow"><span class="kk">${esc(l)}</span><span class="kvv">${esc(v)}</span></div>`:'';}).join('');
  const sel=axis?`<button class="aselect${state==='chosen'?' on':''}" onclick="event.preventDefault();event.stopPropagation();pickAxis('${axis}','${o.id}')">${state==='chosen'?'✓ selected':'select'}</button>`:'';
  return `<details class="acc ${state}"${open?' open':''}><summary><span class="caret">▸</span><span class="an">${esc(o.name)}</span><span class="am">${esc(essence(node,o))}</span>${tag?`<span class="ktag ${state}">${esc(tag)}</span>`:''}${sel}</summary><div class="accbody">${rows}</div></details>`;
}
// generated file as a named row; expand → the complete file
function fileAcc(name,text,open){
  if(!text||typeof text!=='string')return'';
  const id='cf'+(CFID++);
  return `<details class="facc"${open?' open':''}><summary><span class="caret">▸</span><span class="genname">${esc(name)}</span><span class="sub">${text.split('\n').length} lines</span><button class="gencopy" onclick="event.preventDefault();event.stopPropagation();copyCode('${id}',this)">copy</button></summary><pre class="gencode" id="${id}">${esc(text)}</pre></details>`;
}
// the chosen framework's knowledge, open in the flow (full text, no cuts)
function kcardRO(node,o,tag,drawer){
  const rows=(KFIELDS[node]||[]).map(([k,l])=>{const v=kval(o[k]);return v?`<div class="krow"><span class="kk">${esc(l)}</span><span class="kvv">${esc(v)}</span></div>`:'';}).join('');
  return `<div class="kcard chosen"><div class="khead"><b>${esc(o.name)}</b>${tag?`<span class="ktag chosen">${esc(tag)}</span>`:''}<button class="kmore" onclick="${drawer}">full record →</button></div>${rows}</div>`;
}
// the stack bar — your current stack, always visible, chips jump to stages
function renderStackBar(s,DEC){
  const el=$("#stackbar"); if(!el)return;
  const gaps=[...(DEC.compliance||[]),...(DEC.platform||[])].filter(d=>d.verdict==='gap').length;
  const rt=(G.nodes.runtimeDeep||[]).find(r=>r.id===s.base);
  const short=(t)=>String(t||'').split(' (')[0].split(' — ')[0];
  const chips=[[0,RS.industry?short(nameById('verticals',RS.industry)):'no industry'],[1,s.fw.name],[2,short(nameById('pkgBuildDeep',s.pkg))],[3,short(nameById('authDeep',s.auth))],[3,short(nameById('ormDeep',s.orm))],[3,short(nameById('observabilityDeep',s.obs))],[5,short(rt?rt.name:s.base)],[9,short(nameById('clusters',s.cluster))]];
  el.innerHTML=`<span class="sblabel">your stack</span>`+
    chips.map(([i,n])=>`<button class="sbchip" onclick="goCol(${i})">${esc(n)}</button>`).join('<span class="sbsep">›</span>')+
    `<span class="sbhealth ${gaps?'bad':'good'}">${s.rq?s.regimes.length+' regimes · '+gaps+' gap'+(gaps===1?'':'s'):'no industry lens'}</span>`;
}
function libBlock(s){
  const libs=((s.fw.shipped&&s.fw.shipped.libraries)||[]).filter(l=>l.direct);
  if(!libs.length)return'';
  return grp(`shipped libraries (${libs.length} direct)`)+`<div class="libwrap">`+libs.map(l=>`<span class="lib">${esc(l.name)} <span class="libv">${esc(l.version)}</span></span>`).join('')+`</div>`;
}
// final checklist — the decisions to make for compliance + security
function checklistBlock(s,DEC){
  const items=[];
  (DEC.compliance||[]).forEach(d=>items.push({area:'Compliance',q:d.q,state:d.verdict==='gap'?'gap':'ok',note:d.why}));
  (DEC.build||[]).filter(d=>d.verdict==='forced').forEach(d=>items.push({area:'Security · build',q:`${d.q} → ${d.answer}`,state:'forced',note:d.why}));
  (DEC.platform||[]).filter(d=>/Auth|Audit|RBAC|Observability/.test(d.q)).forEach(d=>items.push({area:'Security · platform',q:`${d.q}: ${d.answer}`,state:d.verdict==='gap'?'gap':(d.verdict==='required'?'ok':'note'),note:d.why}));
  if(!items.length)return'<div class="sub">Pick an industry to generate the checklist.</div>';
  const SCENE_OF={'Compliance':[1,'Scene 1'],'Security · build':[6,'Scene 6'],'Security · platform':[4,'Scene 4']};
  const ic={ok:'✓',gap:'✗',forced:'🔒',note:'•'};
  const byArea={}; items.forEach(i=>{(byArea[i.area]||=[]).push(i);});
  const gaps=items.filter(i=>i.state==='gap').length;
  return `<div class="sub" style="margin-bottom:8px">${items.length} decisions · <b style="color:${gaps?'#e8615a':'var(--teal)'}">${gaps} open gap${gaps===1?'':'s'}</b> for ${esc(s.rq?s.rq.name:'this stack')}.</div>`+
    Object.entries(byArea).map(([area,arr])=>grp(area)+arr.map(i=>
      `<div class="chk ${i.state}"><span class="chki">${ic[i.state]}</span><div><div class="chkq">${esc(i.q)}</div>${i.note?`<div class="chkn">${esc(stripTags(i.note))}</div>`:''}</div>${SCENE_OF[area]?`<button class="scjump" onclick="goCol(${SCENE_OF[area][0]-1})">${SCENE_OF[area][1]} →</button>`:''}</div>`).join('')).join('');
}

// ── emitted SRE files: real, droppable starters built from your stack ───────
function alertRulesYaml(s){
  const app=s.fw.serviceSlug||'app';
  return `# Prometheus alert rules — starter pack for ${app}
# Drop into your rule files; tune thresholds to your SLO.
groups:
- name: ${app}-golden-signals
  rules:
  - alert: HighErrorRate
    expr: sum(rate(http_requests_total{job="${app}",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="${app}"}[5m])) > 0.01
    for: 5m
    labels: {severity: page}
    annotations: {summary: ">1% of requests are failing for 5m"}
  - alert: HighLatencyP99
    expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job="${app}"}[5m])) by (le)) > 1
    for: 5m
    labels: {severity: page}
    annotations: {summary: "p99 latency above 1s for 5m"}
  - alert: PodCrashLooping
    expr: increase(kube_pod_container_status_restarts_total{namespace="prod",pod=~"${app}.*"}[10m]) > 3
    for: 0m
    labels: {severity: page}
    annotations: {summary: "pod restarting repeatedly"}
  - alert: DeploymentReplicasUnavailable
    expr: kube_deployment_status_replicas_unavailable{deployment="${app}",namespace="prod"} > 0
    for: 5m
    labels: {severity: ticket}
    annotations: {summary: "desired replicas not available for 5m"}
  - alert: PVCAlmostFull
    expr: kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.85
    for: 10m
    labels: {severity: ticket}
    annotations: {summary: "volume above 85% capacity"}
`;}
function dashboardJson(s){
  const app=s.fw.serviceSlug||'app';
  const panel=(title,expr,x,y)=>({title,type:'timeseries',gridPos:{h:8,w:12,x,y},targets:[{expr,refId:'A'}]});
  return JSON.stringify({title:app+' — golden signals',uid:app+'-golden',tags:['yarova-studio','golden-signals'],time:{from:'now-6h',to:'now'},panels:[
    panel('Latency p99 (s)','histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job="'+app+'"}[5m])) by (le))',0,0),
    panel('Traffic (req/s)','sum(rate(http_requests_total{job="'+app+'"}[5m]))',12,0),
    panel('Errors (% 5xx)','100 * sum(rate(http_requests_total{job="'+app+'",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="'+app+'"}[5m]))',0,8),
    panel('Saturation (CPU vs limit)','sum(rate(container_cpu_usage_seconds_total{pod=~"'+app+'.*"}[5m])) / sum(kube_pod_container_resource_limits{resource="cpu",pod=~"'+app+'.*"})',12,8)
  ]},null,2);}
window.copyAudit=(btn)=>{const el=document.querySelector('#col-12 .colbody');if(!el)return;
  navigator.clipboard.writeText(el.innerText).then(()=>{const t=btn.textContent;btn.textContent='copied ✓';setTimeout(()=>btn.textContent=t,1200);});};
window.openGlossary=()=>{
  const terms=(K.glossary||[]);
  openDrawer('Glossary — every term, plainly',
    `<div class="sub" style="margin-bottom:10px">${terms.length} terms. No prior knowledge assumed.</div>`+
    terms.map(t=>`<div class="gterm"><b>${esc(t.term)}</b>${t.full?` <span class="sub">(${esc(t.full)})</span>`:''}<div class="gdef">${esc(t.def)}</div></div>`).join(''));};

// ── the 13 scenes: reality's order, full coverage, live lens ─────────────────
function industryMatrix(kind){
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
const sceneNote=(n)=>K.sceneNotes&&K.sceneNotes[n]?`<div class="scenenote">${esc(K.sceneNotes[n])}</div>`:'';
function altRow(o,extra,axis,chosenId){
  const fields=[['what','what'],['pick','pick when'],['avoid','avoid when'],['tradeoff','trade-off'],['setup','setup'],['login','login command'],['command','command'],['format','format'],['residency','residency'],['license','license']];
  const rows=fields.map(([k,l])=>o[k]?`<div class="krow"><span class="kk">${esc(l)}</span><span class="kvv">${esc(o[k])}</span></div>`:'').join('');
  const chosen=axis&&o.id===chosenId;
  const sel=axis?`<button class="aselect${chosen?' on':''}" onclick="event.preventDefault();event.stopPropagation();pickAxis('${axis}','${o.id}')">${chosen?'✓ selected':'select'}</button>`:'';
  return `<details class="acc ${chosen?'chosen':'fit'}"${chosen?' open':''}><summary><span class="caret">▸</span><span class="an">${esc(o.name)}</span><span class="am">${esc(firstSentence(o.what||o.pick||''))}</span>${extra||''}${sel}</summary><div class="accbody">${rows}</div></details>`;
}
function renderResolver(){
  const s=resolveStack();
  const rdBase=(G.nodes.runtimeDeep||[]).find(x=>x.id===s.base);
  const baseName=rdBase?rdBase.name:s.base;
  const reqRun=new Set([...(s.rq?.recommendedRuntimeIds||[])]);
  const cur={who:RS.industry||'',fw:s.fw.id,scaffold:s.pkg,app:`${s.auth}|${s.orm}|${s.obs}`,local:s.buildtool||'',
    img:s.base,pr:'pr',main:'main',declare:'d',cluster:s.cluster,observe:s.obs,connect:s.integ.length+':'+RS.industry,signoff:s.regimes.join(','),update:'u',upgrade:s.cluster,protect:'p',respond:RS.industry||'',evolve:'e'};
  const ch=(k)=>LASTR[k]!=null&&LASTR[k]!==cur[k];
  const P=[];

  CFID=0;
  const CFG=buildConfig(s), GF=genFiles(CFG);
  const DEC=decisionsFor(s);
  const forced=(DEC.build||[]).filter(d=>d.verdict==='forced');
  const forcedNote=forced.length?`<div class="forcenote">🔒 ${forced.map(d=>`<b>${esc(d.q)}</b> → ${esc(d.answer)}`).join(' · ')}<div class="sub">${esc(stripTags(forced[0].why||''))}</div></div>`:'';
  renderStackBar(s,DEC);
  const CMD=commandsFor(s);
  const cmdScaffold=cmdBlock('commands — scaffold',CMD.scaffold), cmdDeps=cmdBlock('commands — install',CMD.deps),
        cmdDocker=cmdBlock('commands — build & run locally',CMD.docker),
        cmdGitops=cmdBlock('commands — deploy',CMD.gitops), cmdCluster=cmdBlock('commands — cluster',CMD.cluster);

  // shared joins
  const allC=(G.nodes.complianceProfiles||[]);
  const reqSet=new Set(s.regimes);
  const shComp={};((s.fw.shipped&&s.fw.shipped.shippedCompliance)||[]).forEach(c=>{shComp[c.standard]=c;});
  const stdOf=(id)=>(REGIME_TO_STD[id]||[])[0];
  const toolsByStage={};(G.nodes.tools||[]).forEach(t=>{(toolsByStage[t.stage]||=[]).push(t);});
  const stByPhase={};(G.nodes.stages||[]).forEach(st=>{(stByPhase[st.phaseId]||=[]).push(st);});
  const phases=(G.nodes.phases||[]).sort((a,b)=>(+a.order||0)-(+b.order||0));
  const deltaSrc=((G.pipelines||[]).find(p=>p.complianceDeltas&&p.complianceDeltas.length)||{}).complianceDeltas||[];
  const myStds=[...reqStds(s)];
  const myDeltas=deltaSrc.filter(d=>myStds.some(std=>String(d.standardId||d.standard||'').toLowerCase().includes(std)));
  const stageRow=(st)=>{const tools=toolsByStage[st.name]||[];
    const d=(st.type||'').toLowerCase().includes('sec')?'DevSecOps':discipline(st.name+' '+tools.map(t=>t.tool).join(' '));
    const toolNames=tools.map(t=>t.tool).join(' · ')||'process step';
    const body=tools.length?tools.map(t=>
      `<div class="krow"><span class="kk">tool</span><span class="kvv"><b>${esc(t.tool)}</b> · ${esc(t.license||'')}${/yes/i.test(t.mandatory||'')?' · mandatory':''}</span></div>`+
      (t.whenToUse?`<div class="krow"><span class="kk">use when</span><span class="kvv">${esc(stripTags(t.whenToUse))}</span></div>`:'')+
      (t.whenNot?`<div class="krow"><span class="kk">skip when</span><span class="kvv">${esc(stripTags(t.whenNot))}</span></div>`:'')+
      (t.output?`<div class="krow"><span class="kk">output</span><span class="kvv">${esc(t.output)}${t.ciIntegration?' · '+esc(t.ciIntegration):''}</span></div>`:'')+
      (t.primaryTradeoff?`<div class="krow"><span class="kk">trade-off</span><span class="kvv">${esc(stripTags(t.primaryTradeoff))}</span></div>`:'')
    ).join('<div style="height:8px"></div>'):'<div class="sub">Process step — enforced by configuration, no external tool.</div>';
    return `<details class="acc fit"><summary><span class="caret">▸</span><span class="an">${esc(st.name)}</span><span class="am">${esc(toolNames)}</span><span class="disc ${d.toLowerCase()}">${d}</span></summary><div class="accbody">${body}</div></details>`;};
  const phaseScene=(pid)=>{const ph=phases.find(p=>p.id===pid);if(!ph)return{rows:'',adds:''};
    const rows=(stByPhase[pid]||[]).map(stageRow).join('');
    const adds=myDeltas.map(d=>{const txt=(d.phases||{})[ph.phaseNum||('Phase '+ph.order)]||(d.phases||{})[ph.name];
      return txt?`<div class="forcenote" style="margin-top:6px">🔶 <b>${esc(d.standard||d.standardId)}</b> adds: ${esc(stripTags(txt))}</div>`:'';}).join('');
    return {rows,adds,ph};};
  const slotBlock=(slot)=>grp(`${slot.slot} — ${slot.what}`)+slot.options.map(o=>altRow(o)).join('');

  // ── SCENE 1 · Who it's for ────────────────────────────────────────────────
  const ind=(G.nodes.industryRequirements||[]);
  const rqSel=s.rq;
  const regimeChip=(id)=>{const c=(G.nodes.complianceProfiles||[]).find(x=>x.id===id)||{};
    return `<button class="regchip" onclick="openProfile('${id}')" title="${esc(c.fullName||'')}">${esc(c.name||id)}<span class="regfull">${esc(c.fullName||'')}</span></button>`;};
  const bar=(label,text,where)=>{text=stripTags(String(text||''));
    return `<details class="rbbar"><summary><span class="kk">${esc(label)}</span><span class="kvv">${esc(firstSentence(text))}</span><span class="caret">▸</span></summary><div class="rbfull">${esc(text)}<div class="rbwhere">${esc(where)}</div></div></details>`;};
  const rulebook=rqSel?`<div class="rulebook"><div class="rbt">THE RULEBOOK — born from your choice, enforced in every scene</div>
    <div class="kk" style="margin:2px 0 5px">the ${(rqSel.requiredRegimeIds||[]).length} rule-sets that apply — tap any to read it plainly</div>
    <div class="regwrap">${(rqSel.requiredRegimeIds||[]).map(regimeChip).join('')}</div>
    ${bar('auth bar',rqSel.requiredAuth,'This bites in Scene 4 — Write the app.')}
    ${bar('observability bar',rqSel.requiredObservability,'This bites in Scenes 4 and 11.')}
    ${bar('data & residency',rqSel.requiredDataControls,'This bites in Scenes 6 and 10.')}
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
  P.push(rpanel(0,'#19C8A8','SCENE 1','Who it’s for',rqSel?rtag('you','your decision'):rtag('def','undecided'),
    rqSel?esc(rqSel.name):'Decide: who is this for?',
    rqSel?'Your choice wrote the rulebook below. Every scene now reads it.':'Before any code exists, the customer decides the rules. This is the first decision — yours.',
    rulebook+
    grp('pick your industry (16)')+ind.map(r=>{const sel=r.id===RS.industry;
      return `<div class="irow ${sel?'sel':''}" tabindex="0" role="button" onclick="pickAxis('industry','${r.id}')" onkeydown="if(event.key==='Enter'){pickAxis('industry','${r.id}')}"><b>${esc(r.name)}</b><span class="am">${(r.requiredRegimeIds||[]).length} regimes · ${esc(firstSentence((r.keyRisks||[])[0]||''))}</span>${sel?'<span class="kchk">✓ selected</span>':''}</div>`;}).join('')+
    grp('the full picture — every industry, its regimes')+industryMatrix('regimes'),ch('who')));

  // ── SCENE 2 · Pick the framework ──────────────────────────────────────────
  const sib=(G.nodes.frameworks||[]).filter(f=>f.categoryId===s.fw.categoryId);
  P.push(rpanel(1,'#23CB9F','SCENE 2','Pick the framework',rtag('you','your choice'),
    esc(s.fw.name),`${esc(LANG_HUMAN[s.lang]||s.lang)} · ${esc(s.fw.maturity||'')} · ${esc(s.fw.license||'')}`,
    grp('about this framework')+kcardRO('frameworks',s.fw,langName(s.lang),`openFw('${s.fw.id}')`)+
    libBlock(s)+
    grp(`alternatives in ${esc(nameById('categories',s.fw.categoryId))} (${sib.length-1}) — all ${(G.nodes.frameworks||[]).length} in the top picker`)+
    sib.filter(f=>f.id!==s.fw.id).map(f=>opt('fw',f.id,f.name,(f.languages||[]).join('/'),ostate(f.id,s.fw.id),`openFw('${f.id}')`)).join(''),ch('fw')));

  // ── SCENE 3 · Scaffold the repo ───────────────────────────────────────────
  const p0=phaseScene('phase-0');
  P.push(rpanel(2,'#2FCD9D','SCENE 3','Scaffold the repo',rtag(s.pkgUser?'you':'rec',s.pkgUser?'your choice':'recommended'),
    esc(nameById('pkgBuildDeep',s.pkg)),'The repo is born: scaffold, lockfile, branch protection, CODEOWNERS.',
    cmdScaffold+cmdDeps+
    grp(`package managers for ${langName(s.lang)} — the lockfile is born here`)+
    (()=>{const all=(G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='pkg-mgr');
      const fits=all.filter(p=>langMatch(p.language,s.lang)), others=all.filter(p=>!langMatch(p.language,s.lang));
      return fits.map(p=>accRow('pkgBuildDeep','pkg',p,p.id===s.pkg?'chosen':'fit',p.id===s.pkg?'selected':'applies',p.id===s.pkg)).join('')+
        grp(`other languages (${others.length})`)+others.map(p=>accRow('pkgBuildDeep','pkg',p,'dim','not here',false)).join('');})()+
    grp(`repo rules — ${esc(p0.ph?p0.ph.trigger:'once, at setup')}`)+p0.rows+p0.adds+
    sceneNote('3'),ch('scaffold')));

  // ── SCENE 4 · Write the app ───────────────────────────────────────────────
  const authReqS=new Set(s.rq?.requiredAuthIds||[]), obsReqS=new Set(s.rq?.requiredObservabilityIds||[]);
  const mw=(s.fw.shipped&&s.fw.shipped.middleware)||{};
  const needAudit=myStds.some(x=>['hipaa','pci'].includes(x));
  const mwCell=(label,on,gap)=>`<span class="mw ${on?'on':(gap?'gapped':'')}">${on?'✓':(gap?'✗':'—')} ${label}${gap?' · gap':''}</span>`;
  const orderOpts=(arr,chosenId,reqS,fitFn)=>[...arr].sort((a,b)=>{const w=(o)=>o.id===chosenId?0:(reqS&&reqS.has(o.id)?1:(fitFn&&fitFn(o)?2:3));return w(a)-w(b);});
  const fitOrm=(o)=>(o.language||o.languages||[]).some(L=>langMatch(L,s.lang))||o.id==='orm-none';
  P.push(rpanel(3,'#3BD096','SCENE 4','Write the app',rqSel?rtag('req','rulebook bites here'):rtag('def','app code'),
    esc(nameById('authDeep',s.auth).split(' (')[0]),
    'Auth, data layer and observability are CODE, written into the app now — not deployment config.',
    grp('shipped middleware — this service today')+`<div class="mwstrip">`+
      mwCell('auth',mw.auth,!mw.auth&&authReqS.size>0)+mwCell('audit log',mw.audit,!mw.audit&&needAudit)+
      mwCell('RBAC',mw.rbac,false)+mwCell('circuit breaker',mw.circuitBreaker,false)+
      `<span class="mw ${s.fw.shipped&&s.fw.shipped.observabilityDetected?'on':''}">${s.fw.shipped&&s.fw.shipped.observabilityDetected?'✓':'—'} observability</span></div>`+
    grp(`auth (${(G.nodes.authDeep||[]).length})`)+
    orderOpts(G.nodes.authDeep||[],s.auth,authReqS).map(a=>{const req=authReqS.has(a.id);return accRow('authDeep','auth',a,a.id===s.auth?'chosen':(req?'req':'avail'),a.id===s.auth?'selected':(req?'rulebook requires':'available'),a.id===s.auth);}).join('')+
    grp('what each industry requires — auth')+industryMatrix('auth')+
    grp(`ORM / data layer (${(G.nodes.ormDeep||[]).length})`)+
    orderOpts(G.nodes.ormDeep||[],s.orm,null,fitOrm).map(o=>{const fit=fitOrm(o);return accRow('ormDeep','orm',o,o.id===s.orm?'chosen':(fit?'fit':'dim'),o.id===s.orm?'selected':(fit?'fits '+langName(s.lang):'other language'),o.id===s.orm);}).join('')+
    grp(`backend observability wiring (${(G.nodes.observabilityDeep||[]).length})`)+
    orderOpts(G.nodes.observabilityDeep||[],s.obs,obsReqS).map(o=>{const req=obsReqS.has(o.id);return accRow('observabilityDeep','obs',o,o.id===s.obs?'chosen':(req?'req':'avail'),o.id===s.obs?'selected':(req?'rulebook requires':'available'),o.id===s.obs);}).join('')+
    grp(`frontend observability (${(K.frontendObservability||[]).length})`)+
    (K.frontendObservability||[]).map(o=>altRow(o)).join('')+
    (()=>{const g=LANG_GROUP[s.lang]||'nodejs';const snips=(K.appImpl||{})[g]||(K.appImpl||{}).nodejs||[];
      return snips.length?grp(`write this code — starters for ${langName(s.lang)} (${snips.length})`)+
        snips.map(sn=>`<div class="sub" style="margin:2px 0 4px">${esc(sn.what)}</div>`+fileAcc(sn.file,sn.code)).join(''):'';})(),ch('app')));

  // ── SCENE 5 · Local dev loop ──────────────────────────────────────────────
  const p1=phaseScene('phase-1');
  const devCmds=cmdBlock('commands — the loop',[
    {label:'Run the dev server',cmd:(s.lang==='py'?'uvicorn app:app --reload':s.lang==='go'?'go run ./...':s.lang==='rust'?'cargo run':'npm run dev')},
    {label:'Production build',cmd:(s.lang==='py'?'# no build step — Python ships source':s.lang==='go'?'go build ./...':s.lang==='rust'?'cargo build --release':'npm run build')},
    {label:'Install the git hooks',cmd:'pre-commit install'}]);
  P.push(rpanel(4,'#44D292','SCENE 5','Local dev loop',rtag('same','same for every industry'),
    s.buildtool?esc(nameById('pkgBuildDeep',s.buildtool)):'build + hooks',
    'The inner loop: build tool runs dev/build; hooks catch problems before they reach a PR.',
    devCmds+
    (s.btList.length?grp(`build tools for ${langName(s.lang)} (${s.btList.length}) — invoked via your package scripts`)+
      s.btList.map(p=>accRow('pkgBuildDeep','buildtool',p,p.id===s.buildtool?'chosen':'fit',p.id===s.buildtool?'selected':'applies',p.id===s.buildtool)).join(''):'')+
    grp(`hooks on every commit — ${esc(p1.ph?p1.ph.trigger:'on git commit')}`)+p1.rows+p1.adds+
    grp('files (1)')+fileAcc('.pre-commit-config.yaml',GF.precommit,true)+
    sceneNote('5'),ch('local')));

  // ── SCENE 6 · Containerize ────────────────────────────────────────────────
  const runAll=(G.nodes.runtimeDeep||[]);
  P.push(rpanel(5,'#52D58C','SCENE 6','Containerize',rtag(s.baseTag,s.baseTag==='req'?'rulebook forces this':s.baseTag==='you'?'your choice':'framework default'),
    esc(baseName),esc(s.baseWhy)+' The compliance thread bites again here.',
    forcedNote+cmdDocker+
    grp(`base image — every option (${runAll.length})`)+
    runAll.map(r=>{const req=reqRun.has(r.id);return accRow('runtimeDeep','runtime',r,r.id===s.base?'chosen':(req?'req':'avail'),r.id===s.base?'selected':(req?'rulebook recommends':'available'),r.id===s.base);}).join('')+
    grp('what each industry gets — base image')+industryMatrix('runtime')+
    grp('files (2)')+fileAcc('Dockerfile',GF.dockerfile,true)+fileAcc('.dockerignore',GF.dockerignore),ch('img')));

  // ── SCENE 7 · PR gate ─────────────────────────────────────────────────────
  const p2=phaseScene('phase-2');
  P.push(rpanel(6,'#5AD886','SCENE 7','PR gate',rtag('same','every PR, every framework'),
    `${(stByPhase['phase-2']||[]).length} gates`,
    'Nothing unreviewed or unscanned reaches main. Every gate, every tool — and its alternatives.',
    grp(`the gates — ${esc(p2.ph?p2.ph.trigger:'on every PR push')}`)+p2.rows+p2.adds+
    grp('files (1)')+fileAcc('.github/workflows/pr.yml',GF.prwf)+
    grp('the market — alternatives for every slot')+
    (K.ciAlternatives||[]).map(slotBlock).join(''),ch('pr')));

  // ── SCENE 8 · Main build → registry ───────────────────────────────────────
  const p3=phaseScene('phase-3'); const pReg=phaseScene('registry');
  const ciCmds=cmdBlock('commands — what the pipeline runs',[...CMD.deps,CMD.docker[0],...CMD.registry]);
  P.push(rpanel(7,'#6ADA80','SCENE 8','Main build → registry',rtag('same','on merge to main'),
    'sign · SBOM · push','The merge builds the image, signs it, attaches the SBOM, and pushes it.',
    grp(`main build — ${esc(p3.ph?p3.ph.trigger:'on merge')}`)+p3.rows+p3.adds+
    (pReg.rows?grp('registry stage')+pReg.rows+pReg.adds:'')+
    grp(`signers (${(K.signers||[]).length}) — your choice flows into main.yml`)+(K.signers||[]).map(o=>altRow(o,'','signer',RS.signer)).join('')+
    grp(`SBOM tools (${(K.sbomTools||[]).length}) — your choice flows into main.yml`)+(K.sbomTools||[]).map(o=>altRow(o,'','sbom',RS.sbom)).join('')+
    grp(`registries — all ${(K.registries||[]).length}; your choice rewrites the workflow + commands`)+(K.registries||[]).map(o=>altRow(o,o.oidc?'<span class="ktag fit">OIDC — no stored secrets</span>':'','registry',RS.registry)).join('')+
    grp('files (1)')+fileAcc('.github/workflows/main.yml',GF.mainwf)+
    ciCmds,ch('main')));

  // ── SCENE 9 · Declare the deployment ─────────────────────────────────────
  const gtools=(G.nodes.gitopsTools||[]);
  const helmKust=gtools.filter(t=>/helm|kustomize/i.test(t.name));
  P.push(rpanel(8,'#7CDF78','SCENE 9','Declare the deployment',rtag('same','Git is the truth'),
    'Helm + Kustomize','What runs is what Git says. Values per environment; overlays patch per env.',
    grp('the mechanisms')+helmKust.map(t=>`<details class="acc fit"><summary><span class="caret">▸</span><span class="an">${esc(t.name)}</span><span class="am">${esc(t.role||'')}</span></summary><div class="accbody">${t.what?`<div class="krow"><span class="kk">what</span><span class="kvv">${esc(stripTags(t.what))}</span></div>`:''}${t.decisionChosen?`<div class="krow"><span class="kk">decision</span><span class="kvv">${esc(t.decisionChosen)}</span></div>`:''}</div></details>`).join('')+
    `<div class="sub" style="margin:8px 0">This service ships ${((s.fw.shipped&&s.fw.shipped.helmValuesFiles)||[]).length} Helm values files and overlays for ${esc(((s.fw.shipped&&s.fw.shipped.kustomizeOverlays)||[]).join(' / '))}.</div>`+
    grp('files (3)')+fileAcc('helm/values-prod.yaml',GF.helm,true)+fileAcc('kustomize/base/kustomization.yaml',GF.kbase)+fileAcc('kustomize/base/deployment.yaml',GF.kdeploy)+
    sceneNote('9'),ch('declare')));

  // ── SCENE 10 · GitOps sync → cluster ─────────────────────────────────────
  const clReq=new Set(s.rq?.recommendedClusterIds||[]);
  const comps=[...(G.nodes.clusterComponents||[])].sort((a,b)=>(a.num||'').localeCompare(b.num||''));
  const layers=by(comps,'layer');
  const argo=gtools.find(t=>/argo ?cd/i.test(t.name))||gtools[0];
  const layerOrder=['Foundation','Networking','Security','Storage','Observability','Delivery','Scaling','Platform'];
  const layerKeys=Object.keys(layers).sort((a,b)=>{const ia=layerOrder.indexOf(a),ib=layerOrder.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib);});
  const compBlocks=layerKeys.map(L=>`<details class="acc"><summary><span class="caret">▸</span><span class="an">Layer — ${esc(L)}</span><span class="am">${layers[L].length} components</span></summary><div class="accbody">`+
    layers[L].map(c=>`<div class="compline"><b>${esc(c.num)}. ${esc(c.name)}</b><div class="sub">${esc(firstSentence(c.what||''))}</div>${c.installCommand?`<pre class="cmdcode" style="margin-top:4px">${esc(c.installCommand)}</pre>`:''}${c.verifyCommand?`<div class="krow"><span class="kk">verify</span><span class="kvv">${esc(c.verifyCommand)}</span></div>`:''}</div>`).join('<div style="height:10px"></div>')+`</div></details>`).join('');
  P.push(rpanel(9,'#8FE46E','SCENE 10','GitOps sync → cluster',rqSel?rtag('req','rulebook shapes the cluster'):rtag('def','pick a cluster'),
    esc(nameById('clusters',s.cluster)),
    (argo?esc(argo.name):'Argo CD')+' watches Git and syncs every cluster — hub-and-spoke, one controller.',
    (argo?grp('the controller')+`<details class="acc fit" open><summary><span class="caret">▸</span><span class="an">${esc(argo.name)}</span><span class="am">${esc(argo.role||'')} · v${esc(argo.version||'')}</span></summary><div class="accbody">${argo.what?`<div class="krow"><span class="kk">what</span><span class="kvv">${esc(stripTags(argo.what))}</span></div>`:''}${argo.syncInterval?`<div class="krow"><span class="kk">sync interval</span><span class="kvv">${esc(argo.syncInterval)}</span></div>`:''}${argo.decisionChosen?`<div class="krow"><span class="kk">decision</span><span class="kvv">${esc(argo.decisionChosen)} — ${esc(firstSentence(argo.decisionRejected||''))}</span></div>`:''}</div></details>`:'')+
    grp(`clusters (${(G.nodes.clusters||[]).length})`)+
    (G.nodes.clusters||[]).map(c=>{const req=clReq.has(c.id);return accRow('clusters','cluster',c,c.id===s.cluster?'chosen':(req?'req':'avail'),c.id===s.cluster?'selected':(req?'rulebook recommends':'available'),c.id===s.cluster);}).join('')+
    grp('what each industry gets — cluster')+industryMatrix('clusters')+
    grp(`create the cluster — ${esc(nameById('clusters',s.cluster))} (${((K.clusterProvision||{})[s.cluster]||{}).tool||''})`)+
    cmdBlock('commands — provision',(((K.clusterProvision||{})[s.cluster]||{}).commands)||[])+
    `<details class="acc"><summary><span class="caret">▸</span><span class="an">How the other clusters are created</span><span class="am">eksctl · gcloud · az · openshift-install</span></summary><div class="accbody">${Object.entries(K.clusterProvision||{}).filter(([id])=>id!==s.cluster).map(([id,v])=>`<div class="krow"><span class="kk">${esc(nameById('clusters',id))}</span><span class="kvv">${esc((v.commands[0]||{}).cmd||'')}</span></div>`).join('')}</div></details>`+
    grp(`inside the cluster — ${comps.length} components, stacked`)+compBlocks+
    grp(`manifests (${Object.keys(GF.deploy||{}).length})`)+Object.entries(GF.deploy||{}).map(([n,c])=>fileAcc(n,c)).join('')+
    cmdGitops+cmdCluster,ch('cluster')));

  // ── SCENE 11 · Run + observe (SRE) ───────────────────────────────────────
  const sre=K.sre||{};
  const gs=(sre.goldenSignals||[]).map(g=>`<tr><td><b>${esc(g.signal)}</b></td><td>${esc(g.measure)}</td><td>${esc(g.alertWhen)}</td></tr>`).join('');
  P.push(rpanel(10,'#A3E863','SCENE 11','Run + observe',rqSel?rtag('req','retention is regime-driven'):rtag('def','SRE'),
    esc(nameById('observabilityDeep',s.obs).split(' —')[0]),
    'The service is live. Watch the four golden signals; alert on the budget, not the noise.',
    grp('the four golden signals')+`<table class="mx"><thead><tr><th>signal</th><th>measure</th><th>alert when</th></tr></thead><tbody>${gs}</tbody></table>`+
    grp('SLO starter')+`<div class="scenenote">${esc(sre.sloStarter||'')}</div>`+
    grp('alert starter pack')+`<div class="accbody" style="border:0;padding:0">${(sre.alertPack||[]).map(a=>`<div class="krow"><span class="kk">alert</span><span class="kvv">${esc(a)}</span></div>`).join('')}</div>`+
    grp(`backend stacks (${(G.nodes.observabilityDeep||[]).length}) — full knowledge`)+
    orderOpts(G.nodes.observabilityDeep||[],s.obs,obsReqS).map(o=>{const req=obsReqS.has(o.id);return accRow('observabilityDeep','obs',o,o.id===s.obs?'chosen':(req?'req':'avail'),o.id===s.obs?'selected':(req?'rulebook requires':'available'),false);}).join('')+
    grp('what each industry requires — observability')+industryMatrix('obs')+
    `<div class="scenenote">${esc(sre.retentionNote||'')}</div>`+
    grp('files (2) — drop into your repo')+
    fileAcc('observability/alert-rules.yaml',alertRulesYaml(s))+
    fileAcc('observability/dashboard.json',dashboardJson(s)),ch('observe')));

  // ── SCENE 12 · Connect ───────────────────────────────────────────────────
  let intBody;
  if(rqSel){const bc=by(s.integ,'category');
    intBody=s.integ.length?Object.entries(bc).map(([c,a])=>grp(c)+a.map(g=>
      `<details class="acc fit"><summary><span class="caret">▸</span><span class="an">${esc(g.externalSystem)}</span><span class="am">auth ${esc(g.authOption||'')} · via ${esc(g.apiGateway||'')}</span></summary><div class="accbody">`+
      (g.dataFlow?`<div class="krow"><span class="kk">data flow</span><span class="kvv">${esc(stripTags(g.dataFlow))}</span></div>`:'')+
      (g.tools?`<div class="krow"><span class="kk">tools</span><span class="kvv">${esc(Array.isArray(g.tools)?g.tools.join(', '):stripTags(g.tools))}</span></div>`:'')+
      `<div class="krow"><span class="kk">gateway</span><span class="kvv">${esc(g.apiGateway||'')} — the guarded front door this call goes through</span></div>`+
      `<div style="margin-top:6px"><button class="kmore" onclick="openIntegration('${g.id}')">full record →</button></div></div></details>`).join('')).join(''):'<div class="sub">No catalogued integrations for this industry yet.</div>';
  } else intBody='<div class="sub">Pick an industry in Scene 1 to see its integrations.</div>';
  P.push(rpanel(11,'#B4EE58','SCENE 12','Connect',rqSel?rtag('req',`${s.integ.length} systems`):rtag('def','no industry'),
    rqSel?`${s.integ.length} integrations`:'Pick an industry',
    'The external systems this industry actually talks to — each through a gateway, with auth.',
    intBody+
    grp(`gateways (${(G.nodes.apiGateways||[]).length})`)+(G.nodes.apiGateways||[]).map(a=>`<span class="chip">${esc(a.name||a.id)}</span>`).join(''),ch('connect')));

  // ── SCENE 13 · Sign-off ──────────────────────────────────────────────────
  P.push(rpanel(12,'#C6F24E','SCENE 13','Sign-off',rqSel?rtag('req','release gate'):rtag('def','no industry'),
    'the audit','Every rule from Scene 1 — met, forced, or gap. Release when the gaps are closed.',
    (rqSel?rulebook:'')+
    `<button class="gencopy" style="margin-bottom:10px" onclick="copyAudit(this)">copy the audit</button>`+
    grp('the audit — every decision, traced to its scene')+checklistBlock(s,DEC),ch('signoff')));


  // ════ ACT III — keep it alive ════════════════════════════════════════════
  const A3=K.act3||{};
  const avu=(rows)=>rows&&rows.length?grp('the platform does · you do')+`<table class="mx"><thead><tr><th>the platform does</th><th>you do</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table>`:'';
  const a3cmds=(n,title)=>cmdBlock(title||'commands',((A3[n]||{}).commands)||[]);

  // SCENE 14 · Update loop
  P.push(rpanel(13,'#98E64E','SCENE 14','Update loop',rtag('same','weekly, forever'),
    'small, safe, weekly','A robot opens the update PRs; you merge while they are small.',
    avu((A3['14']||{}).auto)+a3cmds('14','commands — the weekly pass')+
    grp('files (1)')+fileAcc('renovate.json',JSON.stringify({"$schema":"https://docs.renovatebot.com/renovate-schema.json","extends":["config:recommended",":semanticCommitsDisabled"],"schedule":["before 9am on monday"],"packageRules":[{"matchUpdateTypes":["minor","patch"],"groupName":"weekly minors"},{"matchUpdateTypes":["major"],"dependencyDashboardApproval":true}],"vulnerabilityAlerts":{"labels":["security"],"schedule":["at any time"]}},null,2)),ch('update')));

  // SCENE 15 · Upgrade
  P.push(rpanel(14,'#A3E847','SCENE 15','Upgrade the platform',rqSel?rtag('req','on YOUR calendar'):rtag('same','quarterly'),
    esc(nameById('clusters',s.cluster))+' · quarterly','Kubernetes minors retire on the provider’s schedule. Staging first, soak, then prod.',
    avu((A3['15']||{}).auto)+
    grp('the order — never improvise it')+`<div class="runbook"><ol><li>Read the release notes for the next minor.</li><li>pluto detect — fix removed APIs in your manifests first.</li><li>Upgrade STAGING control plane → nodes → addons.</li><li>Soak one week — watch Scene 11 signals.</li><li>Prod by the exact same path.</li></ol></div>`+
    a3cmds('15','commands — upgrade')+
    grp('what else upgrades on this cadence')+`<div class="scenenote">Argo CD + the ${ (G.nodes.clusterComponents||[]).length } cluster components (Scene 10) upgrade by Helm, same staging-first path. Framework majors (e.g. Next 15→16) ride Scene 14 as major-update PRs gated by the dashboard.</div>`,ch('upgrade')));

  // SCENE 16 · Protect
  P.push(rpanel(15,'#AEEA41','SCENE 16','Protect',rtag('same','expiry does not negotiate'),
    'rotate · back up · DRILL','Certificates renew themselves; backups happen on schedule; the restore is only real once you have drilled it.',
    avu((A3['16']||{}).auto)+a3cmds('16','commands — protect + the drill')+
    grp('files (1)')+fileAcc('velero-schedule.yaml','apiVersion: velero.io/v1\nkind: Schedule\nmetadata:\n  name: prod-nightly\n  namespace: velero\nspec:\n  schedule: "0 3 * * *"   # 3am nightly\n  template:\n    includedNamespaces: [prod]\n    ttl: 720h   # keep 30 days\n'),ch('protect')));

  // SCENE 17 · Respond
  const sev=((A3['17']||{}).sev)||[];
  P.push(rpanel(16,'#B9EC3B','SCENE 17','Respond',rqSel?rtag('req','the regulator clock is real'):rtag('same','when, not if'),
    'page → mitigate → learn','Calm beats clever at 2am. The path is written before the pager fires.',
    grp('severity — agree on it BEFORE the incident')+`<table class="mx"><thead><tr><th>level</th><th>meaning</th><th>response</th></tr></thead><tbody>${sev.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table>`+
    grp('the 2am runbook')+`<div class="runbook"><ol>${(((A3['17']||{}).runbook)||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`+
    a3cmds('17','commands — roll back fast')+
    grp('files (1)')+fileAcc('postmortem-template.md','# Postmortem — <incident title>\n\nBlameless. We fix systems, not people.\n\n## Impact\nWho/what was affected, for how long.\n\n## Timeline (UTC)\n- 02:13 page fired (alert: ...)\n- 02:15 acknowledged\n- 02:31 mitigated by ...\n- 03:02 resolved\n\n## Causes\nWhat allowed this (not "who").\n\n## What went well / what hurt\n\n## Action items\n- [ ] item — owner — due date\n')+
    (rqSel&&myStds.length?`<div class="forcenote">🔶 Your rulebook: ${esc(s.rq.name)} — check incident-reporting duties (e.g. OSFI B-13: report material incidents within 24h).</div>`:''),ch('respond')));

  // SCENE 18 · Evolve & retire
  P.push(rpanel(17,'#C6F24E','SCENE 18','Evolve & retire',rtag('same','quarterly, half a day'),
    'EOL · cost · sunset','Look up every quarter: what dies soon, what bleeds money, what should retire with dignity.',
    avu((A3['18']||{}).auto)+a3cmds('18','commands — the quarterly look')+
    grp('the maintenance calendar — the whole of Act III on one card')+
    `<table class="mx"><thead><tr><th>cadence</th><th>what happens</th></tr></thead><tbody>${(K.maintCalendar||[]).map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table>`+
    `<div class="scenenote">Retiring a service: freeze writes → archive data per your retention rules (the rulebook) → keep the audit evidence (Scene 13 export) → tear down compute → keep the DNS tombstone 90 days.</div>`,ch('evolve')));

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
function refreshBuild(){renderBuilder();renderHero();renderResolver();}
window.setMode=(m)=>{
  MODE=m==='guided'?'build':m;  // guided shares build state/lens
  hideWelcome();
  const g=$('#guided'),tr=$('#track');
  if(g)g.hidden=(m!=='guided');
  if(tr)tr.style.display=(m==='guided')?'none':'';
  ['hero','builder','stackbar','lensInfo'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display=(m==='guided')?'none':'';});
  if(m==='guided'){document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('on',b.dataset.m==='guided'));renderGuided();return;}
  document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  const build=m==='build';
  STAGES=build?STAGES_BUILD:STAGES_CATALOG;
  renderHero();
  $("#builder").classList.toggle('on',build);
  const sb=$("#stackbar");if(sb)sb.classList.toggle('on',build);
  document.querySelector('.legend').style.display=build?'none':'';
  document.querySelector('.lens').style.display=build?'none':'';
  if(build){ if(!RS.fw)RS.fw=(G.nodes.frameworks||[])[0]?.id;
    $("#lensInfo").classList.remove('on');$("#track").classList.remove('lensed');
    LASTR={};renderBuilder();renderResolver();
  } else { renderLensInfo();renderBoard(); }
};

// ════ GUIDED — the TurboTax interview: one decision per screen ═══════════════
let GSTEP=0;
let GNAV={platform:null,category:null,all:false};
const TERMS_TOP=['SBOM','OIDC','MFA','FIPS','ORM','lockfile','container','registry','cluster','CI','SAST','middleware','MFA'];
function linkify(text){
  let out=esc(text);
  for(const t of (K.glossary||[])){
    if(!TERMS_TOP.some(x=>x.toLowerCase()===t.term.toLowerCase()))continue;
    const re=new RegExp('\\b('+t.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')\\b','i');
    if(re.test(out))out=out.replace(re,(m)=>`<span class="term" onclick="event.stopPropagation();showPop(this)" data-def="${esc(t.def)}" data-t="${esc(t.term)}">${m}</span>`);
  }
  return out;
}
window.showPop=(el)=>{
  document.querySelectorAll('.pop').forEach(x=>x.remove());
  const d=document.createElement('div');d.className='pop';
  d.innerHTML=`<b>${el.dataset.t}</b> — ${esc(el.dataset.def)}`;
  el.appendChild(d);
  setTimeout(()=>document.addEventListener('click',()=>d.remove(),{once:true}),0);
};
function juriLine(rq){
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
  return Object.entries(groups).filter(([,v])=>v.length)
    .map(([k,v])=>`<b>${k}:</b> ${v.join(', ')}`).join(' · ');
}
function gOptions(axis){
  const s=resolveStack();
  if(axis==='industry')return (G.nodes.industryRequirements||[]).map(r=>({id:r.id,name:r.name,
    plain:firstSentence((r.keyRisks||[])[0]||'')+' is the risk this rulebook exists to stop.',
    juri:juriLine(r), node:'industryRequirements', rec:false, req:false}));
  if(axis==='fw')return (G.nodes.frameworks||[]).map(f=>({id:f.id,name:f.name,
    plain:`${LANG_HUMAN[f.languageId]||f.languageId} · ${firstSentence(f.whenToUse||'')}`,
    node:'frameworks',rec:false}));
  if(axis==='pkg')return (G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='pkg-mgr'&&langMatch(p.language,s.lang)).map(p=>({id:p.id,name:p.name,
    plain:firstSentence(p.what||''),node:'pkgBuildDeep',rec:p.id===s.pkgDef}));
  if(axis==='auth')return (G.nodes.authDeep||[]).map(a=>({id:a.id,name:a.name,
    plain:firstSentence(a.what||''),node:'authDeep',req:(s.rq?.requiredAuthIds||[]).includes(a.id)}));
  if(axis==='orm')return ormsFor(s.lang).map(o=>({id:o.id,name:o.name,
    plain:firstSentence(o.what||''),node:'ormDeep',rec:o.id===s.ormDef}));
  if(axis==='obs')return (G.nodes.observabilityDeep||[]).map(o=>({id:o.id,name:o.name,
    plain:firstSentence(o.what||''),node:'observabilityDeep',req:(s.rq?.requiredObservabilityIds||[]).includes(o.id)}));
  if(axis==='runtime')return (G.nodes.runtimeDeep||[]).map(r=>({id:r.id,name:r.name,
    plain:`${r.baseOs||''} · ${r.sizeMb?r.sizeMb+' MB':''}${r.fipsCertified==='yes'?' · FIPS-validated':''}`,
    node:'runtimeDeep',req:(s.rq?.recommendedRuntimeIds||[]).includes(r.id)}));
  if(axis==='registry')return (K.registries||[]).map(r=>({id:r.id,name:r.name,
    plain:r.pick||'',kjson:r,req:false,rec:r.id==='ghcr'}));
  if(axis==='signer')return (K.signers||[]).map(r=>({id:r.id,name:r.name,plain:r.pick||'',kjson:r,rec:r.id==='cosign'}));
  if(axis==='sbom')return (K.sbomTools||[]).map(r=>({id:r.id,name:r.name,plain:r.pick||'',kjson:r,rec:r.id==='syft'}));
  if(axis==='cluster')return (G.nodes.clusters||[]).map(c=>({id:c.id,name:c.name,
    plain:`${c.cloud||''} — ${c.secretIdentity||''} workload identity`,node:'clusters',req:(s.rq?.recommendedClusterIds||[]).includes(c.id)}));
  return [];
}
function gCard(axis,o){
  const picked=RS[axis]===o.id;
  const body=o.node&&KFIELDS[o.node]?(KFIELDS[o.node]||[]).map(([k,l])=>{const v=kval((find(o.node,o.id)||{})[k]);return v?`<div class="krow"><span class="kk">${esc(l)}</span><span class="kvv">${esc(v)}</span></div>`:'';}).join('')
    :o.kjson?Object.entries(o.kjson).filter(([k,v])=>!['id','name'].includes(k)&&v&&typeof v==='string').map(([k,v])=>`<div class="krow"><span class="kk">${esc(k)}</span><span class="kvv">${esc(v)}</span></div>`).join(''):'';
  return `<details class="gcard${picked?' picked':''}">
    <summary><span class="gname">${esc(o.name)}</span><span class="gplain">${linkify(o.plain||'')}</span>
      ${o.req?'<span class="gtag req">your rulebook requires</span>':o.rec?'<span class="gtag rec">recommended</span>':''}
      <button class="gpick" onclick="event.preventDefault();event.stopPropagation();gPick('${axis}','${o.id}')">${picked?'chosen':'choose'}</button>
    </summary>
    <div class="gbody">${o.juri?`<div class="gjuri">${o.juri}</div>`:''}${body||'<div class="sub">Tap choose — full detail lives in the flow.</div>'}</div>
  </details>`;
}
window.gPick=(axis,id)=>{
  pickAxis(axis,id);
  const st=(K.guided.steps||[]).find(x=>x.axis===axis)||(K.guided.steps||[])[GSTEP];
  if(st){decide('g'+st.axis);decide('s'+st.scene);}  // lights the scene ✓ on the flow rail
  renderGuided();
};
window.startGuided=()=>{GSTEP=0;setMode('guided');};
window.gJump=(i)=>{GSTEP=i;GNAV={platform:null,category:null,all:false};renderGuided();$('#guided').scrollTop=0;};
window.gNav=(k,v)=>{GNAV[k]=v;if(k==='platform'){GNAV.category=null;GNAV.all=false;}renderGuided();$('#guided').scrollTop=0;};
window.gGo=(d)=>{GSTEP=Math.max(0,Math.min((K.guided.steps||[]).length,GSTEP+d));GNAV={platform:null,category:null,all:false};renderGuided();
  $('#guided').scrollTop=0;};
window.gUseRec=()=>{
  const st=(K.guided.steps||[])[GSTEP];if(!st)return;
  const opts=gOptions(st.axis);const rec=opts.find(o=>o.req)||opts.find(o=>o.rec)||opts[0];
  if(rec)gPick(st.axis,rec.id);
  if(st.pair){const p2=gOptions(st.pair);const r2=p2.find(o=>o.rec)||p2[0];if(r2)pickAxis(st.pair,r2.id);}
};
function renderGuided(){
  const steps=(K.guided&&K.guided.steps)||[];
  const total=steps.length+1; // + review
  const el=$('#guided'); if(!el)return;
  if(GSTEP>=steps.length){el.innerHTML=gReview(total);return;}
  const st=steps[GSTEP];
  const opts=gOptions(st.axis);
  const picked=!!RS[st.axis];
  const pairHtml=st.pair?`<div class="gq" style="font-size:20px;margin-top:26px">…and the ingredient list (SBOM)</div>`+gOptions(st.pair).map(o=>gCard(st.pair,o)).join(''):'';
  // Decision 2 = the REAL flow: platform → kind → framework
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
      return parts.length?`<div class="crumbs">${parts.join('<span class="sbsep">›</span>')}</div>`:'';};
    if(!GNAV.platform){
      cascade=dots(1)+crumb()+
        `<h3 class="gsub">First — what are you building?</h3>`+
        Object.entries(K.platformPlain||{}).map(([id,pp])=>{
          const pc=catsOf(id), n=fws.filter(f=>devOf(f)===id).length;
          return `<details class="gcard"><summary><span class="gname">${esc(pp.name)}</span><span class="gplain">${esc(pp.plain)} <b>${n} frameworks · ${pc.length} kinds.</b></span><button class="gpick" onclick="event.preventDefault();event.stopPropagation();gNav('platform','${id}')">this one</button></summary><div class="gbody"><div class="gjuri">${pc.map(c=>esc(c.name.replace(/^[^—]+— /,''))).join(' · ')}</div></div></details>`;}).join('')+
        `<div class="scenenote">Not covered yet (honestly): ${(K.platformsMissing||[]).map(esc).join(' · ')}. These platforms arrive after this walk is perfect.</div>`+
        `<div class="sub" style="margin-top:10px">Already know your framework? <button class="kmore" onclick="GNAV.all=true;renderGuided()">see all ${fws.length} →</button></div>`;
    } else if(!GNAV.category){
      cascade=dots(2)+crumb()+
        `<h3 class="gsub">Which kind of ${esc(((K.platformPlain[GNAV.platform]||{}).name||'').toLowerCase())}?</h3>`+
        catsOf(GNAV.platform).map(c=>{const list=fwsOf(c.id);
          return `<details class="gcard"><summary><span class="gname">${esc(c.name.replace(/^[^—]+— /,''))}</span><span class="gplain">${esc((K.catPlain||{})[c.id]||'')}</span><button class="gpick" onclick="event.preventDefault();event.stopPropagation();gNav('category','${c.id}')">this kind</button></summary><div class="gbody"><div class="gjuri"><b>${list.length} frameworks:</b> ${list.map(f=>esc(f.name)).join(' · ')}</div></div></details>`;}).join('');
    } else {
      const list=fwsOf(GNAV.category);
      cascade=dots(3)+crumb()+
        `<h3 class="gsub">Now compare — the ${list.length} that actually compete</h3>`+
        list.map(f=>gCard('fw',{id:f.id,name:f.name,plain:`${LANG_HUMAN[f.languageId]||f.languageId} · ${firstSentence(f.whenToUse||'')}`,node:'frameworks'})).join('');
    }
  }
  if(st.axis==='fw'&&GNAV.all){
    filter=`<input class="gfilter" placeholder="Type to filter the ${opts.length} frameworks… (e.g. next, fastapi, go)" oninput="gFilter(this.value)">`;
  }
  el.innerHTML=`<div class="gwrap">
    <div class="gtop"><button class="gback" onclick="${GSTEP===0?"setMode('catalog');showWelcome()":'gGo(-1)'}">← back</button>
      <span class="gcount">decision ${GSTEP+1} of ${total} · scene ${st.scene}</span></div>
    <div class="gprog"><i style="width:${Math.round((GSTEP)/total*100)}%"></i></div>
    <h2 class="gq">${esc(st.title)}</h2>
    <p class="gwhy">${linkify(st.why)}</p>
    ${filter}
    <div id="gcards">${(st.axis==='fw'&&!GNAV.all)?cascade:opts.map(o=>gCard(st.axis,o)).join('')}</div>
    ${pairHtml}
    <div class="gfoot">
      ${picked?`<div class="gcons">✓ Locked in. <b>${esc(st.consequence)}</b></div>`:''}
      <button class="gnext" ${picked?'':'disabled'} onclick="gGo(1)">Continue →</button>
      <button class="gskip" onclick="gUseRec()">use the recommended and continue</button>
    </div>
  </div>`;
  if(picked){} // continue enabled
}
window.gFilter=(v)=>{v=v.toLowerCase();
  document.querySelectorAll('#gcards .gcard').forEach(c=>{c.style.display=c.textContent.toLowerCase().includes(v)?'':'none';});};
function gReview(total){
  const s=resolveStack();
  const steps=(K.guided&&K.guided.steps)||[];
  const row=(label,axis,val)=>`<div class="grev"><span class="k2">${esc(label)}</span><b>${esc(val)}</b>
    <button onclick="gJump(${steps.findIndex(x=>x.axis===axis)})">change</button></div>`;
  const CFG=buildConfig(s),GF=genFiles(CFG);
  const files=[['Dockerfile',GF.dockerfile],['.github/workflows/main.yml',GF.mainwf],['.github/workflows/pr.yml',GF.prwf],['helm/values-prod.yaml',GF.helm],['.pre-commit-config.yaml',GF.precommit]];
  CFID=0;
  return `<div class="gwrap">
    <div class="gtop"><button class="gback" onclick="gGo(-1)">← back</button>
      <span class="gcount">decision ${total} of ${total} · review</span></div>
    <div class="gprog"><i style="width:100%"></i></div>
    <h2 class="gq">Your build — every decision, made by you</h2>
    <p class="gwhy">Change anything. Then take your real files — they follow your choices exactly.</p>
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
    <h2 class="gq" style="font-size:21px;margin-top:30px">Your real files — generated from those choices</h2>
    ${files.map(([n,c])=>fileAcc(n,c)).join('')}
    <div class="gfoot">
      <button class="gnext" onclick="setMode('build');setTimeout(()=>goCol(0),250)">Walk the full 18-scene map →</button>
      <button class="gskip" onclick="window.print()">print / save this build</button>
    </div>
  </div>`;
}
function showWelcome(){
  const w=$('#welcome');if(!w)return;
  const has=Object.keys(DECIDED).length>0;
  w.hidden=false;
  const r=$('#wresume');
  if(r){r.hidden=!has; if(has)r.innerHTML=`You have a build in progress — <button onclick="hideWelcome();startGuided()">resume it →</button>`;}
}
window.hideWelcome=()=>{const w=$('#welcome');if(w)w.hidden=true;};

async function boot(){
  try{ const [g,k]=await Promise.all([fetch("graph.json"),fetch("knowledge.json")]);
    G=await g.json(); K=k.ok?await k.json():{}; }
  catch(e){ $("#track").innerHTML=`<div class="err">Could not load graph.json.<br>${e}</div>`; return; }
  const lv=$("#lensV");
  for(const v of (G.nodes.verticals||[])){const o=document.createElement("option");o.value=v.id;o.textContent=v.name||v.id;lv.appendChild(o);}
  // restore lens from hash
  const h=new URLSearchParams(location.hash.slice(1));
  if(h.get('lens')&&(G.nodes.verticals||[]).some(v=>v.id===h.get('lens'))){lv.value=h.get('lens');setLens(h.get('lens'));}
  lv.onchange=e=>{setLens(e.target.value);location.hash=e.target.value?`lens=${e.target.value}`:'';renderLensInfo();renderHero();renderBoard();};
  renderHero();renderLensInfo();renderBoard();
  // first run → welcome; returning → resume offer
  if(!location.hash){ showWelcome(); }
  // deep link: #scene=N&industry=id opens build mode at that scene with that lens
  const hh=new URLSearchParams(location.hash.slice(1));
  const saved=localStorage.getItem('ys-industry');
  if(saved&&(G.nodes.industryRequirements||[]).some(r=>r.id===saved))RS.industry=saved;
  if(hh.get('scene')){
    if(hh.get('industry')&&(G.nodes.industryRequirements||[]).some(r=>r.id===hh.get('industry')))RS.industry=hh.get('industry');
    setMode('build');
    const n=Math.min(STAGES_BUILD.length,Math.max(1,+hh.get('scene')||1));
    setTimeout(()=>goCol(n-1),350);
  }
}
boot();
