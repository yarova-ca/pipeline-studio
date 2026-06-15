<script>
  // the v2 scene-standard blocks — identical order on every scene, one renderer
  import Plain from './Plain.svelte';
  import { getK } from '../lib/logic.js';
  export let scene=1; // 1..18
  $: K=getK()||{};
  $: sc=(K.scenes||{})[String(scene)]||{};
  $: st=(K.sceneStd||{})[String(scene)]||{};
  export let section='pre'; // pre | post
</script>
{#if section==='pre'}
  {#if sc.plain}<div class="plain"><span class="plainlabel">in plain words</span><Plain text={sc.plain}/></div>{/if}
  {#if st.who||st.prereqs}<div class="prereq">
    <div class="krow"><span class="kk">who · when</span><span class="kvv">{st.who||''} — {st.when||''}</span></div>
    {#if st.prereqs?.length}<div class="krow"><span class="kk">before you start</span><span class="kvv">{st.prereqs.join(' · ')}</span></div>{/if}
  </div>{/if}
  {#if st.threat}<div class="threat"><span class="tlabel">the threat this stops</span><Plain text={st.threat}/></div>{/if}
{:else}
  {#if st.rejected}<div class="rejected"><b>The road not taken:</b> {st.rejected.path}<div class="sub">Why not: {st.rejected.why}</div></div>{/if}
  {#if st.skipWhen}<div class="skipwhen"><b>Skip when:</b> {st.skipWhen}</div>{/if}
  {#if st.doneWhen}<div class="donewhen"><span class="dlabel">✓ done when</span>{st.doneWhen}</div>{/if}
  {#if st.breaks?.length}<div class="breaks"><span class="blabel">when it breaks</span>
    {#each st.breaks as b}<div class="brow"><span class="bsym">{b.symptom}</span><span class="bfix">→ {b.fix}</span></div>{/each}</div>{/if}
  {#if st.time||st.cost||st.docs}<div class="metastrip">
    <span class="mt">⏱ {st.time||''}</span><span class="mt">💲 {st.cost||''}</span>
    {#if st.docs&&st.docs!=='dynamic:framework'}<a class="mt" href={st.docs} target="_blank" rel="noopener">official docs ↗</a>{/if}
    <span class="mt sub">verified {(K._meta||{}).updated||''}</span></div>{/if}
  {#if sc.youHave}<div class="youhave"><b>✓ You now have:</b> {sc.youHave}{#if sc.next}<span class="nexthint"> · Next: {sc.next} →</span>{/if}</div>{/if}
{/if}
