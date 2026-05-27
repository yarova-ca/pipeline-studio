// Quick probe: does the registry decision row actually render the "Required" badge?
const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html','utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const W = dom.window;
W.scrollTo = () => {};
W.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
W.localStorage = { getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };
W.Element.prototype.scrollIntoView = () => {};

W.document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  // Pick a shape so step 3 (where 'reg' lives) becomes applicable.
  try { W.pickShapeFramework('nextjs','fe','fullstack'); } catch(e){}
  // Force render.
  try { W.renderDecisionMap(); } catch(e) { console.log('render err', e.message); }

  const ids = ['fe','be','build','pkg','ci','reg','cd','scanner','signing','baseimage','sbom','industry','compliance','ide','precommit','localsecret','cloud','promotion'];
  for (const id of ids) {
    const row = W.document.querySelector(`.ds-row[data-decision="${id}"]`);
    if (!row) { console.log(`  - ${id.padEnd(12)} (row not rendered)`); continue; }
    const reqBadge = row.querySelector('.ds-badge-required');
    const optBadge = row.querySelector('.ds-badge-optional');
    const tag = reqBadge ? 'REQUIRED' : optBadge ? 'optional' : '(no badge)';
    console.log(`  - ${id.padEnd(12)} → ${tag}`);
  }
  process.exit(0);
}, 300));
