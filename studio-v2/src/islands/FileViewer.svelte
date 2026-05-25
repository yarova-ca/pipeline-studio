<script lang="ts">
  import { derived } from 'svelte/store';
  import { resolvedConfig, activeFile } from '../stores/config';
  import { generateDockerfile } from '../generators/dockerfile';
  import { generatePRWorkflow, generateMainWorkflow } from '../generators/workflow';
  import { generateDeploy } from '../generators/deploy';
  import type { PipelineConfig } from '../lib/types';

  // Build the full file map from the current config
  const files = derived(resolvedConfig, ($rc) => {
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

    const map: Record<string, string> = {
      'Dockerfile': generateDockerfile(cfg),
      [ciFile]: generatePRWorkflow(cfg),
      [mainCiFile]: generateMainWorkflow(cfg),
      ...deployFiles,
    };

    return map;
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
</script>

<div class="files-grid">
  <!-- File list sidebar -->
  <div class="files-list">
    {#each Object.keys($files) as name}
      <button
        class="file-item"
        class:active={$activeFile === name}
        on:click={() => selectFile(name)}
        type="button"
      >{name}</button>
    {/each}
  </div>

  <!-- File content panel -->
  {#if $files[$activeFile] !== undefined}
    <div class="file-panel active">
      <div class="file-code-hdr">
        <span class="file-name">{$activeFile}</span>
        <button
          class="cwf-copy"
          class:done={copiedFile === $activeFile}
          on:click={() => copyFile($activeFile, $files[$activeFile] ?? '')}
          type="button"
        >{copiedFile === $activeFile ? '✓ Copied' : 'Copy'}</button>
      </div>
      <pre class="file-pre">{$files[$activeFile]}</pre>
    </div>
  {:else}
    <div class="file-panel active" style="padding:16px;color:var(--muted)">
      Select a file from the list.
    </div>
  {/if}
</div>
