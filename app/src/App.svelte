<script>
  import { onMount } from 'svelte';
  import { ready, loadError } from './lib/stores.js';
  import { loadAll } from './lib/data.js';
  import { platformScale } from './lib/wizard.js';
  import {
    primer, frameworkChapters, pipeline, decisionChapters, complianceChapter,
    proofRepos, glossary, detailFor, regimeDetail,
  } from './lib/guide.js';
  import './app.css';

  let retrying = false;
  let drawer = null;        // {title, lead, rows} — the explanation panel
  let glossOpen = false;
  let glossQuery = '';
  let industry = 'baseline'; // for the compliance lens

  // chapters (computed once ready)
  $: P   = $ready ? primer() : null;
  $: scale = $ready ? platformScale() : null;
  $: fwCh = $ready ? frameworkChapters() : [];
  $: pipe = $ready ? pipeline() : [];
  $: decCh = $ready ? decisionChapters() : [];
  $: comp = $ready ? complianceChapter() : null;
  $: repos = $ready ? proofRepos() : [];
  $: gloss = $ready ? glossary() : [];
  $: glossList = gloss.filter(g => !glossQuery || (g.term+' '+(g.def||'')).toLowerCase().includes(glossQuery.toLowerCase()));

  const LANG = { ts:'TypeScript', js:'JavaScript', py:'Python', go:'Go', rust:'Rust', java:'Java',
    kotlin:'Kotlin', php:'PHP', ruby:'Ruby', csharp:'.NET', elixir:'Elixir', dart:'Dart', swift:'Swift' };
  const NAV = [['what','What it is'],['frameworks','Frameworks'],['pipeline','The pipeline'],
    ['decisions','The decisions'],['compliance','Compliance'],['proof','Proof']];

  function open(kind, id){ drawer = detailFor(kind, id); }
  function openRegime(id){ drawer = regimeDetail(id); }
  function closeDrawer(){ drawer = null; }
  function jump(id){ document.getElementById('ch-'+id)?.scrollIntoView({behavior:'smooth'}); }

  async function attemptLoad(){ retrying = true; try { await loadAll(); } catch(e){} finally { retrying = false; } }
  onMount(attemptLoad);

  function onKey(e){ if(e.key==='Escape'){ drawer=null; glossOpen=false; } }
</script>

<svelte:window on:keydown={onKey} />

{#if $loadError}
  <div class="loadfail" role="alert"><div class="loadfail-card">
    <div class="loadfail-icon">⚠️</div><h1>Couldn't load the studio</h1>
    <p class="loadfail-msg">{$loadError}</p>
    <button class="btn primary" onclick={attemptLoad} disabled={retrying}>{retrying?'Retrying…':'Retry'}</button>
  </div></div>
{:else if !$ready}
  <div class="loading"><span class="loading-spin" aria-hidden="true"></span> Loading the platform knowledge…</div>
{:else}

<header class="gd-header">
  <div class="brand" onclick={()=>jump('what')} role="button" tabindex="0"
    onkeydown={(e)=>{ if(e.key==='Enter'){ jump('what'); } }}>
    <img class="wordmark" src="/yarova-logo-light.png" alt="Yarova" /><span class="toolname">Studio</span>
  </div>
  <nav class="gd-nav">
    {#each NAV as [id, label]}<button onclick={()=>jump(id)}>{label}</button>{/each}
  </nav>
  <button class="btn ghost gloss-btn" onclick={()=>{glossOpen=true;}}>? glossary</button>
</header>

<main class="gd">

  <!-- Chapter 0 — what is this -->
  <section id="ch-what" class="gd-hero">
    <h1 class="gd-h1">Understand the whole platform.<br>Start to end.</h1>
    <p class="gd-lead">Every framework. Every pipeline phase. Every tool, decision, and compliance rule.
    Explained in plain words. Click anything to learn what it is and why it matters.</p>
    {#if scale}
      <div class="gd-scale">
        <span><b>{scale.frameworks}</b> frameworks</span><span><b>{scale.phases}</b> phases</span>
        <span><b>{scale.stages}</b> stages</span><span><b>{scale.tools}</b> tools</span>
        <span><b>{scale.regimes}</b> compliance regimes</span><span><b>{scale.built}</b> real repos</span>
      </div>
    {/if}
    {#if P}
      <div class="gd-primer">
        <p class="primer-what">{P.what}</p>
        <p><b>Why it matters:</b> {P.why}</p>
        {#if P.steps}<ol>{#each P.steps as [n,d]}<li><b>{n}.</b> {d}</li>{/each}</ol>{/if}
      </div>
    {/if}
  </section>

  <!-- Chapter 1 — frameworks -->
  <section id="ch-frameworks" class="gd-sec">
    <h2 class="gd-h2">Frameworks</h2>
    <p class="gd-note">The toolkit your app is built with. ✅ = real code · 🕓 = recipe. Click any to learn it.</p>
    {#each fwCh as dv}
      <div class="gd-device"><h3 class="gd-h3">{dv.device}</h3>
        {#each dv.groups as g}
          <div class="gd-cat">{g.name}</div>
          <div class="gd-chips">
            {#each g.frameworks as f}
              <button class="gd-chip fw" class:built={f.built} onclick={()=>open('frameworks', f.id)}>
                {f.name} <span class="b">{f.built?'✅':'🕓'}</span><span class="lg">{LANG[f.lang]||f.lang}</span>
              </button>
            {/each}
          </div>
        {/each}
      </div>
    {/each}
  </section>

  <!-- Chapter 2 — the pipeline -->
  <section id="ch-pipeline" class="gd-sec">
    <h2 class="gd-h2">The pipeline — code to running app</h2>
    <p class="gd-note">CI = the robot that builds, secures, tests, ships your code.
      Color: <span class="d do">● DevOps</span> <span class="d sec">● DevSecOps</span> <span class="d sre">● SRE</span>. Click a tool to learn it.</p>
    {#each pipe as p, i}
      <div class="gd-phase">
        <div class="gd-phase-h"><span class="gd-num">{i+1}</span>{p.name}</div>
        <div class="gd-stages">
          {#each p.stages as st}
            <div class="gd-stage">
              <div class="gd-stage-n">{st.name}{#if st.parallel}<span class="par">parallel</span>{/if}</div>
              <div class="gd-tools">
                {#each st.tools as t}
                  <button class="gd-tool {t.discipline==='DevSecOps'?'sec':t.discipline==='SRE'?'sre':'do'}" onclick={()=>open('tools', t.id)}>{t.name}</button>
                {/each}
                {#if !st.tools.length}<span class="gd-none">platform default</span>{/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </section>

  <!-- Chapter 3 — the decisions -->
  <section id="ch-decisions" class="gd-sec">
    <h2 class="gd-h2">The decisions — every choice, explained</h2>
    <p class="gd-note">A real pipeline needs these choices. Click any option to learn what it is, when to use it, the trade-off.</p>
    {#each decCh as a}
      <div class="gd-axis">
        <div class="gd-axis-h">{a.title} <span class="gd-axis-p">{a.plain}</span></div>
        <div class="gd-chips">
          {#each a.options as o}<button class="gd-chip" onclick={()=>open(a.kind, o.id)}>{o.name}</button>{/each}
        </div>
      </div>
    {/each}
  </section>

  <!-- Chapter 4 — compliance -->
  {#if comp}
    <section id="ch-compliance" class="gd-sec">
      <h2 class="gd-h2">Compliance — the rules per industry</h2>
      <p class="gd-note">A control = a security/privacy rule. Pick a regime to learn it. Canada-first.</p>
      <div class="gd-chips">
        {#each comp.regimes as r}
          <button class="gd-chip rg {r.priority}" onclick={()=>openRegime(r.id)}>{r.name}</button>
        {/each}
      </div>
      <div class="gd-lens">
        <span>See what one regime turns on:</span>
        <select bind:value={industry}>
          <option value="baseline">— pick a regime —</option>
          {#each comp.regimes as r}<option value={r.id}>{r.name}</option>{/each}
        </select>
      </div>
      {#if industry!=='baseline'}
        {@const reg = comp.regimes.find(r=>r.id===industry)}
        <div class="gd-controls">
          {#each comp.controlKeys as k}
            {@const v = reg.enforces[k]}
            {@const on = !(v===undefined||v===false||v===0||v==='none')}
            <div class="gd-ctrl {on?'on':''}"><span class="dot"></span>{comp.controlLabels[k]}<b>{on?(v===true?'on':v):'—'}</b></div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Chapter 5 — proof -->
  <section id="ch-proof" class="gd-sec">
    <h2 class="gd-h2">Proof — {repos.length} real repos, live</h2>
    <p class="gd-note">Not slides. Real code with green CI. Click to open on GitHub.</p>
    <div class="gd-repos">
      {#each repos as r}<a class="gd-repo" href={r.url} target="_blank" rel="noopener">{r.name} <span class="ci">✓ CI</span></a>{/each}
    </div>
  </section>
</main>

<!-- detail drawer -->
{#if drawer}
  <div class="scrim" onclick={closeDrawer} role="presentation"></div>
  <aside class="gd-drawer" role="dialog" aria-label="Explanation">
    <div class="gd-dh"><h2>{drawer.title}</h2><button class="x" onclick={closeDrawer} aria-label="Close">✕</button></div>
    {#if drawer.lead}<p class="gd-lead-sm">{drawer.lead}</p>{/if}
    <dl class="gd-rows">
      {#each drawer.rows as [label, value]}<dt>{label}</dt><dd>{value}</dd>{/each}
    </dl>
    {#if !drawer.rows.length}<p class="gd-note">No further detail recorded.</p>{/if}
  </aside>
{/if}

<!-- glossary -->
{#if glossOpen}
  <div class="scrim" onclick={()=>glossOpen=false} role="presentation"></div>
  <aside class="gd-drawer" role="dialog" aria-label="Glossary">
    <div class="gd-dh"><h2>Glossary</h2><button class="x" onclick={()=>glossOpen=false} aria-label="Close">✕</button></div>
    <input class="gd-search" type="search" placeholder="Search terms…" bind:value={glossQuery} />
    {#each glossList as g}<div class="gd-term"><b>{g.term}</b><span>{g.def}</span></div>{/each}
    {#if !glossList.length}<p class="gd-note">No terms match.</p>{/if}
  </aside>
{/if}

{/if}
