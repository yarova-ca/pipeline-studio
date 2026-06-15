<script>
  export let title='commands'; export let items=[];
  let copied=-1;
  const copy=(c,i)=>{navigator.clipboard.writeText(c).then(()=>{copied=i;setTimeout(()=>copied=-1,1200);});};
</script>
{#if items.length}
<div class="grp">{title}</div>
{#each items as c,i}
<div class="cmd">
  <div class="cmdlabel"><span><span class="cmdn">{i+1}</span>{c.label}</span>
    <button class="gencopy" on:click={()=>copy(c.cmd,i)}>{copied===i?'copied ✓':'copy'}</button></div>
  <pre class="cmdcode">{c.cmd}</pre>
  {#if c.expect}<div class="expect">you'll see: {c.expect}</div>{/if}
</div>
{/each}
{/if}
