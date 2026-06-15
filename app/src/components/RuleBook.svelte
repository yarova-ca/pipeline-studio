<script>
  // THE rulebook — born in Scene 1, recapped in Sign-off, badged in Library
  import { nameById, firstSentence, stripTags } from '../lib/logic.js';
  export let rq=null; export let compact=false;
  const bar=(t)=>stripTags(String(t||''));
</script>
{#if rq}
<div class="rulebook">
  <div class="rbt">THE RULEBOOK — born from your choice, enforced in every scene</div>
  <div class="kk" style="margin:2px 0 5px">the {(rq.requiredRegimeIds||[]).length} rule-sets that apply — tap any to read it plainly</div>
  <div class="regwrap">
    {#each rq.requiredRegimeIds||[] as id}
      <slot name="chip" {id}>{nameById('complianceProfiles',id)}</slot>
    {/each}
  </div>
  {#if !compact}
    {#each [['auth bar',rq.requiredAuth,'bites in Scene 4'],['observability bar',rq.requiredObservability,'Scenes 4 & 11'],['data & residency',rq.requiredDataControls,'Scenes 6 & 10']] as [l,t,w]}
      <details class="rbbar"><summary><span class="kk">{l}</span><span class="kvv">{firstSentence(bar(t))}</span><span class="caret">▸</span></summary>
        <div class="rbfull">{bar(t)}<div class="rbwhere">{w}</div></div></details>
    {/each}
    <div class="krow"><span class="kk">image bar</span><span class="kvv">{(rq.recommendedRuntimeIds||[]).join(' · ')} <i>(Scene 6)</i></span></div>
    <div class="krow"><span class="kk">cluster bar</span><span class="kvv">{(rq.recommendedClusterIds||[]).map(id=>nameById('clusters',id)).join(' · ')} <i>(Scene 10)</i></span></div>
  {/if}
</div>
{/if}
