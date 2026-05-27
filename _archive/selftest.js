const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function check(label, cond) {
  if (cond) { console.log(`  ✅ ${label}`); pass++; }
  else       { console.error(`  ❌ ${label}`); fail++; }
}

function extractConst(name) {
  const re = new RegExp(`const ${name}\\s*=\\s*`);
  const start = html.search(re);
  if (start === -1) return null;
  let i = start;
  while (i < html.length && html[i] !== '{' && html[i] !== '[') i++;
  if (i >= html.length) return null;
  const open = html[i], close = open === '{' ? '}' : ']';
  let depth = 0, j = i;
  while (j < html.length) {
    if (html[j] === open) depth++;
    else if (html[j] === close) { depth--; if (depth === 0) { j++; break; } }
    j++;
  }
  try { return eval(`(${html.slice(i, j)})`); } catch(e) {
    try { return Function(`return ${html.slice(i, j)}`)(); } catch(e2) {
      console.error(`  Extract ${name} failed: ${e2.message.slice(0,80)}`); return null;
    }
  }
}

// --- PKG_MANAGERS ---
console.log('\nPKG_MANAGERS:');
const PM = extractConst('PKG_MANAGERS');
check('loaded', !!PM);
['spm','mix','cabal','shards','npm','cargo','pip','go','maven'].forEach(k => check(k, PM && !!PM[k]));

// --- PKG_FOR_LANG ---
console.log('\nPKG_FOR_LANG:');
const PFL = extractConst('PKG_FOR_LANG');
check('loaded', !!PFL);
check('Swift → spm (not cargo)',    PFL && PFL.Swift   && PFL.Swift.has('spm')   && !PFL.Swift.has('cargo'));
check('Haskell → cabal (not cargo)',PFL && PFL.Haskell && PFL.Haskell.has('cabal')&&!PFL.Haskell.has('cargo'));
check('Crystal → shards (not cargo)',PFL && PFL.Crystal && PFL.Crystal.has('shards')&&!PFL.Crystal.has('cargo'));
check('Elixir → mix',              PFL && PFL.Elixir  && PFL.Elixir.has('mix'));

// --- swift-vapor pkgMgr ---
console.log('\nSTACKS:');
const svLine = html.match(/'swift-vapor'[\s\S]{0,500}?pkgMgr\s*:\s*'([^']+)'/);
check('swift-vapor pkgMgr = spm', svLine && svLine[1] === 'spm');

// --- DECISION_DEFS ---
console.log('\nDECISION_DEFS:');
const ddStart = html.indexOf('const DECISION_DEFS');
const ddEnd   = html.indexOf('\nconst ', ddStart + 100);
const ddBlock = html.slice(ddStart, ddEnd > 0 ? ddEnd : ddStart + 100000);
['mlframework','inferenceruntime','modelregistry','gpubaseimage','infratooltype','infradistribution'].forEach(t =>
  check(`${t} exists`, ddBlock.includes(`${t}:`)));
const tileCount = (ddBlock.match(/^\s+\w[\w_]+\s*:\s*\{/gm) || []).length;
check(`≥20 tiles (found ${tileCount})`, tileCount >= 20);

// --- DECISION_STEPS ---
console.log('\nDECISION_STEPS:');
const dsMatch = html.match(/const DECISION_STEPS\s*=\s*\[([\s\S]*?)\];/);
const stepCount = dsMatch ? (dsMatch[1].match(/\{/g) || []).length : 0;
check(`≥8 steps (found ${stepCount})`, stepCount >= 8);

// --- SHAPE_TAXONOMY ---
console.log('\nSHAPE_TAXONOMY:');
const stStart = html.indexOf('const SHAPE_TAXONOMY');
const stEnd   = html.indexOf('\nconst ', stStart + 100);
const stBlock = html.slice(stStart, stEnd > 0 ? stEnd : stStart + 100000);
['web','backend','mobile','library','aiml','infra'].forEach(c => check(`${c} category`, stBlock.includes(`${c}:`)));

// Check for duplicates WITHIN each subtype's framework list
console.log('\nDuplicate values within subtypes:');
const subtypeRe = /(\w[\w-]*)\s*:\s*\{\s*label\s*:[^}]*frameworks\s*:\s*\[([\s\S]*?)\]\s*\}/g;
let anyDup = false;
let m;
while ((m = subtypeRe.exec(stBlock)) !== null) {
  const subName = m[1];
  const fBlock = m[2];
  const vals = [...fBlock.matchAll(/value\s*:\s*'([^']+)'/g)].map(x => x[1]);
  const seen = new Set(), dups = vals.filter(v => seen.size === seen.add(v).size);
  if (dups.length) {
    console.error(`  ❌ ${subName} has dup values: ${[...new Set(dups)].join(', ')}`);
    fail++; anyDup = true;
  }
}
if (!anyDup) { console.log('  ✅ No within-subtype duplicates'); pass++; }

// (WIZARD_STEPS check removed — wizard deleted entirely; decision map is the
//  single entry point now.)

// --- JS syntax ---
console.log('\nJS syntax:');
const jsText = html.match(/<script>([\s\S]*?)<\/script>/)[1];
fs.writeFileSync('/tmp/_syn.js', jsText);
try { execSync('node --check /tmp/_syn.js', {stdio:'pipe'}); check('clean', true); }
catch(e) { check('clean', false); console.error('  ', e.stderr.toString().slice(0,300)); }

console.log(`\n${'─'.repeat(40)}`);
console.log(`Total: ${pass} passed, ${fail} failed`);
if (fail === 0) console.log('\nALL CHECKS PASS ✅');
else { console.error(`\n${fail} CHECK(S) FAILED ❌`); process.exit(1); }
