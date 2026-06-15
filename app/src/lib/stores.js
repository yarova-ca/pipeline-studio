// One state. Persisted. Every surface reads/writes THIS — duplication is impossible.
import { writable, derived, get } from 'svelte/store';
import { resolveStack, reqOfInd, getK } from './logic.js';

const safeJSON=(s,fb)=>{try{const v=JSON.parse(s);return (v&&typeof v==='object'&&!Array.isArray(v))?v:fb;}catch(e){return fb;}};

const RS0={fw:null,industry:'',category:'',complianceFocus:'',pkg:null,buildtool:null,orm:null,auth:null,obs:null,runtime:null,cluster:null,region:'',registry:'ghcr',signer:'cosign',sbom:'syft',_industryChanged:''};
export const rs=writable({...RS0, industry:localStorage.getItem('ys-industry')||'', ...safeJSON(localStorage.getItem('ys-rs'),{})});
rs.subscribe(v=>{try{localStorage.setItem('ys-rs',JSON.stringify(v));if(v.industry)localStorage.setItem('ys-industry',v.industry);}catch(e){}});

export const decided=writable(safeJSON(localStorage.getItem('ys-decided'),{}));
decided.subscribe(v=>{try{localStorage.setItem('ys-decided',JSON.stringify(v));}catch(e){}});

export const gstep=writable(parseInt(localStorage.getItem('ys-gstep')||'0')||0);
gstep.subscribe(v=>{try{localStorage.setItem('ys-gstep',String(v));}catch(e){}});

export const gnav=writable({platform:null,category:null,all:false});
export const ready=writable(false);
export const loadError=writable(null); // null = ok | string = fatal load failure message
export const view=writable('welcome'); // welcome | guided | flow | library

// the resolved build — every surface derives from here, never recomputes alone
export const stack=derived([rs,ready],([v,ok])=>ok?resolveStack(v):null);

export function pick(axis,id){
  rs.update(v=>{
    const n={...v,[axis]:id};
    if(axis==='industry'){
      const had=Object.keys(get(decided)).some(k=>/^s([2-9]|1[0-8])$/.test(k));
      if(had && v.industry && v.industry!==id) n._industryChanged=(reqOfInd(id)||{}).name||id;
      n.auth=null;n.obs=null;n.cluster=null;n.runtime=null;
    }
    if(axis==='fw'){n.pkg=null;n.buildtool=null;n.orm=null;}
    return n;
  });
  const K=getK();
  const st=(K.guided?.steps||[]).find(x=>x.axis===axis);
  if(st) decided.update(d=>({...d,['g'+st.axis]:true,['s'+st.scene]:true}));
  if(axis==='industry') decided.update(d=>({...d,s1:true}));
}
export const clearIndustryBanner=()=>rs.update(v=>({...v,_industryChanged:''}));
