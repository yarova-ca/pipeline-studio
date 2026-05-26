<script lang="ts">
  import { activePhaseTab, activeStageName } from '../stores/config';
  import {
    LOCAL_STAGES, PR_STAGES, MAIN_STAGES, PROMOTION_STAGES, PHASE_0_STAGES,
    ALL_STAGES_FLAT, isParallel
  } from '../lib/stages';
  import type { StageDef, Discipline } from '../lib/stages';
  import { INVARIANT_BY_ID } from '../lib/invariants';
  import { TOOL_META } from '../lib/tools';
  import type { ToolVersionKey } from '../lib/tools';

  const TABS = [
    { id: 0, label: '0', sublabel: 'Bootstrap',  color: '#6e7681' },
    { id: 1, label: '1', sublabel: 'Local / Dev', color: '#adb5bd' },
    { id: 2, label: '2', sublabel: 'PR Gate',     color: '#ff8787' },
    { id: 3, label: '3', sublabel: 'Main Build',  color: '#74c0fc' },
    { id: 4, label: '4', sublabel: 'Promotions',  color: '#ffa94d' },
  ];

  const PHASE_CLASS: Record<string, string> = {
    'ph-f': 'phase-f', 'ph-s': 'phase-s', 'ph-b': 'phase-b',
    'ph-g': 'phase-g', 'ph-o': 'phase-o', 'ph-v': 'phase-v',
  };

  let activeTab = 2;
  $: activePhaseTab.set(activeTab);

  let selectedId: string | null = null;
  $: activeStageName.set(selectedId);
  $: selectedStage = selectedId ? (ALL_STAGES_FLAT[selectedId] ?? null) : null;

  function selectStage(id: string) {
    selectedId = selectedId === id ? null : id;
  }
  function closePanel() { selectedId = null; }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && selectedId) closePanel();
  }

  function mistakes(s: StageDef): string[] {
    return s.commonMistakes ? s.commonMistakes.split(' | ') : [];
  }

  const DISC_LABEL: Record<Discipline, string> = {
    s: 'Security', q: 'Quality', c: 'Compliance', p: 'Process', r: 'Runtime',
  };
  const DISC_CLASS: Record<Discipline, string> = {
    s: 'disc-s', q: 'disc-q', c: 'disc-c', p: 'disc-p', r: 'disc-r',
  };

  // Maps stage ID → primary TOOL_META key so we can show lastVerified date in the detail panel
  const STAGE_TOOL_META_KEY: Record<string, ToolVersionKey> = {
    's7pr':   'trivyAction',
    's7main': 'trivyAction',
    's8apr':  'sbomAction',
    's8a':    'sbomAction',
    's8b':    'cosignInstaller',
    's14':    'cosignInstaller',
    's3':     'semgrepVersion',
    's3m':    'semgrepVersion',
    's3b':    'fossaAction',
    's3bm':   'fossaAction',
    's4':     'checkovAction',
    's4m':    'checkovAction',
    's5':     'gitleaksAction',
    's5m':    'gitleaksAction',
    'dast':   'zapBaseline',
    's11':    'k6Image',
    's10':    'slsaGenerator',
    's2':     'dependencyReview',
    's2m':    'dependencyReview',
    's1':     'preCommitAction',
    's1main': 'preCommitAction',
    's6pr':   'dockerBuildPush',
    's6main': 'dockerBuildPush',
  };
</script>

<div class="pipeline-root">

  <!-- ── Phase tab strip ────────────────────────────────────────────────── -->
  <div class="phase-tabs" role="tablist" aria-label="Pipeline phases">
    {#each TABS as tab (tab.id)}
      <button
        role="tab"
        aria-selected={activeTab === tab.id}
        class="phase-tab"
        class:active={activeTab === tab.id}
        style="--tc:{tab.color}"
        on:click={() => { activeTab = tab.id; selectedId = null; }}
        type="button"
      >
        <span class="tab-num">{tab.label}</span>
        <span class="tab-sub">{tab.sublabel}</span>
      </button>
    {/each}
  </div>

  <!-- ── Pipeline body ──────────────────────────────────────────────────── -->
  <div class="pipeline-body">

    <!-- Phase 0: Bootstrap -->
    {#if activeTab === 0}
      <div class="flow-col">
        {#each PHASE_0_STAGES as step (step.id)}
          <div class="p0-card">
            <div class="p0-badge">{step.badge}</div>
            <div class="p0-title">{step.title}</div>
            <p class="p0-desc">{step.desc}</p>
            <ul class="p0-steps">
              {#each step.steps as s}<li>{s}</li>{/each}
            </ul>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Phase 1: Local / Dev -->
    {#if activeTab === 1}
      <div class="flow-col">
        {#each LOCAL_STAGES as stage (stage.id)}
          <div class="local-card {PHASE_CLASS[stage.phase] ?? ''}">
            <div class="s-badge">{stage.badge}</div>
            <div class="s-title">{stage.title}</div>
            <p class="s-desc">{stage.desc}</p>
            <code class="local-setup">{stage.setup}</code>
            <div class="chip-row">
              {#each stage.tools as t}<span class="chip">{t}</span>{/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Phase 2: PR Gate -->
    {#if activeTab === 2}
      <div class="flow-col">
        {#each PR_STAGES as item, i (isParallel(item) ? item.id : item.id)}
          {#if isParallel(item)}
            <div class="parallel-row">
              {#each item.stages as stage (stage.id)}
                <button
                  class="s-box {PHASE_CLASS[stage.phase] ?? ''}"
                  class:sel={selectedId === stage.id}
                  on:click={() => selectStage(stage.id)}
                  type="button"
                  aria-pressed={selectedId === stage.id}
                >
                  <span class="s-badge">{stage.badge}</span>
                  <span class="s-title">{stage.title}</span>
                  {#if stage.invariants?.length}
                    <span class="inv-row">
                      {#each stage.invariants as inv}
                        <span class="inv" title={INVARIANT_BY_ID[inv]?.text ?? inv}>{inv}</span>
                      {/each}
                    </span>
                  {/if}
                </button>
              {/each}
            </div>
          {:else}
            <button
              class="s-box wide {PHASE_CLASS[item.phase] ?? ''}"
              class:sel={selectedId === item.id}
              on:click={() => selectStage(item.id)}
              type="button"
              aria-pressed={selectedId === item.id}
            >
              <span class="s-badge">{item.badge}</span>
              <span class="s-title">{item.title}</span>
              {#if item.invariants?.length}
                <span class="inv-row">
                  {#each item.invariants as inv}
                    <span class="inv" title={INVARIANT_BY_ID[inv]?.text ?? inv}>{inv}</span>
                  {/each}
                </span>
              {/if}
            </button>
          {/if}
          {#if i < PR_STAGES.length - 1}
            <div class="arrow" aria-hidden="true">↓</div>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- Phase 3: Main Build -->
    {#if activeTab === 3}
      <div class="flow-col">
        {#each MAIN_STAGES as item, i (isParallel(item) ? item.id : item.id)}
          {#if isParallel(item)}
            <div class="parallel-row">
              {#each item.stages as stage (stage.id)}
                <button
                  class="s-box {PHASE_CLASS[stage.phase] ?? ''}"
                  class:sel={selectedId === stage.id}
                  on:click={() => selectStage(stage.id)}
                  type="button"
                  aria-pressed={selectedId === stage.id}
                >
                  <span class="s-badge">{stage.badge}</span>
                  <span class="s-title">{stage.title}</span>
                  {#if stage.invariants?.length}
                    <span class="inv-row">
                      {#each stage.invariants as inv}
                        <span class="inv" title={INVARIANT_BY_ID[inv]?.text ?? inv}>{inv}</span>
                      {/each}
                    </span>
                  {/if}
                </button>
              {/each}
            </div>
          {:else}
            <button
              class="s-box wide {PHASE_CLASS[item.phase] ?? ''}"
              class:sel={selectedId === item.id}
              on:click={() => selectStage(item.id)}
              type="button"
              aria-pressed={selectedId === item.id}
            >
              <span class="s-badge">{item.badge}</span>
              <span class="s-title">{item.title}</span>
              {#if item.invariants?.length}
                <span class="inv-row">
                  {#each item.invariants as inv}
                    <span class="inv" title={INVARIANT_BY_ID[inv]?.text ?? inv}>{inv}</span>
                  {/each}
                </span>
              {/if}
            </button>
          {/if}
          {#if i < MAIN_STAGES.length - 1}
            <div class="arrow" aria-hidden="true">↓</div>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- Phase 4: Promotions -->
    {#if activeTab === 4}
      <div class="flow-col promo-col">
        {#each PROMOTION_STAGES as stage, i (stage.id)}
          <button
            class="s-box wide {PHASE_CLASS[stage.phase] ?? ''}"
            class:sel={selectedId === stage.id}
            on:click={() => selectStage(stage.id)}
            type="button"
            aria-pressed={selectedId === stage.id}
          >
            <span class="s-badge">{stage.badge}</span>
            <span class="s-title">{stage.title}</span>
            {#if stage.invariants?.length}
              <span class="inv-row">
                {#each stage.invariants as inv}
                  <span class="inv" title={INVARIANT_BY_ID[inv]?.text ?? inv}>{inv}</span>
                {/each}
              </span>
            {/if}
          </button>
          {#if i < PROMOTION_STAGES.length - 1}
            <div class="arrow" aria-hidden="true">↓</div>
          {/if}
        {/each}
      </div>
    {/if}

  </div><!-- /pipeline-body -->
</div><!-- /pipeline-root -->

<svelte:window on:keydown={handleKey} />

<!-- ── Stage Detail Panel (outside flow, fixed position) ─────────────────── -->
{#if selectedStage}
  {@const s = selectedStage}
  <aside class="sdp" role="dialog" aria-modal="false" aria-label="Stage detail: {s.title}">
    <div class="sdp-hdr">
      <div>
        <span class="sdp-badge {PHASE_CLASS[s.phase] ?? ''}">{s.badge}</span>
        <strong class="sdp-title">{s.title}</strong>
      </div>
      <button class="sdp-close" on:click={closePanel} type="button" aria-label="Close">✕</button>
    </div>

    {#if s.discipline?.length}
      <div class="sdp-disc-row">
        {#each s.discipline as d}
          <span class="sdp-disc {DISC_CLASS[d]}">{DISC_LABEL[d]}</span>
        {/each}
        {#if s.runtime}
          <span class="sdp-runtime">⏱ {s.runtime}</span>
        {/if}
      </div>
    {/if}

    {#if s.benefit}
      <div class="sdp-benefit">{s.benefit}</div>
    {/if}

    {#if s.tool}
      {@const metaKey = STAGE_TOOL_META_KEY[s.id]}
      {@const toolMeta = metaKey ? TOOL_META[metaKey] : null}
      <div class="sdp-row"><span class="sdp-lbl">Tool</span><code class="sdp-val">{s.tool}</code></div>
      {#if toolMeta}
        <div class="sdp-row">
          <span class="sdp-lbl">Verified</span>
          <span class="sdp-val sdp-verified">{toolMeta.lastVerified}
            <span class="sdp-note">{toolMeta.note}</span>
          </span>
        </div>
      {/if}
    {/if}
    {#if s.actor}
      <div class="sdp-row"><span class="sdp-lbl">Actor</span><span class="sdp-val">{s.actor}</span></div>
    {/if}
    {#if s.trigger}
      <div class="sdp-row"><span class="sdp-lbl">Trigger</span><span class="sdp-val">{s.trigger}</span></div>
    {/if}
    {#if s.filesRead}
      <div class="sdp-row"><span class="sdp-lbl">Reads</span><span class="sdp-val">{s.filesRead}</span></div>
    {/if}
    {#if s.filesProduces}
      <div class="sdp-row"><span class="sdp-lbl">Produces</span><span class="sdp-val">{s.filesProduces}</span></div>
    {/if}
    {#if s.onFailure}
      <div class="sdp-row sdp-fail"><span class="sdp-lbl">On failure</span><span class="sdp-val">{s.onFailure}</span></div>
    {/if}

    {#if s.ciLimitation}
      <div class="sdp-warn">{s.ciLimitation}</div>
    {/if}

    {#if s.concept}
      <div class="sdp-sec">
        <div class="sdp-sec-hdr">What is this?</div>
        <p>{s.concept}</p>
      </div>
    {/if}
    {#if s.threat}
      <div class="sdp-sec">
        <div class="sdp-sec-hdr">Threat it stops</div>
        <p>{s.threat}</p>
      </div>
    {/if}
    {#if s.howItWorks}
      <div class="sdp-sec">
        <div class="sdp-sec-hdr">How it works</div>
        <p>{s.howItWorks}</p>
      </div>
    {/if}
    {#if s.outputMeaning}
      <div class="sdp-sec">
        <div class="sdp-sec-hdr">Reading the output</div>
        <p>{s.outputMeaning}</p>
      </div>
    {/if}
    {#if mistakes(s).length}
      <div class="sdp-sec">
        <div class="sdp-sec-hdr">Common mistakes</div>
        <ul class="sdp-list">
          {#each mistakes(s) as m}<li>{m}</li>{/each}
        </ul>
      </div>
    {/if}
    {#if s.invariants?.length}
      <div class="sdp-sec">
        <div class="sdp-sec-hdr">Invariants enforced</div>
        <ul class="sdp-list">
          {#each s.invariants as inv}
            {@const def = INVARIANT_BY_ID[inv]}
            {#if def}
              <li>
                <strong>{inv}</strong> — {def.text}
                <span class="sdp-incident">Incident: {def.incident}</span>
              </li>
            {/if}
          {/each}
        </ul>
      </div>
    {/if}
  </aside>
{/if}

<style>
  /* Root */
  .pipeline-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }

  /* Tab strip */
  .phase-tabs {
    display: flex;
    gap: 3px;
    padding: 10px 16px 0;
    background: var(--surface);
    border-bottom: 2px solid var(--border);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .phase-tabs::-webkit-scrollbar { display: none; }

  .phase-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 7px 18px 9px;
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: var(--bg);
    color: var(--muted);
    cursor: pointer;
    white-space: nowrap;
    position: relative;
    bottom: -2px;
    transition: background .12s, color .12s;
  }
  .phase-tab.active {
    color: var(--text);
    font-weight: 600;
    border-bottom: 2px solid var(--tc, var(--accent));
  }
  .phase-tab:hover:not(.active) { background: var(--surface); color: var(--text-sec); }

  .tab-num  { font-size: 18px; font-weight: 700; color: var(--tc, var(--accent)); line-height: 1; }
  .tab-sub  { font-size: 10.5px; color: var(--muted); }
  .phase-tab.active .tab-sub { color: var(--text-sec); }

  /* Body */
  .pipeline-body {
    padding: 18px 20px;
    overflow-y: auto;
    flex: 1;
  }

  /* Flow column */
  .flow-col {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 520px;
  }
  .promo-col { max-width: 340px; }

  .arrow {
    text-align: center;
    color: var(--muted);
    font-size: 16px;
    line-height: 22px;
    user-select: none;
  }

  /* Parallel group */
  .parallel-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 6px;
    margin: 2px 0;
  }

  /* Stage box */
  .s-box {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    padding: 9px 12px;
    border: 1.5px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    cursor: pointer;
    text-align: left;
    transition: border-color .12s, box-shadow .12s, background .12s;
  }
  .s-box.wide { width: 100%; }
  .s-box:hover { border-color: var(--accent); box-shadow: 0 1px 4px rgba(9,105,218,.18); }
  .s-box.sel   { border-color: var(--accent); background: #f0f7ff; box-shadow: 0 2px 8px rgba(9,105,218,.2); }

  /* Phase colour left border */
  .s-box.phase-f { border-left: 3px solid #adb5bd; }
  .s-box.phase-s { border-left: 3px solid #ff8787; }
  .s-box.phase-b { border-left: 3px solid #74c0fc; }
  .s-box.phase-g { border-left: 3px solid #69db7c; }
  .s-box.phase-o { border-left: 3px solid #ffa94d; }
  .s-box.phase-v { border-left: 3px solid #da77f2; }

  .s-badge { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
  .s-title { font-size: 11.5px; font-weight: 500; color: var(--text); line-height: 1.3; }

  .inv-row { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 3px; }
  .inv {
    font-size: 9px;
    background: #f0f7ff;
    border: 1px solid #b6d4fe;
    color: var(--accent);
    border-radius: 3px;
    padding: 1px 4px;
    font-weight: 500;
    cursor: help;
  }

  /* Phase 0 cards */
  .p0-card {
    border: 1px solid var(--border);
    border-left: 4px solid #6e7681;
    border-radius: 6px;
    padding: 14px 16px;
    background: var(--bg);
    margin-bottom: 10px;
  }
  .p0-badge { font-size: 10px; color: var(--muted); font-weight: 600; }
  .p0-title { font-size: 13px; font-weight: 600; margin: 3px 0; }
  .p0-desc  { font-size: 11.5px; color: var(--text-sec); margin-bottom: 10px; }
  .p0-steps { list-style: disc; padding-left: 18px; font-size: 11.5px; color: var(--text-sec); }
  .p0-steps li + li { margin-top: 4px; }

  /* Local cards */
  .local-card {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px 14px;
    background: var(--bg);
    margin-bottom: 8px;
  }
  .local-card.phase-f { border-left: 3px solid #adb5bd; }
  .s-desc { font-size: 11.5px; color: var(--text-sec); margin: 4px 0 8px; }
  .local-setup {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 4px 8px;
    margin-bottom: 8px;
  }
  .chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip {
    font-size: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 6px;
    color: var(--text-sec);
  }

  /* Stage Detail Panel — anchored to right edge so it covers TOC, not the pipeline */
  .sdp {
    position: fixed;
    right: 0;
    top: 0;
    width: 400px;
    height: 100vh;
    background: var(--bg);
    border-left: 1px solid var(--border);
    overflow-y: auto;
    padding: 20px 20px 48px;
    z-index: var(--z-drawer);
    box-shadow: -4px 0 20px rgba(27,31,36,.1);
    animation: sdp-in .18s ease;
  }
  @keyframes sdp-in {
    from { transform: translateX(18px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }

  .sdp-hdr {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
    gap: 12px;
  }
  .sdp-badge {
    display: inline-block;
    font-size: 10px; font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    margin-right: 6px;
    color: var(--muted);
  }
  .sdp-badge.phase-s { background: #fff5f5; border-color: #ffa8a8; color: #c92a2a; }
  .sdp-badge.phase-b { background: #e8f4fd; border-color: #74c0fc; color: #1971c2; }
  .sdp-badge.phase-g { background: #ebfbee; border-color: #8ce99a; color: #2b8a3e; }
  .sdp-badge.phase-o { background: #fff9db; border-color: #ffd43b; color: #a64d00; }
  .sdp-badge.phase-v { background: #f8f0fc; border-color: #cc5de8; color: #862e9c; }

  .sdp-title { font-size: 14px; font-weight: 600; }
  .sdp-close {
    background: none; border: 1px solid var(--border);
    border-radius: 4px; padding: 4px 8px;
    cursor: pointer; color: var(--muted); font-size: 11.5px; flex-shrink: 0;
  }
  .sdp-close:hover { background: var(--surface); color: var(--text); }

  .sdp-row {
    display: grid;
    grid-template-columns: 76px 1fr;
    gap: 6px;
    padding: 5px 0;
    border-bottom: 1px solid var(--border-subtle);
    font-size: 11.5px;
  }
  .sdp-fail .sdp-val { color: var(--danger); }
  .sdp-lbl { color: var(--muted); font-size: 10px; font-weight: 500; padding-top: 2px; }
  .sdp-val { color: var(--text); word-break: break-word; }
  .sdp-val code { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; }

  .sdp-warn {
    margin: 10px 0;
    padding: 8px 10px;
    background: #fff9db;
    border: 1px solid #ffe066;
    border-radius: 4px;
    font-size: 11.5px; color: #7c4b00;
  }

  .sdp-sec { margin-top: 14px; }
  .sdp-sec-hdr {
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .06em;
    color: var(--muted); margin-bottom: 5px;
  }
  .sdp-sec p { font-size: 11.5px; color: var(--text-sec); line-height: 1.5; }

  .sdp-list {
    list-style: disc; padding-left: 18px;
    font-size: 11.5px; color: var(--text-sec);
  }
  .sdp-list li + li { margin-top: 4px; }
  .sdp-incident { font-size: 10px; color: var(--muted); display: block; margin-top: 2px; }
  .sdp-verified { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--text-sec); }
  .sdp-note { font-size: 9.5px; color: var(--muted); margin-left: 6px; font-family: inherit; }

  /* Discipline chips */
  .sdp-disc-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    margin-bottom: 10px;
  }
  .sdp-disc {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 10px;
    border: 1px solid;
    letter-spacing: .03em;
  }
  .disc-s { background: #fff5f5; border-color: #ffa8a8; color: #c92a2a; }
  .disc-q { background: #e8f4fd; border-color: #74c0fc; color: #1971c2; }
  .disc-c { background: #f8f0fc; border-color: #cc5de8; color: #862e9c; }
  .disc-p { background: var(--surface); border-color: var(--border); color: var(--muted); }
  .disc-r { background: #ebfbee; border-color: #8ce99a; color: #2b8a3e; }

  .sdp-runtime {
    font-size: 10px;
    color: var(--muted);
    margin-left: auto;
  }

  /* Benefit statement */
  .sdp-benefit {
    font-size: 11.5px;
    color: var(--text-sec);
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 4px;
    padding: 7px 10px;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  @media (max-width: 1100px) {
    .sdp { right: 0; width: 360px; }
  }
  @media (max-width: 700px) {
    .sdp { width: 100%; right: 0; top: auto; bottom: 0; height: 60vh; border-left: none; border-top: 1px solid var(--border); }
  }
</style>
