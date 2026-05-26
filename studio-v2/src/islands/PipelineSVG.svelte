<script lang="ts">
  // Master pipeline SVG diagram.
  // Layout: 5 phase columns left-to-right (Phase 0..4).
  // Each column = stacked stage nodes.
  // Arrows show dependencies + canonical pipeline order.
  // Critical path drawn in red.

  import { resolvedConfig, decisionState, activeStageName } from '../stores/config';
  import { DECISION_AFFECTS_NODES } from '../lib/decisions';

  // Maps stage ID → which decision key controls the tool shown on that node.
  const NODE_TOOL_KEY: Record<string, keyof typeof $decisionState> = {
    s7pr:    'scanner',
    s7main:  'scanner',
    s8apr:   'sbom',
    s8a:     'sbom',
    s8b:     'signing',
    s10:     'signing',
    s14:     'signing',
    p1:      'cd',
    p2:      'cd',
    p3:      'cd',
    p4:      'promotion',
    l1:      'ide',
    l2:      'precommit',
    l4:      'localsecret',
  } as const;

  function getNodeToolLabel(stageId: string): string {
    const key = NODE_TOOL_KEY[stageId];
    if (!key) return '';
    const val = $decisionState[key] ?? '';
    if (!val) return '';
    // Shorten long values for display in the node
    const short: Record<string, string> = {
      'trivy': 'trivy', 'grype': 'grype', 'snyk': 'snyk', 'prisma': 'prisma',
      'cosign': 'cosign', 'notary': 'notary',
      'syft': 'syft', 'trivy-sbom': 'trivy',
      'argocd': 'argo', 'flux': 'flux', 'helm': 'helm', 'spinnaker': 'spin',
      'canary': 'canary', 'blue-green': 'b/g', 'rolling': 'rolling',
      'vscode': 'VSCode', 'intellij': 'IntelliJ', 'neovim': 'neovim',
      'precommit': 'pre-commit', 'lefthook': 'lefthook',
      '1password': '1pass', 'vault': 'vault', 'doppler': 'doppler',
    };
    return short[val] ?? val;
  }

  const COL_W = 175, NODE_W = 148, NODE_H = 34, ROW_H = 44, TOP = 56, LEFT = 14;

  const COLS = [
    { phase: 0, label: 'Phase 0 · Bootstrap',  fill: '#f1f3f5', stroke: '#adb5bd', stages: [
      { id: 'p0g1', label: 'Gate 1 Identity',   sub: 'OIDC trust',   critical: false },
      { id: 'p0g2', label: 'Gate 2 Protection', sub: 'branch rules', critical: false },
      { id: 'p0g3', label: 'Gate 3 Secrets',    sub: 'pinned tools', critical: false },
    ]},
    { phase: 1, label: 'Phase 1 · Developer',  fill: '#f1f3f5', stroke: '#adb5bd', stages: [
      { id: 'l1',    label: 'IDE Hints',         sub: 'L1',   critical: false },
      { id: 'l2',    label: 'Pre-commit',        sub: 'L2',   critical: false },
      { id: 'l3',    label: 'Lint + Format',     sub: 'L3',   critical: false },
      { id: 'l4',    label: 'Secret Scan',       sub: 'L4',   critical: false },
      { id: 'gitpush', label: 'git push',        sub: '',     critical: false },
    ]},
    { phase: 2, label: 'Phase 2 · PR Gate',    fill: '#fff0f0', stroke: '#ffc9c9', stages: [
      { id: 's1',    label: 'Hooks (re-run)',    sub: 'S1',   critical: false },
      { id: 's2',    label: 'SCA',              sub: 'S2',   critical: false, parallel: true },
      { id: 's3',    label: 'SAST',             sub: 'S3',   critical: false, parallel: true },
      { id: 's3b',   label: 'License',          sub: 'S3b',  critical: false, parallel: true },
      { id: 's4',    label: 'IaC',              sub: 'S4',   critical: false, parallel: true },
      { id: 's5',    label: 'Secrets',          sub: 'S5',   critical: false, parallel: true },
      { id: 's6pr',  label: 'Build',            sub: 'S6',   critical: false },
      { id: 's8apr', label: 'SBOM',             sub: 'S8a',  critical: false },
      { id: 's7pr',  label: 'Scan',             sub: 'S7',   critical: false },
    ]},
    { phase: 3, label: 'Phase 3 · Main Build', fill: '#e7f5ff', stroke: '#a5d8ff', stages: [
      { id: 's0',    label: 'Auth',             sub: 'S0',   critical: false },
      { id: 's2m',   label: 'SCA',              sub: 'S2',   critical: false, parallel: true },
      { id: 's3m',   label: 'SAST',             sub: 'S3',   critical: false, parallel: true },
      { id: 's3bm',  label: 'License',          sub: 'S3b',  critical: false, parallel: true },
      { id: 's4m',   label: 'IaC',              sub: 'S4',   critical: false, parallel: true },
      { id: 's5m',   label: 'Secrets',          sub: 'S5',   critical: false, parallel: true },
      { id: 's6main',label: 'Build + Push',     sub: 'S6',   critical: false },
      { id: 's8a',   label: 'SBOM',             sub: 'S8a',  critical: false },
      { id: 's7main',label: 'Scan',             sub: 'S7',   critical: false },
      { id: 's8b',   label: 'Sign + Attest',    sub: 'S8b',  critical: true  },
      { id: 's9',    label: 'Unit Test',        sub: 'S9',   critical: false },
      { id: 's9a',   label: 'Integration',      sub: 'S9a',  critical: false },
      { id: 'dast',  label: 'DAST',             sub: '',     critical: false },
      { id: 's11',   label: 'Perf',             sub: 'S11',  critical: false },
      { id: 's10',   label: 'SLSA Provenance',  sub: 'S10',  critical: true  },
    ]},
    { phase: 4, label: 'Phase 4 · Promotions', fill: '#fff4e6', stroke: '#ffd8a8', stages: [
      { id: 's12',   label: 'Notify',           sub: 'S12',  critical: false },
      { id: 's13',   label: 'Promote :latest',  sub: 'S13',  critical: true  },
      { id: 'p1',    label: 'Deploy → dev',     sub: 'P1',   critical: true  },
      { id: 'p2',    label: 'Promote → test',   sub: 'P2',   critical: false },
      { id: 'p3',    label: 'Promote → staging',sub: 'P3',   critical: false },
      { id: 'p4',    label: 'Canary → prod',    sub: 'P4',   critical: true  },
      { id: 's14',   label: 'Verify Signature', sub: 'S14',  critical: true  },
    ]},
  ];

  const EDGES: Array<[string, string, string?]> = [
    // Phase 2: PR gate
    ['s1','s2'], ['s1','s3'], ['s1','s3b'], ['s1','s4'], ['s1','s5'],
    ['s2','s6pr'], ['s3','s6pr'], ['s3b','s6pr'], ['s4','s6pr'], ['s5','s6pr'],
    ['s6pr','s8apr'], ['s8apr','s7pr'],
    // Phase 3: Main build
    ['s0','s2m'], ['s0','s3m'], ['s0','s3bm'], ['s0','s4m'], ['s0','s5m'],
    ['s2m','s6main'], ['s3m','s6main'], ['s3bm','s6main'], ['s4m','s6main'], ['s5m','s6main'],
    ['s6main','s8a'], ['s8a','s7main'], ['s7main','s8b','critical'],
    ['s6main','s9'], ['s9','s9a'], ['s9a','dast'], ['s9a','s11'],
    ['s7main','s10','critical'], ['s6main','s10','critical'],
    // Gate to ship
    ['s8b','s12','critical'], ['s10','s12','critical'], ['dast','s12'], ['s11','s12'],
    ['s12','s13','critical'],
    ['s13','p1','critical'], ['p1','p2'], ['p2','p3'], ['p3','p4','critical'],
    ['p4','s14','critical'],
    // Cross-phase
    ['p0g3','l1'],
  ];

  // Compute node positions
  function buildNodePos() {
    const pos: Record<string, { x: number; y: number; w: number; h: number }> = {};
    COLS.forEach((col, ci) => {
      col.stages.forEach((s, ri) => {
        pos[s.id] = {
          x: LEFT + ci * COL_W,
          y: TOP + ri * ROW_H,
          w: NODE_W,
          h: NODE_H,
        };
      });
    });
    return pos;
  }
  const nodePos = buildNodePos();

  const maxRows = Math.max(...COLS.map(c => c.stages.length));
  const totalH  = TOP + maxRows * ROW_H + 20;
  const totalW  = LEFT + COLS.length * COL_W + 8;

  // Compute which nodes are affected by current decisions
  $: decidedNodeIds = (() => {
    const ids = new Set<string>();
    const d = $decisionState;
    Object.entries(d).forEach(([decId, val]) => {
      if (val && DECISION_AFFECTS_NODES[decId]) {
        DECISION_AFFECTS_NODES[decId].forEach(nid => ids.add(nid));
      }
    });
    return ids;
  })();

  function cx(p: { x: number; w: number }) { return p.x + p.w / 2; }
  function cy(p: { y: number; h: number }) { return p.y + p.h / 2; }

  function edgePath(from: string, to: string): string {
    const a = nodePos[from], b = nodePos[to];
    if (!a || !b) return '';
    const ax = a.x + a.w, ay = cy(a);
    const bx = b.x, by = cy(b);
    const mx = (ax + bx) / 2;
    return `M ${ax} ${ay} C ${mx} ${ay} ${mx} ${by} ${bx} ${by}`;
  }

  function fillForStage(stageId: string, colFill: string, critical: boolean): string {
    if ($activeStageName === stageId) return '#fff0f0';
    if (decidedNodeIds.has(stageId)) return '#e8f5e9';
    if (critical) return '#fff8f8';
    return colFill;
  }

  function strokeForStage(stageId: string, colStroke: string, critical: boolean): string {
    if ($activeStageName === stageId) return '#cf222e';
    if (decidedNodeIds.has(stageId)) return '#2da44e';
    if (critical) return '#cf222e';
    return colStroke;
  }

  function handleNodeClick(stageId: string) {
    activeStageName.set($activeStageName === stageId ? null : stageId);
  }
</script>

<div class="svg-wrap">
  <svg
    width={totalW}
    height={totalH}
    viewBox={`0 0 ${totalW} ${totalH}`}
    role="img"
    aria-label="Pipeline stage diagram"
  >
    <!-- Phase column headers -->
    {#each COLS as col, ci}
      {@const hx = LEFT + ci * COL_W}
      <rect x={hx} y={4} width={NODE_W} height={26} rx={4} fill={col.fill} stroke={col.stroke} stroke-width="1" />
      <text x={hx + NODE_W / 2} y={21} text-anchor="middle" font-size="9" font-weight="700" fill="#495057" font-family="JetBrains Mono, monospace">
        {col.label}
      </text>
    {/each}

    <!-- Edges -->
    {#each EDGES as [from, to, kind]}
      {@const path = edgePath(from, to)}
      {#if path}
        <path
          d={path}
          fill="none"
          stroke={kind === 'critical' ? '#cf222e' : '#adb5bd'}
          stroke-width={kind === 'critical' ? 1.5 : 1}
          stroke-dasharray={kind === 'critical' ? '' : '3 2'}
          opacity="0.7"
        />
      {/if}
    {/each}

    <!-- Stage nodes -->
    {#each COLS as col}
      {#each col.stages as stage}
        {@const p = nodePos[stage.id]}
        {#if p}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <g
            class="stage-node"
            on:click={() => handleNodeClick(stage.id)}
            style="cursor:pointer"
          >
            <rect
              x={p.x} y={p.y}
              width={p.w} height={p.h}
              rx={4}
              fill={fillForStage(stage.id, col.fill, stage.critical)}
              stroke={strokeForStage(stage.id, col.stroke, stage.critical)}
              stroke-width={stage.critical ? 1.5 : 1}
            />
            {#if stage.parallel}
              <line x1={p.x + 4} y1={p.y} x2={p.x + 4} y2={p.y + p.h} stroke={col.stroke} stroke-width="2" />
            {/if}
            <text x={p.x + 8} y={p.y + 13} font-size="10" font-weight="600" fill="#24292f" font-family="system-ui, sans-serif">
              {stage.label}
            </text>
            {#if stage.sub}
              <text x={p.x + 8} y={p.y + 26} font-size="8.5" fill="#57606a" font-family="JetBrains Mono, monospace">
                {stage.sub}
              </text>
            {/if}
            {#if stage.critical}
              <rect x={p.x + p.w - 8} y={p.y + 2} width={6} height={p.h - 4} rx={2} fill="#cf222e" opacity="0.7" />
            {/if}
            <!-- Tool label pill — shows currently picked tool for decision-driven nodes -->
            {#if getNodeToolLabel(stage.id)}
              {@const toolLabel = getNodeToolLabel(stage.id)}
              {@const pillW = toolLabel.length * 4.8 + 8}
              <rect
                x={p.x + p.w - pillW - (stage.critical ? 12 : 4)}
                y={p.y + p.h - 11}
                width={pillW}
                height={9}
                rx={3}
                fill="#0969da"
                opacity="0.85"
              />
              <text
                x={p.x + p.w - pillW / 2 - (stage.critical ? 12 : 4)}
                y={p.y + p.h - 4}
                text-anchor="middle"
                font-size="6.5"
                font-weight="600"
                fill="white"
                font-family="JetBrains Mono, monospace"
              >{toolLabel}</text>
            {/if}
          </g>
        {/if}
      {/each}
    {/each}
  </svg>

  <div class="svg-legend">
    <span class="leg-item"><span class="leg-dot red"></span>Critical path</span>
    <span class="leg-item"><span class="leg-dot green"></span>Changed by your picks</span>
    <span class="leg-item leg-muted">Click any stage for details</span>
  </div>
</div>

<style>
  .svg-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: #fafbfc;
    padding: 12px;
  }

  .stage-node rect { transition: fill .15s, stroke .15s; }
  .stage-node:hover rect { filter: brightness(.95); }

  .svg-legend {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
    font-size: 10.5px;
    color: var(--muted);
    padding: 0 4px;
  }
  .leg-item { display: flex; align-items: center; gap: 5px; }
  .leg-dot {
    width: 10px; height: 10px;
    border-radius: 2px;
    border: 1.5px solid;
    flex-shrink: 0;
  }
  .leg-dot.red   { background: #fff8f8; border-color: #cf222e; }
  .leg-dot.green { background: #e8f5e9; border-color: #2da44e; }
  .leg-muted { color: var(--muted); margin-left: auto; font-style: italic; }
</style>
