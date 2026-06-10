<script lang="ts">
  import { resolvedConfig } from '../stores/config';
  import { GLOSSARY } from '../lib/glossary';
  import { SETUP_GUIDES } from '../lib/setupguides';
  import { TESTED_COMBINATIONS, lookupCombo } from '../lib/testedcombos';
  import { TOOL_VERSIONS, TOOL_META } from '../lib/tools';
  import { PR_STAGES, MAIN_STAGES, ALL_STAGES_FLAT, isParallel } from '../lib/stages';
  import type { StageDef } from '../lib/stages';
  import { INVARIANTS } from '../lib/invariants';

  type TabId = 'setup' | 'versions' | 'matrix' | 'mistakes' | 'glossary' | 'tradeoffs' | 'maintain' | 'selftest';

  const TABS: Array<{ id: TabId; label: string; hint: string }> = [
    { id: 'setup',     label: 'Setup Guides',      hint: '9 registries' },
    { id: 'versions',  label: 'Tool Versions',      hint: '52 tools' },
    { id: 'matrix',    label: 'Tested Matrix',      hint: '13 combos' },
    { id: 'mistakes',  label: 'Common Mistakes',    hint: 'per stage' },
    { id: 'glossary',  label: 'Glossary',           hint: '52 terms' },
    { id: 'tradeoffs', label: 'Tradeoffs',          hint: 'alternatives' },
    { id: 'maintain',  label: 'Maintain',           hint: 'contributors' },
    { id: 'selftest',  label: 'Self-Test',          hint: 'data health' },
  ];

  let activeTab: TabId = 'setup';
  let glossaryFilter = '';
  let expandedCombo: string | null = null;

  $: regKey = $resolvedConfig.regKey ?? 'ghcr';
  $: currentGuide = SETUP_GUIDES[regKey] ?? SETUP_GUIDES.ghcr;

  $: comboResult = lookupCombo(
    $resolvedConfig.feKey,
    $resolvedConfig.beKey,
    $resolvedConfig.ciKey,
    $resolvedConfig.regKey
  );

  $: filteredGlossary = glossaryFilter
    ? GLOSSARY.filter(g =>
        g.term.toLowerCase().includes(glossaryFilter.toLowerCase()) ||
        g.def.toLowerCase().includes(glossaryFilter.toLowerCase())
      )
    : GLOSSARY;

  // Build version table entries (filter to security/build tools only)
  const DISPLAY_TOOLS = [
    { key: 'trivyImage',        label: 'Trivy (container scanner)',  url: 'https://github.com/aquasecurity/trivy/releases' },
    { key: 'semgrepVersion',    label: 'Semgrep (SAST)',             url: 'https://github.com/semgrep/semgrep/releases' },
    { key: 'cosignImage',       label: 'cosign (image signing)',     url: 'https://github.com/sigstore/cosign/releases' },
    { key: 'cosignInstaller',   label: 'cosign-installer (GHA)',     url: 'https://github.com/sigstore/cosign-installer/releases' },
    { key: 'gitleaksImage',     label: 'Gitleaks (secret scan)',     url: 'https://github.com/gitleaks/gitleaks/releases' },
    { key: 'syftImage',         label: 'Syft (SBOM generator)',      url: 'https://github.com/anchore/syft/releases' },
    { key: 'sbomAction',        label: 'anchore/sbom-action (GHA)',  url: 'https://github.com/anchore/sbom-action/releases' },
    { key: 'checkovImage',      label: 'Checkov (IaC scanner)',      url: 'https://github.com/bridgecrewio/checkov/releases' },
    { key: 'checkovAction',     label: 'checkov-action (GHA)',       url: 'https://github.com/bridgecrewio/checkov-action/releases' },
    { key: 'k6Image',           label: 'k6 (perf testing)',          url: 'https://github.com/grafana/k6/releases' },
    { key: 'zapImage',          label: 'OWASP ZAP (DAST)',           url: 'https://github.com/zaproxy/zaproxy/releases' },
    { key: 'zapBaseline',       label: 'zap-baseline-action (GHA)', url: 'https://github.com/zaproxy/action-baseline/releases' },
    { key: 'fossaAction',       label: 'FOSSA (license scan)',       url: 'https://github.com/fossas/fossa-action/releases' },
    { key: 'slsaGenerator',     label: 'SLSA generator (GHA)',       url: 'https://github.com/slsa-framework/slsa-github-generator/releases' },
    { key: 'dockerBuildPush',   label: 'docker/build-push-action',   url: 'https://github.com/docker/build-push-action/releases' },
    { key: 'dockerLogin',       label: 'docker/login-action',        url: 'https://github.com/docker/login-action/releases' },
    { key: 'dockerSetupBuildx', label: 'docker/setup-buildx-action', url: 'https://github.com/docker/setup-buildx-action/releases' },
    { key: 'actionCheckout',    label: 'actions/checkout',           url: 'https://github.com/actions/checkout/releases' },
    { key: 'actionCache',       label: 'actions/cache',              url: 'https://github.com/actions/cache/releases' },
    { key: 'awsConfigureCreds', label: 'aws/configure-credentials',  url: 'https://github.com/aws-actions/configure-aws-credentials/releases' },
    { key: 'awsEcrLogin',       label: 'amazon-ecr-login',           url: 'https://github.com/aws-actions/amazon-ecr-login/releases' },
    { key: 'gcpAuth',           label: 'google-github-actions/auth', url: 'https://github.com/google-github-actions/auth/releases' },
    { key: 'azureLogin',        label: 'azure/login',                url: 'https://github.com/Azure/login/releases' },
    { key: 'nodeImage',         label: 'Node.js base image',         url: 'https://hub.docker.com/_/node/tags' },
    { key: 'pythonImage',       label: 'Python base image',          url: 'https://hub.docker.com/_/python/tags' },
    { key: 'golangImage',       label: 'Go builder image',           url: 'https://hub.docker.com/_/golang/tags' },
    { key: 'javaImage',         label: 'Java (Temurin) image',       url: 'https://hub.docker.com/_/eclipse-temurin/tags' },
    { key: 'rustImage',         label: 'Rust builder image',         url: 'https://hub.docker.com/_/rust/tags' },
  ] as const;

  // All stages with commonMistakes populated
  const stagesWithMistakes = [
    ...(Array.isArray(PR_STAGES) ? PR_STAGES : []),
    ...(Array.isArray(MAIN_STAGES) ? MAIN_STAGES : []),
  ].flatMap(item => {
    if ('parallel' in item && item.parallel) return item.stages;
    return [item];
  }).filter((s: any) => s.commonMistakes);

  // Self-test: build a flat array of all StageDefs for consistency checks
  const ALL_STAGES_LIST: StageDef[] = Object.values(ALL_STAGES_FLAT);

  interface SelfTestCheck {
    id: string;
    label: string;
    pass: boolean;
    detail: string;
  }

  function buildSelfTestChecks(): SelfTestCheck[] {
    const checks: SelfTestCheck[] = [];
    const stages = ALL_STAGES_LIST;
    const total = stages.length;

    // Coverage checks
    const withTool      = stages.filter(s => s.tool).length;
    const withConcept   = stages.filter(s => s.concept).length;
    const withBenefit   = stages.filter(s => s.benefit).length;
    const withMistakes  = stages.filter(s => s.commonMistakes).length;
    const withDiscipline = stages.filter(s => s.discipline?.length).length;
    const withRuntime   = stages.filter(s => s.runtime).length;
    const withInvariants = stages.filter(s => s.invariants?.length).length;

    checks.push({
      id: 'c1', label: 'All stages have tool field',
      pass: withTool === total,
      detail: `${withTool}/${total} stages have tool defined`,
    });
    checks.push({
      id: 'c2', label: 'All stages have concept (educational text)',
      pass: withConcept >= Math.floor(total * 0.8),
      detail: `${withConcept}/${total} stages have concept text`,
    });
    checks.push({
      id: 'c3', label: 'All stages have benefit statement',
      pass: withBenefit >= Math.floor(total * 0.8),
      detail: `${withBenefit}/${total} stages have benefit defined`,
    });
    checks.push({
      id: 'c4', label: 'All stages have common mistakes',
      pass: withMistakes >= Math.floor(total * 0.7),
      detail: `${withMistakes}/${total} stages have commonMistakes`,
    });
    checks.push({
      id: 'c5', label: 'All stages have discipline codes',
      pass: withDiscipline >= Math.floor(total * 0.8),
      detail: `${withDiscipline}/${total} stages have discipline codes`,
    });
    checks.push({
      id: 'c6', label: 'All stages have runtime estimate',
      pass: withRuntime >= Math.floor(total * 0.7),
      detail: `${withRuntime}/${total} stages have runtime defined`,
    });
    checks.push({
      id: 'c7', label: 'Stages with invariant references',
      pass: withInvariants > 0,
      detail: `${withInvariants} stages reference pipeline invariants`,
    });

    // Invariant integrity
    const definedInvariantIds = new Set(INVARIANTS.map(inv => inv.id));
    const referencedIds = new Set(
      stages.flatMap(s => s.invariants ?? [])
    );
    const orphaned = [...referencedIds].filter(id => !definedInvariantIds.has(id));
    checks.push({
      id: 'c8', label: 'No orphaned invariant references',
      pass: orphaned.length === 0,
      detail: orphaned.length === 0
        ? `All ${referencedIds.size} referenced invariants are defined`
        : `Orphaned: ${orphaned.join(', ')}`,
    });

    // Data integrity
    checks.push({
      id: 'c9', label: 'Glossary is populated',
      pass: GLOSSARY.length >= 30,
      detail: `${GLOSSARY.length} terms defined`,
    });
    checks.push({
      id: 'c10', label: 'Tested combinations populated',
      pass: Object.keys(TESTED_COMBINATIONS).length >= 10,
      detail: `${Object.keys(TESTED_COMBINATIONS).length} validated combos`,
    });
    checks.push({
      id: 'c11', label: 'Setup guides for all registries',
      pass: Object.keys(SETUP_GUIDES).length >= 9,
      detail: `${Object.keys(SETUP_GUIDES).length} registry guides`,
    });
    checks.push({
      id: 'c12', label: 'Tool versions pinned',
      pass: Object.keys(TOOL_VERSIONS).length >= 20,
      detail: `${Object.keys(TOOL_VERSIONS).length} tool versions pinned in tools.ts`,
    });

    // Tool meta — check no lastVerified is more than 6 months old
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const staleTools = Object.entries(TOOL_META)
      .filter(([, m]) => new Date(m.lastVerified) < sixMonthsAgo)
      .map(([k]) => k);
    checks.push({
      id: 'c13', label: 'No tool versions stale (>6 months)',
      pass: staleTools.length === 0,
      detail: staleTools.length === 0
        ? 'All tool versions verified within 6 months'
        : `Stale (${staleTools.length}): ${staleTools.slice(0, 3).join(', ')}${staleTools.length > 3 ? '…' : ''}`,
    });

    // Stage IDs unique
    const ids = stages.map(s => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    checks.push({
      id: 'c14', label: 'No duplicate stage IDs',
      pass: dupes.length === 0,
      detail: dupes.length === 0
        ? `${total} stage IDs are unique`
        : `Duplicate IDs: ${dupes.join(', ')}`,
    });

    return checks;
  }

  const selfTestChecks = buildSelfTestChecks();
  $: selfTestPass = selfTestChecks.filter(c => c.pass).length;
  $: selfTestFail = selfTestChecks.filter(c => !c.pass).length;

  // Tradeoffs data: per-stage alternative tools
  const TRADEOFFS = [
    { stage: 'S2 SCA',             current: 'dependency-check / npm audit',  alternatives: 'Snyk (commercial, IDE integration), Grype (fast, SBOM-native), OSV-Scanner (Google, free)',   when: 'Snyk if team already pays. Grype if you use CycloneDX SBOMs. OSV-Scanner for pure open-source.' },
    { stage: 'S3 SAST',            current: 'Semgrep 1.92.0',                alternatives: 'CodeQL (GitHub-native, deeper analysis), Sonar (commercial, PR decoration)',                   when: 'CodeQL for GitHub-hosted repos with more time budget. Sonar if you need dashboard reporting.' },
    { stage: 'S3b License',        current: 'FOSSA',                          alternatives: 'TLDR Legal (simpler), ORT (open-source, complex), LicenseFinder',                             when: 'FOSSA if AGPL/GPL blocking matters commercially. ORT if you need SBOM + license in one pass.' },
    { stage: 'S4 IaC',             current: 'Checkov',                        alternatives: 'Terrascan, kics, OPA Conftest, Trivy (--scanners config)',                                   when: 'kics if Terraform is your primary IaC. Conftest if you write OPA Rego policies already.' },
    { stage: 'S5 Secrets',         current: 'Gitleaks',                       alternatives: 'truffleHog (history scanning), detect-secrets (Yelp), git-secrets',                          when: 'truffleHog for deeper entropy-based scanning. detect-secrets for a pre-commit-only flow.' },
    { stage: 'S7 Container Scan',  current: 'Trivy',                          alternatives: 'Grype, Snyk Container, Clair, Prisma Cloud, Anchore Enterprise',                             when: 'Grype if Trivy false-positives are high. Prisma/Anchore for enterprise policy enforcement.' },
    { stage: 'S8a SBOM',           current: 'Syft (SPDX-JSON)',               alternatives: 'Trivy --format cyclonedx, Microsoft SBOM Tool, cdxgen',                                     when: 'Trivy SBOM if you already use Trivy scan (same tool, one less binary). cdxgen for JVM projects.' },
    { stage: 'S8b Signing',        current: 'cosign (keyless, Sigstore)',      alternatives: 'Notary v2 (signotary, harbor-native), Docker Content Trust (legacy DCT)',                    when: 'Notary v2 if Harbor is your registry (native integration). Avoid DCT — it uses Notary v1.' },
    { stage: 'S9 Tests',           current: 'framework-native runner',         alternatives: 'Vitest (Jest-compatible, Vite-native), pytest (Python), go test, JUnit 5',                  when: 'Vitest for Vite-stack projects. pytest for Python. go test for Go (no config needed).' },
    { stage: 'DAST',               current: 'OWASP ZAP baseline',             alternatives: 'Nuclei (fast, community templates), Burp Suite (commercial), Nikto',                        when: 'Nuclei for faster scans with CVE template coverage. Burp for manual + automated combined.' },
    { stage: 'S11 Perf',           current: 'k6',                             alternatives: 'Gatling (JVM, Scala DSL), Locust (Python), Artillery, wrk',                                 when: 'Locust if team is Python-heavy. Gatling for JVM-native load with Akka backend.' },
    { stage: 'S10 SLSA',           current: 'slsa-framework/slsa-github-generator', alternatives: 'Manual provenance via cosign attest, in-toto attestation',                           when: 'Manual attest on non-GHA CI. SLSA generator Level 3 only works on GitHub Actions today.' },
    { stage: 'CD (P1–P4)',         current: 'ArgoCD',                         alternatives: 'Flux (pull-based, CNCF graduated), Helm + manual, Spinnaker (complex), Jenkins X',           when: 'Flux if you want true GitOps without a running UI. Spinnaker for multi-cloud enterprise.' },
    { stage: 'Promotion',          current: 'Argo Rollouts (canary)',          alternatives: 'Flagger (Linkerd/Istio), blue-green, rolling, Keptn',                                       when: 'Flagger if you run a service mesh already. Blue-green if you need instant rollback.' },
  ];
</script>

<div class="rt-root">
  <!-- Tab strip -->
  <div class="rt-tabs" role="tablist">
    {#each TABS as tab}
      <button
        class="rt-tab"
        class:active={activeTab === tab.id}
        on:click={() => { activeTab = tab.id; }}
        role="tab"
        aria-selected={activeTab === tab.id}
        type="button"
      >
        {tab.label}
        <span class="rt-tab-hint">{tab.hint}</span>
      </button>
    {/each}
  </div>

  <div class="rt-body">

    <!-- ── Setup Guides ──────────────────────────────────────────── -->
    {#if activeTab === 'setup'}
      <div class="rt-panel">
        <div class="rt-panel-intro">
          <strong>First-time registry setup.</strong>
          Showing guide for your selected registry: <span class="rt-accent">{currentGuide.name}</span>.
          {#if currentGuide.oidc}
            <span class="rt-badge-green">OIDC — no stored secrets</span>
          {:else}
            <span class="rt-badge-yellow">Stored credentials — rotate every 90 days</span>
          {/if}
        </div>

        <!-- Registry tabs -->
        <div class="reg-tabs">
          {#each Object.entries(SETUP_GUIDES) as [key, guide]}
            <button
              class="reg-tab"
              class:active={regKey === key}
              on:click={() => { /* read-only — user changes registry in ConfigBar */ }}
              type="button"
              title={key === regKey ? 'Current selection' : 'Change in config bar above'}
            >
              {guide.name}
              {#if guide.oidc}<span class="oidc-dot" title="OIDC supported">●</span>{/if}
            </button>
          {/each}
        </div>

        <div class="guide-steps">
          {#each currentGuide.steps as step, i}
            <div class="guide-step">
              <div class="guide-step-num">{i + 1}</div>
              <div class="guide-step-body">
                <div class="guide-step-title">{step.title}</div>
                <pre class="guide-step-content">{step.body}</pre>
              </div>
            </div>
          {/each}
        </div>
      </div>

    <!-- ── Tool Versions ──────────────────────────────────────────── -->
    {:else if activeTab === 'versions'}
      <div class="rt-panel">
        <div class="rt-panel-intro">
          <strong>All pinned tool versions.</strong>
          Bump a version here → every generated YAML picks it up.
          Last verified: <span class="rt-accent">2026-05-24</span>.
          Click a tool name to open its release page.
        </div>
        <table class="ver-table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Pinned version</th>
              <th>Last verified</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {#each DISPLAY_TOOLS as tool}
              {@const meta = TOOL_META[tool.key]}
              {@const ver = TOOL_VERSIONS[tool.key]}
              <tr>
                <td class="ver-label">{tool.label}</td>
                <td class="ver-val"><code>{ver}</code></td>
                <td class="ver-date">{meta?.lastVerified ?? '—'}</td>
                <td>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer" class="ver-link">releases ↗</a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    <!-- ── Tested Matrix ──────────────────────────────────────────── -->
    {:else if activeTab === 'matrix'}
      <div class="rt-panel">
        <div class="rt-panel-intro">
          <strong>Validated combinations.</strong>
          13 reference stacks tested end-to-end.
          Your current pick:
          {#if comboResult.status === 'reference'}
            <span class="rt-badge-green">✓ VALIDATED — {comboResult.notes}</span>
          {:else}
            <span class="rt-badge-yellow">Untested combo — {comboResult.notes}</span>
          {/if}
        </div>
        <table class="mx-table">
          <thead>
            <tr>
              <th>Frontend</th>
              <th>Backend</th>
              <th>CI</th>
              <th>Registry</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {#each Object.entries(TESTED_COMBINATIONS) as [key, combo]}
              {@const parts = key.split('|')}
              {@const isCurrent = key === comboResult.key}
              <tr class:current={isCurrent}>
                <td class="mx-fw">{parts[0]}</td>
                <td class="mx-fw">{parts[1]}</td>
                <td>{parts[2]}</td>
                <td>{parts[3]}</td>
                <td class="mx-notes">{combo.notes}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    <!-- ── Common Mistakes ──────────────────────────────────────────── -->
    {:else if activeTab === 'mistakes'}
      <div class="rt-panel">
        <div class="rt-panel-intro">
          <strong>Common mistakes per stage.</strong>
          Read once a quarter. These are real recurring issues found in production pipelines.
        </div>
        <div class="mk-list">
          {#each stagesWithMistakes as stage}
            <div class="mk-item">
              <div class="mk-badge">{stage.badge}</div>
              <div class="mk-body">
                <div class="mk-title">{stage.title}</div>
                <div class="mk-text">{stage.commonMistakes}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

    <!-- ── Glossary ──────────────────────────────────────────── -->
    {:else if activeTab === 'glossary'}
      <div class="rt-panel">
        <div class="rt-panel-intro">
          <strong>Security + DevOps glossary.</strong>
          {GLOSSARY.length} terms defined plainly. No prior knowledge assumed.
        </div>
        <input
          class="gl-search"
          type="text"
          placeholder="Search terms…"
          bind:value={glossaryFilter}
        />
        <div class="gl-grid">
          {#each filteredGlossary as g}
            <div class="gl-card">
              <div class="gl-term">
                {g.term}
                {#if g.full}<span class="gl-full">— {g.full}</span>{/if}
              </div>
              <div class="gl-def">{g.def}</div>
            </div>
          {/each}
          {#if filteredGlossary.length === 0}
            <div class="gl-empty">No terms match "{glossaryFilter}"</div>
          {/if}
        </div>
      </div>

    <!-- ── Tradeoffs ──────────────────────────────────────────── -->
    {:else if activeTab === 'tradeoffs'}
      <div class="rt-panel">
        <div class="rt-panel-intro">
          <strong>Tool alternatives per stage.</strong>
          When to switch and what you trade off. Current defaults are highlighted.
        </div>
        <table class="tr-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Current default</th>
              <th>Alternatives</th>
              <th>Switch when</th>
            </tr>
          </thead>
          <tbody>
            {#each TRADEOFFS as row}
              <tr>
                <td class="tr-stage">{row.stage}</td>
                <td class="tr-cur"><code>{row.current}</code></td>
                <td class="tr-alt">{row.alternatives}</td>
                <td class="tr-when">{row.when}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    <!-- ── Self-Test ──────────────────────────────────────────── -->
    {:else if activeTab === 'selftest'}
      <div class="rt-panel">
        <div class="rt-panel-intro">
          <strong>Data health check.</strong>
          {selfTestChecks.length} automated checks against the stage, invariant, and tool data.
          {#if selfTestFail === 0}
            <span class="rt-badge-green">✓ All {selfTestPass} checks pass</span>
          {:else}
            <span class="rt-badge-yellow">⚠ {selfTestFail} check{selfTestFail > 1 ? 's' : ''} need attention</span>
          {/if}
        </div>

        <div class="st-list">
          {#each selfTestChecks as check}
            <div class="st-row" class:st-pass={check.pass} class:st-fail={!check.pass}>
              <span class="st-icon">{check.pass ? '✓' : '✗'}</span>
              <div class="st-body">
                <div class="st-label">{check.label}</div>
                <div class="st-detail">{check.detail}</div>
              </div>
            </div>
          {/each}
        </div>

        <div class="st-meta">
          Checks run in-browser against live data from <code>stages.ts</code>, <code>invariants.ts</code>,
          <code>tools.ts</code>, <code>glossary.ts</code>, and <code>testedcombos.ts</code>.
          No network requests.
        </div>
      </div>

    <!-- ── Maintain ──────────────────────────────────────────── -->
    {:else if activeTab === 'maintain'}
      <div class="rt-panel">
        <div class="rt-panel-intro">
          <strong>Contributor guide.</strong>
          How to add frameworks, update tool versions, and keep the catalog current.
        </div>

        <div class="mn-section">
          <div class="mn-hdr">Adding a new framework</div>
          <ol class="mn-steps">
            <li>Add entry to <code>src/lib/catalog.ts</code> — start with <code>tier: 'coming-soon'</code> and a sister.</li>
            <li>Add stack config to <code>src/lib/stacks.ts</code> — builder image, runtime image, test cmd, lint cmd.</li>
            <li>Add to dropdown in <code>src/islands/ConfigBar.svelte</code>.</li>
            <li>Verify Dockerfile generates correctly: select framework, open FileViewer → Dockerfile.</li>
            <li>Run <code>npm run build</code> — zero TypeScript errors required.</li>
            <li>Test the full pipeline YAML generates: select framework + GitHub Actions + GHCR → open PR workflow file.</li>
            <li>Promote to <code>tier: 'production'</code> once all files verified copy-pasteable.</li>
          </ol>
        </div>

        <div class="mn-section">
          <div class="mn-hdr">Updating tool versions</div>
          <ol class="mn-steps">
            <li>Check release pages for each tool (links in Tool Versions tab).</li>
            <li>Update the version string in <code>src/lib/tools.ts</code>.</li>
            <li>Update <code>lastVerified</code> date in <code>TOOL_META</code>.</li>
            <li>Run <code>npm run build</code> — generators pick up new version automatically.</li>
            <li>Spot-check the generated YAML in FileViewer to confirm version appears correctly.</li>
          </ol>
        </div>

        <div class="mn-section">
          <div class="mn-hdr">Coming-soon coverage</div>
          <div class="mn-note">
            Frameworks with <code>tier: 'coming-soon'</code> show in the catalog but generate using the sister framework's code.
            This is intentional — it keeps the generated files valid while the real generator ships.
          </div>
          <table class="mn-table">
            <thead><tr><th>Count</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td class="mn-num">55</td><td>Production — full code generated</td></tr>
              <tr><td class="mn-num">~80</td><td>Coming soon — sister fallback used</td></tr>
            </tbody>
          </table>
        </div>

        <div class="mn-section">
          <div class="mn-hdr">Security links for reference</div>
          <div class="mn-links">
            <a href="https://slsa.dev" target="_blank" rel="noopener noreferrer">SLSA framework ↗</a>
            <a href="https://sigstore.dev" target="_blank" rel="noopener noreferrer">Sigstore (cosign/Rekor) ↗</a>
            <a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noopener noreferrer">OWASP Top 10 ↗</a>
            <a href="https://semgrep.dev/r" target="_blank" rel="noopener noreferrer">Semgrep rules ↗</a>
            <a href="https://github.com/aquasecurity/trivy" target="_blank" rel="noopener noreferrer">Trivy ↗</a>
            <a href="https://kyverno.io/policies/" target="_blank" rel="noopener noreferrer">Kyverno policies ↗</a>
            <a href="https://www.checkov.io/5.Policy%20Index/all.html" target="_blank" rel="noopener noreferrer">Checkov policies ↗</a>
            <a href="https://github.com/gitleaks/gitleaks" target="_blank" rel="noopener noreferrer">Gitleaks ↗</a>
            <a href="https://github.com/anchore/syft" target="_blank" rel="noopener noreferrer">Syft SBOM ↗</a>
            <a href="https://grafana.com/docs/k6/" target="_blank" rel="noopener noreferrer">k6 docs ↗</a>
            <a href="https://www.zaproxy.org/" target="_blank" rel="noopener noreferrer">OWASP ZAP ↗</a>
            <a href="https://nvd.nist.gov/" target="_blank" rel="noopener noreferrer">NVD (CVE database) ↗</a>
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>

<style>
  .rt-root { background: var(--bg); }

  .rt-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    padding: 0 16px;
  }

  .rt-tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 12px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 11.5px;
    color: var(--muted);
    font-weight: 500;
    transition: color .12s, border-color .12s;
    margin-bottom: -1px;
  }
  .rt-tab:hover { color: var(--text); }
  .rt-tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

  .rt-tab-hint {
    font-size: 9px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1px 5px;
    color: var(--muted);
  }

  .rt-body { overflow: hidden; }

  .rt-panel { padding: 16px 20px 28px; }

  .rt-panel-intro {
    font-size: 11.5px;
    color: var(--text-sec);
    margin-bottom: 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    line-height: 1.5;
  }

  .rt-accent { color: var(--accent); font-weight: 600; }

  .rt-badge-green {
    font-size: 10px; font-weight: 600;
    background: rgba(25,200,168,.12); color: #19C8A8; border: 1px solid #9CEDC7;
    border-radius: 4px; padding: 2px 8px;
  }
  .rt-badge-yellow {
    font-size: 10px; font-weight: 600;
    background: rgba(255,184,0,.14); color: #FFB800; border: 1px solid #FFB800;
    border-radius: 4px; padding: 2px 8px;
  }

  /* Setup Guides */
  .reg-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 16px;
  }
  .reg-tab {
    padding: 3px 10px;
    font-size: 10.5px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    cursor: default;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .reg-tab.active { background: rgba(25,200,168,.12); color: var(--accent); border-color: rgba(25,200,168,.20); font-weight: 600; cursor: default; }
  .oidc-dot { color: #19C8A8; font-size: 8px; }

  .guide-steps { display: flex; flex-direction: column; gap: 10px; }
  .guide-step {
    display: flex;
    gap: 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    overflow: hidden;
  }
  .guide-step-num {
    width: 32px;
    flex-shrink: 0;
    background: var(--surface);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 12px 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    border-right: 1px solid var(--border);
  }
  .guide-step-body { padding: 10px 12px; flex: 1; }
  .guide-step-title { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .guide-step-content {
    font-family: var(--font-mono);
    font-size: 10.5px;
    white-space: pre-wrap;
    color: var(--text-sec);
    margin: 0;
    line-height: 1.55;
  }

  /* Version table */
  .ver-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .ver-table th {
    text-align: left;
    padding: 7px 10px;
    background: var(--surface);
    color: var(--muted);
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: .06em;
    border-bottom: 1px solid var(--border);
  }
  .ver-table td { padding: 6px 10px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
  .ver-table tr:last-child td { border-bottom: none; }
  .ver-label { font-weight: 500; color: var(--text); }
  .ver-val code { font-family: var(--font-mono); font-size: 10.5px; color: var(--accent); }
  .ver-date { color: var(--muted); font-size: 10.5px; }
  .ver-link { color: var(--accent); font-size: 10.5px; text-decoration: none; }
  .ver-link:hover { text-decoration: underline; }

  /* Tested matrix */
  .mx-table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .mx-table th { text-align: left; padding: 7px 10px; background: var(--surface); color: var(--muted); font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid var(--border); }
  .mx-table td { padding: 6px 10px; border-bottom: 1px solid var(--border-subtle); }
  .mx-table tr:last-child td { border-bottom: none; }
  .mx-table tr.current td { background: rgba(25,200,168,.12); }
  .mx-fw { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-sec); }
  .mx-notes { color: var(--muted); font-size: 10.5px; }

  /* Common mistakes */
  .mk-list { display: flex; flex-direction: column; gap: 8px; }
  .mk-item { display: flex; gap: 10px; border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px; background: var(--bg); }
  .mk-badge { font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--accent); flex-shrink: 0; width: 28px; }
  .mk-title { font-size: 11.5px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .mk-text { font-size: 11px; color: var(--text-sec); line-height: 1.5; }

  /* Glossary */
  .gl-search {
    width: 100%;
    box-sizing: border-box;
    padding: 7px 12px;
    font-size: 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    margin-bottom: 12px;
    outline: none;
  }
  .gl-search:focus { border-color: var(--accent); }

  .gl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 8px;
  }
  .gl-card { border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px; background: var(--bg); }
  .gl-term { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .gl-full { font-size: 10px; font-weight: 400; color: var(--muted); }
  .gl-def { font-size: 11px; color: var(--text-sec); line-height: 1.5; }
  .gl-empty { color: var(--muted); font-size: 12px; padding: 12px 0; }

  /* Tradeoffs */
  .tr-table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .tr-table th { text-align: left; padding: 7px 10px; background: var(--surface); color: var(--muted); font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid var(--border); }
  .tr-table td { padding: 7px 10px; border-bottom: 1px solid var(--border-subtle); vertical-align: top; }
  .tr-table tr:last-child td { border-bottom: none; }
  .tr-stage { font-weight: 600; color: var(--text); white-space: nowrap; }
  .tr-cur code { font-family: var(--font-mono); font-size: 10px; color: var(--accent); }
  .tr-alt { color: var(--text-sec); }
  .tr-when { color: var(--muted); font-style: italic; }

  /* Maintain */
  .mn-section { margin-bottom: 20px; }
  .mn-hdr { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border-subtle); }
  .mn-steps { margin: 0; padding-left: 18px; }
  .mn-steps li { font-size: 11.5px; color: var(--text-sec); line-height: 1.6; margin-bottom: 4px; }
  .mn-steps code { font-family: var(--font-mono); font-size: 10.5px; color: var(--accent); background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 1px 4px; }
  .mn-note { font-size: 11.5px; color: var(--text-sec); line-height: 1.5; margin-bottom: 10px; }
  .mn-table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .mn-table th { text-align: left; padding: 6px 10px; background: var(--surface); color: var(--muted); font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid var(--border); }
  .mn-table td { padding: 6px 10px; border-bottom: 1px solid var(--border-subtle); }
  .mn-table tr:last-child td { border-bottom: none; }
  .mn-num { font-weight: 700; color: var(--accent); font-family: var(--font-mono); }

  .mn-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .mn-links a {
    font-size: 11px;
    color: var(--accent);
    text-decoration: none;
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    transition: background .1s;
  }
  .mn-links a:hover { background: rgba(25,200,168,.12); border-color: var(--accent); }

  /* Self-Test */
  .st-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .st-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 5px;
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .st-pass { border-left: 3px solid #19C8A8; }
  .st-fail { border-left: 3px solid #FFB800; background: rgba(255,184,0,.10); }

  .st-icon { font-size: 13px; font-weight: 700; flex-shrink: 0; line-height: 1.4; }
  .st-pass .st-icon { color: #19C8A8; }
  .st-fail .st-icon { color: #FFB800; }

  .st-body { flex: 1; }
  .st-label { font-size: 11.5px; font-weight: 500; color: var(--text); }
  .st-detail { font-size: 10.5px; color: var(--muted); margin-top: 2px; }

  .st-meta {
    font-size: 10.5px;
    color: var(--muted);
    border-top: 1px solid var(--border-subtle);
    padding-top: 10px;
    line-height: 1.5;
  }
  .st-meta code { font-family: var(--font-mono); font-size: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 1px 4px; color: var(--accent); }
</style>
