// Final perfection audit — runs init + simulates 12 common user flows and
// counts console errors / window errors / silent breakage.
const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html','utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/' });
const W = dom.window;
W.scrollTo = () => {}; W.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
W.localStorage = { getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };
W.sessionStorage = { getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };
W.Element.prototype.scrollIntoView = () => {};
const errors = [];
W.console.error = (...a) => errors.push('console.error: ' + a.join(' '));
W.addEventListener('error', e => errors.push('window.error: ' + e.message));
W.onerror = (msg) => errors.push('onerror: ' + msg);

W.document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  const d = W.document;
  const run = (label, fn) => {
    const before = errors.length;
    try { fn(); } catch(e) { errors.push(`${label}: threw ${e.message}`); }
    const after = errors.length;
    console.log((after > before ? '  ❌' : '  ✅') + ' ' + label + (after > before ? ' (' + (after-before) + ' errors)' : ''));
  };

  console.log('── User flow audit ────────────────────────────────────');
  run('init() completes cleanly', () => {});
  run('Pick frontend (nextjs → svelte)', () => { d.getElementById('sel-frontend').value='svelte'; W.onConfigChange(); });
  run('Pick backend (none → python-fastapi)', () => { d.getElementById('sel-backend').value='python-fastapi'; W.onConfigChange(); });
  run('Pick CI (gh actions → gitlab-ci)', () => { d.getElementById('sel-ci').value='gitlab-ci'; W.onConfigChange(); });
  run('Pick registry (ghcr → harbor)', () => { d.getElementById('sel-reg').value='harbor'; W.onConfigChange(); });
  run('Pick compliance (none → pci)', () => { d.getElementById('sel-compliance').value='pci'; W.onConfigChange(); });
  run('Pick secondary compliance (soc2)', () => { d.getElementById('sel-compliance-2').value='soc2'; W.onConfigChange(); });
  run('Pick industry (healthcare → autolink)', () => { d.getElementById('sel-industry').value='healthcare'; W.onIndustryChange(); });
  run('Activate Phase 2 tab', () => { const b=d.querySelector('.phase-tab[data-tab="tab-pr"]'); W.activatePhaseTab('tab-pr', b); });
  run('Activate Phase 4 tab', () => { const b=d.querySelector('.phase-tab[data-tab="tab-promotions"]'); W.activatePhaseTab('tab-promotions', b); });
  run('Open ctx drawer for invariant I-3', () => W.openInvariantContext('I-3'));
  run('Close ctx drawer', () => W.closeContext());
  run('Open Quick Find', () => W.openQuickFind());
  run('Close Quick Find', () => W.closeQuickFind());
  run('Reset all (cancel)', () => { W.confirm = () => false; W.resetAllConfig(); });
  run('Toggle decision map collapse', () => W.toggleDecisionMapCollapsed());
  run('Toggle quick-start mode', () => W.toggleQuickStartMode());
  run('Toggle advanced config', () => W.toggleAdvancedConfig());
  run('Pick a decision pill (cd → flux)', () => W.pickDecision('cd','flux'));
  run('Pick gitops same-repo → push', () => W.pickDecision('gitops','push'));

  console.log('');
  console.log('── DOM state after flows ──────────────────────────────');
  const cf = W.eval('CONFIG_FILES');
  console.log('  CONFIG_FILES count:', Object.keys(cf).length);
  console.log('  Active phase tab:', d.querySelector('.phase-tab.phase-tab-active')?.dataset.tab);
  console.log('  Visible phase panel:', d.querySelector('.phase-strip > .tab-content.phase-active')?.id);
  console.log('  Reference wrap open:', d.getElementById('reference-wrap')?.open);
  console.log('  SVG nodes:', d.querySelectorAll('.msvg-node').length);
  console.log('  Decision-map rendered:', !!d.getElementById('decision-map')?.innerHTML);

  console.log('');
  console.log('── Errors during all flows ────────────────────────────');
  console.log('Total: ' + errors.length);
  errors.slice(0,15).forEach(e => console.log('  > ' + String(e).slice(0,200)));
  process.exit(errors.length > 0 ? 1 : 0);
}, 600));
