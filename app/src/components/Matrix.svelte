<script>
  import { industryMatrixRows } from '../lib/logic.js';
  import { rs, pick } from '../lib/stores.js';
  export let kind='regimes';
  const TITLES={regimes:'regimes that apply',auth:'auth required',obs:'observability required',runtime:'base image',clusters:'recommended cluster'};
  $: rows=industryMatrixRows(kind,$rs);
</script>
<table class="mx"><thead><tr><th>industry</th><th>{TITLES[kind]||kind}</th></tr></thead>
<tbody>{#each rows as r}<tr class:sel={r.sel} on:click={()=>pick('industry',r.id)}><td>{r.name}</td><td>{r.value}</td></tr>{/each}</tbody></table>
