<script lang="ts">
  import { config, decisionState } from '../stores/config';
  import { DECISION_DEFS, OPTION_HELP } from '../lib/decisions';
  import { STACKS } from '../lib/stacks';
  import { CI_SYSTEMS } from '../lib/ci';
  import { REGS } from '../lib/registry';

  let open = false;

  interface WhyCard {
    label: string;
    icon: string;
    value: string;
    valueLabel: string;
    why?: string;
    pickWhen?: string;
    avoid?: string;
    tradeoff?: string;
    cost?: string;
    caps?: string[];
  }

  function getOptionData(decisionId: string, value: string) {
    const def = DECISION_DEFS[decisionId];
    if (!def?.options) return null;
    return def.options.find(o => o.value === value) ?? null;
  }

  function getFrontendLabel(key: string): string {
    return STACKS.frontend[key]?.label ?? key;
  }
  function getBackendLabel(key: string): string {
    if (key === 'none') return 'None (frontend only)';
    return STACKS.backend[key]?.label ?? key;
  }
  function getCiLabel(key: string): string {
    return CI_SYSTEMS[key]?.label ?? key;
  }
  function getRegLabel(key: string): string {
    return REGS[key]?.label ?? key;
  }

  $: cards = (() => {
    const c = $config;
    const d = $decisionState;
    const result: WhyCard[] = [];

    // FE pick
    const feHelp = OPTION_HELP.frontend?.[c.feKey];
    result.push({
      label: 'Frontend', icon: '🌐',
      value: c.feKey,
      valueLabel: getFrontendLabel(c.feKey),
      why: DECISION_DEFS.fe.why,
      pickWhen: feHelp ?? undefined,
    });

    // BE pick (only if not none)
    if (c.beKey !== 'none') {
      const beHelp = OPTION_HELP.backend?.[c.beKey];
      result.push({
        label: 'Backend', icon: '⚙️',
        value: c.beKey,
        valueLabel: getBackendLabel(c.beKey),
        why: DECISION_DEFS.be.why,
        pickWhen: beHelp ?? undefined,
      });
    }

    // CI
    const ciOpt = getOptionData('ci', c.ciKey);
    result.push({
      label: 'CI System', icon: '🔁',
      value: c.ciKey,
      valueLabel: getCiLabel(c.ciKey),
      why: DECISION_DEFS.ci.why,
      pickWhen: ciOpt?.pickWhen,
      avoid: ciOpt?.avoid,
      tradeoff: ciOpt?.tradeoff,
      cost: ciOpt?.cost,
      caps: ciOpt?.caps,
    });

    // Registry
    const regOpt = getOptionData('reg', c.regKey);
    result.push({
      label: 'Registry', icon: '🏪',
      value: c.regKey,
      valueLabel: getRegLabel(c.regKey),
      why: DECISION_DEFS.reg.why,
      pickWhen: regOpt?.pickWhen,
      avoid: regOpt?.avoid,
      tradeoff: regOpt?.tradeoff,
      cost: regOpt?.cost,
      caps: regOpt?.caps,
    });

    // Scanner
    const scanner = d.scanner ?? c.scanner ?? 'trivy';
    const scanOpt = getOptionData('scanner', scanner);
    if (scanOpt) {
      result.push({
        label: 'CVE Scanner', icon: '🛡️',
        value: scanner,
        valueLabel: scanOpt.label,
        why: DECISION_DEFS.scanner.why,
        pickWhen: scanOpt.pickWhen,
        avoid: scanOpt.avoid,
        tradeoff: scanOpt.tradeoff,
        cost: scanOpt.cost,
        caps: scanOpt.caps,
      });
    }

    // Signing
    const signing = d.signing ?? c.signing ?? 'cosign';
    const signOpt = getOptionData('signing', signing);
    if (signOpt) {
      result.push({
        label: 'Image Signing', icon: '🔐',
        value: signing,
        valueLabel: signOpt.label,
        why: DECISION_DEFS.signing.why,
        pickWhen: signOpt.pickWhen,
        avoid: signOpt.avoid,
        tradeoff: signOpt.tradeoff,
        cost: signOpt.cost,
        caps: signOpt.caps,
      });
    }

    // Base image
    const baseimage = d.baseimage ?? c.baseimage ?? 'distroless';
    const baseOpt = getOptionData('baseimage', baseimage);
    if (baseOpt) {
      result.push({
        label: 'Base Image', icon: '🐳',
        value: baseimage,
        valueLabel: baseOpt.label,
        why: DECISION_DEFS.baseimage.why,
        pickWhen: baseOpt.pickWhen,
        avoid: baseOpt.avoid,
        tradeoff: baseOpt.tradeoff,
        cost: baseOpt.cost,
        caps: baseOpt.caps,
      });
    }

    // CD tool
    const cd = d.cd ?? c.cd ?? 'argocd';
    const cdOpt = getOptionData('cd', cd);
    if (cdOpt) {
      result.push({
        label: 'CD Tool', icon: '🚀',
        value: cd,
        valueLabel: cdOpt.label,
        why: DECISION_DEFS.cd.why,
        pickWhen: cdOpt.pickWhen,
        avoid: cdOpt.avoid,
        tradeoff: cdOpt.tradeoff,
        cost: cdOpt.cost,
        caps: cdOpt.caps,
      });
    }

    return result;
  })();
</script>

<details
  bind:open
  id="why-panel"
  style="background:rgba(25,200,168,.08);border-bottom:1px solid rgba(25,200,168,.18);font-size:11.5px;color:#F4F3EF"
>
  <summary class="why-summary">
    <span class="why-chevron" class:open>{open ? '▾' : '▸'}</span>
    Why this combo? — tradeoffs of your current picks
    <span class="why-count">{cards.length} decisions</span>
  </summary>

  <div class="why-grid">
    {#each cards as card (card.value + card.label)}
      <div class="why-card">
        <div class="why-card-hdr">
          <span class="why-card-icon">{card.icon}</span>
          <span class="why-card-label">{card.label}</span>
          <span class="why-card-pick">{card.valueLabel}</span>
        </div>

        {#if card.caps && card.caps.length > 0}
          <div class="why-caps">
            {#each card.caps as cap}
              <span class="why-cap">✓ {cap}</span>
            {/each}
          </div>
        {/if}

        {#if card.pickWhen}
          <div class="why-row">
            <span class="why-row-lbl pick">Pick when</span>
            <span class="why-row-val">{card.pickWhen}</span>
          </div>
        {/if}
        {#if card.avoid}
          <div class="why-row">
            <span class="why-row-lbl avoid">Avoid</span>
            <span class="why-row-val">{card.avoid}</span>
          </div>
        {/if}
        {#if card.tradeoff}
          <div class="why-row">
            <span class="why-row-lbl tradeoff">Tradeoff</span>
            <span class="why-row-val">{card.tradeoff}</span>
          </div>
        {/if}
        {#if card.cost}
          <div class="why-row">
            <span class="why-row-lbl cost">Cost</span>
            <span class="why-row-val">{card.cost}</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</details>

<style>
  .why-summary {
    cursor: pointer;
    padding: 7px 20px;
    font-weight: 600;
    font-size: 11px;
    color: #19C8A8;
    text-transform: uppercase;
    letter-spacing: .06em;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 6px;
    user-select: none;
  }
  .why-summary::-webkit-details-marker { display: none; }
  .why-summary:hover { background: rgba(25,200,168,.12); }

  .why-chevron { font-size: 10px; }
  .why-count {
    margin-left: auto;
    font-size: 10px;
    font-weight: 500;
    color: rgba(244,243,239,.55);
    text-transform: none;
    letter-spacing: 0;
  }

  .why-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
    padding: 10px 20px 14px;
  }

  .why-card {
    background: #1C1F28;
    border: 1px solid rgba(244,243,239,.14);
    border-radius: 6px;
    padding: 10px 12px;
    font-size: 11px;
  }

  .why-card-hdr {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .why-card-icon { font-size: 14px; }
  .why-card-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: rgba(244,243,239,.55);
  }
  .why-card-pick {
    margin-left: auto;
    font-size: 10.5px;
    font-weight: 600;
    color: #19C8A8;
    background: rgba(9,105,218,.08);
    border: 1px solid rgba(9,105,218,.2);
    border-radius: 4px;
    padding: 1px 7px;
  }

  .why-caps {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-bottom: 8px;
  }
  .why-cap {
    font-size: 9.5px;
    color: #19C8A8;
    background: rgba(25,200,168,.12);
    border: 1px solid #9CEDC7;
    border-radius: 3px;
    padding: 1px 6px;
  }

  .why-row {
    display: flex;
    gap: 6px;
    margin-bottom: 4px;
    line-height: 1.45;
  }
  .why-row-lbl {
    flex-shrink: 0;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    padding: 1px 5px;
    border-radius: 3px;
    height: fit-content;
    margin-top: 1px;
  }
  .why-row-lbl.pick    { background: rgba(25,200,168,.12); color: #19C8A8; border: 1px solid #9CEDC7; }
  .why-row-lbl.avoid   { background: rgba(255,184,0,.10); color: #FFB800; border: 1px solid rgba(255,184,0,.22); }
  .why-row-lbl.tradeoff{ background: rgba(198,242,78,.10); color: #C6F24E; border: 1px solid rgba(198,242,78,.22); }
  .why-row-lbl.cost    { background: rgba(255,184,0,.14); color: #FFB800; border: 1px solid #FFB800; }
  .why-row-val {
    font-size: 11px;
    color: #F4F3EF;
    line-height: 1.45;
  }

  @media (max-width: 700px) {
    .why-grid { grid-template-columns: 1fr; padding: 8px 12px 12px; }
  }
</style>
