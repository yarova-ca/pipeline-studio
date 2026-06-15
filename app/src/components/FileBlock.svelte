<script>
  export let name=''; export let text=''; export let open=false;
  let copied=false;
  const copy=()=>{navigator.clipboard.writeText(text).then(()=>{copied=true;setTimeout(()=>copied=false,1200);});};
</script>
{#if text}
<details class="facc" {open}>
  <summary><span class="caret">▸</span><span class="genname">{name}</span>
    <span class="sub">{text.split('\n').length} lines</span>
    <button class="gencopy" on:click|preventDefault|stopPropagation={copy}>{copied?'copied ✓':'copy'}</button></summary>
  <pre class="gencode">{text}</pre>
</details>
{/if}
