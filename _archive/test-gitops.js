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
  // Probe via globalThis since const isn't on window in jsdom
  const ctx = dom.window.eval('({ CONFIG_FILES, DECISION_DEFS, DECISION_REQUIRED, DECISION_STATE, getConfig })');
  console.log('CONFIG_FILES keys: ' + Object.keys(ctx.CONFIG_FILES).length);
  Object.keys(ctx.CONFIG_FILES).forEach(k => {
    const f = ctx.CONFIG_FILES[k];
    const lbl = typeof f.label === 'function' ? f.label() : f.label;
    console.log('  - ' + k.padEnd(45) + ' [' + lbl + ']');
  });
  console.log('');
  console.log('gitops in DECISION_DEFS:    ', !!ctx.DECISION_DEFS.gitops);
  console.log('gitops in REQUIRED:         ', ctx.DECISION_REQUIRED.has('gitops'));
  console.log('default gitops:             ', ctx.getConfig().gitops);
  // Switch gitops + verify argocd-app changes
  ctx.DECISION_STATE.gitops = 'same-repo';
  const sameRepoApp = ctx.CONFIG_FILES['deploy/argocd-app.yaml'].content;
  ctx.DECISION_STATE.gitops = 'separate-repo';
  const sepRepoApp = ctx.CONFIG_FILES['deploy/argocd-app.yaml'].content;
  console.log('');
  console.log('same-repo Application:      ', sameRepoApp.includes('YOUR_APP_REPO') ? '✅ points at app repo' : '❌');
  console.log('separate-repo Application:  ', sepRepoApp.includes('YOUR_CONFIG_REPO') ? '✅ points at config repo' : '❌');
  console.log('same-repo path:             ', sameRepoApp.includes('deploy/overlays/dev') ? '✅' : '❌');
  console.log('separate-repo path:         ', sepRepoApp.match(/path: overlays\/dev/) ? '✅' : '❌');
}, 300));
