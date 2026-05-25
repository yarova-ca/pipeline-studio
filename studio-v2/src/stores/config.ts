// Svelte writable store — single source of truth for PipelineConfig.
// All islands read from and write to this store so state is shared across
// the config bar, pipeline view, file viewer, and decision map.
import { writable, derived } from 'svelte/store';
import type { PipelineConfig, ComplianceKey } from '../lib/types';
import { STACKS } from '../lib/stacks';
import { REGS } from '../lib/registry';
import { CI_SYSTEMS } from '../lib/ci';
import { PKG_MANAGERS } from '../lib/pkgmanager';

export const DEFAULT_CONFIG: PipelineConfig = {
  feKey: 'nextjs',
  beKey: 'none',
  ciKey: 'github-actions',
  regKey: 'ghcr',
  compliance: 'none',
  compliance2: 'none',
  industry: 'none',
  cd: 'argocd',
  gitops: 'same-repo',
  scanner: 'trivy',
  signing: 'cosign',
  sbom: 'syft',
  baseimage: 'distroless',
  pkgMgr: 'npm',
  appName: 'myapp',
  port: '3000',
  healthPath: '/api/health',
};

// Read URL params at module load time (browser only).
// This runs before any island mounts, so the store is initialized correctly
// and Svelte's initial render reflects the URL state without a second pass.
function initialConfig(): PipelineConfig {
  const cfg = { ...DEFAULT_CONFIG };
  if (typeof window === 'undefined') return cfg;
  const p = new URLSearchParams(window.location.search);
  return {
    ...cfg,
    feKey:       p.get('fe')          ?? cfg.feKey,
    beKey:       p.get('be')          ?? cfg.beKey,
    ciKey:       p.get('ci')          ?? cfg.ciKey,
    regKey:      p.get('reg')         ?? cfg.regKey,
    compliance:  (p.get('compliance') ?? cfg.compliance)  as ComplianceKey,
    compliance2: (p.get('compliance2') ?? cfg.compliance2) as ComplianceKey,
    industry:    p.get('industry')    ?? cfg.industry,
    appName:     (() => { const n = p.get('appName'); return n && /^[a-z][a-z0-9-]{0,38}$/.test(n) ? n : cfg.appName; })(),
  };
}

export const config = writable<PipelineConfig>(initialConfig());

// Derived store: resolved stack objects for the current config.
// Consumers import this to avoid repeating the lookup logic.
export const resolvedConfig = derived(config, ($cfg) => {
  const fe = STACKS.frontend[$cfg.feKey] ?? STACKS.frontend.nextjs;
  const be = STACKS.backend[$cfg.beKey]  ?? STACKS.backend.none;
  const reg = REGS[$cfg.regKey]           ?? REGS.ghcr;
  const ci  = CI_SYSTEMS[$cfg.ciKey]     ?? CI_SYSTEMS['github-actions'];
  const pm  = PKG_MANAGERS[$cfg.pkgMgr]  ?? PKG_MANAGERS.npm;

  const beGroup = ($cfg.beKey.includes('-') ? $cfg.beKey.split('-')[0] : $cfg.beKey).toLowerCase();
  const feGroup = ($cfg.feKey.includes('-') ? $cfg.feKey.split('-')[0] : (fe.group ?? $cfg.feKey)).toLowerCase();

  const testCmds = [fe.testCmd, be.testCmd].filter(Boolean) as string[];
  const lintCmds = [fe.lintCmd, be.lintCmd].filter(Boolean) as string[];
  const builderImage = be.builder ?? fe.builder ?? 'node:22-alpine';
  const runtimeImage = be.runtime ?? fe.runtime ?? 'gcr.io/distroless/nodejs22-debian12:nonroot';

  const baseimageOverrides: Record<string, Record<string, string>> = {
    alpine:     { nodejs: 'node:22-alpine', python: 'python:3.12-alpine', go: 'gcr.io/distroless/static-debian12', java: 'eclipse-temurin:21-jre-alpine', rust: 'rust:1.87-alpine', dotnet: 'mcr.microsoft.com/dotnet/aspnet:8.0-alpine', ruby: 'ruby:3.3-alpine', php: 'php:8.3-alpine-fpm', default: 'alpine:3.20' },
    ubuntu:     { nodejs: 'node:22-slim',   python: 'python:3.12-slim',   go: 'ubuntu:24.04', java: 'eclipse-temurin:21-jre-jammy', rust: 'ubuntu:24.04', dotnet: 'mcr.microsoft.com/dotnet/aspnet:8.0', ruby: 'ruby:3.3-slim', php: 'php:8.3-fpm', default: 'ubuntu:24.04' },
    chainguard: { nodejs: 'cgr.dev/chainguard/node:latest', python: 'cgr.dev/chainguard/python:latest', go: 'cgr.dev/chainguard/static:latest', java: 'cgr.dev/chainguard/jre:latest', rust: 'cgr.dev/chainguard/rust:latest', dotnet: 'cgr.dev/chainguard/dotnet-runtime:latest', ruby: 'cgr.dev/chainguard/ruby:latest', php: 'cgr.dev/chainguard/php:latest', default: 'cgr.dev/chainguard/static:latest' },
    scratch:    { go: 'scratch', rust: 'scratch', default: 'scratch' },
    'rhel-ubi': { nodejs: 'registry.access.redhat.com/ubi9/nodejs-22', python: 'registry.access.redhat.com/ubi9/python-312', go: 'registry.access.redhat.com/ubi9-minimal', java: 'registry.access.redhat.com/ubi9/openjdk-21', rust: 'registry.access.redhat.com/ubi9-minimal', dotnet: 'registry.access.redhat.com/ubi9/dotnet-80-runtime', ruby: 'registry.access.redhat.com/ubi9/ruby-33', php: 'registry.access.redhat.com/ubi9/php-83', default: 'registry.access.redhat.com/ubi9-minimal' },
    distroless: {},
  };

  let effectiveRuntimeImage = runtimeImage;
  if ($cfg.baseimage !== 'distroless') {
    const overrides = baseimageOverrides[$cfg.baseimage] ?? {};
    effectiveRuntimeImage = overrides[beGroup] ?? overrides[feGroup] ?? overrides['default'] ?? runtimeImage;
  }

  return {
    ...$cfg,
    fe, be, reg, ci, pm,
    beGroup, feGroup,
    builderImage,
    runtimeImage: effectiveRuntimeImage,
    testCmds,
    lintCmds,
    testCmd:  testCmds.join(' && ') || 'npm test',
    lintCmd:  lintCmds.join(' && ') || 'npx biome check .',
    installCmd: pm.installCmd ?? 'npm ci --ignore-scripts',
    port:       be.port ?? fe.port ?? '3000',
    healthPath: be.healthPath ?? fe.healthPath ?? '/api/health',
    prFile:  ci.prFile,
    mainFile: ci.mainFile,
  };
});

// Active tab (which phase is shown in the phase strip)
export const activePhaseTab = writable<number>(2); // default: Phase 2 PR Gate

// Active stage for the SDP panel
export const activeStageName = writable<string | null>(null);

// Active file in the file viewer
export const activeFile = writable<string>('Dockerfile');

// Decision state — keys from DECISION_DEFS, values are user picks
export const decisionState = writable<Record<string, string>>({});

export function setDecision(key: string, value: string) {
  decisionState.update(s => ({ ...s, [key]: value }));
}

export function resetConfig() {
  config.set({ ...DEFAULT_CONFIG });
  decisionState.set({});
  activePhaseTab.set(2);
  activeStageName.set(null);
  activeFile.set('Dockerfile');
}

// Persist config to / restore from URL query params
export function applyUrlParams() {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams(window.location.search);
  config.update(c => ({
    ...c,
    feKey:       p.get('fe')    ?? c.feKey,
    beKey:       p.get('be')    ?? c.beKey,
    ciKey:       p.get('ci')    ?? c.ciKey,
    regKey:      p.get('reg')   ?? c.regKey,
    compliance:  (p.get('compliance')  ?? c.compliance)  as ComplianceKey,
    compliance2: (p.get('compliance2') ?? c.compliance2) as ComplianceKey,
    industry:    p.get('industry') ?? c.industry,
    appName:     (() => { const n = p.get('appName'); return n && /^[a-z][a-z0-9-]{0,38}$/.test(n) ? n : c.appName; })(),
  }));
}
