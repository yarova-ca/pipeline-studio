// Phases + stages. PHASE_DEFS is the canonical map; STAGE_TO_PHASE_TAB is
// DERIVED — no duplication, no drift. Add a stage here and every sync
// helper picks it up automatically.

import type { PhaseDef, PhaseTabId, StageId, PhaseNumber } from './types';

export const PHASE_DEFS: Record<PhaseNumber, PhaseDef | null> = {
  0: null,  // Phase 0 (Bootstrap) doesn't appear in PHASE_DEFS — it's a
            // one-time setup, not a pipeline phase. Mapped manually below.
  1: {
    label: 'Developer',
    badge: '1 — Local',
    color: '#adb5bd',
    stageIds: ['l1', 'l2', 'l3', 'l4']
  },
  2: {
    label: 'PR Gate',
    badge: '2 — PR',
    color: '#ff8787',
    stageIds: ['s1', 's2', 's3', 's3b', 's4', 's5', 's6pr', 's8apr', 's7pr']
  },
  3: {
    label: 'Main Build',
    badge: '3 — Main',
    color: '#74c0fc',
    stageIds: [
      's0', 's1main', 's2m', 's3m', 's3bm', 's4m', 's5m', 's6main',
      's8a', 's7main', 's8b', 's9', 's9a', 'dast', 's11', 's10', 's12', 's13'
    ]
  },
  4: {
    label: 'Promotions',
    badge: '4 — Ship',
    color: '#ffa94d',
    stageIds: ['p1', 'p2', 'p3', 'p4', 's14']
  }
};

const PHASE_NUM_TO_TAB: Record<PhaseNumber, PhaseTabId> = {
  0: 'tab-phase0',
  1: 'tab-local',
  2: 'tab-pr',
  3: 'tab-main',
  4: 'tab-promotions'
};

/**
 * Stage → owning phase tab. DERIVED from PHASE_DEFS at module load.
 * Phase 0 stages (p0g1..p0g3) hardcoded since they aren't in PHASE_DEFS.
 */
export const STAGE_TO_PHASE_TAB: Readonly<Record<StageId, PhaseTabId>> = (() => {
  const out: Record<StageId, PhaseTabId> = {
    p0g1: 'tab-phase0',
    p0g2: 'tab-phase0',
    p0g3: 'tab-phase0'
  };
  (Object.entries(PHASE_DEFS) as [string, PhaseDef | null][])
    .forEach(([n, def]) => {
      if (!def) return;
      const tab = PHASE_NUM_TO_TAB[Number(n) as PhaseNumber];
      def.stageIds.forEach(sid => { out[sid] = tab; });
    });
  return Object.freeze(out);
})();

/** Reverse: phase tab → list of stages. Cheap; derived from STAGE_TO_PHASE_TAB. */
export const stagesInTab = (tab: PhaseTabId): StageId[] =>
  Object.entries(STAGE_TO_PHASE_TAB)
    .filter(([, t]) => t === tab)
    .map(([s]) => s);
