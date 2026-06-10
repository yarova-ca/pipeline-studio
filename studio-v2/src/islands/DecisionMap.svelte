<script lang="ts">
  import { config, decisionState, setDecision } from '../stores/config';
  import { DECISION_DEFS, DECISION_REQUIRED } from '../lib/decisions';
  import type { DecisionId } from '../lib/types';

  interface DecisionEntry {
    id: DecisionId;
    icon: string;
    label: string;
    concept: string;
    defaultVal: string;
    why?: string;
    skipWhen?: string;
    isRequired: boolean;
    hasOptions: boolean;
    hasCfgBar: boolean;
    selectId?: string;
    options?: Array<{ value: string; label: string; desc: string; caps?: string[]; pickWhen?: string; avoid?: string; tradeoff?: string; cost?: string }>;
  }

  const ENTRIES: DecisionEntry[] = (Object.entries(DECISION_DEFS) as [DecisionId, typeof DECISION_DEFS[DecisionId]][]).map(([id, def]) => ({
    id,
    icon: def.icon,
    label: def.label,
    concept: def.concept,
    defaultVal: def.defaultVal,
    why: def.why,
    skipWhen: def.skipWhen,
    isRequired: DECISION_REQUIRED.has(id),
    hasOptions: !!(def.options?.length),
    hasCfgBar: !!def.selectId,
    selectId: def.selectId,
    options: def.options,
  }));

  let activeId: DecisionId | null = null;

  function pick(id: DecisionId, value: string) {
    setDecision(id, value);
    if (id === 'cd')        config.update(c => ({ ...c, cd: value }));
    if (id === 'gitops')    config.update(c => ({ ...c, gitops: value as 'same-repo' | 'separate-repo' | 'push' }));
    if (id === 'scanner')   config.update(c => ({ ...c, scanner: value }));
    if (id === 'signing')   config.update(c => ({ ...c, signing: value }));
    if (id === 'sbom')      config.update(c => ({ ...c, sbom: value }));
    if (id === 'baseimage') config.update(c => ({ ...c, baseimage: value }));
  }

  function toggleDetail(id: DecisionId) {
    activeId = activeId === id ? null : id;
  }

  function picked(entry: DecisionEntry): string {
    return $decisionState[entry.id] ?? entry.defaultVal;
  }
</script>

<div class="dm-root">
  <div class="dm-intro">
    <h2 class="dm-title">Decision Map</h2>
    <p class="dm-sub">
      Each card is a pipeline decision. Click to explore why it matters and pick an option.
      Required decisions change generated YAML. Optional decisions tune behavior.
    </p>
  </div>

  <div class="dm-grid">
    {#each ENTRIES as entry (entry.id)}
      {@const isOpen = activeId === entry.id}
      {@const currentPick = picked(entry)}

      <div class="dm-card" class:open={isOpen} class:required={entry.isRequired}>
        <button
          class="dm-hdr"
          on:click={() => toggleDetail(entry.id)}
          type="button"
          aria-expanded={isOpen}
        >
          <span class="dm-icon" aria-hidden="true">{entry.icon}</span>
          <span class="dm-lbl">{entry.label}</span>
          <span class="dm-badge" class:req={entry.isRequired} class:opt={!entry.isRequired}>
            {entry.isRequired ? 'Required' : 'Optional'}
          </span>
          <span class="dm-chevron" class:flip={isOpen}>▾</span>
        </button>

        <div class="dm-current">
          {#if entry.hasCfgBar}
            <span class="dm-chip muted">← set in config bar</span>
          {:else}
            <span class="dm-chip green">{currentPick}</span>
          {/if}
        </div>

        {#if isOpen}
          <div class="dm-body">
            <p class="dm-concept">{entry.concept}</p>

            {#if entry.why}
              <p class="dm-why">{entry.why}</p>
            {/if}

            {#if entry.hasOptions}
              <div class="dm-opts">
                {#each entry.options ?? [] as opt (opt.value)}
                  {@const isPicked = currentPick === opt.value}
                  <button
                    class="dm-opt"
                    class:picked={isPicked}
                    on:click={() => pick(entry.id, opt.value)}
                    type="button"
                  >
                    <div class="dm-opt-top">
                      <span class="dm-opt-lbl">{opt.label}</span>
                      {#if isPicked}<span class="dm-opt-active-badge">Current pick</span>{/if}
                    </div>
                    <span class="dm-opt-desc">{opt.desc}</span>
                    {#if opt.caps && opt.caps.length > 0}
                      <div class="dm-opt-caps">
                        {#each opt.caps.slice(0, 3) as cap}
                          <span class="dm-opt-cap">✓ {cap}</span>
                        {/each}
                      </div>
                    {/if}
                    {#if isPicked && (opt.pickWhen || opt.avoid || opt.tradeoff)}
                      <div class="dm-opt-knowledge">
                        {#if opt.pickWhen}
                          <div class="dk-row">
                            <span class="dk-lbl pick">Pick when</span>
                            <span class="dk-val">{opt.pickWhen}</span>
                          </div>
                        {/if}
                        {#if opt.avoid}
                          <div class="dk-row">
                            <span class="dk-lbl avoid">Avoid</span>
                            <span class="dk-val">{opt.avoid}</span>
                          </div>
                        {/if}
                        {#if opt.tradeoff}
                          <div class="dk-row">
                            <span class="dk-lbl tradeoff">Tradeoff</span>
                            <span class="dk-val">{opt.tradeoff}</span>
                          </div>
                        {/if}
                        {#if opt.cost}
                          <div class="dk-row">
                            <span class="dk-lbl cost">Cost</span>
                            <span class="dk-val">{opt.cost}</span>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            {:else if entry.hasCfgBar}
              <p class="dm-note">
                Change this via the <strong>{entry.label}</strong> dropdown in the config bar above.
              </p>
            {/if}

            {#if entry.skipWhen}
              <p class="dm-skipwhen">Skip when: {entry.skipWhen}</p>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .dm-root { padding: 20px 24px 40px; }
  .dm-intro { margin-bottom: 20px; }
  .dm-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .dm-sub   { font-size: 11.5px; color: var(--muted); line-height: 1.5; }

  .dm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
  }

  .dm-card {
    border: 1.5px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    overflow: hidden;
    transition: border-color .12s, box-shadow .12s;
  }
  .dm-card.open     { border-color: var(--accent); box-shadow: 0 2px 10px rgba(9,105,218,.14); }
  .dm-card.required { border-left: 3px solid var(--accent); }

  .dm-hdr {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }
  .dm-hdr:hover { background: var(--surface); }

  .dm-icon   { font-size: 16px; flex-shrink: 0; }
  .dm-lbl    { font-size: 12.5px; font-weight: 600; flex: 1; color: var(--text); }

  .dm-badge {
    font-size: 9px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .06em;
    padding: 2px 6px; border-radius: 10px; flex-shrink: 0;
  }
  .dm-badge.req { background: rgba(25,200,168,.12); color: var(--accent); border: 1px solid rgba(25,200,168,.20); }
  .dm-badge.opt { background: var(--surface); color: var(--muted); border: 1px solid var(--border); }

  .dm-chevron { font-size: 12px; color: var(--muted); transition: transform .15s; flex-shrink: 0; }
  .dm-chevron.flip { transform: rotate(180deg); }

  .dm-current { padding: 0 12px 10px; }
  .dm-chip {
    display: inline-block;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .dm-chip.muted { background: var(--surface); border: 1px solid var(--border); color: var(--muted); }
  .dm-chip.green { background: rgba(25,200,168,.12); border: 1px solid #9CEDC7; color: #14A88E; font-weight: 500; }

  .dm-body {
    border-top: 1px solid var(--border-subtle);
    padding: 12px 12px 14px;
  }
  .dm-concept { font-size: 11.5px; color: var(--text-sec); line-height: 1.5; margin-bottom: 8px; }
  .dm-why { font-size: 11px; color: var(--muted); line-height: 1.5; margin-bottom: 10px; font-style: italic; border-left: 2px solid var(--border); padding-left: 8px; }
  .dm-skipwhen { font-size: 10.5px; color: var(--muted); margin-top: 10px; padding: 6px 8px; background: var(--surface); border-radius: 4px; border: 1px solid var(--border); }

  .dm-opts { display: flex; flex-direction: column; gap: 6px; }
  .dm-opt {
    display: flex; flex-direction: column; gap: 3px;
    padding: 8px 10px;
    border: 1.5px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    cursor: pointer;
    text-align: left;
    transition: border-color .1s, background .1s;
  }
  .dm-opt:hover  { border-color: var(--accent); background: rgba(25,200,168,.08); }
  .dm-opt.picked { border-color: var(--accent); background: rgba(25,200,168,.10); }

  .dm-opt-top { display: flex; align-items: center; gap: 6px; }
  .dm-opt-lbl { font-size: 12px; font-weight: 600; color: var(--text); flex: 1; }
  .dm-opt-active-badge { font-size: 8.5px; font-weight: 700; color: #19C8A8; background: rgba(25,200,168,.12); border: 1px solid #9CEDC7; border-radius: 3px; padding: 1px 5px; white-space: nowrap; }
  .dm-opt-desc { font-size: 10.5px; color: var(--muted); line-height: 1.4; }

  .dm-opt-caps { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
  .dm-opt-cap { font-size: 9.5px; color: #19C8A8; background: rgba(25,200,168,.12); border: 1px solid #b2f2bb; border-radius: 3px; padding: 1px 5px; }

  .dm-opt-knowledge {
    margin-top: 6px;
    border-top: 1px dashed var(--border);
    padding-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .dk-row { display: flex; gap: 6px; align-items: flex-start; }
  .dk-lbl {
    flex-shrink: 0;
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    border-radius: 3px;
    padding: 1px 5px;
    margin-top: 1px;
    border: 1px solid;
  }
  .dk-lbl.pick     { background: rgba(25,200,168,.12); color: #19C8A8; border-color: #9CEDC7; }
  .dk-lbl.avoid    { background: rgba(255,184,0,.10); color: #FFB800; border-color: rgba(255,184,0,.22); }
  .dk-lbl.tradeoff { background: rgba(198,242,78,.10); color: #C6F24E; border-color: rgba(198,242,78,.22); }
  .dk-lbl.cost     { background: rgba(255,184,0,.14); color: #FFB800; border-color: #FFB800; }
  .dk-val { font-size: 10.5px; color: var(--text-sec); line-height: 1.45; }

  .dm-note {
    font-size: 11px; color: var(--muted);
    padding: 8px 10px;
    background: var(--surface);
    border-radius: 4px;
    border: 1px solid var(--border);
  }

  @media (max-width: 700px) {
    .dm-grid { grid-template-columns: 1fr; }
  }
</style>
