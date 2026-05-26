<script lang="ts">
  import { derived } from 'svelte/store';
  import { resolvedConfig, activeFile } from '../stores/config';
  import { generateDockerfile } from '../generators/dockerfile';
  import { generatePRWorkflow, generateMainWorkflow } from '../generators/workflow';
  import { generateDeploy } from '../generators/deploy';
  import {
    generatePreCommitConfig,
    generateGitleaksConfig,
    generateTrivyIgnore,
    generateCheckovConfig,
    generateSbomPolicy,
  } from '../generators/hooks';
  import {
    generateDockerIgnore,
    generateBaseDeployment,
    generateBaseKustomization,
    generateOverlayKustomization,
  } from '../generators/kustomize';
  import { generateHelmValues } from '../generators/helm';
  import type { PipelineConfig } from '../lib/types';

  interface FileGroup {
    label: string;
    files: string[];
  }

  const filesMap = derived(resolvedConfig, ($rc) => {
    const cfg: PipelineConfig = {
      feKey: $rc.feKey,
      beKey: $rc.beKey,
      ciKey: $rc.ciKey,
      regKey: $rc.regKey,
      compliance: $rc.compliance,
      compliance2: $rc.compliance2,
      industry: $rc.industry,
      cd: $rc.cd,
      gitops: $rc.gitops,
      scanner: $rc.scanner,
      signing: $rc.signing,
      sbom: $rc.sbom,
      baseimage: $rc.baseimage,
      pkgMgr: $rc.pkgMgr,
      appName: $rc.appName,
      port: $rc.port,
      healthPath: $rc.healthPath,
    };

    const deployFiles = generateDeploy(cfg);
    const ciFile = $rc.ci.prFile ?? '.github/workflows/pr-checks.yml';
    const mainCiFile = $rc.ci.mainFile ?? '.github/workflows/main-pipeline.yml';
    const isMobile = $rc.feKey.includes('mobile') || $rc.feKey.includes('expo');

    const map: Record<string, string> = {
      // Group: CI Workflows
      [ciFile]: generatePRWorkflow(cfg),
      [mainCiFile]: generateMainWorkflow(cfg),

      // Group: Container
      'Dockerfile': generateDockerfile(cfg),
      '.dockerignore': generateDockerIgnore(cfg),

      // Group: Local dev hooks
      '.pre-commit-config.yaml': generatePreCommitConfig(cfg),
      '.gitleaks.toml': generateGitleaksConfig(cfg),
      '.trivyignore': generateTrivyIgnore(cfg),
      '.checkov.yaml': generateCheckovConfig(cfg),

      // Group: Security policy
      'sbom-policy.yaml': generateSbomPolicy(cfg),

      ...deployFiles,
    };

    if (!isMobile) {
      // Group: Kustomize deploy tree
      Object.assign(map, {
        'deploy/base/deployment.yaml': generateBaseDeployment(cfg),
        'deploy/base/kustomization.yaml': generateBaseKustomization(cfg),
        'deploy/overlays/dev/kustomization.yaml': generateOverlayKustomization(cfg, 'dev'),
        'deploy/overlays/test/kustomization.yaml': generateOverlayKustomization(cfg, 'test'),
        'deploy/overlays/staging/kustomization.yaml': generateOverlayKustomization(cfg, 'staging'),
        'deploy/overlays/prod/kustomization.yaml': generateOverlayKustomization(cfg, 'prod'),

        // Group: Helm chart (alternative to Kustomize)
        'deploy/charts/myapp/values-dev.yaml': generateHelmValues(cfg, 'dev'),
        'deploy/charts/myapp/values-staging.yaml': generateHelmValues(cfg, 'staging'),
        'deploy/charts/myapp/values-prod.yaml': generateHelmValues(cfg, 'prod'),
      });
    }

    return map;
  });

  // Build grouped file list for the sidebar
  const fileGroups = derived(resolvedConfig, ($rc) => {
    const isMobile = $rc.feKey.includes('mobile') || $rc.feKey.includes('expo');
    const ciFile = $rc.ci.prFile ?? '.github/workflows/pr-checks.yml';
    const mainCiFile = $rc.ci.mainFile ?? '.github/workflows/main-pipeline.yml';

    const groups: FileGroup[] = [
      {
        label: 'CI Workflows',
        files: [ciFile, mainCiFile],
      },
    ];

    if (!isMobile) {
      groups.push({ label: 'Container', files: ['Dockerfile', '.dockerignore'] });
    }

    groups.push({
      label: 'Local Dev Hooks',
      files: ['.pre-commit-config.yaml', '.gitleaks.toml', '.trivyignore', '.checkov.yaml'],
    });

    groups.push({ label: 'Security Policy', files: ['sbom-policy.yaml'] });

    if (!isMobile) {
      groups.push({
        label: 'Kustomize Deploy Tree',
        files: [
          'deploy/base/deployment.yaml',
          'deploy/base/kustomization.yaml',
          'deploy/overlays/dev/kustomization.yaml',
          'deploy/overlays/test/kustomization.yaml',
          'deploy/overlays/staging/kustomization.yaml',
          'deploy/overlays/prod/kustomization.yaml',
        ],
      });

      groups.push({
        label: 'Helm Chart (alternative)',
        files: [
          'deploy/charts/myapp/values-dev.yaml',
          'deploy/charts/myapp/values-staging.yaml',
          'deploy/charts/myapp/values-prod.yaml',
        ],
      });
    }

    return groups;
  });

  let copiedFile = '';

  async function copyFile(name: string, content: string) {
    await navigator.clipboard.writeText(content);
    copiedFile = name;
    setTimeout(() => { copiedFile = ''; }, 2000);
  }

  function selectFile(name: string) {
    activeFile.set(name);
  }

  // Auto-select first file on mount
  import { onMount } from 'svelte';
  onMount(() => {
    if (!$activeFile && $fileGroups.length > 0 && $fileGroups[0].files.length > 0) {
      activeFile.set($fileGroups[0].files[0]);
    }
  });

  function shortName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }
</script>

<div class="files-root">
  <!-- Sidebar: grouped file list -->
  <div class="files-list">
    {#each $fileGroups as group}
      <div class="file-group">
        <div class="file-group-hdr">{group.label}</div>
        {#each group.files as name}
          {#if $filesMap[name] !== undefined}
            <button
              class="file-item"
              class:active={$activeFile === name}
              on:click={() => selectFile(name)}
              type="button"
              title={name}
            >
              <span class="file-item-icon">
                {#if name.endsWith('.yaml') || name.endsWith('.yml')}⚙{:else if name === 'Dockerfile'}🐳{:else if name.endsWith('.toml') || name.endsWith('.yaml')}🔧{:else}📄{/if}
              </span>
              <span class="file-item-name">{shortName(name)}</span>
            </button>
          {/if}
        {/each}
      </div>
    {/each}
    <div class="file-count">
      {Object.keys($filesMap).length} files total — all copy-pasteable
    </div>
  </div>

  <!-- Content panel -->
  <div class="file-panel">
    {#if $filesMap[$activeFile] !== undefined}
      <div class="file-code-hdr">
        <span class="file-path">{$activeFile}</span>
        <button
          class="cwf-copy"
          class:done={copiedFile === $activeFile}
          on:click={() => copyFile($activeFile, $filesMap[$activeFile] ?? '')}
          type="button"
        >{copiedFile === $activeFile ? '✓ Copied' : 'Copy'}</button>
      </div>
      <pre class="file-pre">{$filesMap[$activeFile]}</pre>
    {:else}
      <div class="file-empty">Select a file from the list.</div>
    {/if}
  </div>
</div>

<style>
  .files-root {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 480px;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--bg);
  }

  .files-list {
    border-right: 1px solid var(--border);
    overflow-y: auto;
    max-height: 600px;
    background: var(--surface);
  }

  .file-group { margin-bottom: 2px; }

  .file-group-hdr {
    padding: 6px 10px 4px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--muted);
    background: var(--surface);
    border-top: 1px solid var(--border-subtle);
    margin-top: 4px;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    padding: 4px 10px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 11px;
    color: var(--text);
    transition: background .1s;
    border-radius: 0;
  }
  .file-item:hover { background: rgba(255,255,255,.06); }
  .file-item.active { background: rgba(9,105,218,.12); color: var(--accent); font-weight: 600; }

  .file-item-icon { font-size: 10px; flex-shrink: 0; opacity: .7; }
  .file-item-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .file-count {
    padding: 8px 10px;
    font-size: 9px;
    color: var(--muted);
    border-top: 1px solid var(--border-subtle);
    margin-top: 6px;
  }

  .file-panel { display: flex; flex-direction: column; overflow: hidden; }

  .file-code-hdr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .file-path {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px;
    color: var(--text-sec);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cwf-copy {
    flex-shrink: 0;
    padding: 3px 10px;
    font-size: 10.5px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
    color: var(--text);
    transition: background .1s;
  }
  .cwf-copy:hover { background: var(--surface); }
  .cwf-copy.done { background: #ebfbee; border-color: #2da44e; color: #1a7f37; }

  .file-pre {
    flex: 1;
    overflow: auto;
    margin: 0;
    padding: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    line-height: 1.55;
    color: var(--text);
    background: var(--bg);
    white-space: pre;
    tab-size: 2;
  }

  .file-empty {
    padding: 24px;
    color: var(--muted);
    font-size: 12px;
  }
</style>
