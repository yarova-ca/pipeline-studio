<script>
  // full knowledge for ONE record — the single deep-renderer everywhere
  import { KFIELDS, find } from '../lib/logic.js';
  export let node=''; export let id=''; export let obj=null;
  const kval=(v)=>v==null||v===''?'':Array.isArray(v)?v.join(', '):typeof v==='object'?Object.entries(v).map(([k,x])=>`${k}: ${x}`).join('  ·  '):String(v);
  $: o=obj||find(node,id)||{};
  $: rows=(KFIELDS[node]||Object.keys(o).filter(k=>!['id','name','label'].includes(k)).map(k=>[k,k]))
      .map(([k,l])=>({l,v:kval(o[k])})).filter(r=>r.v);
</script>
{#each rows as r}<div class="krow"><span class="kk">{r.l}</span><span class="kvv">{r.v}</span></div>{/each}
