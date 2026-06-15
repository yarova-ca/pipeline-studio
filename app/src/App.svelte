<script>
  import { onMount, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { rs, decided, gstep, gnav, view, ready, loadError, pick, clearIndustryBanner } from './lib/stores.js';
  import { loadAll } from './lib/data.js';
  import { getG, getK, find, nameById, stripTags, firstSentence, STAGES_BUILD, KFIELDS } from './lib/logic.js';
  import {
    setRenderState, setLens, setGSTEP, setGNAV,
    renderHeroHtml, renderLensInfoHtml, renderStackBarHtml, renderBuilderHtml,
    renderBoard, renderResolver, renderGuidedHtml, gOptions,
    STAGES_CATALOG, fullNode, getRepoFiles, getRepoName,
  } from './lib/render.js';
  import JSZip from 'jszip';
  import './app.css';

  let viewVal = 'welcome';
  let rsVal = {};
  let isReady = false;
  let heroHtml = '';
  let lensInfoHtml = '';
  let stackBarHtml = '';
  let builderHtml = '';
  let boardHtml = '';
  let resolverHtml = '';
  let guidedHtml = '';
  let mode = 'catalog';
  let drawerOpen = false;
  let drawerTitle = '';
  let drawerBody = '';
  let glossaryOpen = false;
  let glossaryQuery = '';
  let popEl = null;
  let popText = '';
  let popTerm = '';
  let errMsg = null;
  let retrying = false;
  let gstepVal = 0;
  let catalogSearch = '';
  let applyingHash = false;   // true while restoring from URL — suppresses hash writes
  let lastFocus = null;       // element focused before a modal opened
  let showPrimer = false;     // welcome "what is a pipeline" expander
  let level = (typeof localStorage!=='undefined' && localStorage.getItem('ys-level')) || 'beginner'; // beginner | expert
  function setLevel(l){
    level=l;
    try{ localStorage.setItem('ys-level', l); }catch(e){}
    if(isReady) renderActive();   // re-render guided + scenes so cards open/close to match
  }
  $: levelClass = level==='beginner' ? 'level-beginner' : 'level-expert';

  view.subscribe(v => { viewVal = v; if(isReady){ renderActive(); writeHash(); } });
  rs.subscribe(v => { rsVal = v; if(isReady){ renderActive(); writeHash(); } });
  ready.subscribe(v => { isReady = v; if(v) renderActive(); });
  loadError.subscribe(v => { errMsg = v; });
  gstep.subscribe(v => { gstepVal = v; setGSTEP(v); if(isReady && viewVal==='guided'){ doRenderGuided(); writeHash(); } });
  gnav.subscribe(v => { setGNAV(v); if(isReady && viewVal==='guided') doRenderGuided(); });

  function syncState(){
    setRenderState({rs: rsVal, mode, decided: get(decided), level});
    setLens(rsVal.industry || '');
  }
  // Render ONLY the surface that is on screen. No wasted work on hidden surfaces.
  function renderActive(){
    if(!getG()) return;
    if(viewVal==='guided'){ doRenderGuided(); return; }
    if(viewVal==='flow'){ mode==='catalog' ? renderCatalog() : renderBuild(); return; }
    // welcome view needs no generated HTML
  }
  function renderCatalog(){
    if(!getG()) return;
    syncState();
    const G=getG();
    heroHtml = renderHeroHtml(G, STAGES_CATALOG, 'catalog', rsVal, get(decided));
    lensInfoHtml = renderLensInfoHtml();
    boardHtml = renderBoard();
    builderHtml = '';
    observeColumns();
  }
  function renderBuild(){
    if(!getG()||!getK()) return;
    syncState();
    const G=getG();
    const res = renderResolver();
    resolverHtml = res.html;
    stackBarHtml = res.stackBarHtml;
    heroHtml = renderHeroHtml(G, STAGES_BUILD, 'build', rsVal, get(decided));
    lensInfoHtml = renderLensInfoHtml();
    builderHtml = renderBuilderHtml();
    observeColumns();
  }
  function doRenderGuided(){
    syncState();
    guidedHtml = renderGuidedHtml();
  }
  // F2 — highlight the hero-rail node for whichever column is on screen ("where am I").
  let colObserver = null;
  function observeColumns(){
    tick().then(()=>{
      if(colObserver) colObserver.disconnect();
      const track = document.querySelector('.track');
      const nodes = [...document.querySelectorAll('.hnode')];
      if(!track || !nodes.length) return;
      colObserver = new IntersectionObserver((ents)=>{
        ents.forEach(e=>{ if(e.isIntersecting){
          const i = +e.target.id.split('-')[1];
          nodes.forEach(n=> n.classList.toggle('active', +n.dataset.i===i));
        }});
      }, { root: track, threshold: 0.5 });
      track.querySelectorAll('.col').forEach(c=> colObserver.observe(c));
    });
  }
  let currentScene = 0;
  function goCol(i){
    currentScene = i;
    if(isReady) writeHash();
    tick().then(()=>{
      const el = document.getElementById('col-'+i);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
  function openDrawer(title, body){ lastFocus=document.activeElement; drawerTitle=title; drawerBody=body; drawerOpen=true; focusModal(); }
  function closeDrawer(){ drawerOpen=false; restoreFocus(); }
  function startGuided(resume){
    const steps=(getK()?.guided?.steps||[]);
    const saved=parseInt(localStorage.getItem('ys-gstep')||'0')||0;
    gstep.set(resume ? Math.min(steps.length, saved) : 0);
    gnav.set({platform:null,category:null,all:false});
    view.set('guided');
  }

  // ── Express path — 2 plain questions, the engine fills the other 9 axes ───────
  // Default framework per "what are you building". Real ids (numeric-prefixed).
  const EXPRESS_FW = { 'frontend-web':'01-nextjs', 'mobile':'09-expo', 'backend':'15-fastapi', 'protocol':'15-fastapi' };
  let expressStep = 0;      // 0 = what are you building, 1 = who is it for
  let expressBuild = '';
  function startExpress(){ expressStep=0; expressBuild=''; view.set('express'); }
  function expressPickBuild(platformId){ expressBuild=platformId; expressStep=1; }
  function expressPickIndustry(industryId){
    // set ONLY framework + industry; resolveStack derives pkg/auth/orm/obs/runtime/cluster defaults.
    pick('fw', EXPRESS_FW[expressBuild] || '01-nextjs');
    pick('industry', industryId);
    const steps=(getK()?.guided?.steps||[]);
    gstep.set(steps.length);   // jump straight to the result/repo screen
    view.set('guided');
    doRenderGuided();
  }
  $: platformPlain = isReady && getK() ? Object.entries(getK().platformPlain||{}) : [];
  $: industriesPlain = isReady && getG() ? (getG().nodes.industryRequirements||[]) : [];
  // Shown when an onclick references an id that no longer exists in the data.
  function missing(id){
    openDrawer('Not found', `<div class="sub">No record found for <code>${id}</code>.<br>The page data may be out of date. Try reloading.</div>`);
  }

  // ── URL hash: deep-link + restore the FULL build (ported/extended from site/app.js:309) ──
  // A shared link reproduces the exact stack — lens + every chosen axis + where you are.
  const HASH_AXES = ['industry','category','complianceFocus','fw','pkg','buildtool','orm','auth','obs','runtime','cluster','registry','signer','sbom'];
  function writeHash(){
    if(applyingHash || typeof location==='undefined') return;
    const p = new URLSearchParams();
    if(viewVal==='guided'){ p.set('mode','guided'); p.set('step', String(gstepVal)); }
    else if(viewVal==='flow'){ p.set('mode', mode); if(mode==='build' && currentScene) p.set('scene', String(currentScene+1)); }
    else { p.set('mode','welcome'); }
    for(const k of HASH_AXES){ const v=rsVal[k]; if(v) p.set(k, v); }
    const next = '#'+p.toString();
    if(location.hash !== next) history.replaceState(null, '', next);
  }
  function applyHash(){
    if(typeof location==='undefined' || !location.hash) return false;
    const p = new URLSearchParams(location.hash.slice(1));
    // Restore the whole stack in ONE update — avoids the cascade resets pick() triggers.
    const patch = {};
    for(const k of HASH_AXES){ const v=p.get(k); if(v) patch[k]=v; }
    if(Object.keys(patch).length) rs.update(s=>({...s, ...patch}));
    const m = p.get('mode');
    if(m==='guided'){ const s=parseInt(p.get('step')||'0')||0; gstep.set(s); view.set('guided'); return true; }
    if(m==='build'){ mode='build'; view.set('flow');
      const sc=parseInt(p.get('scene')||'0')||0; if(sc>0) tick().then(()=>goCol(sc-1)); return true; }
    if(m==='catalog'){ mode='catalog'; view.set('flow'); return true; }
    return false; // welcome or unknown
  }

  // ── Focus management for modals (ported from site/app.js:334-342) ─────────────
  function trapTab(e){
    const root = document.querySelector('.drawer.open');
    if(!root) return;
    const f = root.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if(!f.length) return;
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
  function onKeydown(e){
    if(e.key==='Escape'){
      if(popEl){ popEl=null; return; }
      if(glossaryOpen){ closeGlossary(); return; }
      if(drawerOpen){ closeDrawer(); return; }
    }
    if(e.key==='Tab' && (drawerOpen||glossaryOpen)) trapTab(e);
  }
  function focusModal(){
    tick().then(()=>{ const d=document.querySelector('.drawer.open'); if(d) d.focus(); });
  }
  function restoreFocus(){ if(lastFocus && lastFocus.focus){ try{ lastFocus.focus(); }catch(e){} } lastFocus=null; }

  // ── Catalog search (B5) ───────────────────────────────────────────────────────
  function filterCatalog(){
    const q = catalogSearch.trim().toLowerCase();
    const cards = document.querySelectorAll('.track .card');
    cards.forEach(c=>{ c.style.display = (q && !c.textContent.toLowerCase().includes(q)) ? 'none' : ''; });
    // dim columns that ended up empty
    document.querySelectorAll('.track .col').forEach(col=>{
      const any=[...col.querySelectorAll('.card')].some(c=>c.style.display!=='none');
      col.style.opacity = (q && !any) ? '.4' : '';
    });
  }

  // ── Share + export (B6) ─────────────────────────────────────────────────────
  function copyShareLink(){
    writeHash();
    const url = location.href;
    navigator.clipboard?.writeText(url).then(()=>{ shareLabel='Link copied!'; setTimeout(()=>{shareLabel='Share';},1600); }).catch(()=>{});
  }
  let shareLabel = 'Share';

  async function attemptLoad(){
    retrying = true;
    try { await loadAll(); }
    catch(e){ /* loadError store already set; error panel shows */ }
    finally { retrying = false; }
  }

  onMount(async ()=>{
    await attemptLoad();
    window.pickAxis = (axis, id) => { pick(axis, id); };
    window.builderChange = (axis, val) => { pick(axis, val); };
    window.goCol = goCol;
    window.setMode = (m) => {
      mode = m;
      syncState();
      if(m==='guided'){ gstep.set(0); gnav.set({platform:null,category:null,all:false}); view.set('guided'); doRenderGuided(); }
      else if(m==='build'){ view.set('flow'); renderBuild(); }
      else if(m==='catalog'){ view.set('flow'); renderCatalog(); }
    };
    window.showWelcome = () => { view.set('welcome'); };
    window.openFw = (id) => {
      const fw=(getG()?.nodes.frameworks||[]).find(f=>f.id===id); if(!fw)return missing(id);
      openDrawer(fw.name, fullNode(fw, (KFIELDS.frameworks||[]).map(([k,l])=>[k,l]), ['shipped']));
    };
    window.openStage = (id) => {
      const st=(getG()?.nodes.stages||[]).find(s=>s.id===id); if(!st)return missing(id);
      openDrawer(st.name||st.label, fullNode(st, null, null));
    };
    window.openInvariant = (id) => {
      const x=(getG()?.nodes.invariants||[]).find(i=>i.id===id); if(!x)return missing(id);
      openDrawer(x.name, fullNode(x, null, null));
    };
    window.openAxis = (id) => {
      const a=(getG()?.nodes.buildAxes||[]).find(x=>x.id===id); if(!a)return missing(id);
      openDrawer(a.name||a.arg, fullNode(a, null, null));
    };
    window.openProfile = (id) => {
      const p=(getG()?.nodes.complianceProfiles||[]).find(x=>x.id===id); if(!p)return missing(id);
      openDrawer(p.name, fullNode(p, [['fullName','Full name'],['regulator','Regulator'],['scope','Scope'],['what','What it covers'],['keyControls','Key controls'],['sourcePage','Source']], null));
    };
    window.openRegistry = () => openDrawer('GHCR — GitHub Container Registry', '<div class="sub">GitHub\'s built-in OCI registry. Signed images + SBOM attestations stored alongside.</div>');
    window.openImage = (id) => { const img=(getG()?.nodes.images||[]).find(x=>x.id===id); if(!img)return missing(id); openDrawer(img.name, fullNode(img, null, null)); };
    window.openDeep = (node, id) => { const o=(getG()?.nodes[node]||[]).find(x=>x.id===id); if(!o)return missing(id); openDrawer(o.name, fullNode(o, (KFIELDS[node]||[]).map(([k,l])=>[k,l]), null)); };
    window.openPkg = (id) => window.openDeep('pkgBuildDeep', id);
    window.openGitops = (id) => { const t=(getG()?.nodes.gitopsTools||[]).find(x=>x.id===id); if(!t)return missing(id); openDrawer(t.name, fullNode(t, null, null)); };
    window.openCluster = (id) => window.openDeep('clusters', id);
    window.openCluster2 = (id) => { const c=(getG()?.nodes.clusterComponents||[]).find(x=>x.id===id); if(!c)return missing(id); openDrawer((c.num?c.num+'. ':'')+c.name, fullNode(c, [['what','what'],['layer','layer'],['installCommand','install'],['verifyCommand','verify'],['whenNot','skip when'],['evidence','notes']], null)); };
    window.openIntegration = (id) => { const g=(getG()?.nodes.integrations||[]).find(x=>x.id===id); if(!g)return missing(id); openDrawer(g.externalSystem, fullNode(g, null, null)); };
    window.openConcept = (id) => { const c=(getG()?.nodes.conceptNotes||[]).find(x=>x.id===id); if(!c)return missing(id); openDrawer(c.title, `<div class="sub">${stripTags(c.body||c.text||'')}</div>`); };
    window.openRef = (node, id) => { const o=(getG()?.nodes[node]||[]).find(x=>x.id===id); if(!o)return missing(id); openDrawer(o.name||o.id, fullNode(o, null, null)); };
    window.copyCode = (id, btn) => {
      const el=document.getElementById(id); if(!el) return;
      navigator.clipboard.writeText(el.textContent||'').then(()=>{ if(btn){btn.textContent='copied!';setTimeout(()=>{btn.textContent='copy';},1500);}}).catch(()=>{});
    };
    window.copyAudit = (btn) => {
      const el=document.querySelector('.colbody'); if(!el) return;
      navigator.clipboard.writeText(el.innerText||'').then(()=>{ if(btn){btn.textContent='copied!';setTimeout(()=>{btn.textContent='copy the audit';},2000);}}).catch(()=>{});
    };
    window.copyAllFiles = (btn) => {
      const el=document.getElementById('allfiles'); if(!el) return;
      navigator.clipboard.writeText(el.value||'').then(()=>{ if(btn){const t=btn.textContent;btn.textContent='✓ all files copied!';setTimeout(()=>{btn.textContent=t;},2000);}}).catch(()=>{});
    };
    window.downloadRepo = async (btn) => {
      const label = btn ? btn.textContent : '';
      if(btn){ btn.disabled=true; btn.textContent='zipping…'; }
      try {
        const files = getRepoFiles();              // {path: contents}
        const name = getRepoName() || 'pipeline';
        const zip = new JSZip();
        const root = zip.folder(name);
        for(const [path, contents] of Object.entries(files)) root.file(path, contents);
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${name}.zip`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(url), 1000);
        if(btn){ btn.textContent='✓ downloaded'; setTimeout(()=>{ btn.textContent=label; btn.disabled=false; }, 2200); }
      } catch(e){
        if(btn){ btn.textContent='download failed — retry'; btn.disabled=false; }
      }
    };
    window.gGo = (dir) => {
      const K=getK(); if(!K) return;
      const steps=(K.guided?.steps||[]);
      const next=get(gstep)+dir;
      if(next<0){ view.set('welcome'); return; }
      if(next>steps.length) return;
      gstep.set(next);
    };
    window.gPick = (axis, id) => { pick(axis, id); };
    window.gNav = (type, val) => { gnav.update(v=>({...v,[type]:val,...(type==='platform'?{category:null}:{})})); };
    window.gNavAll = () => { gnav.update(v=>({...v,all:true})); };
    window.gFilter = (q) => {
      const cards=document.querySelectorAll('#gcards .gcard'); const lo=q.toLowerCase();
      cards.forEach(c=>{ c.style.display=(lo&&!c.textContent.toLowerCase().includes(lo))?'none':''; });
    };
    window.gUseRec = () => {
      const K=getK(); if(!K) return;
      const step=(K.guided?.steps||[])[get(gstep)]; if(!step) return;
      const opts=gOptions(step.axis);
      const rec=opts.find(o=>o.rec)||opts[0];
      if(rec){ pick(step.axis, rec.id); window.gGo(1); }
    };
    window.gJump = (i) => { gstep.set(i); };
    window.startGuided = startGuided;
    window.showPop = (el) => { popEl=el; popText=el.dataset.def||''; popTerm=el.dataset.t||el.textContent||''; };
    window.hidePop = () => { popEl=null; };

    // Restore deep-linked state from the URL (mode, scene, lens). Welcome otherwise.
    if(!applyHash()) view.set('welcome');
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });

  // Resume affordance: returning user has saved progress.
  $: canResume = isReady && (gstepVal>0 || (rsVal && rsVal.industry));

  // Glossary
  function openGlossary(){ lastFocus=document.activeElement; glossaryOpen=true; glossaryQuery=''; focusModal(); }
  function closeGlossary(){ glossaryOpen=false; restoreFocus(); }
  $: glossaryItems = isReady && getK() ? (getK().glossary||[]).filter(g=> !glossaryQuery || g.term.toLowerCase().includes(glossaryQuery.toLowerCase()) || (g.def||'').toLowerCase().includes(glossaryQuery.toLowerCase())) : [];
</script>

{#if errMsg}
  <div class="loadfail" role="alert">
    <div class="loadfail-card">
      <div class="loadfail-icon">⚠️</div>
      <h1>Couldn't load Pipeline Studio</h1>
      <p class="loadfail-msg">{errMsg}</p>
      <p class="sub">The app needs graph.json, knowledge.json and generators.js. Check your connection, then retry.</p>
      <button class="loadfail-retry" onclick={attemptLoad} disabled={retrying}>
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  </div>
{:else if !isReady}
  <div class="loading"><span class="loading-spin" aria-hidden="true"></span> Loading knowledge graph…</div>
{:else}

<!-- ── Header ──────────────────────────────────────────────────────────────── -->
<header>
  <div class="brand" onclick={()=>view.set('welcome')} role="button" tabindex="0"
       onkeydown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); view.set('welcome'); } }}
       aria-label="Yarova Studio — home">
    <img class="wordmark" src="/yarova-logo-light.png" alt="Yarova" />
    <span class="toolname">Studio</span>
  </div>
  <div class="modes" role="tablist" aria-label="View mode">
    <button class="mode" class:on={viewVal==='guided'} role="tab" aria-selected={viewVal==='guided'}
      onclick={()=>{ gstep.set(0); gnav.set({platform:null,category:null,all:false}); view.set('guided'); doRenderGuided(); }}>Guided</button>
    <button class="mode" class:on={mode==='build'&&viewVal==='flow'} role="tab" aria-selected={mode==='build'&&viewVal==='flow'}
      onclick={()=>{ mode='build'; view.set('flow'); renderBuild(); }}>The flow</button>
    <button class="mode" class:on={mode==='catalog'&&viewVal==='flow'} role="tab" aria-selected={mode==='catalog'&&viewVal==='flow'}
      onclick={()=>{ mode='catalog'; view.set('flow'); renderCatalog(); }}>Catalog</button>
  </div>
  <button class="gloss" onclick={openGlossary} title="Glossary — every term, plainly">? glossary</button>
  {#if viewVal!=='welcome'}
    <button class="gloss" onclick={copyShareLink} title="Copy a link to this exact view">🔗 {shareLabel}</button>
    <div class="levels" role="group" aria-label="Detail level">
      <button class="lvlbtn" class:on={level==='beginner'} onclick={()=>setLevel('beginner')} title="Hide advanced columns — focus on the essentials">Beginner</button>
      <button class="lvlbtn" class:on={level==='expert'} onclick={()=>setLevel('expert')} title="Show everything — all columns, all depth">Expert</button>
    </div>
  {/if}
  <div class="legend">
    <span><span class="dot" style="background:var(--amber)"></span>required by lens</span>
    <span><span class="dot" style="background:var(--green)"></span>same for every industry</span>
    <span><span class="dot" style="background:var(--muted);opacity:.5"></span>not required here</span>
  </div>
  <div class="lens">
    <span class="sub">Industry lens:</span>
    {#if getG()}
      <select aria-label="Choose an industry vertical to see what applies" value={rsVal.industry||''} onchange={e=>pick('industry', e.target.value)}>
        <option value="">All industries (no lens)</option>
        {#each (getG().nodes.industryRequirements||[]) as r}
          <option value={r.id}>{r.name}</option>
        {/each}
      </select>
    {/if}
  </div>
</header>

<!-- ── Hero rail ───────────────────────────────────────────────────────────── -->
{#if viewVal==='flow'}
  <section class="hero" aria-label="Pipeline overview">
    <div class="htitle">{mode==='build' ? 'Your build · 18 scenes, start to running cluster' : 'The pipeline · front-end to running cluster'}</div>
    <div class="hrail">{@html heroHtml}</div>
  </section>
{/if}

<!-- ── Builder bar (build mode) ───────────────────────────────────────────── -->
{#if mode==='build' && viewVal==='flow' && builderHtml}
  <div class="builder on" aria-label="Stack inputs">{@html builderHtml}</div>
{/if}

<!-- ── Stack bar (build mode) ─────────────────────────────────────────────── -->
{#if mode==='build' && viewVal==='flow' && stackBarHtml}
  <div class="stackbar on" aria-label="Your current stack">{@html stackBarHtml}</div>
{/if}

<!-- ── Lens info banner ────────────────────────────────────────────────────── -->
{#if lensInfoHtml && viewVal==='flow'}
  <div class="lensinfo on" role="status">{@html lensInfoHtml}</div>
{/if}

<!-- ── Industry-changed banner (B8) ────────────────────────────────────────── -->
{#if rsVal._industryChanged && viewVal==='flow'}
  <div class="changebanner" role="status">
    <span>🔶 Industry changed to <b>{rsVal._industryChanged}</b> — sign-in, observability, base image and cluster were re-derived. Review them.</span>
    <button onclick={clearIndustryBanner} aria-label="Dismiss">✕</button>
  </div>
{/if}

<!-- ── Catalog search (B5) ─────────────────────────────────────────────────── -->
{#if mode==='catalog' && viewVal==='flow'}
  <div class="catsearch">
    <input type="search" placeholder="Search all columns — frameworks, tools, regimes, clusters…"
      bind:value={catalogSearch} oninput={filterCatalog} aria-label="Search the catalog" />
    {#if catalogSearch}
      <button class="catsearch-clear" onclick={()=>{ catalogSearch=''; filterCatalog(); }}>clear</button>
    {/if}
  </div>
{/if}

<!-- ── Welcome ──────────────────────────────────────────────────────────────  -->
{#if viewVal==='welcome'}
  <section class="welcome">
    <div class="wv">
      <img src="/yarova-logo-light.png" alt="Yarova" style="height:32px;margin-bottom:16px" />
      <h1>Your whole delivery pipeline.<br>Built in two questions.</h1>
      <p class="wp">Tell us what you're building and who it's for.
      We assemble the entire setup — container, tests, deploy, security, monitoring —
      and hand you a repo you download and run. No DevOps knowledge needed.</p>
      <div class="wbtns">
        <button class="wstart" onclick={()=>startExpress()}>Build my pipeline →</button>
        <button class="walt" onclick={()=>startGuided(false)}>I know my stack — choose every detail</button>
      </div>
      {#if canResume}
        <div class="wresume show">
          <button class="wresume-btn" onclick={()=>startGuided(true)}>
            ↻ Resume where you left off{gstepVal>0 ? ` — decision ${gstepVal+1}` : ''}
          </button>
        </div>
      {/if}
      {#if getK()?.primer}
        <div class="primer">
          <button class="primer-toggle" aria-expanded={showPrimer} onclick={()=>showPrimer=!showPrimer}>
            {showPrimer ? '▾' : '▸'} New here? What is a pipeline? <span class="sub">30-second read</span>
          </button>
          {#if showPrimer}
            {@const P = getK().primer}
            <div class="primer-body">
              <p class="primer-what">{P.what}</p>
              <p class="primer-why"><b>Why it matters:</b> {P.why}</p>
              <ol class="primer-steps">
                {#each P.steps as [name, desc]}
                  <li><b>{name}.</b> {desc}</li>
                {/each}
              </ol>
              <p class="primer-promise">{P.promise}</p>
              <p class="sub">{P.jargonNote}</p>
            </div>
          {/if}
        </div>
      {/if}
      <div class="wmore">
        <button onclick={()=>{ mode='build'; view.set('flow'); renderBuild(); }}>explore the full map</button>
        <span>·</span>
        <button onclick={()=>{ mode='catalog'; view.set('flow'); renderCatalog(); }}>browse the catalog</button>
      </div>
    </div>
  </section>

{:else if viewVal==='express'}
  <section class="welcome">
    <div class="ev">
      <div class="ev-top">
        <button class="gback" onclick={()=> expressStep===0 ? view.set('welcome') : (expressStep=0)}>← back</button>
        <span class="ev-count">question {expressStep+1} of 2</span>
      </div>
      {#if expressStep===0}
        <h2 class="ev-q">What are you building?</h2>
        <p class="ev-sub">Pick the closest. You can change anything later.</p>
        <div class="ev-opts">
          {#each platformPlain as [id, p]}
            <button class="ev-opt" onclick={()=>expressPickBuild(id)}>
              <span class="ev-opt-name">{p.name}</span>
              <span class="ev-opt-plain">{p.plain}</span>
            </button>
          {/each}
        </div>
      {:else}
        <h2 class="ev-q">Who is it for?</h2>
        <p class="ev-sub">This sets your security + compliance rules. Pick the closest.</p>
        <div class="ev-opts">
          <button class="ev-opt" onclick={()=>expressPickIndustry('technology')}>
            <span class="ev-opt-name">Not sure / just trying it</span>
            <span class="ev-opt-plain">Safe general defaults — change later.</span>
          </button>
          {#each industriesPlain as r}
            <button class="ev-opt compact" onclick={()=>expressPickIndustry(r.id)}>
              <span class="ev-opt-name">{r.name}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </section>

{:else if viewVal==='guided'}
  <section class="guided">{@html guidedHtml}</section>

{:else if viewVal==='flow'}
  {#if mode==='catalog' && level==='beginner'}
    <div class="lvlhint">
      <span>Beginner view — showing the 6 core columns. Compliance, integrations and reference are hidden.</span>
      <button onclick={()=>setLevel('expert')}>Show all 9 →</button>
    </div>
  {/if}
  <div class="track {mode==='catalog' ? levelClass : ''}">{@html mode==='catalog'?boardHtml:resolverHtml}</div>
{/if}

<!-- ── Drawer ──────────────────────────────────────────────────────────────── -->
{#if drawerOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="scrim on" onclick={closeDrawer}></div>
  <div class="drawer open" role="dialog" aria-modal="true" aria-label="Detail panel" tabindex="-1">
    <div class="dh">
      <h1>{drawerTitle}</h1>
      <button class="x" onclick={closeDrawer} aria-label="Close">✕</button>
    </div>
    <div class="db">{@html drawerBody}</div>
  </div>
{/if}

<!-- ── Glossary drawer ─────────────────────────────────────────────────────── -->
{#if glossaryOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="scrim on" onclick={closeGlossary}></div>
  <div class="drawer open" role="dialog" aria-modal="true" aria-label="Glossary" tabindex="-1">
    <div class="dh">
      <h1>Glossary</h1>
      <button class="x" onclick={closeGlossary} aria-label="Close">✕</button>
    </div>
    <div class="db">
      <input class="gsearch" type="search" placeholder="Search terms…" bind:value={glossaryQuery} />
      {#each glossaryItems as g}
        <div class="gterm"><b>{g.term}</b><span>{g.def||''}</span></div>
      {/each}
      {#if !glossaryItems.length}
        <div class="sub">No terms match.</div>
      {/if}
    </div>
  </div>
{/if}

<!-- ── Tooltip pop ─────────────────────────────────────────────────────────── -->
{#if popEl}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="pop" onclick={()=>{ popEl=null; }}>
    <b class="pop-term">{popTerm}</b>
    <p class="pop-def">{popText}</p>
  </div>
{/if}

{/if}
