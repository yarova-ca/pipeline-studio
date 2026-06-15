// Loads the single sources ONCE: graph.json (extracted truth),
// knowledge.json (authored truth), generators.js (file emitters).
import { initCtx } from './logic.js';
import { ready, loadError } from './stores.js';

async function fetchJson(path){
  let r;
  try { r = await fetch(path); }
  catch(e){ throw new Error(`${path} could not be reached (network error). ${e.message||e}`); }
  if(!r.ok) throw new Error(`${path} returned ${r.status} ${r.statusText}.`);
  try { return await r.json(); }
  catch(e){ throw new Error(`${path} is not valid JSON. ${e.message||e}`); }
}

export async function loadAll(){
  loadError.set(null);
  try {
    const [g,k,GEN]=await Promise.all([
      fetchJson('/graph.json'),
      fetchJson('/knowledge.json'),
      import(/* @vite-ignore */ '/generators.js').catch(e=>{
        throw new Error(`generators.js failed to load. ${e.message||e}`);
      }),
    ]);
    if(!g?.nodes) throw new Error('graph.json loaded but has no "nodes" — data is malformed.');
    if(!k) throw new Error('knowledge.json loaded but is empty.');
    initCtx(g,k,GEN);
    ready.set(true);
  } catch(e){
    // ready stays false — App shows the error panel, not an infinite spinner.
    loadError.set(e.message||String(e));
    throw e;
  }
}
