<script lang="ts">
  import { onMount } from 'svelte';
  import { config, resolvedConfig, resetConfig } from '../stores/config';
  import type { ComplianceKey } from '../lib/types';
  import { INDUSTRIES } from '../lib/industries';

  // Svelte 4 compiles <select value={expr}> as an HTML attribute, not a DOM property.
  // Browsers ignore the value attribute on selects — they rely on <option selected>.
  // We must imperatively set select.value after mount to reflect store state.
  // This matters for URL-param-driven initial state (initialConfig() in store).
  onMount(() => {
    const cfg = $config;
    const selectors: [string, string][] = [
      ['sel-frontend', cfg.feKey],
      ['sel-backend',  cfg.beKey],
      ['sel-ci',       cfg.ciKey],
      ['sel-reg',      cfg.regKey],
      ['sel-compliance',   cfg.compliance],
      ['sel-compliance-2', cfg.compliance2],
      ['sel-industry', cfg.industry],
      ['sel-pkgmgr',   cfg.pkgMgr],
    ];
    for (const [id, val] of selectors) {
      const el = document.getElementById(id) as HTMLSelectElement | null;
      if (el && val) el.value = val;
    }
  });

  let showAdvanced = false;

  // Track whether compliance was explicitly set by the user
  let complianceUserSet = false;

  // ── Incompatibility detection ───────────────────────────────────────────────
  // Reactive warnings for combinations that are valid but unusual or misleading.
  interface CompatWarning { id: string; msg: string; }

  $: isMobile = $config.feKey === 'mobile-expo' || $config.feKey === 'mobile';
  $: isEmptyStack = $config.feKey === 'none' && $config.beKey === 'none';
  $: isEphemeralReg = $config.regKey === 'ttlsh';
  $: isGhcrWithGitlab = $config.ciKey === 'gitlab-ci' && $config.regKey === 'ghcr';
  $: isAzdoWithGhcr = $config.ciKey === 'azdo' && $config.regKey === 'ghcr';

  $: compatWarnings = ((): CompatWarning[] => {
    const w: CompatWarning[] = [];
    if (isMobile) w.push({ id: 'mobile-reg', msg: 'Mobile apps ship to app stores, not container registries. Registry config is ignored.' });
    if (isEmptyStack) w.push({ id: 'empty-stack', msg: 'No frontend or backend selected — nothing to containerize.' });
    if (isEphemeralReg) w.push({ id: 'ttlsh', msg: 'ttl.sh images expire after 24 h — testing use only.' });
    if (isGhcrWithGitlab) w.push({ id: 'ghcr-gitlab', msg: 'GHCR with GitLab CI requires a GitHub PAT secret in GitLab CI/CD variables.' });
    if (isAzdoWithGhcr) w.push({ id: 'azdo-ghcr', msg: 'GHCR with Azure DevOps requires a GitHub PAT in ADO secret variables.' });
    return w;
  })();

  function handleIndustryChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    config.update(c => ({ ...c, industry: val }));

    if (!complianceUserSet && val !== 'none') {
      const ind = INDUSTRIES[val];
      if (ind?.suggestedCompliance) {
        config.update(c => ({ ...c, compliance: ind.suggestedCompliance as ComplianceKey }));
        if (ind.suggestedCompliance2) {
          config.update(c => ({ ...c, compliance2: ind.suggestedCompliance2 as ComplianceKey }));
        }
      }
    }
  }

  function handleComplianceChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value as ComplianceKey;
    complianceUserSet = true;
    config.update(c => ({ ...c, compliance: val }));
  }

  function handleFrontendChange(e: Event) {
    config.update(c => ({ ...c, feKey: (e.target as HTMLSelectElement).value }));
  }
  function handleBackendChange(e: Event) {
    config.update(c => ({ ...c, beKey: (e.target as HTMLSelectElement).value }));
  }
  function handleCiChange(e: Event) {
    config.update(c => ({ ...c, ciKey: (e.target as HTMLSelectElement).value }));
  }
  function handleRegChange(e: Event) {
    config.update(c => ({ ...c, regKey: (e.target as HTMLSelectElement).value }));
  }
  function handleCompliance2Change(e: Event) {
    config.update(c => ({ ...c, compliance2: (e.target as HTMLSelectElement).value as ComplianceKey }));
  }
  function handlePkgMgrChange(e: Event) {
    config.update(c => ({ ...c, pkgMgr: (e.target as HTMLSelectElement).value }));
  }
</script>

<div id="config-bar" class:show-advanced={showAdvanced}>
  <div class="cfg-grp">
    <label for="sel-frontend">Frontend</label>
    <select id="sel-frontend" value={$config.feKey} on:change={handleFrontendChange}>
      <optgroup label="React — SSR / Hybrid">
        <option value="nextjs">Next.js 15</option>
        <option value="remix">Remix 2</option>
      </optgroup>
      <optgroup label="React — CSR / SPA">
        <option value="react-vite">React + Vite</option>
        <option value="gatsby">Gatsby 5</option>
      </optgroup>
      <optgroup label="Vue">
        <option value="nuxt">Nuxt 3</option>
        <option value="vue-vite">Vue 3 + Vite</option>
      </optgroup>
      <optgroup label="Angular">
        <option value="angular">Angular 18</option>
      </optgroup>
      <optgroup label="Svelte">
        <option value="svelte">SvelteKit</option>
      </optgroup>
      <optgroup label="Solid">
        <option value="solid">SolidStart</option>
        <option value="solid-vite">Solid + Vite</option>
      </optgroup>
      <optgroup label="Qwik">
        <option value="qwik">Qwik City</option>
      </optgroup>
      <optgroup label="TanStack">
        <option value="tanstack">TanStack Start</option>
      </optgroup>
      <optgroup label="Meta / Islands">
        <option value="astro">Astro 4</option>
      </optgroup>
      <optgroup label="Mobile (no container)">
        <option value="mobile-expo">Expo (managed)</option>
        <option value="mobile">React Native (bare)</option>
      </optgroup>
      <option value="none">None (backend only)</option>
    </select>
  </div>

  <div class="cfg-grp">
    <label for="sel-backend">Backend</label>
    <select id="sel-backend" value={$config.beKey} on:change={handleBackendChange}>
      <option value="none">None (frontend only)</option>
      <optgroup label="Node.js">
        <option value="nodejs-express">Express</option>
        <option value="nodejs-fastify">Fastify</option>
        <option value="nodejs-nest">NestJS</option>
        <option value="nodejs-hono">Hono</option>
        <option value="nodejs-koa">Koa</option>
      </optgroup>
      <optgroup label="Python">
        <option value="python-fastapi">FastAPI</option>
        <option value="python-django">Django</option>
        <option value="python-flask">Flask</option>
        <option value="python-litestar">Litestar</option>
      </optgroup>
      <optgroup label="Go">
        <option value="go-gin">Go + gin</option>
        <option value="go-echo">Go + echo</option>
        <option value="go-chi">Go + chi</option>
        <option value="go-fiber">Go + fiber</option>
        <option value="go-stdlib">Go stdlib</option>
      </optgroup>
      <optgroup label="Java">
        <option value="java-spring">Spring Boot 3</option>
        <option value="java-quarkus">Quarkus</option>
        <option value="java-micronaut">Micronaut</option>
      </optgroup>
      <optgroup label="Kotlin">
        <option value="kotlin-ktor">Ktor</option>
      </optgroup>
      <optgroup label=".NET">
        <option value="dotnet-webapi">.NET Web API</option>
        <option value="dotnet-minimal">.NET Minimal API</option>
      </optgroup>
      <optgroup label="Rust">
        <option value="rust-axum">Axum</option>
        <option value="rust-actix">Actix-web</option>
        <option value="rust-rocket">Rocket</option>
        <option value="rust-warp">Warp</option>
      </optgroup>
      <optgroup label="Elixir">
        <option value="elixir-phoenix">Phoenix</option>
      </optgroup>
      <optgroup label="Ruby">
        <option value="ruby-rails">Rails 7</option>
        <option value="ruby-sinatra">Sinatra</option>
      </optgroup>
      <optgroup label="PHP">
        <option value="php-laravel">Laravel 11</option>
        <option value="php-symfony">Symfony 7</option>
        <option value="php-slim">Slim 4</option>
      </optgroup>
    </select>
  </div>

  <div class="cfg-grp cfg-grp-advanced" id="cfg-pkgmgr-grp">
    <label for="sel-pkgmgr">Pkg Mgr</label>
    <select id="sel-pkgmgr" value={$config.pkgMgr} on:change={handlePkgMgrChange}>
      <option value="npm">npm</option>
      <option value="pnpm">pnpm</option>
      <option value="yarn">yarn</option>
      <option value="bun">bun</option>
      <option value="pip">pip</option>
      <option value="poetry">poetry</option>
      <option value="uv">uv</option>
      <option value="gradle">gradle</option>
      <option value="maven">maven</option>
      <option value="cargo">cargo</option>
      <option value="go-mod">go mod</option>
    </select>
  </div>

  <div class="cfg-divider"></div>

  <div class="cfg-grp">
    <label for="sel-ci">CI System</label>
    <select id="sel-ci" value={$config.ciKey} on:change={handleCiChange}>
      <option value="github-actions">GitHub Actions</option>
      <option value="gitlab-ci">GitLab CI</option>
      <option value="jenkins">Jenkins</option>
      <option value="azdo">Azure DevOps</option>
      <option value="circleci">CircleCI</option>
      <option value="tekton">Tekton</option>
    </select>
  </div>

  <div class="cfg-grp" class:compat-muted={isMobile} title={isMobile ? 'Mobile apps use app stores, not container registries' : undefined}>
    <label for="sel-reg">Registry{isMobile ? ' ⚠' : ''}</label>
    <select id="sel-reg" value={$config.regKey} on:change={handleRegChange} disabled={isMobile} aria-disabled={isMobile}>
      <option value="ghcr">GHCR</option>
      <option value="ecr">ECR (AWS)</option>
      <option value="gar">GAR (GCP)</option>
      <option value="acr">ACR (Azure)</option>
      <option value="dockerhub">Docker Hub</option>
      <option value="jfrog">JFrog</option>
      <option value="harbor">Harbor</option>
      <option value="nexus">Nexus</option>
      <option value="quay">Quay.io</option>
      <option value="ttlsh">ttl.sh (ephemeral)</option>
    </select>
  </div>

  <div class="cfg-grp cfg-grp-advanced">
    <label for="sel-industry">Industry</label>
    <select id="sel-industry" value={$config.industry} on:change={handleIndustryChange}>
      <option value="none">General SaaS</option>
      <option value="fintech">Fintech / Payments</option>
      <option value="healthcare">Healthcare</option>
      <option value="government">Government</option>
      <option value="defense">Defense / Aerospace</option>
      <option value="retail">Retail / E-commerce</option>
      <option value="media">Media / Publishing</option>
      <option value="iot">IoT / Edge</option>
      <option value="education">Education / EdTech</option>
      <option value="energy">Energy / Utilities</option>
      <option value="ai">AI / ML Platforms</option>
    </select>
  </div>

  <div class="cfg-grp">
    <label for="sel-compliance">Compliance</label>
    <select id="sel-compliance" value={$config.compliance} on:change={handleComplianceChange}>
      <option value="none">None</option>
      <option value="pci">PCI-DSS v4.0</option>
      <option value="hipaa">HIPAA</option>
      <option value="fedramp">FedRAMP Moderate</option>
      <option value="soc2">SOC 2</option>
      <option value="gdpr">GDPR</option>
      <option value="canadapb">Canada Protected B</option>
      <option value="cmmc">CMMC Level 2</option>
      <option value="iso27001">ISO/IEC 27001</option>
      <option value="hitrust">HITRUST CSF</option>
      <option value="nistcsf">NIST CSF 2.0</option>
      <option value="ferpa">FERPA (Education)</option>
      <option value="nerccip">NERC CIP (Energy)</option>
    </select>
  </div>

  <div class="cfg-grp">
    <label for="sel-compliance-2" style="font-size:9px;color:var(--muted)">+ Add</label>
    <select id="sel-compliance-2" value={$config.compliance2} on:change={handleCompliance2Change}>
      <option value="none">—</option>
      <option value="pci">PCI-DSS v4.0</option>
      <option value="hipaa">HIPAA</option>
      <option value="fedramp">FedRAMP Moderate</option>
      <option value="soc2">SOC 2</option>
      <option value="gdpr">GDPR</option>
      <option value="iso27001">ISO/IEC 27001</option>
      <option value="cmmc">CMMC Level 2</option>
    </select>
  </div>

  <div class="cfg-divider cfg-grp-advanced"></div>

  <div class="cfg-grp cfg-grp-advanced">
    <label for="sel-mode">Mode</label>
    <select id="sel-mode">
      <option value="default">Default</option>
      <option value="learn">Learn</option>
      <option value="ship">Ship</option>
      <option value="audit">Audit</option>
    </select>
  </div>

  <button
    id="cfg-advanced-toggle"
    aria-label="Toggle advanced configuration options"
    aria-expanded={showAdvanced}
    on:click={() => { showAdvanced = !showAdvanced; }}
  >{showAdvanced ? '▾ Less' : '▸ More'}</button>

  <button
    aria-label="Reset all selections to defaults"
    title="Reset every dropdown + decision back to defaults. Use this to start fresh for a new service."
    on:click={resetConfig}
  >↺ Reset</button>

  <!-- Compat warnings strip -->
  {#if compatWarnings.length > 0}
    <div class="compat-bar" role="alert" aria-live="polite">
      {#each compatWarnings as w (w.id)}
        <span class="compat-chip">⚠ {w.msg}</span>
      {/each}
    </div>
  {/if}
</div>
