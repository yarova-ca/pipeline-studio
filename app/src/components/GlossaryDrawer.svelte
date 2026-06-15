<script>
  import { getK } from '../lib/logic.js';
  export let open=false;
  $: terms=(getK()?.glossary||[]);
</script>
{#if open}
<div class="scrim on" on:click={()=>open=false}></div>
<aside class="drawer open" role="dialog" aria-modal="true">
  <div class="dh"><h1>Glossary — every term, plainly</h1>
    <button class="x" on:click={()=>open=false}>✕</button></div>
  <div class="db">
    <div class="sub" style="margin-bottom:10px">{terms.length} terms. No prior knowledge assumed.</div>
    {#each terms as t}<div class="gterm"><b>{t.term}</b>{#if t.full}<span class="sub"> ({t.full})</span>{/if}<div class="gdef">{t.def}</div></div>{/each}
  </div>
</aside>
{/if}
