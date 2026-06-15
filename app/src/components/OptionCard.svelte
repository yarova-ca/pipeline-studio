<script>
  // THE option card — guided, flow and library all render options through this
  import { createEventDispatcher } from 'svelte';
  import Plain from './Plain.svelte';
  import KnowledgeRows from './KnowledgeRows.svelte';
  export let o={};            // {id,name,plain,scope,node,kjson,rec,covered,req,juri}
  export let picked=false;
  export let pickable=true;
  export let pickLabel='choose';
  const d=createEventDispatcher();
</script>
<details class="gcard" class:picked class:recd={o.rec}>
  <summary>
    <span class="gname">{o.name}</span>
    <span class="gplain"><Plain text={o.plain||''}/>{#if o.scope}<span class="gscope">{o.scope}</span>{/if}</span>
    {#if o.rec}<span class="gtag rec">✓ recommended for you</span>
    {:else if o.covered}<span class="gtag cov">in your rulebook — covered by the recommendation</span>
    {:else if o.req}<span class="gtag req">your rulebook requires</span>{/if}
    {#if pickable}<button class="gpick" on:click|preventDefault|stopPropagation={()=>d('pick',o.id)}>{picked?'✓ chosen':pickLabel}</button>{/if}
  </summary>
  <div class="gbody">
    {#if o.juri}<div class="gjuri">{@html o.juri}</div>{/if}
    {#if o.node}<KnowledgeRows node={o.node} id={o.id}/>
    {:else if o.kjson}<KnowledgeRows obj={o.kjson}/>{/if}
  </div>
</details>
