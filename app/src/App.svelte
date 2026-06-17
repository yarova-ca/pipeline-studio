<script>
  import { onMount } from 'svelte';
  import { rs, ready, loadError, pick } from './lib/stores.js';
  import { loadAll } from './lib/data.js';
  import {
    STEP_ORDER, DECISION_STEPS, deviceGroups, frameworksForDevice,
    buildBlueprint, repoLink, gOptions, buildComplianceMatrix, catalogOptions, integrationsList, platformScale, platformMap
  } from './lib/wizard.js';
  import './app.css';

  let view = 'blueprint';       // 'blueprint' (whole platform) | 'wizard' (configure)
  let step = 0;                 // index into STEP_ORDER
  let chosenDevice = '';        // device id picked on step 0
  let showAll = false;          // "see other options" expander on a decision step
  let retrying = false;
  let openPhase = null;         // which blueprint phase is expanded
  $: pmap = ($ready && view==='blueprint') ? platformMap() : null;
  const DISC = { DevOps:'do', DevSecOps:'sec', SRE:'sre' };
  function enterWizard(){ view='wizard'; step=0; chosenDevice=''; }

  $: stepKey = STEP_ORDER[step];
  $: total   = STEP_ORDER.length;
  $: decStep = DECISION_STEPS.find(d => d.axis === stepKey);
  $: opts    = (decStep && $ready) ? (catalogOptions(stepKey, $rs) || gOptions(stepKey, $rs)) : [];
  $: rec     = opts.find(o => o.rec) || opts[0];
  $: devices = $ready ? deviceGroups() : [];
  $: scale = $ready ? platformScale() : null;
  $: fwGroups = (stepKey === 'fw' && chosenDevice && $ready) ? frameworksForDevice(chosenDevice) : [];
  $: bp = (stepKey === 'result' && $ready && $rs.fw) ? buildBlueprint($rs) : null;
  $: matrix = (stepKey === 'result' && $ready && $rs.fw) ? buildComplianceMatrix($rs) : null;
  $: integrations = (stepKey === 'result' && $ready) ? integrationsList() : null;

  function next(){ if(step < total - 1){ step++; showAll = false; } }
  function back(){ if(step > 0){ step--; showAll = false; } }
  function goto(i){ step = i; showAll = false; }

  function pickDevice(id){ chosenDevice = id; next(); }
  function pickFw(id){ pick('fw', id); next(); }
  function pickIndustry(id){ pick('industry', id); next(); }
  function skipIndustry(){ pick('industry', ''); next(); }
  function accept(){ if(rec){ pick(stepKey, rec.id); } next(); }
  function pickOption(id){ pick(stepKey, id); next(); }
  function restart(){ view='blueprint'; step = 0; chosenDevice = ''; showAll = false; }

  async function attemptLoad(){
    retrying = true;
    try { await loadAll(); } catch(e){ /* loadError store drives the panel */ }
    finally { retrying = false; }
  }
  onMount(attemptLoad);

  const LANG = { ts:'TypeScript', js:'JavaScript', py:'Python', go:'Go', rust:'Rust',
    java:'Java', kotlin:'Kotlin', php:'PHP', ruby:'Ruby', csharp:'.NET', elixir:'Elixir', dart:'Dart', swift:'Swift' };
</script>

{#if $loadError}
  <div class="loadfail" role="alert">
    <div class="loadfail-card">
      <div class="loadfail-icon">⚠️</div>
      <h1>Couldn't load the Studio</h1>
      <p class="loadfail-msg">{$loadError}</p>
      <p class="sub">It needs graph.json, knowledge.json and generators.js. Check your connection, then retry.</p>
      <button class="btn primary" onclick={attemptLoad} disabled={retrying}>{retrying ? 'Retrying…' : 'Retry'}</button>
    </div>
  </div>
{:else if !$ready}
  <div class="loading"><span class="loading-spin" aria-hidden="true"></span> Loading the pipeline knowledge…</div>
{:else}

<header class="wz-header">
  <div class="brand" onclick={restart} role="button" tabindex="0"
       onkeydown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); restart(); } }}>
    <img class="wordmark" src="/yarova-logo-light.png" alt="Yarova" />
    <span class="toolname">Studio</span>
  </div>
  {#if view==='wizard'}
    <div class="wz-progress" aria-label="Progress">
      {#each STEP_ORDER as k, i}
        <button class="dot" class:on={i===step} class:done={i<step}
          title={k} aria-label={`Step ${i+1}`} onclick={()=>{ if(i<step) goto(i); }}></button>
      {/each}
    </div>
    <div class="wz-count">Step {step+1} of {total}</div>
  {:else}
    <div class="wz-progress"></div>
    <button class="btn primary" onclick={enterWizard}>Configure my repo →</button>
  {/if}
</header>

{#if view==='blueprint' && pmap}
  <main class="bp">
    <!-- at a glance -->
    <section class="bp-hero">
      <h1 class="bp-h1">The whole platform — one blueprint.</h1>
      <p class="bp-sub">Every decision, phase, stage, tool, regime. DevOps + DevSecOps + SRE. Nothing hidden.</p>
      <div class="bp-scale">
        <span><b>{pmap.scale.frameworks}</b> frameworks</span>
        <span><b>{pmap.scale.built}</b> real repos</span>
        <span><b>{pmap.scale.phases}</b> phases</span>
        <span><b>{pmap.scale.stages}</b> stages</span>
        <span><b>{pmap.scale.tools}</b> tools</span>
        <span><b>{pmap.scale.regimes}</b> compliance regimes</span>
        <span><b>{pmap.scale.integrations}</b> integrations</span>
      </div>
      <div class="bp-legend">
        <span class="disc do"><i class="dot"></i>DevOps <b>{pmap.disciplines.DevOps}</b></span>
        <span class="disc sec"><i class="dot"></i>DevSecOps <b>{pmap.disciplines.DevSecOps}</b></span>
        <span class="disc sre"><i class="dot"></i>SRE <b>{pmap.disciplines.SRE}</b></span>
      </div>
    </section>

    <!-- the pipeline: every phase → stage → tool, color by discipline -->
    <section class="bp-sec">
      <h2 class="bp-h2">The pipeline — start to end</h2>
      <div class="bp-phases">
        {#each pmap.phases as p, pi}
          <div class="bp-phase">
            <div class="bp-phase-head"><span class="bp-pnum">{pi+1}</span>{p.name}</div>
            <div class="bp-stages">
              {#each p.stages as st}
                <div class="bp-stage">
                  <div class="bp-stage-name {DISC[st.discipline]}">{st.name}</div>
                  <div class="bp-tools">
                    {#each st.tools as t}
                      <span class="bp-tool {DISC[t.discipline]}" title={t.discipline}>{t.name}</span>
                    {/each}
                    {#if !st.tools.length}<span class="bp-tool none">platform default</span>{/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- every decision axis -->
    <section class="bp-sec">
      <h2 class="bp-h2">Every decision — all options</h2>
      <div class="bp-axes">
        {#each pmap.axes as a}
          <div class="bp-axis">
            <div class="bp-axis-head">{a.label} <span class="bp-axis-n">{a.count}</span></div>
            <div class="bp-axis-opts">
              {#each a.options.slice(0,18) as o}
                <span class="bp-opt" class:built={o.built}>{o.name}{#if o.built} ✓{/if}</span>
              {/each}
              {#if a.options.length>18}<span class="bp-opt more">+{a.options.length-18} more</span>{/if}
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- compliance grid -->
    {#if pmap.compliance}
      <section class="bp-sec">
        <h2 class="bp-h2">Compliance — {pmap.compliance.controls} controls × {pmap.compliance.regimes.length} regimes</h2>
        <p class="bp-note">Same controls for every industry. A profile just flips them on/off. Canada-first.</p>
        <div class="bp-matrix-wrap">
          <table class="bp-matrix">
            <thead><tr><th>Control</th>{#each pmap.compliance.regimes as r}<th class="rg {r.priority}" title={r.name}>{r.id}</th>{/each}</tr></thead>
            <tbody>
              {#each pmap.compliance.rows as row}
                <tr><td class="ctrl">{row.label}</td>{#each row.cells as c}<td class="cell {c.on?'on':''}">{c.on?'●':''}</td>{/each}</tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/if}

    <!-- integrations + real repos -->
    <section class="bp-sec">
      <h2 class="bp-h2">Integrations ({pmap.integrations.length}) + real repos ({pmap.builtRepos.length})</h2>
      <div class="bp-chips">
        {#each pmap.integrations as i}<span class="bp-chip">{i.name}</span>{/each}
      </div>
      <div class="bp-repos">
        {#each pmap.builtRepos as r}
          <a class="bp-repo" href={r.url} target="_blank" rel="noopener">{r.name} <span class="ci">✓ CI</span></a>
        {/each}
      </div>
    </section>

    <section class="bp-cta">
      <h2 class="bp-h2">Want this for your stack?</h2>
      <button class="btn primary big" onclick={enterWizard}>Configure my repo →</button>
    </section>
  </main>

{:else if view==='wizard'}
<main class="wz-main">

  <!-- STEP: device ─────────────────────────────────────────────────────────── -->
  {#if stepKey === 'device'}
    <section class="wz-card">
      <!-- Act 1 — the promise -->
      <div class="promise">
        <h1 class="promise-h">You write the app code.<br>Everything else is already built.</h1>
        <p class="promise-p">Container, CI, security, compliance, observability, integrations — done and verified.
        You plug in keys. Nothing else.</p>
        {#if scale}
          <div class="scale">
            <span><b>{scale.frameworks}</b> frameworks</span>
            <span><b>{scale.built}</b> with real code</span>
            <span><b>{scale.regimes}</b> compliance regimes</span>
            <span><b>{scale.phases}</b> phases</span>
            <span><b>{scale.stages}</b> stages</span>
            <span><b>{scale.tools}</b> tools</span>
            <span><b>{scale.integrations}</b> integrations</span>
          </div>
        {/if}
      </div>
      <h1 class="wz-q">What are you building?</h1>
      <p class="wz-plain">Pick the closest. Nothing is hidden — every framework is reachable.</p>
      <div class="wz-grid two">
        {#each devices as d}
          <button class="opt big" onclick={()=>pickDevice(d.id)}>
            <span class="opt-name">{d.name}</span>
            <span class="opt-meta">{d.total} frameworks · <b class="ok">{d.built} with real code</b></span>
          </button>
        {/each}
      </div>
    </section>

  <!-- STEP: framework ──────────────────────────────────────────────────────── -->
  {:else if stepKey === 'fw'}
    <section class="wz-card wide">
      <div class="wz-top">
        <button class="btn ghost" onclick={back}>← back</button>
      </div>
      <h1 class="wz-q">Pick your framework</h1>
      <p class="wz-plain">
        <span class="badge ok">✅ real code ready</span>
        <span class="badge soon">🕓 recipe ready, code coming</span>
      </p>
      {#each fwGroups as g}
        <div class="fw-group">
          <h2 class="fw-cat">{g.name}</h2>
          <div class="wz-grid three">
            {#each g.frameworks as f}
              <button class="opt fw" class:has-code={f.built} onclick={()=>pickFw(f.id)}>
                <span class="opt-row">
                  <span class="opt-name">{f.name}</span>
                  <span class="badge {f.built ? 'ok' : 'soon'}">{f.built ? '✅' : '🕓'}</span>
                </span>
                <span class="opt-meta">{LANG[f.lang] || f.lang}</span>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </section>

  <!-- STEP: industry ───────────────────────────────────────────────────────── -->
  {:else if stepKey === 'industry'}
    <section class="wz-card wide">
      <div class="wz-top"><button class="btn ghost" onclick={back}>← back</button></div>
      <h1 class="wz-q">Who is it for?</h1>
      <p class="wz-plain">This flips your security + compliance rules. One setting, no code change.</p>
      <button class="opt big full" onclick={skipIndustry}>
        <span class="opt-name">Just exploring / not sure</span>
        <span class="opt-meta">Safe general defaults — change anytime.</span>
      </button>
      <div class="wz-grid three">
        {#each gOptions('industry', $rs) as ind}
          <button class="opt" onclick={()=>pickIndustry(ind.id)}>
            <span class="opt-name">{ind.name}</span>
          </button>
        {/each}
      </div>
    </section>

  <!-- STEP: a decision (pkg / auth / orm / obs / runtime / registry / signer / cluster) -->
  {:else if decStep}
    <section class="wz-card">
      <div class="wz-top"><button class="btn ghost" onclick={back}>← back</button></div>
      <h1 class="wz-q">{decStep.title}</h1>
      <p class="wz-plain">{decStep.plain}</p>

      {#if decStep.why}
        <div class="insight"><span class="insight-tag">Why it matters</span> {decStep.why}</div>
      {/if}

      {#if rec}
        <div class="rec">
          <div class="rec-tag">✓ Recommended</div>
          <div class="rec-name">{rec.name}</div>
          {#if rec.plain}<div class="rec-why">{rec.plain}</div>{/if}
          {#if rec.scope}<div class="rec-scope">{rec.scope}</div>{/if}
        </div>
        <button class="btn primary big" onclick={accept}>Accept &amp; continue →</button>
      {/if}

      {#if opts.length > 1}
        <button class="btn link" onclick={()=>showAll=!showAll}>
          {showAll ? '▾ hide other options' : `▸ see other options (${opts.length-1})`}
        </button>
      {/if}

      {#if showAll}
        <div class="other-opts">
          {#each opts.filter(o=>!rec || o.id!==rec.id) as o}
            <button class="opt row" onclick={()=>pickOption(o.id)}>
              <span class="opt-name">{o.name}</span>
              {#if o.plain}<span class="opt-meta">{o.plain}</span>{/if}
            </button>
          {/each}
        </div>
      {/if}
    </section>

  <!-- STEP: result — the full pipeline blueprint ───────────────────────────── -->
  {:else if stepKey === 'result' && bp}
    <section class="wz-card wide result">
      <div class="wz-top"><button class="btn ghost" onclick={back}>← back</button></div>

      {#if bp.built}
        <div class="result-head ok">
          <h1>✅ Your {bp.fw.name} pipeline is ready as real code.</h1>
          <div class="result-actions">
            <a class="btn primary" href={bp.repoBase} target="_blank" rel="noopener">View on GitHub →</a>
          </div>
        </div>
      {:else}
        <div class="result-head soon">
          <h1>🕓 Real golden repo for {bp.fw.name} is not built yet.</h1>
          <p class="wz-plain">Everything else below is identical — the full recipe, every tool, every config.
          The only missing piece: the hand-verified real files.</p>
        </div>
      {/if}

      <!-- the chosen stack -->
      <h2 class="sec">Your stack</h2>
      <div class="summary">
        {#each bp.summary as [k,v]}
          <div class="sum-row"><span class="sum-k">{k}</span><span class="sum-v">{v}</span></div>
        {/each}
      </div>

      <!-- compliance matrix — same controls for every industry, just on/off -->
      {#if matrix}
        <h2 class="sec">Compliance — {matrix.controlCount} controls · same keys, just on/off</h2>
        <div class="matrix-wrap">
          <table class="matrix">
            <thead>
              <tr>
                <th class="mx-ctrl">Control</th>
                {#each matrix.regimes as r}
                  <th class="mx-reg" title={r.name}>{r.id}<span class="mx-pri {r.priority}">{r.priority}</span></th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each matrix.rows as row}
                <tr>
                  <td class="mx-ctrl">{row.label}</td>
                  {#each row.cells as c}
                    <td class="mx-cell {c.on ? 'on' : 'off'}">{c.value}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="wz-plain mx-note">Switch with one env var: <code>COMPLIANCE_PROFILE</code>. No code change. No rebuild.</p>
      {/if}

      <!-- the full pipeline: phases → stages → tools (expanded top-to-bottom) -->
      <h2 class="sec">Your full pipeline — start to end · {bp.phases.length} phases · {bp.stageCount} stages · {bp.toolCount} tools</h2>
      <p class="wz-plain">Every phase, stage and tool the pipeline runs. Top to bottom.</p>
      {#each bp.phases as p, pi}
        <div class="phase open">
          <div class="phase-head static">
            <span class="phase-name"><span class="phase-num">{pi+1}</span> {p.name}</span>
            <span class="phase-meta">{p.stages.length} stages</span>
          </div>
          {#if true}
            <div class="phase-body">
              {#each p.stages as st}
                <div class="stage">
                  <div class="stage-head">
                    <span class="stage-name">{st.name}</span>
                    <span class="stage-type t-{(st.type||'').toLowerCase()}">{st.type}</span>
                    {#if st.parallel}<span class="stage-par">runs in parallel</span>{/if}
                  </div>
                  {#each st.tools as t}
                    <div class="tool">
                      <div class="tool-name">{t.name}{#if t.mandatory}<span class="req">required</span>{/if}</div>
                      {#if t.why}<div class="tool-why">{t.why}</div>{/if}
                      <div class="tool-meta">
                        {#if t.license}<span>license: {t.license}</span>{/if}
                        {#if t.output && t.output!=='N/A'}<span>output: {t.output}</span>{/if}
                      </div>
                    </div>
                  {/each}
                  {#if !st.tools.length}<div class="tool-none">handled by platform defaults</div>{/if}
                </div>
              {/each}
              {#if bp.built}
                <a class="btn link" href={repoLink(bp.repoBase, '.github/workflows')} target="_blank" rel="noopener">
                  view the real workflow files for this phase →
                </a>
              {/if}
            </div>
          {/if}
        </div>
      {/each}

      <!-- integrations the repo can connect to -->
      {#if integrations}
        <h2 class="sec">Integrations — connect to outside systems</h2>
        <p class="wz-plain">Each ships a client + config keys. Fill the env to activate. Canada-first.</p>
        <div class="integ-grid">
          {#each integrations.canada as i}
            <div class="integ ca"><span class="integ-name">{i.name}</span><span class="integ-meta">{i.category} · {i.auth} · <b>CA</b></span></div>
          {/each}
          {#each integrations.common as i}
            <div class="integ"><span class="integ-name">{i.name}</span><span class="integ-meta">{i.category} · {i.auth}</span></div>
          {/each}
        </div>
      {/if}

      <!-- runnable recipe -->
      {#if bp.commands && bp.commands.docker}
        <h2 class="sec">Run it — the commands</h2>
        <div class="recipe">
          {#each Object.entries(bp.commands) as [group, list]}
            {#each list as c}
              <div class="cmd">
                <div class="cmd-label">{c.label}</div>
                <pre class="cmd-code">{c.cmd}</pre>
                {#if c.expect}<div class="cmd-expect">→ {c.expect}</div>{/if}
              </div>
            {/each}
          {/each}
        </div>
      {/if}

      <!-- Act 3 — the closing proof -->
      <div class="proof">
        <h2 class="proof-h">That is the entire pipeline — start to end.</h2>
        <p class="proof-p">Nothing left for you to wire. You set keys; everything above is built.</p>
        <div class="proof-badges">
          {#if bp.built}
            <span class="proof-b ok">✅ real, verified code</span>
            <span class="proof-b ok">✅ tested in CI</span>
            <span class="proof-b ok">✅ signed images + SBOM</span>
          {:else}
            <span class="proof-b soon">🕓 recipe + generated starter</span>
            <span class="proof-b ok">✅ same pipeline as the built repos</span>
          {/if}
          <span class="proof-b ok">✅ Canada-first compliance, one env var</span>
        </div>
      </div>

      <div class="result-foot">
        <button class="btn ghost" onclick={restart}>↺ start over</button>
      </div>
    </section>
  {/if}

</main>
{/if}
{/if}
