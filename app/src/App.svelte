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

  // ── Purpose page content (authored — the platform org, plain words) ───────
  const PILLARS = [
    ['What the platform offers','Every framework, pipeline, security gate, compliance rule, cluster, deploy target.'],
    ['Who runs the platform','A platform team, from director to engineer — each owning a clear slice.'],
    ['How it stays alive','Patched, upgraded, modernized, versioned — as technology moves.'],
    ['How anyone uses it','Pick a stack → ship to registry + ArgoCD → maintain it. Guided, explained.'],
  ];
  // Honest status — what is real code vs designed. Studio shows this everywhere.
  const LAYERS = [
    ['Services','frameworks → golden repos','22 built','84 designed'],
    ['Clusters','EKS · AKS · GKE · OpenShift, hub-and-spoke','Terraform exists','to complete + repo-ize'],
    ['Serverless / edge','Workers · Lambda · Cloud Run','edge-hono built','rest designed'],
    ['Invariants','laws per service-category + per cluster','25 defined','wire as tests'],
    ['Compliance','16 industries × 29 regimes','catalog live','—'],
    ['CI/CD','DevOps · DevSecOps · SRE pipeline','22 services green','—'],
    ['ADRs','the decision + why, recorded','—','to author per decision'],
  ];
  // Director of Platform Engineering = leads the team that builds the paved road.
  const ROLES = [
    { role:'Director of Platform Engineering', owns:'Vision, roadmap, strategy, budget, hiring.',
      does:'Decides what the platform supports next + the trade-offs.', ships:'The 1–3 year platform direction.' },
    { role:'Platform Engineering Lead', owns:'Team delivery, priorities, unblocking.',
      does:'Turns the roadmap into shipped work.', ships:'Roadmap items, on time.' },
    { role:'Platform / IDP Engineer', owns:'The golden paths — templates, this studio, self-service.',
      does:'Builds so a developer ships without filing tickets.', ships:'Self-service that just works.',
      note:'IDP = Internal Developer Platform (self-service tooling).' },
    { role:'DevOps Engineer', owns:'CI/CD pipelines, automation, infra-as-code.',
      does:'Wires build → test → deploy, fully automated.', ships:'The pipeline every repo uses.',
      note:'CI/CD = the automated build-and-ship pipeline. Infra-as-code = infra defined in files.' },
    { role:'DevSecOps Engineer', owns:'Security gates — SCA, SAST, secrets, signing, SBOM, compliance.',
      does:'Makes sure nothing ships unscanned or unsigned.', ships:'A provable, secure supply chain.',
      note:'SCA = scans dependencies. SAST = scans your code. SBOM = the ingredient list.' },
    { role:'SRE — Site Reliability Engineer', owns:'Reliability — SLOs, observability, on-call, rollouts.',
      does:'Keeps it up; handles incidents; tunes performance.', ships:'Uptime + fast recovery.',
      note:'SLO = a measurable reliability target. Observability = seeing what the app does.' },
    { role:'Cloud / Infrastructure Engineer', owns:'Clusters, networking, identity, cost.',
      does:'Provides + tunes the runtime apps land on.', ships:'The cluster + its guardrails.' },
    { role:'Release / Delivery Engineer', owns:'Promotions across environments, GitOps, ArgoCD.',
      does:'Moves code safely dev → test → prod.', ships:'A controlled path to production.',
      note:'GitOps = git is the source of truth; ArgoCD syncs git → cluster.' },
    { role:'Product / Application Developer', owns:'Their app code — nothing else.',
      does:'Picks a golden path + writes features.', ships:'The product. The platform does the rest.',
      note:'This is the consumer — the person the whole platform serves.' },
  ];
  const LIFECYCLE = [
    ['Create','The team builds a golden repo per framework — real, runnable.'],
    ['Patch','Renovate + Dependabot open PRs for new dependency versions, weekly.'],
    ['Upgrade','Framework + tool versions bump on a schedule; CI proves they still pass.'],
    ['Modernize','Aging tech is replaced before it rots — driven by the roadmap.'],
    ['Version','Every release is tagged + signed; you always know what is running.'],
    ['Retire','Deprecated paths are marked, then removed — with a migration note.'],
  ];
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

  <!-- Chapter 0 — PURPOSE (the locked page) -->
  <section id="ch-what" class="gd-purpose">
    <div class="pp-hero">
      <span class="pp-kicker">Platform Engineering — explained, end to end</span>
      <h1 class="gd-h1">The whole platform.<br>Who runs it. How you build on it.</h1>
      <p class="gd-lead">One guide to a complete platform-engineering organization.
      What it offers, who maintains it, how it evolves, and how anyone ships a product on it.
      Plain words. Nothing to memorize.</p>
      {#if scale}
        <div class="gd-scale">
          <span><b>{scale.frameworks}</b> frameworks</span><span><b>{scale.phases}</b> phases</span>
          <span><b>{scale.stages}</b> stages</span><span><b>{scale.tools}</b> tools</span>
          <span><b>{scale.regimes}</b> compliance regimes</span><span><b>{scale.built}</b> real repos</span>
        </div>
      {/if}
    </div>

    <h2 class="gd-h2">What this studio is</h2>
    <div class="pp-pillars">
      {#each PILLARS as [t, d]}<div class="pp-pillar"><div class="pp-pt">{t}</div><div class="pp-pd">{d}</div></div>{/each}
    </div>

    <h2 class="gd-h2">The platform — every layer + its status</h2>
    <p class="gd-note">Honest by design. ✅ = real code you can open. 🕓 = designed + explained, repo planned.</p>
    <div class="pp-layers">
      {#each LAYERS as [name, what, built, todo]}
        <div class="pp-layer">
          <div class="pp-ln">{name}</div>
          <div class="pp-lw">{what}</div>
          <div class="pp-ls2">{#if built!=='—'}<span class="ok">✅ {built}</span>{/if}{#if todo!=='—'}<span class="soon">🕓 {todo}</span>{/if}</div>
        </div>
      {/each}
    </div>

    <h2 class="gd-h2">Who runs the platform</h2>
    <p class="gd-note">A platform team builds + maintains the paved road. Every role owns a clear slice.</p>
    <div class="pp-roles">
      {#each ROLES as r, i}
        <div class="pp-role" class:consumer={i===ROLES.length-1}>
          <div class="pp-role-h"><span class="pp-rn">{i+1}</span>{r.role}</div>
          <dl>
            <dt>Owns</dt><dd>{r.owns}</dd>
            <dt>Does</dt><dd>{r.does}</dd>
            <dt>Ships</dt><dd>{r.ships}</dd>
            {#if r.note}<dt>Plain terms</dt><dd class="pp-note-d">{r.note}</dd>{/if}
          </dl>
        </div>
      {/each}
    </div>

    <h2 class="gd-h2">How the platform stays alive</h2>
    <p class="gd-note">Technology moves. The platform is kept current — never left to rot.</p>
    <div class="pp-life">
      {#each LIFECYCLE as [step, d], i}
        <div class="pp-life-step"><span class="pp-ls">{i+1}</span><b>{step}</b><span>{d}</span></div>
      {/each}
    </div>

    <h2 class="gd-h2">Two things keep it correct</h2>
    <div class="pp-pillars">
      <div class="pp-pillar"><div class="pp-pt">Invariants</div>
        <div class="pp-pd">A law that must always hold, proven by a test.
        Different per service-category and per cluster. Example: every service exposes /health.</div></div>
      <div class="pp-pillar"><div class="pp-pt">ADRs</div>
        <div class="pp-pd">Architecture Decision Record — the decision + why, written down.
        So a choice is never re-argued, and a newcomer learns the reasoning.</div></div>
    </div>

    <h2 class="gd-h2">How you use it to build</h2>
    <p class="gd-note">You pick ONE stack. The studio still shows ALL of it, so every choice is clear.</p>
    <div class="pp-flow">
      Industry → Framework → Package + build → Auth → Data → Observability →
      Runtime → Security gates → Registry (image pushed) → Sign + SBOM →
      ArgoCD (deploy + auto-sync) → Promotions + monitor
    </div>
    <p class="gd-note">Each step below is narrated: what it is, your options, what to use for your case, why.</p>

    <div class="pp-test">
      <b>The test of this studio:</b>
      a newcomer reads it → understands the platform org + can act in it.
      A builder reads it → ships + maintains a product. No prior expertise needed.
    </div>
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
