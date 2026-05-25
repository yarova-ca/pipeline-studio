// jsdom-based regression test for the "click Angular → page jumps" bug.
// Loads index.html, runs init(), simulates a frontend pick, and asserts
// that selectPipeStage during init/onConfigChange does NOT call scrollIntoView.
const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html','utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const W = dom.window;
// Stubs jsdom doesn't provide
W.scrollTo = () => {};
W.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
const localStore = {};
Object.defineProperty(W, 'localStorage', { value: {
  getItem: k => localStore[k] || null,
  setItem: (k,v) => { localStore[k] = v; },
  removeItem: k => { delete localStore[k]; }
}});

// Spy on Element.prototype.scrollIntoView to record calls
const scrollCalls = [];
W.Element.prototype.scrollIntoView = function(opts) {
  scrollCalls.push({ id: this.id || '(no id)', opts });
};

// Wait for DOMContentLoaded -> init() to run
function waitForInit() {
  return new Promise(r => {
    W.document.addEventListener('DOMContentLoaded', () => setTimeout(r, 300));
  });
}

(async () => {
  await waitForInit();
  const initCalls = scrollCalls.splice(0);
  console.log('── Init phase ─────────────────────────────────');
  console.log('  scrollIntoView calls during init:', initCalls.length);
  initCalls.forEach(c => console.log('    -', c.id));

  // ── Simulate user picking Angular in shape picker ──
  try { W.pickShapeFramework('angular', 'fe', 'web-ssr'); } catch(e) {
    console.log('  ERROR in pickShapeFramework:', e.message);
  }
  await new Promise(r => setTimeout(r, 50));
  const pickCalls = scrollCalls.splice(0);
  console.log('');
  console.log('── User clicks Angular ────────────────────────');
  console.log('  scrollIntoView calls after pickShapeFramework:', pickCalls.length);
  pickCalls.forEach(c => console.log('    -', c.id));

  // Verdict
  console.log('');
  const ok = initCalls.length === 0 && pickCalls.length === 0;
  console.log(ok
    ? '✅ PASS — neither init nor Angular click triggers a scroll-jump.'
    : '❌ FAIL — page is scrolling when it should not.');
  process.exit(ok ? 0 : 1);
})();
