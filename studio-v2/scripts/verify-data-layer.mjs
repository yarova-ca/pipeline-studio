#!/usr/bin/env node
// Light sanity check on the ported data layer — runs WITHOUT Astro/Vite
// installed, so it works even before `npm install`. Strips TypeScript
// annotations naively so the runtime-shape assertions can fire.
//
// Usage:  node scripts/verify-data-layer.mjs

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../src/lib/', import.meta.url).pathname;

// Tiny TS-to-JS shim: strip `: Type` annotations, `as ...` casts, and
// `interface` blocks. Good enough for our flat type-annotated data files.
function stripTs(src) {
  let s = src;
  s = s.replace(/^\s*import type[^;]+;\s*$/gm, '');                 // type-only imports
  s = s.replace(/^\s*export (interface|type)[\s\S]*?^\}$/gm, '');   // top-level interface/type blocks
  s = s.replace(/^\s*(interface|type)[\s\S]*?^\}$/gm, '');
  s = s.replace(/\bexport type [^;]+;\s*/g, '');
  s = s.replace(/<[^<>]*>(?=\s*[=(\[])/g, '');                      // generic args like Record<X,Y>
  s = s.replace(/:\s*Readonly<[^>]+>/g, '');
  s = s.replace(/:\s*Partial<[^>]+>/g, '');
  s = s.replace(/:\s*ReadonlySet<[^>]+>/g, '');
  s = s.replace(/:\s*Record<[^>]+>/g, '');
  s = s.replace(/:\s*readonly\s+[A-Za-z_][\w[\]]*\s*=/g, ' =');     // readonly Foo[] =
  s = s.replace(/\bas\s+const\b/g, '');
  s = s.replace(/\bas\s+[A-Za-z_][\w<>\[\],\s|]*/g, '');            // `as Type` casts
  s = s.replace(/:\s*[A-Za-z_][\w<>\[\],\s|.]*?(?=[,=)\]}\n])/g, ''); // simple `: Type` annotations
  return s;
}

async function loadModule(file) {
  const ts = await readFile(join(root, file), 'utf8');
  const js = stripTs(ts);
  const tmp = await mkdtemp(join(tmpdir(), 'studio-v2-'));
  const path = join(tmp, file.replace('.ts', '.mjs'));
  await writeFile(path, js);
  return import(pathToFileURL(path).href);
}

const failures = [];
const ok = (label) => console.log('  ✅ ' + label);
const fail = (label, err) => { failures.push(label); console.log('  ❌ ' + label + (err ? '  — ' + err : '')); };

console.log('── studio-v2 data layer sanity ─────────────────────────');

try {
  const phases = await loadModule('phases.ts');
  const PHASE_DEFS = phases.PHASE_DEFS;
  const STAGE_TO_PHASE_TAB = phases.STAGE_TO_PHASE_TAB;
  const phaseCount = Object.values(PHASE_DEFS).filter(Boolean).length;
  phaseCount === 4 ? ok(`PHASE_DEFS has 4 active phases (got ${phaseCount})`) : fail(`PHASE_DEFS count`, phaseCount);
  const allStagesFromDefs = Object.values(PHASE_DEFS).filter(Boolean).flatMap(p => p.stageIds);
  const missing = allStagesFromDefs.filter(s => !STAGE_TO_PHASE_TAB[s]);
  missing.length === 0 ? ok(`STAGE_TO_PHASE_TAB derives every stage in PHASE_DEFS`) : fail(`missing: ${missing.join(',')}`);
  ['p0g1','p0g2','p0g3'].every(s => STAGE_TO_PHASE_TAB[s] === 'tab-phase0') ? ok('Phase 0 stages mapped to tab-phase0') : fail('Phase 0 mapping');
  STAGE_TO_PHASE_TAB['s14'] === 'tab-promotions' ? ok('s14 (verify sig) is in Phase 4 (Promotions)') : fail('s14 mapping');
} catch (e) { fail('phases.ts load', e.message); }

try {
  const decisions = await loadModule('decisions.ts');
  const DECISION_DEFS = decisions.DECISION_DEFS;
  const DECISION_AFFECTS_NODES = decisions.DECISION_AFFECTS_NODES;
  const decCount = Object.keys(DECISION_DEFS).length;
  decCount >= 15 ? ok(`DECISION_DEFS has ${decCount} decisions`) : fail(`decision count low: ${decCount}`);
  const phases = await loadModule('phases.ts');
  const validStages = new Set(Object.keys(phases.STAGE_TO_PHASE_TAB));
  const ghosts = Object.entries(DECISION_AFFECTS_NODES)
    .flatMap(([d, ns]) => ns.filter(n => !validStages.has(n)).map(n => `${d}->${n}`));
  ghosts.length === 0 ? ok('DECISION_AFFECTS_NODES has no ghost stages') : fail(`ghost stages: ${ghosts.join(', ')}`);
} catch (e) { fail('decisions.ts load', e.message); }

try {
  const inv = await loadModule('invariants.ts');
  inv.INVARIANTS.length === 20 ? ok(`INVARIANTS has 20 entries`) : fail(`invariant count: ${inv.INVARIANTS.length}`);
  const ids = new Set(inv.INVARIANTS.map(i => i.id));
  const orphanDeps = Object.keys(inv.INVARIANT_DEPENDS_ON).filter(k => !ids.has(k));
  orphanDeps.length === 0 ? ok('INVARIANT_DEPENDS_ON keys all exist in INVARIANTS') : fail(`orphan deps: ${orphanDeps.join(',')}`);
} catch (e) { fail('invariants.ts load', e.message); }

try {
  const c = await loadModule('compliance.ts');
  const inv = await loadModule('invariants.ts');
  const invIds = new Set(inv.INVARIANTS.map(i => i.id));
  const ghostInv = [];
  for (const [fw, controls] of Object.entries(c.COMPLIANCE_CONTROL_MAP)) {
    for (const ctrl of controls) {
      for (const iid of ctrl.satisfiedBy) {
        if (!invIds.has(iid)) ghostInv.push(`${fw}/${ctrl.control}->${iid}`);
      }
    }
  }
  ghostInv.length === 0 ? ok('COMPLIANCE_CONTROL_MAP references no missing invariants') : fail(`ghost invariants: ${ghostInv.join(', ')}`);
  Object.keys(c.COMPLIANCE_CONTROL_MAP).length === 7 ? ok('7 compliance frameworks mapped') : fail(`framework count: ${Object.keys(c.COMPLIANCE_CONTROL_MAP).length}`);
} catch (e) { fail('compliance.ts load', e.message); }

console.log('────────────────────────────────────────');
console.log(failures.length ? `${failures.length} FAILURE(S)` : 'ALL GOOD ✅');
process.exit(failures.length ? 1 : 0);
