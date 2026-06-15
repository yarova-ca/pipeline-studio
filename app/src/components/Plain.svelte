<script>
  // renders text with glossary terms tappable — the ONLY place terms are linkified
  import { getK } from '../lib/logic.js';
  export let text='';
  const TOP=['SBOM','OIDC','MFA','FIPS','ORM','lockfile','container','registry','cluster','CI','SAST','middleware'];
  let parts=[];
  $:{
    const terms=(getK()?.glossary||[]).filter(t=>TOP.some(x=>x.toLowerCase()===t.term.toLowerCase()));
    let segs=[{t:text,term:null}];
    for(const t of terms){
      const re=new RegExp('\\b('+t.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')\\b','i');
      segs=segs.flatMap(s=>{
        if(s.term||!re.test(s.t))return [s];
        const m=s.t.match(re);const i=m.index;
        return [{t:s.t.slice(0,i),term:null},{t:m[0],term:t},{t:s.t.slice(i+m[0].length),term:null}];
      });
    }
    parts=segs.filter(s=>s.t);
  }
  let open=null;
</script>
{#each parts as p,i}{#if p.term}<span class="term" role="button" tabindex="0"
  on:click|stopPropagation={()=>open=open===i?null:i}
  on:keydown={e=>e.key==='Enter'&&(open=open===i?null:i)}>{p.t}{#if open===i}<span class="pop"><b>{p.term.term}</b> — {p.term.def}</span>{/if}</span>{:else}{p.t}{/if}{/each}
