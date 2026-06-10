# Pipeline Studio v2 (Astro)

Migration target. Lives alongside the legacy `../index.html` until parity is
reached; nothing in the legacy app is touched.

## Stack

- **Astro 4** — static-first; emits a single `dist/index.html` so we keep the
  "drop on any static host" property of v1
- **Svelte 4** islands for the interactive zones (config bar, decision map,
  pipeline SVG, file viewer). Pure-static panels (invariants, glossary,
  catalog, compliance reference) ship zero JS
- **TypeScript** everywhere (strict) — kills the "two decision-node maps
  drift" class of bugs that plagued v1
- **Vitest** for generator snapshot tests — every emitted Dockerfile /
  workflow YAML / deploy manifest gets a fixture per stack

## Layout

```
src/
├── pages/index.astro             entry shell
├── layouts/Base.astro            site-wide chrome, head, scripts
├── components/                   .astro files (zero JS unless marked)
├── islands/                      .svelte files (hydrated, interactive)
├── lib/                          typed data layer (ported from v1 monolith)
├── generators/                   pure functions emit file contents
└── styles/                       tokens + component CSS

vendor/                           dropping ground for code copied from
                                  yarova.ca (responsive layout, theme, …)
```

## Status

- [x] Scaffold + dirs
- [x] package.json (Astro + Svelte + Vitest)
- [x] astro.config.mjs (static output)
- [x] tsconfig (strict + path aliases)
- [x] `lib/phases.ts` — `PHASE_DEFS` ported, typed; `STAGE_TO_PHASE_TAB`
      derived (no longer duplicated)
- [x] `lib/decisions.ts` — `DECISION_DEFS`, `DECISION_REQUIRED`,
      `DECISION_OPTIONAL`, `DECISION_AFFECTS_NODES` ported, typed
- [x] `lib/invariants.ts` — 20 invariants + `INVARIANT_DEPENDS_ON`
- [x] `lib/compliance.ts` — `COMPLIANCE_CONTROL_MAP` for 7 frameworks
- [x] `lib/types.ts` — shared `Stage`, `Decision`, `Invariant`, `Framework`,
      `ComplianceKey` types
- [ ] `lib/catalog.ts` — 102-framework catalog (port pending)
- [ ] `lib/industries.ts` — 11 industries with suggested compliance pairs
- [ ] `generators/dockerfile.ts` — port from v1 (8 backend langs)
- [ ] `generators/workflow.ts` — port from v1 (6 CI systems)
- [ ] `generators/deploy-kustomize.ts` — base + overlays + ArgoCD app
- [ ] `generators/deploy-helm.ts` — Chart + values + per-env values
- [ ] Layout / responsive — pending yarova.ca code drop into `vendor/`
- [ ] Components (Phase tabs, Config bar, Cluster prereqs, …)
- [ ] Islands (Config bar Svelte, Decision map, Pipeline SVG, Files viewer)
- [ ] Vitest snapshot tests for every generator × stack
- [ ] Parity sweep + cutover

## To unblock me (Claude in next session)

Drop these into `vendor/from-yarova/`:
- Base layout (header, footer, responsive container)
- Tailwind / token config (if used)
- Mobile nav pattern
- Any shared button/card components worth reusing
- Theme (light/dark? brand colors?)

Or paste them in chat — I'll wire them into `layouts/Base.astro` and the
component scaffold.

## Build / dev

```bash
cd studio-v2
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/index.html (single static asset)
npm run check    # astro check + tsc --noEmit
```
