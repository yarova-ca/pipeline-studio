# Pipeline Studio — Master Blueprint

**What this is:** the complete platform knowledge, in one progression.
**How to read:** top to bottom. First every framework, front-end to back-end. Then each platform stage.

Frameworks: 106 · Categories: 30

---

# Part A — Frameworks (front-end → back-end)

## A.1 Frontend — SSR / Hybrid

6 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Next.js | 16.2.6 | ts, js | Production | TTFB p99: ~80ms warm / ~30ms edge (web.dev/ttfb) | Server exposed, no built-in auth, CSP manual |
| Remix | React Router 7 | ts, js | Production | TTFB p99: ~60ms warm / ~25ms edge (web.dev/ttfb) | Server exposed, web-standard fetch, no built-in auth |
| Nuxt | 4.4 | ts, js | Production | TTFB p99: ~80ms warm (web.dev/ttfb) | Server exposed, Nitro server, no built-in auth |
| SvelteKit | 2.57 | ts, js | Production | TTFB p99: ~50ms warm (web.dev/ttfb) | Server exposed, adapter-based, no built-in auth |
| Angular SSR | 20 | ts | Production | TTFB p99: ~90ms warm (web.dev/ttfb) | Strong DI system, CSP requires config, no built-in auth |
| Solid Start | 1.0 | ts, js | Production | TTFB p99: ~55ms warm | Server exposed, no built-in auth — fine-grained reactivity unusual attack model |

### Next.js

- **Version:** 16.2.6
- **License:** MIT
- **Maintained by:** Vercel
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Concurrent rendering via React Suspense + parallel RSC data fetch
- **Memory:** GC — V8. RSC payload + per-request state in server heap
- **Performance:** TTFB p99: ~80ms warm / ~30ms edge (web.dev/ttfb)
- **Bundle size:** ~80–120 kb
- **Rendering modes:** SSR, CSR, SSG, ISR — per-page
- **Hydration:** Full — RSC reduces client JS
- **Runtime target:** Node.js / Edge (Vercel, Cloudflare)
- **Scaling:** Horizontal
- **Ecosystem:** 6M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn, bun
- **Build tool:** Webpack / Turbopack
- **When to use:** React team, SEO, mixed static + dynamic
- **When NOT:** Pure static → Astro. Mobile → Expo
- **Trade-off:** vs Remix: bigger ecosystem, weaker form handling
- **Home:** https://nextjs.org

### Remix

- **Version:** React Router 7
- **License:** MIT
- **Maintained by:** Shopify
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Sequential loader per route — defer() for non-blocking secondary data
- **Memory:** GC — V8. Loader state per request — released after response
- **Performance:** TTFB p99: ~60ms warm / ~25ms edge (web.dev/ttfb)
- **Bundle size:** ~40–80 kb
- **Rendering modes:** SSR, CSR — route-level
- **Hydration:** Full
- **Runtime target:** Node.js / Edge (Cloudflare, Deno, Bun)
- **Scaling:** Horizontal
- **Ecosystem:** 600k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / esbuild
- **When to use:** Form-heavy apps, progressive enhancement
- **When NOT:** Complex data-fetching graphs → Next.js
- **Trade-off:** vs Next.js: simpler data model, smaller ecosystem
- **Home:** https://remix.run

### Nuxt

- **Version:** 4.4
- **License:** MIT
- **Maintained by:** NuxtLabs
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Sequential load() per route — ReadableStream for streaming
- **Memory:** GC — V8. Per-request server state in Nitro server heap
- **Performance:** TTFB p99: ~80ms warm (web.dev/ttfb)
- **Bundle size:** ~70–100 kb
- **Rendering modes:** SSR, CSR, SSG, ISR — per-page
- **Hydration:** Full — partial hydration via islands plugin
- **Runtime target:** Node.js / Edge (Cloudflare, Vercel)
- **Scaling:** Horizontal
- **Ecosystem:** 1.5M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn, bun
- **Build tool:** Vite / Rollup
- **When to use:** Vue team, full-stack Vue apps
- **When NOT:** React team → Next.js
- **Trade-off:** vs Next.js: Vue ecosystem, smaller community
- **Home:** https://nuxt.com

### SvelteKit

- **Version:** 2.57
- **License:** MIT
- **Maintained by:** Vercel
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Sequential load() per route — ReadableStream for streaming
- **Memory:** GC — V8. Per-request state — no virtual DOM overhead
- **Performance:** TTFB p99: ~50ms warm (web.dev/ttfb)
- **Bundle size:** ~20–50 kb
- **Rendering modes:** SSR, CSR, SSG — per-route
- **Hydration:** Full — minimal overhead, no virtual DOM
- **Runtime target:** Node.js / Edge (Cloudflare, Vercel, Deno)
- **Scaling:** Horizontal
- **Ecosystem:** 700k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / Rollup
- **When to use:** Smallest bundle, compile-time reactivity
- **When NOT:** Large React team → Next.js
- **Trade-off:** vs Next.js: smaller bundle, smaller community
- **Home:** https://kit.svelte.dev

### Angular SSR

- **Version:** 20
- **License:** MIT
- **Maintained by:** Google
- **Maturity:** Production
- **Concurrency:** Zone.js change detection — Signals (v17+) for fine-grained updates
- **Memory:** GC — V8. Zone.js patch tree + component tree in heap
- **Performance:** TTFB p99: ~90ms warm (web.dev/ttfb)
- **Bundle size:** ~80–120 kb
- **Rendering modes:** SSR, CSR — app-wide
- **Hydration:** Full — hydration improved in v17+
- **Runtime target:** Node.js only
- **Scaling:** Horizontal
- **Ecosystem:** 3M+ weekly npm downloads
- **Package manager:** npm
- **Build tool:** Angular CLI / esbuild
- **When to use:** Enterprise Java-background teams, strict structure
- **When NOT:** Small team, fast iteration → Next.js
- **Trade-off:** vs Next.js: more opinionated, heavier DX overhead
- **Home:** https://angular.dev

### Solid Start

- **Version:** 1.0
- **License:** MIT
- **Maintained by:** Community / Ryan Carniato
- **Maturity:** Production
- **Concurrency:** Single-thread async (V8) — fine-grained reactive graph, no virtual DOM diffing
- **Memory:** GC — V8. Per-request server state — fine-grained signals, lower heap than React hydration
- **Performance:** TTFB p99: ~55ms warm
- **Bundle size:** ~10–30 kb (no virtual DOM overhead)
- **Rendering modes:** SSR, CSR — route-level
- **Hydration:** Full (fine-grained reactive signals — not VDOM-based)
- **Runtime target:** Node.js / Edge (Netlify, Cloudflare)
- **Scaling:** Horizontal
- **Ecosystem:** 30k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite
- **When to use:** SolidJS team wanting SSR — max performance + React-like syntax
- **When NOT:** Large team expecting React ecosystem → Next.js
- **Trade-off:** vs Next.js: faster rendering via fine-grained signals, smaller ecosystem
- **Home:** https://start.solidjs.com

---

## A.2 Frontend — CSR / SPA

7 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| React | 19 | ts, js | Production | TTI p99: ~2s on 4G mid-range (bundle-dependent) | XSS via dangerouslySetInnerHTML, no built-in auth |
| Vue | 3.5 | ts, js | Production | TTI p99: ~1.5s on 4G mid-range | XSS if v-html misused, no built-in auth |
| Angular | 20 | ts | Production | TTI p99: ~3s on 4G (heavier initial bundle) | Strong DI, built-in sanitization, no built-in auth |
| Svelte | 5 | ts, js | Production | TTI p99: ~0.8s on 4G (smallest runtime) | XSS if {@html} misused, no virtual DOM attack surface |
| Solid.js | 2.0 | ts, js | Beta | TTI p99: ~0.6s on 4G | XSS if innerHTML misused, fine-grained reactivity model |
| Preact | 10.25 | ts, js | Production | TTI p99: ~0.8s on 4G (3 kB runtime vs React's 45 kB) | XSS via dangerouslySetInnerHTML (React-compatible API) — same risks as React |
| Lit | 3.2 | ts, js | Production | TTI p99: ~0.5s on 4G (6 kB runtime, native browser APIs) | Shadow DOM isolation per component — XSS contained within shadow root |

### React

- **Version:** 19
- **License:** MIT
- **Maintained by:** Meta
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Single render cycle — Concurrent Mode via useTransition / Suspense
- **Memory:** GC — V8. Virtual DOM fiber tree in browser heap
- **Performance:** TTI p99: ~2s on 4G mid-range (bundle-dependent)
- **Bundle size:** ~40–60 kb (React alone)
- **Rendering modes:** CSR only (add Next.js for SSR)
- **Hydration:** N/A — client-only
- **Runtime target:** Browser
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 20M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn, bun
- **Build tool:** Vite / CRA (deprecated)
- **When to use:** Rich UI, large team, React ecosystem
- **When NOT:** SEO-critical public site → SSR
- **Trade-off:** vs Vue: larger community, higher learning curve
- **Home:** https://react.dev

### Vue

- **Version:** 3.5
- **License:** MIT
- **Maintained by:** Evan You / Community
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Single-thread async (V8 event loop) — reactive proxy system
- **Memory:** GC — V8. Reactive proxy tree in browser heap
- **Performance:** TTI p99: ~1.5s on 4G mid-range
- **Bundle size:** ~30–50 kb
- **Rendering modes:** CSR only (add Nuxt for SSR)
- **Hydration:** N/A — client-only
- **Runtime target:** Browser
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 4M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / Rollup
- **When to use:** Gentler learning curve, progressive adoption
- **When NOT:** Large enterprise React team → React
- **Trade-off:** vs React: gentler DX, smaller job market
- **Home:** https://vuejs.org

### Angular

- **Version:** 20
- **License:** MIT
- **Maintained by:** Google
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Zone.js change detection — Signals (v17+) for fine-grained updates
- **Memory:** GC — V8. Zone.js patch tree + component tree in heap
- **Performance:** TTI p99: ~3s on 4G (heavier initial bundle)
- **Bundle size:** ~80–120 kb (esbuild reduces this)
- **Rendering modes:** CSR only (add Angular SSR)
- **Hydration:** N/A — client-only
- **Runtime target:** Browser
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 3M+ weekly npm downloads
- **Package manager:** npm
- **Build tool:** Angular CLI / esbuild
- **When to use:** Enterprise, Java-background teams, opinionated structure
- **When NOT:** Small team, fast prototyping → Vue / React
- **Trade-off:** vs React: more structured, heavier toolchain
- **Home:** https://angular.dev

### Svelte

- **Version:** 5
- **License:** MIT
- **Maintained by:** Vercel
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Compiler-based reactivity — no virtual DOM, no diffing
- **Memory:** GC — V8. No virtual DOM — compiled signals, lower heap use
- **Performance:** TTI p99: ~0.8s on 4G (smallest runtime)
- **Bundle size:** ~5–15 kb (no runtime overhead)
- **Rendering modes:** CSR only (add SvelteKit for SSR)
- **Hydration:** N/A — client-only
- **Runtime target:** Browser
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 700k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / Rollup
- **When to use:** Smallest bundle, compile-time reactivity, no runtime overhead
- **When NOT:** Large team expecting React patterns → React
- **Trade-off:** vs React: near-zero runtime, much smaller community
- **Home:** https://svelte.dev

### Solid.js

- **Version:** 2.0
- **License:** MIT
- **Maintained by:** Community / Ryan Carniato
- **Maturity:** Beta
- **Tier:** Tier 2
- **Concurrency:** Fine-grained reactive graph — no virtual DOM, no diffing
- **Memory:** GC — V8. Fine-grained reactive graph — no virtual DOM
- **Performance:** TTI p99: ~0.6s on 4G
- **Bundle size:** ~6–12 kb
- **Rendering modes:** CSR only (add SolidStart for SSR)
- **Hydration:** N/A — client-only
- **Runtime target:** Browser
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 80k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / esbuild
- **When to use:** Maximum runtime performance, React-like syntax
- **When NOT:** Large team, ecosystem maturity needed → React
- **Trade-off:** vs React: faster runtime, tiny ecosystem
- **Home:** https://solidjs.com

### Preact

- **Version:** 10.25
- **License:** MIT
- **Maintained by:** Jason Miller / Community
- **Maturity:** Production
- **Concurrency:** Single render cycle — preact/compat enables React Concurrent features via compatibility layer
- **Memory:** GC — V8. 3 kB virtual DOM — 20× smaller heap footprint than React's 45 kB runtime
- **Performance:** TTI p99: ~0.8s on 4G (3 kB runtime vs React's 45 kB)
- **Bundle size:** ~3 kb (framework) + app code
- **Rendering modes:** CSR only (add preact-iso or Fresh for SSR)
- **Hydration:** N/A — client-only
- **Runtime target:** Browser
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 2M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / esbuild
- **When to use:** Performance-critical apps, embedded widgets, mobile web, React migration path
- **When NOT:** Full React ecosystem (hooks libraries, tooling) needed → React
- **Trade-off:** vs React: 20× smaller runtime, React-compatible via compat layer
- **Home:** https://preactjs.com

### Lit

- **Version:** 3.2
- **License:** BSD-3-Clause
- **Maintained by:** Google
- **Maturity:** Production
- **Concurrency:** Single-thread async (V8) — native browser custom element lifecycle, no virtual DOM
- **Memory:** GC — V8. Native Web Component lifecycle — shadow DOM per component, minimal framework heap
- **Performance:** TTI p99: ~0.5s on 4G (6 kB runtime, native browser APIs)
- **Bundle size:** ~6 kb (framework) + component code
- **Rendering modes:** CSR (Web Components standard — @lit-labs/ssr for server-side)
- **Hydration:** N/A — native browser custom elements, no hydration step
- **Runtime target:** Browser (framework-agnostic — works in React, Vue, Angular, vanilla)
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 500k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / Rollup
- **When to use:** Shareable UI components across frameworks, design systems, micro-frontends
- **When NOT:** Single-framework team with React/Vue chosen → use that framework's component model
- **Trade-off:** vs React: native browser standard — components work in any framework or vanilla HTML
- **Home:** https://lit.dev

---

## A.3 Frontend — SSG

4 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Astro | 6.3 | ts, js | Production | TTFB: <10ms CDN static (web.dev/ttfb) | Zero JS by default, no attack surface at runtime |
| Eleventy | 3.0 | js | Production | TTFB: <10ms CDN static (web.dev/ttfb) | Zero JS by default |
| Hugo | 0.161 | go-templates | Production | TTFB: <10ms CDN static (web.dev/ttfb) | Zero JS by default, Go binary — no npm supply chain |
| Gatsby | 5.13 | ts, js | Production | TTFB: <10ms CDN static (web.dev/ttfb) | GraphQL layer, plugin ecosystem risks |

### Astro

- **Version:** 6.3
- **License:** MIT
- **Maintained by:** The Astro Technology Company
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Build-time only (Vite) — zero runtime concurrency model
- **Memory:** GC — V8 (build only). Zero runtime heap — static files served
- **Performance:** TTFB: <10ms CDN static (web.dev/ttfb)
- **Bundle size:** ~0 kb default (no JS shipped)
- **Rendering modes:** SSG primary — SSR available via adapter
- **Hydration:** Partial (islands) — JS only where needed
- **Runtime target:** Browser + Node/Edge for SSR mode
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 1M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / Rollup
- **When to use:** Content sites, docs, blogs — max performance
- **When NOT:** Highly dynamic data per user → SSR
- **Trade-off:** vs Next.js SSG: zero JS default, fewer integrations
- **Home:** https://astro.build

### Eleventy

- **Version:** 3.0
- **License:** MIT
- **Maintained by:** Community / Zach Leatherman
- **Maturity:** Production
- **Concurrency:** Build-time only (Node.js) — zero runtime concurrency model
- **Memory:** GC — V8 (build only). Zero runtime heap
- **Performance:** TTFB: <10ms CDN static (web.dev/ttfb)
- **Bundle size:** ~0 kb default
- **Rendering modes:** SSG only
- **Hydration:** None (no client JS by default)
- **Runtime target:** Browser (static files)
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 200k+ weekly npm downloads
- **Package manager:** npm, yarn
- **Build tool:** Node.js (no bundler required)
- **When to use:** Maximum control, any template language
- **When NOT:** React/Vue team → Astro
- **Trade-off:** vs Astro: simpler, no components model
- **Home:** https://www.11ty.dev

### Hugo

- **Version:** 0.161
- **License:** Apache 2.0
- **Maintained by:** Community
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Build-time only (Go binary) — zero runtime concurrency model
- **Memory:** Manual (Go — no GC at build). Go binary compiled, zero runtime heap
- **Performance:** TTFB: <10ms CDN static (web.dev/ttfb)
- **Bundle size:** ~0 kb default
- **Rendering modes:** SSG only
- **Hydration:** None
- **Runtime target:** Browser (static files)
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 70k+ GitHub stars
- **Package manager:** None (single binary)
- **Build tool:** Hugo CLI (built-in)
- **When to use:** Largest site (10k+ pages), fastest build time
- **When NOT:** JS team, component model needed → Astro
- **Trade-off:** vs Astro: 100× faster builds, no JS component ecosystem
- **Home:** https://gohugo.io

### Gatsby

- **Version:** 5.13
- **License:** MIT
- **Maintained by:** Netlify
- **Maturity:** Production
- **Concurrency:** Build-time only (V8 + GraphQL layer) — React hydration in browser
- **Memory:** GC — V8 (build only). React hydration in browser heap at runtime
- **Performance:** TTFB: <10ms CDN static (web.dev/ttfb)
- **Bundle size:** ~100–150 kb (React overhead)
- **Rendering modes:** SSG + partial hydration
- **Hydration:** Full (React hydration)
- **Runtime target:** Browser + Node.js at build
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 400k+ weekly npm downloads
- **Package manager:** npm, yarn
- **Build tool:** Webpack / Gatsby CLI
- **When to use:** React + GraphQL data layer, image optimization
- **When NOT:** No GraphQL need → Astro or Next.js SSG
- **Trade-off:** vs Astro: GraphQL data layer, slower builds
- **Home:** https://www.gatsbyjs.com

---

## A.4 Frontend — Islands Architecture

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Astro | 6.3 | ts, js | Production | TTFB: <10ms CDN static (web.dev/ttfb) | Per-island isolation, zero JS surfaces by default |
| Fresh | 2.3 | ts | Production | TTFB p99: ~50ms (Deno Deploy edge) (web.dev/ttfb) | No npm by default — smaller supply chain surface |

### Astro

- **Version:** 6.3
- **License:** MIT
- **Maintained by:** The Astro Technology Company
- **Maturity:** Production
- **Concurrency:** Build-time (Vite) + island-per-component lazy hydration — no shared runtime state
- **Memory:** GC — V8. Per-island heap only — static HTML areas have zero runtime overhead
- **Performance:** TTFB: <10ms CDN static (web.dev/ttfb)
- **Bundle size:** ~0 kb baseline + island size per island
- **Rendering modes:** SSG + SSR — islands per component
- **Hydration:** Partial — only island components hydrate
- **Runtime target:** Browser + Node / Edge
- **Scaling:** Horizontal (CDN)
- **Ecosystem:** 1M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / Rollup
- **When to use:** Content-heavy sites needing selective interactivity
- **When NOT:** Fully dynamic app → SvelteKit or Next.js
- **Trade-off:** vs Next.js: zero-JS baseline, islands only hydrate on demand
- **Home:** https://astro.build

### Fresh

- **Version:** 2.3
- **License:** MIT
- **Maintained by:** Deno
- **Maturity:** Production
- **Concurrency:** Single-thread async (Deno / V8) — island components hydrate independently
- **Memory:** GC — V8 (Deno). Preact component tree per island
- **Performance:** TTFB p99: ~50ms (Deno Deploy edge) (web.dev/ttfb)
- **Bundle size:** ~5–20 kb per island (Preact)
- **Rendering modes:** SSR — islands per component
- **Hydration:** Partial — only island components hydrate
- **Runtime target:** Deno / Deno Deploy (edge)
- **Scaling:** Horizontal (Deno Deploy)
- **Ecosystem:** 15k+ GitHub stars
- **Package manager:** Deno (no npm by default)
- **Build tool:** esbuild (built-in)
- **When to use:** Deno-native stack, edge-first, islands model
- **When NOT:** npm ecosystem needed → Astro
- **Trade-off:** vs Astro: Deno-native, smaller ecosystem
- **Home:** https://fresh.deno.dev

---

## A.5 Frontend — Resumability

1 framework in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Qwik | 2.0 | ts, js | Production | TTI p99: <100ms regardless of app size | Serialized closures — unusual attack model, no built-in auth |

### Qwik

- **Version:** 2.0
- **License:** MIT
- **Maintained by:** Builder.io
- **Maturity:** Production
- **Concurrency:** Single-thread async (V8) + lazy-loaded event handlers per component
- **Memory:** GC — V8. Serialized state in HTML — minimal JS heap at load, lazy loaded
- **Performance:** TTI p99: <100ms regardless of app size
- **Bundle size:** <1 kb initial (lazy loads on first interaction)
- **Rendering modes:** SSR (Qwik City) + CSR
- **Hydration:** Resumable — not hydration. <1 kb JS on load regardless of app size
- **Runtime target:** Node.js / Edge (Cloudflare, Vercel)
- **Scaling:** Horizontal
- **Ecosystem:** 90k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite
- **When to use:** Large apps where hydration cost is a performance bottleneck
- **When NOT:** Small app where hydration cost is negligible → React / Svelte
- **Trade-off:** vs Next.js: near-zero TTI, steep mental model shift
- **Home:** https://qwik.dev

---

## A.6 Frontend — Edge Rendering

3 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Next.js Edge Runtime | 16.2.6 | ts, js | Production | TTFB p99: ~30–60ms global (web.dev/ttfb) | Reduced attack surface (no Node.js), no fs/crypto |
| Hono | 4.7 | ts, js | Production | TTFB p99: ~20–40ms global (web.dev/ttfb) | Minimal surface — no framework magic, web-standard APIs only |
| Remix (Cloudflare) | React Router 7 | ts, js | Production | TTFB p99: ~30–60ms global (web.dev/ttfb) | Web-standard fetch, no Node.js leakage at edge |

### Next.js Edge Runtime

- **Version:** 16.2.6
- **License:** MIT
- **Maintained by:** Vercel
- **Maturity:** Production
- **Concurrency:** V8 Isolate — no shared memory between requests, event loop per isolate
- **Memory:** GC — V8 (128 MB limit). Per-isolate heap — no shared state
- **Performance:** TTFB p99: ~30–60ms global (web.dev/ttfb)
- **Bundle size:** ~80–120 kb
- **Rendering modes:** SSR (edge) — pages opt-in via export runtime='edge'
- **Hydration:** Full
- **Runtime target:** V8 Isolate (Vercel Edge, Cloudflare)
- **Scaling:** Horizontal (CDN global)
- **Ecosystem:** 6M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn, bun
- **Build tool:** Turbopack / Webpack
- **When to use:** Personalized pages needing global low latency
- **When NOT:** Node.js APIs needed → Node.js runtime
- **Trade-off:** vs Node.js runtime: 10× faster TTFB, 128 MB limit
- **Home:** https://nextjs.org

### Hono

- **Version:** 4.7
- **License:** MIT
- **Maintained by:** Community / Yusuke Wada
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** V8 Isolate (Cloudflare) or Single-thread async (Deno / Bun / Node)
- **Memory:** GC — V8. Near-zero framework heap — no class instantiation
- **Performance:** TTFB p99: ~20–40ms global (web.dev/ttfb)
- **Bundle size:** ~14 kb (framework only)
- **Rendering modes:** SSR — any template engine
- **Hydration:** None (HTML only) or full if JSX used
- **Runtime target:** Cloudflare Workers, Deno Deploy, Bun, Node.js
- **Scaling:** Horizontal (CDN global)
- **Ecosystem:** 600k+ weekly npm downloads
- **Package manager:** npm, pnpm
- **Build tool:** esbuild / Vite
- **When to use:** Ultra-light API or SSR at the edge
- **When NOT:** Full-stack app with complex routing → Next.js
- **Trade-off:** vs Next.js: lighter, multi-runtime, no React
- **Home:** https://hono.dev

### Remix (Cloudflare)

- **Version:** React Router 7
- **License:** MIT
- **Maintained by:** Shopify
- **Maturity:** Production
- **Concurrency:** V8 Isolate — web-standard fetch, no Node.js event loop
- **Memory:** GC — V8 (128 MB limit). Loader state per request
- **Performance:** TTFB p99: ~30–60ms global (web.dev/ttfb)
- **Bundle size:** ~40–80 kb
- **Rendering modes:** SSR — route-level
- **Hydration:** Full
- **Runtime target:** Cloudflare Workers
- **Scaling:** Horizontal (CDN global)
- **Ecosystem:** 600k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / esbuild
- **When to use:** Form-heavy apps needing global low latency
- **When NOT:** Node.js-specific packages needed → Node.js adapter
- **Trade-off:** vs Next.js edge: web-standard model, Cloudflare-native
- **Home:** https://remix.run

---

## A.7 Frontend — Streaming SSR

3 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Next.js App Router | 16.2.6 | ts, js | Production | TTFB first chunk: ~50ms (web.dev/ttfb) | Server components isolated, no client exposure of server code |
| Remix | React Router 7 | ts, js | Production | TTFB first chunk: ~40ms (web.dev/ttfb) | Web-standard response streaming |
| SvelteKit | 2.57 | ts, js | Production | TTFB first chunk: ~40ms (web.dev/ttfb) | No virtual DOM — smaller runtime attack surface |

### Next.js App Router

- **Version:** 16.2.6
- **License:** MIT
- **Maintained by:** Vercel
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Concurrent rendering via React Suspense + parallel RSC data fetch — streaming via ReadableStream
- **Memory:** GC — V8. React Suspense boundary state per request
- **Performance:** TTFB first chunk: ~50ms (web.dev/ttfb)
- **Bundle size:** ~80–120 kb
- **Rendering modes:** SSR streaming — Suspense boundaries define chunks
- **Hydration:** Full — RSC reduces hydration payload
- **Runtime target:** Node.js / Edge
- **Scaling:** Horizontal
- **Ecosystem:** 6M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn, bun
- **Build tool:** Turbopack / Webpack
- **When to use:** Large pages where some sections load slower than others
- **When NOT:** Simple page → SSG
- **Trade-off:** vs Pages Router: streaming + RSC, steeper migration
- **Home:** https://nextjs.org

### Remix

- **Version:** React Router 7
- **License:** MIT
- **Maintained by:** Shopify
- **Maturity:** Production
- **Concurrency:** Sequential loader per route — defer() wraps slow loaders for streaming
- **Memory:** GC — V8. Loader state — deferred promises released after response
- **Performance:** TTFB first chunk: ~40ms (web.dev/ttfb)
- **Bundle size:** ~40–80 kb
- **Rendering modes:** SSR streaming — defer() wraps slow loaders
- **Hydration:** Full
- **Runtime target:** Node.js / Edge / Deno / Bun
- **Scaling:** Horizontal
- **Ecosystem:** 600k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / esbuild
- **When to use:** Deferred non-critical data, fast initial render
- **When NOT:** Simple page → SSG
- **Trade-off:** vs Next.js: simpler defer model, smaller ecosystem
- **Home:** https://remix.run

### SvelteKit

- **Version:** 2.57
- **License:** MIT
- **Maintained by:** Vercel
- **Maturity:** Production
- **Concurrency:** Single-thread async + ReadableStream — streaming via native Node.js stream
- **Memory:** GC — V8. No virtual DOM — streaming state released per chunk
- **Performance:** TTFB first chunk: ~40ms (web.dev/ttfb)
- **Bundle size:** ~20–50 kb
- **Rendering modes:** SSR streaming — ReadableStream native
- **Hydration:** Full (no virtual DOM overhead)
- **Runtime target:** Node.js / Edge / Deno / Bun
- **Scaling:** Horizontal
- **Ecosystem:** 700k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite / Rollup
- **When to use:** Smallest streamed bundle, Svelte ecosystem
- **When NOT:** React team → Next.js
- **Trade-off:** vs Next.js: smaller bundle, React incompatible
- **Home:** https://kit.svelte.dev

---

## A.8 Frontend — Micro-frontends

3 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Module Federation | Webpack 5 / Rspack | js, ts | Production | Depends on remote load — ~50–200ms overhead | Remote code injection risk — must validate remote origins |
| Single-spa | 6.0 | js, ts | Production | ~100–300ms orchestrator overhead | Shared global scope — XSS in one app affects all |
| Rspack (Module Fed. v2) | 1.x | js, ts | Production | 2–10× faster builds than Webpack 5 (Rust-based compiler — same runtime overhead as Webpack) | Remote code injection risk — same as Webpack Module Federation; must validate re |

### Module Federation

- **Version:** Webpack 5 / Rspack
- **License:** MIT
- **Maintained by:** Webpack team / ByteDance
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Browser event loop per remote — each remote loads independently
- **Memory:** GC — V8. Each remote has own module heap — shared dependencies deduped
- **Performance:** Depends on remote load — ~50–200ms overhead
- **Bundle size:** Shell ~10 kb + each remote independently
- **Rendering modes:** CSR (primary) — SSR support in Webpack 5.84+
- **Hydration:** Full — each remote hydrates independently
- **Runtime target:** Browser
- **Scaling:** Horizontal (each remote independently)
- **Ecosystem:** Webpack: 20M+ weekly downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Webpack 5 / Rspack
- **When to use:** Multiple teams, independent deployments, shared dependencies
- **When NOT:** Single team, small app → monorepo SPA
- **Trade-off:** vs iframes: shared state possible, harder to isolate
- **Home:** https://webpack.js.org/concepts/module-federation

### Single-spa

- **Version:** 6.0
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Browser event loop — orchestrator pattern, single active app at a time
- **Memory:** GC — V8. Shared global scope — all apps share one browser heap
- **Performance:** ~100–300ms orchestrator overhead
- **Bundle size:** Orchestrator ~15 kb + each app independently
- **Rendering modes:** CSR — each app renders itself
- **Hydration:** Full — each app independently
- **Runtime target:** Browser
- **Scaling:** Horizontal (each app independently)
- **Ecosystem:** 100k+ weekly npm downloads
- **Package manager:** npm, yarn
- **Build tool:** Any bundler (framework-agnostic)
- **When to use:** Framework-agnostic composition (React + Vue + Angular together)
- **When NOT:** All apps same framework → Module Federation
- **Trade-off:** vs Module Federation: framework agnostic, more configuration
- **Home:** https://single-spa.js.org

### Rspack (Module Fed. v2)

- **Version:** 1.x
- **License:** MIT
- **Maintained by:** ByteDance
- **Maturity:** Production
- **Concurrency:** Browser event loop per remote — same composition model as Webpack 5 Module Federation
- **Memory:** GC — V8. Each remote has own module heap — shared dependencies deduped via Module Federation v2
- **Performance:** 2–10× faster builds than Webpack 5 (Rust-based compiler — same runtime overhead as Webpack)
- **Bundle size:** Shell ~10 kb + each remote independently (identical to Webpack 5 Module Federation)
- **Rendering modes:** CSR (primary) — SSR support via Module Federation v2 SSR mode
- **Hydration:** Full — each remote hydrates independently
- **Runtime target:** Browser
- **Scaling:** Horizontal (each remote deployed and scaled independently)
- **Ecosystem:** Rspack: 10k+ GitHub stars
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Rspack (Rust-based, Webpack-compatible CLI)
- **When to use:** Module Federation teams hitting slow Webpack 5 build times — Rspack is a drop-in replacement with 2–10× faster builds
- **When NOT:** Build speed not a bottleneck → stay on Webpack 5 Module Federation
- **Trade-off:** vs Webpack 5 Module Federation: identical runtime behavior and config API, 2–10× faster builds due to Rust implementation
- **Home:** https://rspack.dev

---

## A.9 Mobile — Cross-platform JS

3 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| React Native | 0.79 | ts, js | Production | ~60fps (new arch — JSI near-synchronous) | JS bridge — XSS not applicable, native module risks |
| Expo | 52 | ts, js | Production | ~60fps (React Native new arch) | Managed workflow limits native attack surface |
| Ionic | 8 | ts, js | Production | ~30–50fps (WebView overhead) | WebView — full web attack surface in a native shell |

### React Native

- **Version:** 0.79
- **License:** MIT
- **Maintained by:** Meta
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** JS thread + native UI thread — new arch: JSI near-synchronous bridge
- **Memory:** GC — Hermes (Meta's JS engine). Pre-compiled bytecode — faster startup than V8
- **Performance:** ~60fps (new arch — JSI near-synchronous)
- **Bundle size:** ~20–50 MB APK / IPA
- **Runtime target:** iOS / Android
- **Scaling:** Vertical (device constraints)
- **Ecosystem:** 700k+ weekly npm downloads
- **Package manager:** npm, yarn
- **Build tool:** Metro bundler
- **When to use:** React team targeting iOS + Android, large native module ecosystem
- **When NOT:** High-performance games or 3D → Flutter / Native
- **Trade-off:** vs Flutter: larger ecosystem, slower UI than Flutter
- **Home:** https://reactnative.dev

### Expo

- **Version:** 52
- **License:** MIT
- **Maintained by:** Expo
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** JS thread + native thread (React Native — same arch) — managed via Expo modules
- **Memory:** GC — Hermes. Same as React Native + Expo module heap
- **Performance:** ~60fps (React Native new arch)
- **Bundle size:** ~25–60 MB (includes Expo modules)
- **Runtime target:** iOS / Android / Web (Expo Web)
- **Scaling:** Vertical (device constraints)
- **Ecosystem:** 400k+ weekly npm downloads
- **Package manager:** npm, yarn
- **Build tool:** Metro + EAS Build
- **When to use:** React Native apps without Xcode/Android Studio setup
- **When NOT:** Deep native customization → bare React Native
- **Trade-off:** vs bare React Native: faster DX, less native control
- **Home:** https://expo.dev

### Ionic

- **Version:** 8
- **License:** MIT
- **Maintained by:** Ionic
- **Maturity:** Production
- **Concurrency:** Browser event loop (WebView) — JS-to-native bridge for Capacitor plugins
- **Memory:** GC — V8 (WebView). Full web stack heap in native shell
- **Performance:** ~30–50fps (WebView overhead)
- **Bundle size:** ~10–30 MB APK / IPA
- **Runtime target:** iOS / Android / PWA / Web
- **Scaling:** Vertical (device constraints)
- **Ecosystem:** 200k+ weekly npm downloads
- **Package manager:** npm, yarn
- **Build tool:** Vite / Angular CLI
- **When to use:** Web team, web-only UI components, Capacitor plugins
- **When NOT:** Native performance critical → React Native / Flutter
- **Trade-off:** vs React Native: web-native, lower performance ceiling
- **Home:** https://ionicframework.com

---

## A.10 Mobile — Cross-platform non-JS

3 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Flutter | 3.44 | dart | Production | ~120fps (Impeller renderer — GPU direct on supported hardware) | No WebView — smaller attack surface, custom renderer |
| .NET MAUI | 10 | csharp | Production | ~60fps native controls | .NET runtime, no WebView, native controls |
| Kotlin Multiplatform | 2.1 | kotlin | Production | Native speed on each platform | Kotlin Native on iOS — smaller attack surface than JVM |

### Flutter

- **Version:** 3.44
- **License:** BSD-3
- **Maintained by:** Google
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Single-thread (Dart isolate) + isolates for background — Impeller GPU render thread
- **Memory:** GC — Dart VM. Generational GC per isolate — each isolate has own heap, no global pause
- **Performance:** ~120fps (Impeller renderer — GPU direct on supported hardware)
- **Bundle size:** ~15–30 MB (Dart + Flutter engine)
- **Runtime target:** iOS / Android / Web / Desktop
- **Scaling:** Vertical (device constraints)
- **Ecosystem:** 160k+ GitHub stars
- **Package manager:** pub (Dart)
- **Build tool:** Flutter CLI / Gradle / Xcode
- **When to use:** Pixel-perfect cross-platform UI, animations, games
- **When NOT:** JS team, web output primary → React Native + Expo
- **Trade-off:** vs React Native: faster/smoother UI, Dart is a new language
- **Home:** https://flutter.dev

### .NET MAUI

- **Version:** 10
- **License:** MIT
- **Maintained by:** Microsoft
- **Maturity:** Production
- **Concurrency:** Thread pool + async/await — native UI thread per platform
- **Memory:** GC — CLR (Mobile GC). Xamarin-derived mobile GC. Conservative collection
- **Performance:** ~60fps native controls
- **Bundle size:** ~20–40 MB (.NET runtime)
- **Runtime target:** iOS / Android / Windows / macOS
- **Scaling:** Vertical (device constraints)
- **Ecosystem:** 20k+ GitHub stars
- **Package manager:** NuGet
- **Build tool:** dotnet CLI / MSBuild
- **When to use:** .NET / C# team targeting iOS, Android, Windows, macOS
- **When NOT:** No .NET team → Flutter
- **Trade-off:** vs Flutter: C# ecosystem, lower UI flexibility
- **Home:** https://dotnet.microsoft.com/apps/maui

### Kotlin Multiplatform

- **Version:** 2.1
- **License:** Apache 2.0
- **Maintained by:** JetBrains
- **Maturity:** Production
- **Concurrency:** Coroutines — multiplatform. Native coroutine support on iOS and Android
- **Memory:** GC — JVM ART (Android) / experimental K/N GC (iOS). JVM ART: AOT compiled GC
- **Performance:** Native speed on each platform
- **Bundle size:** ~8–20 MB per platform
- **Runtime target:** iOS / Android / Desktop / Web (experimental)
- **Scaling:** Vertical (device constraints)
- **Ecosystem:** 50k+ GitHub stars
- **Package manager:** Gradle
- **Build tool:** Kotlin CLI / Gradle / Xcode
- **When to use:** Kotlin Android team adding iOS support, shared business logic
- **When NOT:** UI sharing needed → Flutter
- **Trade-off:** vs Flutter: shares logic not UI, Kotlin native on iOS
- **Home:** https://kotlinlang.org/docs/multiplatform.html

---

## A.11 Mobile — Native iOS

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Swift / SwiftUI | Swift 6 / SwiftUI 6 | swift | Production | 120fps ProMotion, Metal GPU direct | App Sandbox, keychain, biometrics, no WebView unless needed |
| Objective-C (UIKit) | Objective-C 2.0 | objective-c | Legacy | Native — same as Swift (Core Animation / Metal) | Same as Swift sandbox model |

### Swift / SwiftUI

- **Version:** Swift 6 / SwiftUI 6
- **License:** Apache 2.0
- **Maintained by:** Apple
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** GCD + Swift structured concurrency (async/await) — actors for shared mutable state
- **Memory:** ARC (Automatic Reference Counting). No GC pauses. Memory freed when last reference drops
- **Performance:** 120fps ProMotion, Metal GPU direct
- **Bundle size:** ~5–30 MB IPA (app-dependent, App Store thins per-device)
- **Runtime target:** iOS / iPadOS / macOS / watchOS / tvOS / visionOS
- **Scaling:** Vertical (device)
- **Ecosystem:** Swift: 65k+ GitHub stars
- **Package manager:** Swift Package Manager (SPM)
- **Build tool:** Xcode
- **When to use:** iOS-first product, full platform API access, latest iOS features
- **When NOT:** iOS + Android both needed → Flutter or React Native
- **Trade-off:** vs React Native: best iOS perf, iOS-only
- **Home:** https://developer.apple.com/swift

### Objective-C (UIKit)

- **Version:** Objective-C 2.0
- **License:** Proprietary
- **Maintained by:** Apple
- **Maturity:** Legacy
- **Concurrency:** GCD + NSOperationQueue — main thread for all UI, background queues for async work
- **Memory:** Manual (MRC) or ARC. ARC is standard since 2011 — same model as Swift
- **Performance:** Native — same as Swift (Core Animation / Metal)
- **Bundle size:** ~5–30 MB IPA (app-dependent)
- **Runtime target:** iOS / iPadOS / macOS
- **Scaling:** Vertical (device)
- **Ecosystem:** Legacy codebase (existing iOS apps)
- **Package manager:** CocoaPods / SPM
- **Build tool:** Xcode
- **When to use:** Maintaining existing Obj-C codebase
- **When NOT:** New iOS project → Swift
- **Trade-off:** vs Swift: no type safety, verbose syntax, no modern concurrency

---

## A.12 Mobile — Native Android

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Kotlin + Jetpack Compose | Kotlin 2.1 / Compose 1.8 | kotlin | Production | ~60–90fps (Material3 native — GPU-accelerated Skia) | App Sandbox, Keystore, biometrics |
| Java Android SDK | Java 17 (Android SDK 36) | java | Legacy | ~60fps native (XML layouts with HWUI) | Same Android sandbox model |

### Kotlin + Jetpack Compose

- **Version:** Kotlin 2.1 / Compose 1.8
- **License:** Apache 2.0
- **Maintained by:** Google / JetBrains
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Coroutines + Flow — main dispatcher for UI, IO/Default dispatchers for async
- **Memory:** GC — JVM ART. Android Runtime with AOT compilation — faster than Dalvik
- **Performance:** ~60–90fps (Material3 native — GPU-accelerated Skia)
- **Bundle size:** ~10–30 MB APK (split APK reduces this)
- **Runtime target:** Android
- **Scaling:** Vertical (device)
- **Ecosystem:** Compose: 20k+ GitHub stars
- **Package manager:** Gradle
- **Build tool:** Android Studio / Gradle
- **When to use:** Android-first product, Google ecosystem, modern UI
- **When NOT:** iOS + Android both needed → Flutter or React Native
- **Trade-off:** vs Flutter: native Android perf, Android-only
- **Home:** https://developer.android.com/compose

### Java Android SDK

- **Version:** Java 17 (Android SDK 36)
- **License:** Apache 2.0
- **Maintained by:** Google
- **Maturity:** Legacy
- **Concurrency:** Thread pool + Java executors — main thread for UI (AsyncTask deprecated)
- **Memory:** GC — JVM ART. Same ART runtime as Kotlin
- **Performance:** ~60fps native (XML layouts with HWUI)
- **Bundle size:** ~8–25 MB APK
- **Runtime target:** Android
- **Scaling:** Vertical (device)
- **Ecosystem:** Legacy (existing Java Android apps)
- **Package manager:** Gradle
- **Build tool:** Android Studio / Gradle
- **When to use:** Maintaining existing Java Android codebase
- **When NOT:** New Android project → Kotlin + Compose
- **Trade-off:** vs Kotlin: no null safety, verbose, no coroutines

---

## A.13 Mobile — PWA

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Workbox | 7.3 | js, ts | Production | Cache hit: <10ms TTFB from SW cache. Cache miss: network-dependent | HTTPS required, Service Worker scope isolation |
| Vite PWA Plugin | 0.21 | js, ts | Production | Same as Workbox — SW cache hit: <10ms, miss: network | HTTPS required |

### Workbox

- **Version:** 7.3
- **License:** MIT
- **Maintained by:** Google
- **Maturity:** Production
- **Concurrency:** Service Worker (browser background thread) — intercepts fetch, serves from cache
- **Memory:** GC — V8 (Service Worker). Isolated heap — SW failure does not crash the page
- **Performance:** Cache hit: <10ms TTFB from SW cache. Cache miss: network-dependent
- **Bundle size:** ~10 kb (Workbox runtime)
- **Hydration:** Depends on base framework
- **Runtime target:** Browser (installable on iOS Safari / Android Chrome)
- **Scaling:** Horizontal (CDN + cache)
- **Ecosystem:** 2M+ weekly npm downloads
- **Package manager:** npm, yarn
- **Build tool:** Webpack / Vite plugin
- **When to use:** Adding offline + caching to any existing web app
- **When NOT:** Deep native APIs (Bluetooth, NFC) → Native or Capacitor
- **Trade-off:** vs Capacitor: zero native code, limited native API access
- **Home:** https://developer.chrome.com/docs/workbox

### Vite PWA Plugin

- **Version:** 0.21
- **License:** MIT
- **Maintained by:** Community / antfu
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Service Worker (browser background thread) — Workbox underneath
- **Memory:** GC — V8. Same as Workbox — isolated SW heap
- **Performance:** Same as Workbox — SW cache hit: <10ms, miss: network
- **Bundle size:** ~5 kb (plugin wrapper; Workbox separately)
- **Hydration:** Same as underlying Vite app
- **Runtime target:** Browser (installable on iOS Safari / Android Chrome)
- **Scaling:** Horizontal (CDN + cache)
- **Ecosystem:** 1.5M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Vite
- **When to use:** Vite-based app needing PWA without manual Workbox config
- **When NOT:** Non-Vite build system → Workbox directly
- **Trade-off:** vs Workbox: zero-config PWA for Vite, less control
- **Home:** https://vite-pwa-org.netlify.app

---

## A.14 Backend — Node.js / Deno / Bun

7 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Express | 5.0 | js, ts | Production | p99: ~12ms at 256 conn (TechEmpower R22 JSON) | No built-in security — needs helmet.js, cors, rate-limit |
| Fastify | 5.2 | js, ts | Production | p99: ~4ms at 256 conn (TechEmpower R22 JSON) | Schema validation built-in (Ajv), helmet recommended |
| NestJS | 11.0 | ts | Production | p99: ~8ms (Fastify adapter) | Guards, interceptors, pipes — structured auth model |
| Hono | 4.7 | ts, js | Production | p99: ~3ms (Bun runtime) | Minimal surface — web-standard APIs only |
| Deno | 2.3 | ts, js | Production | p99: ~6ms (native HTTP) | Permissions model — deny-by-default filesystem, network, env access |
| Elysia | 1.2 | ts | Production | p99: ~1ms (Bun runtime, consistently fastest TS framework) | End-to-end type safety via Eden treaty — type errors at compile time |
| Bun (native) | 1.1 | ts, js | Production | p99: ~1ms (Bun.serve() — consistently fastest JS HTTP baseline) | Minimal surface — no middleware magic, Bun's built-in TLS support |

### Express

- **Version:** 5.0
- **License:** MIT
- **Maintained by:** OpenJS Foundation
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Single-thread event loop — middleware chain sequential per request
- **Memory:** GC — V8. Minimal — middleware chain, no framework heap overhead
- **Performance:** p99: ~12ms at 256 conn (TechEmpower R22 JSON)
- **Throughput:** ~30k req/s (TechEmpower R22 JSON)
- **Cold start:** ~300ms
- **Container size:** ~150 MB (node:alpine)
- **Thread model:** Single-thread event loop
- **Scaling:** Horizontal
- **Ecosystem:** 30M+ weekly npm downloads
- **Package manager:** npm, yarn, pnpm
- **Build tool:** Node.js (no bundler)
- **When to use:** Largest middleware ecosystem, maximum flexibility
- **When NOT:** High throughput → Fastify
- **Trade-off:** vs Fastify: 2× slower, larger middleware ecosystem
- **Home:** https://expressjs.com

### Fastify

- **Version:** 5.2
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Single-thread event loop — schema-validated async hook pipeline
- **Memory:** GC — V8. Schema cache (~5MB at boot). Request objects pooled
- **Performance:** p99: ~4ms at 256 conn (TechEmpower R22 JSON)
- **Throughput:** ~80k req/s (TechEmpower R22 JSON)
- **Cold start:** ~200ms
- **Container size:** ~150 MB (node:alpine)
- **Thread model:** Single-thread event loop
- **Scaling:** Horizontal
- **Ecosystem:** 2M+ weekly npm downloads
- **Package manager:** npm, yarn, pnpm
- **Build tool:** Node.js (no bundler)
- **When to use:** High throughput JSON APIs, schema-first design
- **When NOT:** Non-JSON protocols or Express plugins needed → Express
- **Trade-off:** vs Express: 2× faster, smaller middleware ecosystem
- **Home:** https://fastify.dev

### NestJS

- **Version:** 11.0
- **License:** MIT
- **Maintained by:** Kamil Mysliwiec
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** DI-scoped async handlers — request pipeline via guards + interceptors
- **Memory:** GC — V8. DI container + module graph held at boot (~30MB)
- **Performance:** p99: ~8ms (Fastify adapter)
- **Throughput:** ~40k req/s (Fastify adapter)
- **Cold start:** ~500ms (reflection overhead)
- **Container size:** ~180 MB
- **Thread model:** Single-thread event loop
- **Scaling:** Horizontal
- **Ecosystem:** 1.5M+ weekly npm downloads
- **Package manager:** npm, yarn, pnpm
- **Build tool:** Node.js / Webpack (swc)
- **When to use:** Enterprise, Angular-background team, opinionated structure
- **When NOT:** Simple API → Express or Fastify
- **Trade-off:** vs Express: structured DI + modules, heavier boilerplate
- **Home:** https://nestjs.com

### Hono

- **Version:** 4.7
- **License:** MIT
- **Maintained by:** Community / Yusuke Wada
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Multi-runtime async — same handler runs on Node / Deno / Bun / CF Workers
- **Memory:** GC — V8. Near-zero heap — no class instantiation
- **Performance:** p99: ~3ms (Bun runtime)
- **Throughput:** ~100k req/s (Bun) / ~80k (Node)
- **Cold start:** ~100ms (Bun) / ~200ms (Node)
- **Container size:** ~100 MB (Bun) / ~150 MB (Node)
- **Thread model:** Single-thread async (multi-runtime)
- **Scaling:** Horizontal
- **Ecosystem:** 600k+ weekly npm downloads
- **Package manager:** npm, pnpm
- **Build tool:** esbuild / Vite
- **When to use:** Edge + multi-runtime API (Node, Deno, Bun, Cloudflare)
- **When NOT:** Node.js-only middleware ecosystem needed → Fastify
- **Trade-off:** vs Fastify: multi-runtime, no Node.js-specific middleware
- **Home:** https://hono.dev

### Deno

- **Version:** 2.3
- **License:** MIT
- **Maintained by:** Deno Land
- **Maturity:** Production
- **Concurrency:** Single-thread async + Workers API for true parallelism
- **Memory:** GC — V8. Permissions state + module cache
- **Performance:** p99: ~6ms (native HTTP)
- **Throughput:** ~60k req/s (native HTTP)
- **Cold start:** ~150ms
- **Container size:** ~200 MB (deno:alpine)
- **Thread model:** Single-thread async + Workers for parallel
- **Scaling:** Horizontal
- **Ecosystem:** 90k+ GitHub stars
- **Package manager:** Deno (built-in)
- **Build tool:** esbuild (built-in)
- **When to use:** Security-first server, TypeScript without build step
- **When NOT:** npm-heavy codebase → Node.js
- **Trade-off:** vs Node.js: deny-by-default security, smaller npm compat
- **Home:** https://deno.com

### Elysia

- **Version:** 1.2
- **License:** MIT
- **Maintained by:** SaltyAom / Community
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Single-thread async — Bun runtime only, JavaScriptCore event loop
- **Memory:** GC — JavaScriptCore (Bun). Near-zero heap — value-based routing, no class overhead
- **Performance:** p99: ~1ms (Bun runtime, consistently fastest TS framework)
- **Throughput:** ~120k req/s (TechEmpower R22 JSON — Bun)
- **Cold start:** ~50ms (Bun cold start)
- **Container size:** ~100 MB (oven-sh/bun:alpine)
- **Thread model:** Single-thread async (Bun only — not Node/Deno compatible)
- **Scaling:** Horizontal
- **Ecosystem:** 30k+ GitHub stars
- **Package manager:** bun
- **Build tool:** Bun (no bundler)
- **When to use:** Maximum Bun throughput, end-to-end TypeScript type safety, Eden RPC
- **When NOT:** Non-Bun runtime required → Hono
- **Trade-off:** vs Hono: Bun-only, higher throughput, end-to-end type safety
- **Home:** https://elysiajs.com

### Bun (native)

- **Version:** 1.1
- **License:** MIT
- **Maintained by:** Oven
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Single-thread async — JavaScriptCore event loop (not V8), Bun.serve() built-in HTTP
- **Memory:** GC — JavaScriptCore (JSC). Near-zero framework heap — no middleware chain, no DI container
- **Performance:** p99: ~1ms (Bun.serve() — consistently fastest JS HTTP baseline)
- **Throughput:** ~130k req/s (raw Bun.serve() — no framework overhead)
- **Cold start:** ~30ms
- **Container size:** ~80 MB (oven-sh/bun:alpine)
- **Thread model:** Single-thread async (Bun / JavaScriptCore — not Node.js or Deno compatible)
- **Scaling:** Horizontal
- **Ecosystem:** 80k+ GitHub stars
- **Package manager:** bun
- **Build tool:** Bun (built-in bundler + runtime)
- **When to use:** Maximum raw Bun throughput, Bun-first teams, ultra-low latency APIs without framework overhead
- **When NOT:** npm ecosystem compatibility critical or multi-runtime required → Hono or Fastify
- **Trade-off:** vs Elysia: raw Bun.serve() — no framework overhead, no type safety layer — lower DX, higher throughput
- **Home:** https://bun.sh

---

## A.15 Backend — Python

4 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| FastAPI | 0.115 | python | Production | p99: ~18ms (uvicorn, async) | Automatic OpenAPI, Pydantic validation, no built-in auth |
| Django | 5.2 | python | Production | p99: ~80ms (sync) / ~30ms (async) | CSRF protection, SQL injection via ORM, security middleware built-in |
| Flask | 3.1 | python | Production | p99: ~45ms (gunicorn) | Minimal — no CSRF by default, needs Flask-Login, Flask-WTF |
| Starlette | 0.41 | python | Production | p99: ~12ms (uvicorn) | Minimal — FastAPI is built on top of this |

### FastAPI

- **Version:** 0.115
- **License:** MIT
- **Maintained by:** Sebastián Ramírez
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Async (asyncio / Starlette) — ASGI interface, supports WebSockets
- **Memory:** GC — CPython refcount + cycle collector. Pydantic model cache at boot
- **Performance:** p99: ~18ms (uvicorn, async)
- **Throughput:** ~20k req/s (uvicorn async)
- **Cold start:** ~500ms
- **Container size:** ~120 MB (python:alpine)
- **Thread model:** Async (asyncio) + multi-process via gunicorn
- **Scaling:** Horizontal
- **Ecosystem:** 15M+ weekly PyPI downloads
- **Package manager:** pip, uv, poetry
- **Build tool:** uvicorn / gunicorn
- **When to use:** ML/AI APIs, async Python, auto OpenAPI docs
- **When NOT:** CPU-bound processing → Go or Rust
- **Trade-off:** vs Django: async-first, lighter, no ORM built-in
- **Home:** https://fastapi.tiangolo.com

### Django

- **Version:** 5.2
- **License:** BSD-3
- **Maintained by:** Django Software Foundation
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Sync (WSGI) + async (ASGI) — both supported; ORM is sync-first
- **Memory:** GC — CPython. ORM + settings + URL resolver held in heap at boot
- **Performance:** p99: ~80ms (sync) / ~30ms (async)
- **Throughput:** ~5k (sync) / ~12k (async)
- **Cold start:** ~800ms (ORM boot)
- **Container size:** ~150 MB
- **Thread model:** Thread-per-request (sync) or async (ASGI)
- **Scaling:** Horizontal
- **Ecosystem:** 25M+ weekly PyPI downloads
- **Package manager:** pip, uv, poetry
- **Build tool:** gunicorn / daphne
- **When to use:** Full-stack web app, admin panel, ORM-heavy projects
- **When NOT:** Lightweight API → FastAPI
- **Trade-off:** vs FastAPI: batteries-included ORM + admin, slower async
- **Home:** https://djangoproject.com

### Flask

- **Version:** 3.1
- **License:** BSD-3
- **Maintained by:** Pallets
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Sync (WSGI) + async via Quart fork — explicit per-request context
- **Memory:** GC — CPython. Near-zero overhead — explicit per-request context
- **Performance:** p99: ~45ms (gunicorn)
- **Throughput:** ~8k req/s (gunicorn workers)
- **Cold start:** ~400ms
- **Container size:** ~100 MB
- **Thread model:** Thread-per-request (sync WSGI)
- **Scaling:** Horizontal
- **Ecosystem:** 25M+ weekly PyPI downloads
- **Package manager:** pip, uv, poetry
- **Build tool:** gunicorn
- **When to use:** Micro-services, simple APIs, teaching Python web dev
- **When NOT:** Async-first → FastAPI
- **Trade-off:** vs FastAPI: no async, no auto-docs, more control
- **Home:** https://flask.palletsprojects.com

### Starlette

- **Version:** 0.41
- **License:** BSD-3
- **Maintained by:** Encode
- **Maturity:** Production
- **Concurrency:** Async (asyncio) — ASGI interface. FastAPI is built on top of Starlette
- **Memory:** GC — CPython. Minimal — FastAPI is built on top of this
- **Performance:** p99: ~12ms (uvicorn)
- **Throughput:** ~25k req/s (uvicorn)
- **Cold start:** ~300ms
- **Container size:** ~100 MB
- **Thread model:** Async (asyncio)
- **Scaling:** Horizontal
- **Ecosystem:** 5M+ weekly PyPI downloads
- **Package manager:** pip, uv, poetry
- **Build tool:** uvicorn
- **When to use:** Raw ASGI performance, building frameworks on top of
- **When NOT:** Need auto-docs or validation → FastAPI
- **Trade-off:** vs FastAPI: lower-level, faster, no Pydantic
- **Home:** https://www.starlette.io

---

## A.16 Backend — Go

4 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Gin | 1.10 | go | Production | p99: ~3ms at 256 conn (TechEmpower R22 JSON) | No built-in auth — explicit middleware for CORS, auth |
| Echo | 4.12 | go | Production | p99: ~3ms at 256 conn | Same as Gin — explicit middleware |
| Fiber | 3.0 | go | Production | p99: ~1ms at 256 conn (TechEmpower R22 JSON) | Deviates from net/http — middleware compatibility issues |
| Chi | 5.2 | go | Production | p99: ~4ms at 256 conn | net/http compatible — all standard lib middleware works |

### Gin

- **Version:** 1.10
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Goroutine per request — M:N scheduler across all CPU cores
- **Memory:** GC — Go tri-color concurrent. Static binary ~10MB RSS per 1k goroutines
- **Performance:** p99: ~3ms at 256 conn (TechEmpower R22 JSON)
- **Throughput:** ~120k req/s (TechEmpower R22 JSON)
- **Cold start:** ~50ms
- **Container size:** ~10–15 MB (static Go binary)
- **Thread model:** Goroutines — M:N scheduling (OS threads backing goroutine pool)
- **Scaling:** Horizontal
- **Ecosystem:** 75k+ GitHub stars
- **Package manager:** go mod
- **Build tool:** go build
- **When to use:** High-throughput REST APIs, Go ecosystem, large community
- **When NOT:** Ultra-low latency → Fiber
- **Trade-off:** vs Echo: larger community, similar performance
- **Home:** https://github.com/gin-gonic/gin

### Echo

- **Version:** 4.12
- **License:** MIT
- **Maintained by:** LabStack
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Goroutine per request — M:N scheduler across all CPU cores
- **Memory:** GC — Go tri-color concurrent. Static binary ~10MB RSS per 1k goroutines
- **Performance:** p99: ~3ms at 256 conn
- **Throughput:** ~115k req/s
- **Cold start:** ~50ms
- **Container size:** ~10–15 MB
- **Thread model:** Goroutines — M:N scheduling
- **Scaling:** Horizontal
- **Ecosystem:** 28k+ GitHub stars
- **Package manager:** go mod
- **Build tool:** go build
- **When to use:** Cleaner API than Gin, middleware-first design
- **When NOT:** Need Gin's larger plugin ecosystem → Gin
- **Trade-off:** vs Gin: cleaner API, smaller community
- **Home:** https://echo.labstack.com

### Fiber

- **Version:** 3.0
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Goroutine per request — fasthttp (bypasses net/http, different pooling)
- **Memory:** GC — Go tri-color concurrent. fasthttp pools request objects — lower allocation rate
- **Performance:** p99: ~1ms at 256 conn (TechEmpower R22 JSON)
- **Throughput:** ~300k req/s (TechEmpower R22 JSON — fasthttp)
- **Cold start:** ~50ms
- **Container size:** ~10–15 MB
- **Thread model:** Goroutines + fasthttp (bypasses net/http)
- **Scaling:** Horizontal
- **Ecosystem:** 32k+ GitHub stars
- **Package manager:** go mod
- **Build tool:** go build
- **When to use:** Maximum Go HTTP throughput
- **When NOT:** net/http middleware compatibility needed → Gin or Echo
- **Trade-off:** vs Gin: 2× faster, incompatible with net/http middleware
- **Home:** https://gofiber.io

### Chi

- **Version:** 5.2
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Goroutine per request — net/http compatible, M:N scheduler
- **Memory:** GC — Go tri-color concurrent. Static binary — minimal overhead
- **Performance:** p99: ~4ms at 256 conn
- **Throughput:** ~100k req/s
- **Cold start:** ~50ms
- **Container size:** ~8–12 MB
- **Thread model:** Goroutines — M:N scheduling
- **Scaling:** Horizontal
- **Ecosystem:** 17k+ GitHub stars
- **Package manager:** go mod
- **Build tool:** go build
- **When to use:** Standard library compatibility, minimal abstraction over net/http
- **When NOT:** Need rich middleware ecosystem → Gin
- **Trade-off:** vs Gin: closer to stdlib, less opinionated router
- **Home:** https://github.com/go-chi/chi

---

## A.17 Backend — Java

3 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Spring Boot | 3.4 | java | Production | p99: ~8ms (MVC) / ~4ms (WebFlux) (TechEmpower R22 JSON) | Spring Security built-in, CSRF, OAuth2, mature ecosystem |
| Quarkus | 3.35.4 | java, kotlin | Production | p99: ~3ms (native) (TechEmpower R22 JSON) | GraalVM native eliminates reflection attack vectors |
| Micronaut | 5.0.0 | java, kotlin, groovy | Production | p99: ~4ms (native) | Compile-time DI — no reflection at runtime |

### Spring Boot

- **Version:** 3.4
- **License:** Apache 2.0
- **Maintained by:** VMware / Broadcom
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Thread pool (MVC, blocking) or Reactor event loop (WebFlux, reactive)
- **Memory:** GC — JVM G1GC / ZGC. IoC container ~200MB heap at boot
- **Performance:** p99: ~8ms (MVC) / ~4ms (WebFlux) (TechEmpower R22 JSON)
- **Throughput:** ~40k (MVC) / ~80k (WebFlux) req/s
- **Cold start:** 2–5s (JVM) / ~100ms (native image)
- **Container size:** ~180–250 MB (JRE) / ~80 MB (native)
- **Thread model:** Thread pool (MVC) or event loop (WebFlux / Netty)
- **Scaling:** Horizontal
- **Ecosystem:** Most downloaded Java framework (Maven Central)
- **Package manager:** Maven / Gradle
- **Build tool:** Maven / Gradle
- **When to use:** Enterprise Java, existing Spring ecosystem, security-critical apps
- **When NOT:** Low startup time → Quarkus native
- **Trade-off:** vs Quarkus: bigger ecosystem, slower startup
- **Home:** https://spring.io/projects/spring-boot

### Quarkus

- **Version:** 3.35.4
- **License:** Apache 2.0
- **Maintained by:** Red Hat
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Vert.x reactive event loop + worker thread pool for blocking ops
- **Memory:** GC — JVM or GraalVM native (no GC in native mode). Zero heap startup in native
- **Performance:** p99: ~3ms (native) (TechEmpower R22 JSON)
- **Throughput:** ~120k req/s (native)
- **Cold start:** ~10ms (native) / ~1s (JVM)
- **Container size:** ~50 MB (native) / ~200 MB (JVM)
- **Thread model:** Reactive (Vert.x event loop) + worker threads
- **Scaling:** Horizontal
- **Ecosystem:** 13k+ GitHub stars
- **Package manager:** Maven / Gradle
- **Build tool:** Quarkus CLI / Maven / Gradle
- **When to use:** Kubernetes-native, container-first, fast startup
- **When NOT:** Existing Spring team → Spring Boot
- **Trade-off:** vs Spring Boot: 10× faster startup native, smaller ecosystem
- **Home:** https://quarkus.io

### Micronaut

- **Version:** 5.0.0
- **License:** Apache 2.0
- **Maintained by:** Object Computing
- **Maturity:** Production
- **Concurrency:** Reactive (Netty) + async — compile-time DI, no reflection at runtime
- **Memory:** GC — JVM or GraalVM native. Compile-time DI — no reflection heap
- **Performance:** p99: ~4ms (native)
- **Throughput:** ~100k req/s
- **Cold start:** ~30ms (native) / ~500ms (JVM)
- **Container size:** ~60 MB (native) / ~200 MB (JVM)
- **Thread model:** Reactive (Netty event loop)
- **Scaling:** Horizontal
- **Ecosystem:** 6k+ GitHub stars
- **Package manager:** Maven / Gradle
- **Build tool:** Micronaut CLI / Maven / Gradle
- **When to use:** Compile-time DI, GraalVM native, low memory
- **When NOT:** Spring familiarity needed → Spring Boot
- **Trade-off:** vs Spring Boot: no reflection, compile-time AOP
- **Home:** https://micronaut.io

---

## A.18 Backend — Kotlin

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Ktor | 3.5.0 | kotlin | Production | p99: ~5ms (Netty engine) | Explicit plugin model — no magic, auth plugin required |
| Spring Boot (Kotlin) | 3.4 | kotlin | Production | p99: ~4ms (WebFlux + coroutines) | Spring Security, full mature security model |

### Ktor

- **Version:** 3.5.0
- **License:** Apache 2.0
- **Maintained by:** JetBrains
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Coroutine per request — Netty event loop underneath
- **Memory:** GC — JVM G1GC. Coroutine context objects per request
- **Performance:** p99: ~5ms (Netty engine)
- **Throughput:** ~80k req/s (Netty)
- **Cold start:** ~500ms (JVM)
- **Container size:** ~180–220 MB (JRE + app)
- **Thread model:** Coroutines + Netty event loop
- **Scaling:** Horizontal
- **Ecosystem:** 12k+ GitHub stars
- **Package manager:** Gradle
- **Build tool:** Gradle / IntelliJ IDEA
- **When to use:** Kotlin-first server, coroutines, JetBrains ecosystem
- **When NOT:** Spring familiarity needed → Spring Boot Kotlin
- **Trade-off:** vs Spring Boot: lightweight, Kotlin-idiomatic, smaller ecosystem
- **Home:** https://ktor.io

### Spring Boot (Kotlin)

- **Version:** 3.4
- **License:** Apache 2.0
- **Maintained by:** VMware / Broadcom
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Coroutines (WebFlux) + thread pool (MVC) — Spring coroutine support on WebFlux
- **Memory:** GC — JVM G1GC / ZGC. Spring DI container + coroutine context in heap
- **Performance:** p99: ~4ms (WebFlux + coroutines)
- **Throughput:** ~80k req/s (WebFlux)
- **Cold start:** 2–4s (JVM) / ~100ms (native)
- **Container size:** ~200–250 MB (JRE)
- **Thread model:** Coroutines (WebFlux) or thread pool (MVC)
- **Scaling:** Horizontal
- **Ecosystem:** Kotlin Spring: growing rapidly
- **Package manager:** Gradle
- **Build tool:** Gradle / Maven
- **When to use:** Existing Spring Java team migrating to Kotlin
- **When NOT:** New Kotlin project, no Spring baggage → Ktor
- **Trade-off:** vs Ktor: Spring ecosystem, more boilerplate
- **Home:** https://spring.io/projects/spring-boot

---

## A.19 Backend — .NET / C#

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| ASP.NET Core | 9 | csharp | Production | p99: ~1ms (TechEmpower R22 JSON) | Built-in auth, CSRF, HTTPS enforcement, security middleware |
| Minimal APIs (.NET 9) | 9 | csharp | Production | p99: ~1ms (same Kestrel base) | Same as ASP.NET Core — built on same runtime |

### ASP.NET Core

- **Version:** 9
- **License:** MIT
- **Maintained by:** Microsoft
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Async/await on Kestrel thread pool — I/O threads managed by CLR
- **Memory:** GC — CLR (Server GC). Server GC tuned for throughput over pause time
- **Performance:** p99: ~1ms (TechEmpower R22 JSON)
- **Throughput:** ~500k req/s (TechEmpower R22 JSON — Kestrel)
- **Cold start:** ~300ms (JIT) / ~80ms (native AOT)
- **Container size:** ~200 MB (JIT) / ~50 MB (native AOT)
- **Thread model:** Async/await on thread pool (Kestrel I/O threads)
- **Scaling:** Horizontal
- **Ecosystem:** NuGet: largest .NET package registry
- **Package manager:** NuGet / dotnet CLI
- **Build tool:** dotnet CLI / MSBuild
- **When to use:** .NET team, high-throughput APIs, Windows or Linux
- **When NOT:** No .NET team → Go or Node.js
- **Trade-off:** vs Go: comparable speed, larger enterprise ecosystem
- **Home:** https://dotnet.microsoft.com/apps/aspnet

### Minimal APIs (.NET 9)

- **Version:** 9
- **License:** MIT
- **Maintained by:** Microsoft
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Async/await on Kestrel thread pool — same as ASP.NET Core
- **Memory:** GC — CLR. Less startup code = slightly lower initial heap
- **Performance:** p99: ~1ms (same Kestrel base)
- **Throughput:** ~500k req/s (same Kestrel)
- **Cold start:** ~200ms (less startup code)
- **Container size:** ~180 MB (JIT) / ~45 MB (native AOT)
- **Thread model:** Async/await on thread pool
- **Scaling:** Horizontal
- **Ecosystem:** Same as ASP.NET Core
- **Package manager:** NuGet / dotnet CLI
- **Build tool:** dotnet CLI
- **When to use:** Simple APIs without MVC overhead, microservices
- **When NOT:** Complex routing, controllers, auth needed → ASP.NET Core MVC
- **Trade-off:** vs ASP.NET MVC: less boilerplate, less structure
- **Home:** https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis

---

## A.20 Backend — Rust

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Axum | 0.8 | rust | Production | p99: <1ms (TechEmpower R22 JSON) | Memory safety at compile time, no null, no buffer overflow |
| Actix-web | 4.9 | rust | Production | p99: <1ms (TechEmpower R22 JSON) | Same Rust memory safety guarantees |

### Axum

- **Version:** 0.8
- **License:** MIT
- **Maintained by:** Tokio team
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Tokio async executor — multi-thread, work-stealing scheduler
- **Memory:** Borrow checker — no GC. Zero heap allocation overhead. ~5MB RSS idle
- **Performance:** p99: <1ms (TechEmpower R22 JSON)
- **Throughput:** ~600k req/s (TechEmpower R22 JSON)
- **Cold start:** ~50ms
- **Container size:** ~8–20 MB (static Rust binary)
- **Thread model:** Async (Tokio — multi-thread executor)
- **Scaling:** Horizontal
- **Ecosystem:** 18k+ GitHub stars
- **Package manager:** Cargo
- **Build tool:** Cargo
- **When to use:** Maximum safety + performance, systems-level services
- **When NOT:** Rapid prototyping, team unfamiliar with Rust → Go
- **Trade-off:** vs Actix-web: Tokio-native, simpler type model
- **Home:** https://github.com/tokio-rs/axum

### Actix-web

- **Version:** 4.9
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Async (Actix actor system + Tokio) — actor-per-handler concurrency
- **Memory:** Borrow checker — no GC. Actix actor heap per actor instance
- **Performance:** p99: <1ms (TechEmpower R22 JSON)
- **Throughput:** ~700k req/s (TechEmpower R22 JSON — historically #1)
- **Cold start:** ~50ms
- **Container size:** ~8–20 MB (static Rust binary)
- **Thread model:** Async (Tokio + Actix actor system)
- **Scaling:** Horizontal
- **Ecosystem:** 21k+ GitHub stars
- **Package manager:** Cargo
- **Build tool:** Cargo
- **When to use:** Highest raw HTTP throughput needed
- **When NOT:** Simpler API preferred → Axum
- **Trade-off:** vs Axum: marginally faster, more complex type constraints
- **Home:** https://actix.rs

---

## A.21 Backend — Elixir

1 framework in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Phoenix | 1.7 | elixir | Production | p99: ~3ms HTTP (TechEmpower R22 JSON) | CSRF, XSS, SQL injection via Ecto, secure defaults |

### Phoenix

- **Version:** 1.7
- **License:** MIT
- **Maintained by:** Chris McCord
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Actor model — one BEAM process per connection, millions concurrent
- **Memory:** GC — per-process BEAM GC. Each BEAM process has isolated heap — no stop-the-world
- **Performance:** p99: ~3ms HTTP (TechEmpower R22 JSON)
- **Throughput:** ~150k req/s HTTP + 2M+ concurrent WebSocket
- **Cold start:** ~500ms (BEAM boot)
- **Container size:** ~120–160 MB (BEAM + OTP)
- **Thread model:** Actor model — millions of isolated BEAM processes, no shared state
- **Scaling:** Horizontal + Vertical
- **Ecosystem:** 20k+ GitHub stars
- **Package manager:** Mix / Hex
- **Build tool:** Mix
- **When to use:** Real-time apps, WebSockets, chat, IoT — massive concurrency
- **When NOT:** CPU-bound computation → Go or Rust
- **Trade-off:** vs Node.js: 10× more WebSocket connections, fault-tolerant
- **Home:** https://phoenixframework.org

---

## A.22 Backend — Ruby

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Rails | 8.0 | ruby | Production | p99: ~80ms (Puma 4 workers) | CSRF, XSS, SQL injection via ActiveRecord, strong defaults |
| Sinatra | 4.0 | ruby | Production | p99: ~50ms (Puma) | Minimal — no CSRF by default, explicit config |

### Rails

- **Version:** 8.0
- **License:** MIT
- **Maintained by:** DHH / Rails Core Team
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Thread-per-request (Puma) — GIL limits true CPU parallelism
- **Memory:** GC — MRI generational. Per-request object allocation reset via GC
- **Performance:** p99: ~80ms (Puma 4 workers)
- **Throughput:** ~5k req/s (Puma 4 workers)
- **Cold start:** ~1–2s (Rails eager loading)
- **Container size:** ~120–160 MB (ruby:alpine)
- **Thread model:** Thread-per-request — GIL limits CPU parallelism
- **Scaling:** Horizontal
- **Ecosystem:** Gems: 165k+ on rubygems.org
- **Package manager:** Bundler / gem
- **Build tool:** Bundler / rake
- **When to use:** Startup speed, convention over config, prototypes, SaaS
- **When NOT:** High throughput → Go or Node.js
- **Trade-off:** vs Sinatra: full-stack batteries, slower throughput
- **Home:** https://rubyonrails.org

### Sinatra

- **Version:** 4.0
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Thread-per-request (Puma) — GIL limits true CPU parallelism
- **Memory:** GC — MRI generational. Near-zero framework overhead vs Rails
- **Performance:** p99: ~50ms (Puma)
- **Throughput:** ~8k req/s
- **Cold start:** ~300ms
- **Container size:** ~100–130 MB
- **Thread model:** Thread-per-request — GIL limits CPU parallelism
- **Scaling:** Horizontal
- **Ecosystem:** 12k+ GitHub stars
- **Package manager:** Bundler / gem
- **Build tool:** Bundler / rake
- **When to use:** Simple APIs, microservices, Ruby team wanting minimal framework
- **When NOT:** Full-stack app → Rails
- **Trade-off:** vs Rails: lighter, higher req/s, no conventions
- **Home:** https://sinatrarb.com

---

## A.23 Backend — PHP

3 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Laravel | 12 | php | Production | p99: ~45ms (FPM) | CSRF, XSS, SQL injection via Eloquent ORM, strong defaults |
| Symfony | 7.2 | php | Production | p99: ~60ms (FPM) | CSRF, XSS, mature security component |
| Slim | 4.14 | php | Production | p99: ~20ms (FPM — minimal overhead) | Minimal — PSR-7 standard, explicit middleware only |

### Laravel

- **Version:** 12
- **License:** MIT
- **Maintained by:** Taylor Otwell
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Process-per-request (PHP-FPM) — no shared memory. Octane (Swoole / RoadRunner) for persistent process
- **Memory:** GC — PHP refcount + cycle. Per-request memory fully reset by FPM
- **Performance:** p99: ~45ms (FPM)
- **Throughput:** ~8k (FPM) / ~50k (Octane) req/s
- **Cold start:** ~400ms (FPM) / persistent (Octane)
- **Container size:** ~100–140 MB (php:alpine)
- **Thread model:** Process-per-request (FPM) — no threads
- **Scaling:** Horizontal
- **Ecosystem:** Packagist: 40M+ monthly downloads
- **Package manager:** Composer
- **Build tool:** Composer / artisan
- **When to use:** Full-stack PHP, large PHP community, rapid prototyping
- **When NOT:** High concurrent connections → Node.js or Go
- **Trade-off:** vs Symfony: faster DX, less flexibility
- **Home:** https://laravel.com

### Symfony

- **Version:** 7.2
- **License:** MIT
- **Maintained by:** SensioLabs
- **Maturity:** Production
- **Concurrency:** Process-per-request (PHP-FPM) — no shared memory between requests
- **Memory:** GC — PHP refcount + cycle collector. Per-request memory reset
- **Performance:** p99: ~60ms (FPM)
- **Throughput:** ~6k req/s (FPM)
- **Cold start:** ~500ms (heavier DI boot)
- **Container size:** ~120–150 MB
- **Thread model:** Process-per-request (FPM)
- **Scaling:** Horizontal
- **Ecosystem:** Packagist: 30M+ monthly downloads
- **Package manager:** Composer
- **Build tool:** Composer
- **When to use:** Enterprise PHP, component-based, Drupal/API Platform underneath
- **When NOT:** Speed of delivery primary → Laravel
- **Trade-off:** vs Laravel: more flexible, steeper learning curve
- **Home:** https://symfony.com

### Slim

- **Version:** 4.14
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Process-per-request (PHP-FPM) — minimal DI overhead
- **Memory:** GC — PHP refcount. Near-zero framework overhead — minimal boot
- **Performance:** p99: ~20ms (FPM — minimal overhead)
- **Throughput:** ~15k req/s (FPM)
- **Cold start:** ~100ms (minimal boot)
- **Container size:** ~80–100 MB
- **Thread model:** Process-per-request (FPM)
- **Scaling:** Horizontal
- **Ecosystem:** 5M+ monthly Packagist downloads
- **Package manager:** Composer
- **Build tool:** Composer
- **When to use:** Micro-APIs, PHP teams wanting minimal abstraction
- **When NOT:** Full-stack needs → Laravel
- **Trade-off:** vs Laravel: 2× faster, no conventions
- **Home:** https://slimframework.com

---

## A.24 Backend — Swift

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Vapor | 4.121.4 | swift | Production | p99: ~5ms | No built-in auth — Vapor-Auth plugin, Swift type safety |
| Hummingbird | 2.0 | swift | Production | p99: ~4ms | Minimal surface — explicit middleware only |

### Vapor

- **Version:** 4.121.4
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Swift structured concurrency (async/await + actors) + SwiftNIO event loop
- **Memory:** ARC (Automatic Reference Counting). No GC pauses. ~80MB RSS idle
- **Performance:** p99: ~5ms
- **Throughput:** ~80k req/s
- **Cold start:** ~100ms
- **Container size:** ~80–120 MB (Swift runtime)
- **Thread model:** Swift structured concurrency + SwiftNIO event loop
- **Scaling:** Horizontal
- **Ecosystem:** 23k+ GitHub stars
- **Package manager:** Swift Package Manager (SPM)
- **Build tool:** swift build
- **When to use:** iOS/macOS team extending to server, ARC memory model, no GC pauses
- **When NOT:** Non-Swift team → Node.js or Go
- **Trade-off:** vs Go: ARC vs GC, smaller ecosystem
- **Home:** https://vapor.codes

### Hummingbird

- **Version:** 2.0
- **License:** Apache 2.0
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Swift structured concurrency + SwiftNIO event loop — lighter than Vapor
- **Memory:** ARC. Minimal framework overhead vs Vapor
- **Performance:** p99: ~4ms
- **Throughput:** ~100k req/s
- **Cold start:** ~80ms
- **Container size:** ~70–100 MB
- **Thread model:** Swift structured concurrency + SwiftNIO event loop
- **Scaling:** Horizontal
- **Ecosystem:** 2k+ GitHub stars
- **Package manager:** SPM
- **Build tool:** swift build
- **When to use:** Higher throughput than Vapor, lighter dependencies
- **When NOT:** Rich plugin ecosystem needed → Vapor
- **Trade-off:** vs Vapor: faster, smaller ecosystem, newer
- **Home:** https://github.com/hummingbird-project/hummingbird

---

## A.25 Backend — Scala

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Play Framework | 3.0 | scala, java | Production | p99: ~6ms | CSRF, XSS protection, mature security helpers |
| http4s | 0.23 | scala | Production | p99: ~5ms | Purely functional — no shared mutable state |

### Play Framework

- **Version:** 3.0
- **License:** Apache 2.0
- **Maintained by:** Lightbend
- **Maturity:** Production
- **Concurrency:** Akka actor system + Netty event loop — reactive by default
- **Memory:** GC — JVM G1GC. Akka actor heap — actors hold state across requests
- **Performance:** p99: ~6ms
- **Throughput:** ~60k req/s
- **Cold start:** ~2s (JVM + Akka boot)
- **Container size:** ~220–280 MB (JRE + Akka)
- **Thread model:** Reactive (Akka actor system + Netty)
- **Scaling:** Horizontal
- **Ecosystem:** 12k+ GitHub stars
- **Package manager:** sbt
- **Build tool:** sbt
- **When to use:** Scala team, reactive web apps, Akka ecosystem
- **When NOT:** No Scala team → Spring Boot
- **Trade-off:** vs Spring Boot: reactive-first, Scala type system
- **Home:** https://www.playframework.com

### http4s

- **Version:** 0.23
- **License:** Apache 2.0
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Cats Effect fiber scheduler — purely functional green threads on JVM
- **Memory:** GC — JVM G1GC. Cats Effect fiber stack — purely functional allocation
- **Performance:** p99: ~5ms
- **Throughput:** ~80k req/s
- **Cold start:** ~1.5s (JVM)
- **Container size:** ~200–250 MB (JRE)
- **Thread model:** Cats Effect fiber-based async (green threads)
- **Scaling:** Horizontal
- **Ecosystem:** 2k+ GitHub stars
- **Package manager:** sbt / Scala CLI
- **Build tool:** sbt
- **When to use:** Pure functional Scala, Cats Effect ecosystem, type-safe HTTP
- **When NOT:** Team unfamiliar with FP → Play
- **Trade-off:** vs Play: pure FP, steeper learning curve
- **Home:** https://http4s.org

---

## A.26 Backend — Clojure

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Ring | 1.12 | clojure | Production | p99: ~8ms (http-kit async) | Minimal — explicit middleware model, Clojure immutability reduces state bugs |
| Pedestal | 0.7 | clojure | Production | p99: ~7ms | Interceptor chain — each step explicit, no hidden middleware magic |

### Ring

- **Version:** 1.12
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Thread pool (Jetty) or async (http-kit) — functional middleware composition
- **Memory:** GC — JVM G1GC. Clojure immutable data structures reduce GC pressure
- **Performance:** p99: ~8ms (http-kit async)
- **Throughput:** ~40k req/s (http-kit async)
- **Cold start:** ~2s (JVM + Clojure boot)
- **Container size:** ~200–250 MB (JRE)
- **Thread model:** Thread pool (Jetty) or async (http-kit)
- **Scaling:** Horizontal
- **Ecosystem:** 3k+ GitHub stars
- **Package manager:** Leiningen / deps.edn
- **Build tool:** Leiningen / deps.edn
- **When to use:** Clojure team, REPL-driven APIs, functional purity
- **When NOT:** No Clojure team → Go or Python
- **Trade-off:** vs Pedestal: simpler model, less structure
- **Home:** https://github.com/ring-clojure/ring

### Pedestal

- **Version:** 0.7
- **License:** Apache 2.0
- **Maintained by:** Community / Cognitect
- **Maturity:** Production
- **Concurrency:** Async interceptor chain — each step explicit, composable, testable
- **Memory:** GC — JVM G1GC. Interceptor context map allocated per request
- **Performance:** p99: ~7ms
- **Throughput:** ~50k req/s
- **Cold start:** ~2s (JVM)
- **Container size:** ~200–250 MB (JRE)
- **Thread model:** Async interceptor chain (Jetty / Tomcat)
- **Scaling:** Horizontal
- **Ecosystem:** 2k+ GitHub stars
- **Package manager:** deps.edn / Leiningen
- **Build tool:** deps.edn
- **When to use:** Interceptor-based architecture, async Clojure APIs
- **When NOT:** Simple API → Ring
- **Trade-off:** vs Ring: async interceptors, more structure
- **Home:** https://pedestal.io

---

## A.27 Backend — C++

2 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Drogon | 1.9.13 | cplusplus17 | Production | p99: <1ms (TechEmpower R22 JSON — consistently top 3) | No memory safety guarantees — manual management, buffer overflow risk |
| Crow | 1.3.2 | cplusplus14-17 | Production | p99: ~1ms | Same C++ manual memory risks |

### Drogon

- **Version:** 1.9.13
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Coroutines + multi-thread event loop (libuv-style)
- **Memory:** Manual — smart pointers (shared_ptr / unique_ptr). No GC — deterministic allocation
- **Performance:** p99: <1ms (TechEmpower R22 JSON — consistently top 3)
- **Throughput:** ~1.5M req/s (TechEmpower R22 JSON)
- **Cold start:** ~20ms
- **Container size:** ~5–15 MB (static binary)
- **Thread model:** Coroutines + multi-thread event loop
- **Scaling:** Horizontal
- **Ecosystem:** 10k+ GitHub stars
- **Package manager:** CMake / Conan / vcpkg
- **Build tool:** CMake
- **When to use:** Absolute maximum HTTP throughput, HFT, game server APIs
- **When NOT:** Rapid development team → Go or Rust
- **Trade-off:** vs Rust Axum: faster raw throughput, unsafe memory model
- **Home:** https://github.com/drogonframework/drogon

### Crow

- **Version:** 1.3.2
- **License:** BSD-3
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Multi-thread async (Boost.Asio thread pool)
- **Memory:** Manual — smart pointers. Header-only library — no separate build step
- **Performance:** p99: ~1ms
- **Throughput:** ~500k req/s
- **Cold start:** ~20ms
- **Container size:** ~5–10 MB (header-only)
- **Thread model:** Multi-thread async (Boost.Asio)
- **Scaling:** Horizontal
- **Ecosystem:** 9k+ GitHub stars
- **Package manager:** CMake / Conan
- **Build tool:** CMake
- **When to use:** Simpler C++ HTTP API than Drogon, header-only
- **When NOT:** Absolute maximum perf → Drogon
- **Trade-off:** vs Drogon: simpler API, 3× lower throughput
- **Home:** https://crowcpp.org

---

## A.28 Protocol — gRPC

11 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| grpc-go | 1.63 | go | Production | ~200k RPCs/s (unary, single process) | TLS 1.3 built-in, mTLS native, interceptor chain for auth and tracing |
| grpc-java | 1.63 | java | Production | ~150k RPCs/s (unary, Netty) | TLS via Netty SSL, mTLS, channel credentials, server interceptors |
| grpcio | 1.63 | python | Production | ~20k RPCs/s (GIL limits Python handler concurrency) | TLS via C-core (OpenSSL), mTLS, server interceptors |
| @grpc/grpc-js | 1.10 | js, ts | Production | ~30k RPCs/s | TLS via Node.js native tls module, mTLS channel credentials, call interceptors |
| grpc-dotnet | 2.62 | csharp | Production | ~120k RPCs/s | TLS via Kestrel, mTLS client certificates, ASP.NET Core auth middleware |
| tonic | 0.11 | rust | Production | ~250k RPCs/s | TLS via rustls (memory-safe, no OpenSSL CVE risk), mTLS, tower middleware interc |
| grpc-swift | 2.0 | swift | Production | ~100k RPCs/s | TLS via SwiftNIO SSL (BoringSSL), mTLS, interceptors |
| grpc-kotlin | 1.4 | kotlin | Production | ~120k RPCs/s | TLS via Netty SSL, mTLS channel credentials, coroutine-aware interceptors |
| connect-go | 0.5 | go | Production | ~180k RPCs/s | TLS via Go stdlib, mTLS, works with standard HTTP reverse proxies (no envoy requ |
| grpc-php | 1.63 | php | Production | ~10k RPCs/s (FPM worker pool limit) | TLS via OpenSSL (grpc C-core), mTLS supported |
| grpc-ruby | 1.63 | ruby | Production | ~15k RPCs/s (GIL limits Ruby handler concurrency; C-core handles I/O) | TLS via OpenSSL (grpc C-core), mTLS, server interceptors |

### grpc-go

- **Version:** 1.63
- **License:** Apache 2.0
- **Maintained by:** Google
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Goroutines — M:N green threads, HTTP/2 multiplexed streams per connection
- **Memory:** GC — Go. Per-stream goroutine stack (2 kB initial). Low GC pause — well-suited for long-lived streams
- **Throughput:** ~200k RPCs/s (unary, single process)
- **Cold start:** ~20ms
- **Container size:** ~15 MB (golang:alpine)
- **Thread model:** Goroutines (M:N green threads — auto-scales to all CPUs)
- **Scaling:** Horizontal (HTTP/2 — fewer connections than REST)
- **Ecosystem:** 20k+ GitHub stars
- **Package manager:** go mod
- **Build tool:** Go (buf or protoc for proto generation)
- **When to use:** Highest-performance Go microservices, service mesh, server + client streaming
- **When NOT:** Browser clients without grpc-web proxy → ConnectRPC or REST
- **Trade-off:** vs REST: 5–10× throughput, binary protocol — not human-readable, requires proto schema
- **Home:** https://pkg.go.dev/google.golang.org/grpc

### grpc-java

- **Version:** 1.63
- **License:** Apache 2.0
- **Maintained by:** Google
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Async via Netty event loop — non-blocking I/O with Netty NIO transport
- **Memory:** JVM heap — Netty ByteBuf pool. JVM base overhead ~100 MB heap
- **Throughput:** ~150k RPCs/s (unary, Netty)
- **Cold start:** ~2s (JVM startup)
- **Container size:** ~200 MB (eclipse-temurin:21-alpine)
- **Thread model:** Non-blocking async (Netty NIO — boss/worker thread pool)
- **Scaling:** Horizontal
- **Ecosystem:** 10k+ GitHub stars
- **Package manager:** Maven / Gradle
- **Build tool:** Maven / Gradle (protoc + protobuf-gradle-plugin)
- **When to use:** Java/Spring microservices, existing JVM ecosystem, Android gRPC clients
- **When NOT:** Startup time critical (serverless) → grpc-go or grpc-node
- **Trade-off:** vs grpc-go: comparable warm throughput, higher startup overhead and container size
- **Home:** https://github.com/grpc/grpc-java

### grpcio

- **Version:** 1.63
- **License:** Apache 2.0
- **Maintained by:** Google
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Async (grpc.aio + asyncio) — C-core underlying transport bypasses Python GIL for I/O
- **Memory:** Python heap + C-core native memory. GIL still applies for Python handler code
- **Throughput:** ~20k RPCs/s (GIL limits Python handler concurrency)
- **Cold start:** ~500ms
- **Container size:** ~130 MB (python:3.12-alpine)
- **Thread model:** Async (asyncio + C-core async I/O — GIL limits handler parallelism)
- **Scaling:** Horizontal (multiple processes to bypass GIL)
- **Ecosystem:** 20M+ weekly PyPI downloads
- **Package manager:** pip / uv / poetry
- **Build tool:** pip (grpcio-tools for proto generation)
- **When to use:** Python ML model serving, data science microservices, consuming gRPC APIs from Python
- **When NOT:** High concurrency required → grpc-go. Performance-critical server → grpc-go
- **Trade-off:** vs grpcio-asyncio: sync grpcio blocks GIL per handler — use grpc.aio for async
- **Home:** https://grpc.io/docs/languages/python/

### @grpc/grpc-js

- **Version:** 1.10
- **License:** Apache 2.0
- **Maintained by:** Google
- **Maturity:** Production
- **Tier:** Tier 1
- **Concurrency:** Single-thread event loop — pure JS transport, no C bindings required
- **Memory:** GC — V8. No C-core dependency — pure JavaScript implementation
- **Throughput:** ~30k RPCs/s
- **Cold start:** ~300ms
- **Container size:** ~150 MB (node:alpine)
- **Thread model:** Single-thread event loop (Node.js — use cluster for multi-core)
- **Scaling:** Horizontal
- **Ecosystem:** 3M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Node.js (proto-loader for dynamic proto loading or protoc for static)
- **When to use:** Node.js gRPC clients/servers, TypeScript microservices, interop with Go/Java gRPC
- **When NOT:** Native binary performance → grpc-go. Complex bidirectional streaming at scale → grpc-go
- **Trade-off:** vs grpc-go: pure JS — 5× higher latency, same HTTP/2 protocol wire compatibility
- **Home:** https://github.com/grpc/grpc-node

### grpc-dotnet

- **Version:** 2.62
- **License:** Apache 2.0
- **Maintained by:** Microsoft
- **Maturity:** Production
- **Concurrency:** Async/await (Task) — Kestrel HTTP/2 server, fully async pipeline
- **Memory:** .NET GC — managed heap. Kestrel socket buffers, low framework overhead
- **Throughput:** ~120k RPCs/s
- **Cold start:** ~500ms (JIT) / ~200ms (AOT)
- **Container size:** ~80 MB (dotnet:8.0-alpine)
- **Thread model:** Async/await (Thread pool — scales to all CPUs)
- **Scaling:** Horizontal
- **Ecosystem:** 4k+ GitHub stars (part of ASP.NET Core)
- **Package manager:** NuGet (dotnet CLI)
- **Build tool:** dotnet CLI (Grpc.Tools for proto generation)
- **When to use:** .NET microservices, ASP.NET Core APIs replacing REST, Azure workloads
- **When NOT:** Browser clients without grpc-web → REST. Non-.NET clients → standard gRPC + proxy
- **Trade-off:** vs REST (ASP.NET Core): 3× throughput, binary protocol — debugging harder without grpc-ui
- **Home:** https://learn.microsoft.com/en-us/aspnet/core/grpc/

### tonic

- **Version:** 0.11
- **License:** MIT
- **Maintained by:** Community (LukeMathWalker)
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Async (Tokio) — zero-cost abstractions, work-stealing multi-thread runtime
- **Memory:** No GC — deterministic allocation. Tokio async runtime near-zero overhead per task
- **Throughput:** ~250k RPCs/s
- **Cold start:** ~10ms
- **Container size:** ~15 MB (rust:alpine / distroless)
- **Thread model:** Async Tokio (multi-threaded work-stealing — scales to all CPUs)
- **Scaling:** Horizontal
- **Ecosystem:** 10k+ GitHub stars
- **Package manager:** cargo
- **Build tool:** cargo (tonic-build for proto generation in build.rs)
- **When to use:** Lowest latency gRPC, memory safety critical, Rust microservices, embedded service mesh
- **When NOT:** Rapid prototyping → grpc-go. Python/Java team → use that language's gRPC impl
- **Trade-off:** vs grpc-go: lower latency, no GC pauses, higher compile complexity and learning curve
- **Home:** https://github.com/hyperium/tonic

### grpc-swift

- **Version:** 2.0
- **License:** Apache 2.0
- **Maintained by:** Apple / gRPC team
- **Maturity:** Production
- **Concurrency:** Swift structured concurrency (async/await) — SwiftNIO event loop
- **Memory:** ARC — no GC, deterministic memory management, low per-stream overhead
- **Throughput:** ~100k RPCs/s
- **Cold start:** ~100ms
- **Container size:** ~50 MB (swift:5.10-alpine)
- **Thread model:** Swift structured concurrency (SwiftNIO NIO event loop — multi-threaded)
- **Scaling:** Horizontal
- **Ecosystem:** 4k+ GitHub stars
- **Package manager:** Swift Package Manager
- **Build tool:** swift (protoc + grpc-swift-plugin)
- **When to use:** iOS/macOS gRPC clients, Vapor server with gRPC, Swift server microservices
- **When NOT:** Non-Apple platform primary → grpc-go. Python/Java team → use their impl
- **Trade-off:** vs grpc-go: native iOS/macOS integration advantage, smaller Linux server ecosystem
- **Home:** https://github.com/grpc/grpc-swift

### grpc-kotlin

- **Version:** 1.4
- **License:** Apache 2.0
- **Maintained by:** Google
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Coroutines — suspending functions, non-blocking on Kotlin coroutine dispatcher
- **Memory:** JVM heap — Kotlin coroutines minimal overhead vs Java threads. Netty ByteBuf pool
- **Throughput:** ~120k RPCs/s
- **Cold start:** ~2s (JVM startup)
- **Container size:** ~200 MB (eclipse-temurin:21-alpine)
- **Thread model:** Coroutines (Kotlin coroutine dispatcher — non-blocking on JVM thread pool)
- **Scaling:** Horizontal
- **Ecosystem:** 2k+ GitHub stars
- **Package manager:** Gradle
- **Build tool:** Gradle (protoc + grpc-kotlin plugin)
- **When to use:** Kotlin microservices, Android coroutine gRPC clients, Spring Boot Kotlin
- **When NOT:** Pure Java team → grpc-java directly. Performance critical → grpc-go
- **Trade-off:** vs grpc-java: idiomatic Kotlin coroutines, same JVM warm throughput
- **Home:** https://github.com/grpc/grpc-kotlin

### connect-go

- **Version:** 0.5
- **License:** Apache 2.0
- **Maintained by:** Buf Technologies
- **Maturity:** Production
- **Concurrency:** Goroutines — same as net/http, compatible with gRPC + gRPC-Web + Connect protocols
- **Memory:** GC — Go. net/http2 transport, minimal overhead — no separate gRPC runtime
- **Throughput:** ~180k RPCs/s
- **Cold start:** ~20ms
- **Container size:** ~15 MB (golang:alpine)
- **Thread model:** Goroutines (M:N green threads — auto-scales to all CPUs)
- **Scaling:** Horizontal (compatible with standard HTTP load balancers)
- **Ecosystem:** 6k+ GitHub stars
- **Package manager:** go mod
- **Build tool:** Go (buf generate for proto + connect-go plugin)
- **When to use:** gRPC + browser clients without grpc-web proxy, standard HTTP LBs, buf.build ecosystem
- **When NOT:** Existing envoy + raw gRPC only → grpc-go. Non-Go teams
- **Trade-off:** vs grpc-go: HTTP/1.1 + browser compatible without proxy, slightly lower raw throughput
- **Home:** https://connectrpc.com

### grpc-php

- **Version:** 1.63
- **License:** Apache 2.0
- **Maintained by:** Google
- **Maturity:** Production
- **Concurrency:** Synchronous (PHP-FPM) — each request in new FPM worker, no async model
- **Memory:** PHP GC — ZendEngine per-request. grpc C extension is C-based native memory
- **Throughput:** ~10k RPCs/s (FPM worker pool limit)
- **Cold start:** ~200ms (FPM worker init)
- **Container size:** ~100 MB (php:8.3-fpm-alpine)
- **Thread model:** Synchronous (PHP-FPM — one request per worker process)
- **Scaling:** Horizontal (PHP-FPM process pool)
- **Ecosystem:** 1M+ monthly Packagist downloads
- **Package manager:** Composer
- **Build tool:** Composer (protoc + grpc_php_plugin)
- **When to use:** PHP services consuming gRPC APIs (GCP client libs, Shopify), Laravel gRPC clients
- **When NOT:** PHP as high-traffic gRPC server → use grpc-go as sidecar. Any server workload → Go/Java
- **Trade-off:** vs REST: binary efficiency gained at client, lost to PHP-FPM per-request overhead at server
- **Home:** https://grpc.io/docs/languages/php/

### grpc-ruby

- **Version:** 1.63
- **License:** Apache 2.0
- **Maintained by:** Google
- **Maturity:** Production
- **Concurrency:** Thread-per-RPC (MRI) — grpc gem backed by C-core runtime; GIL limits parallel Ruby handler execution
- **Memory:** Ruby GC (MRI generational) + C-core native memory. GIL applies to Ruby handler code; C-core I/O bypasses GIL
- **Throughput:** ~15k RPCs/s (GIL limits Ruby handler concurrency; C-core handles I/O)
- **Cold start:** ~800ms (Rails boot if used with Rails)
- **Container size:** ~160 MB (ruby:3.3-alpine)
- **Thread model:** Thread-per-RPC (MRI GIL — use multi-process for server concurrency)
- **Scaling:** Horizontal (multiple processes to bypass GIL)
- **Ecosystem:** 500k+ monthly Rubygems downloads
- **Package manager:** Bundler / gem
- **Build tool:** Bundler (protoc + grpc_ruby_plugin for proto generation)
- **When to use:** Rails services consuming gRPC APIs, Ruby microservices in a polyglot gRPC mesh, GCP client libraries in Ruby
- **When NOT:** High-throughput gRPC server → grpc-go. New non-Ruby service → Go/Java
- **Trade-off:** vs grpc-go: Ruby GIL limits server concurrency — grpc-ruby is best suited as a gRPC client from Rails, not as a high-traffic server
- **Home:** https://grpc.io/docs/languages/ruby/

---

## A.29 Protocol — GraphQL

8 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| Apollo Server | 4.10 | js, ts | Production | ~20k queries/s | Introspection disabled in production mode, persisted queries, depth limiting via |
| GraphQL Yoga | 5.6 | js, ts | Production | ~30k queries/s | Persisted operations, envelop plugin system for depth limiting and auth |
| Strawberry | 0.235 | python | Production | ~5k queries/s (Python GIL) | Extension system for depth limiting, max complexity, persisted queries via exten |
| gqlgen | 0.17 | go | Production | ~50k queries/s | Generated type-safe resolvers eliminate reflection injection risk, query complex |
| Spring for GraphQL | 1.3 | java | Production | ~30k queries/s | Spring Security integration, query complexity limits via instrumentation, intros |
| Hot Chocolate | 14 | csharp | Production | ~40k queries/s | Persisted queries, query complexity, depth limits, field-level authorization via |
| graphql-ruby | 2.3 | ruby | Production | ~3k queries/s (MRI GIL) | Query depth limiting, complexity analysis, persisted queries, field-level author |
| async-graphql | 7.0 | rust | Production | ~80k queries/s | Query depth and complexity limits built-in, field-level auth via guards, no runt |

### Apollo Server

- **Version:** 4.10
- **License:** MIT
- **Maintained by:** Apollo GraphQL
- **Maturity:** Production
- **Tier:** Tier 2
- **Concurrency:** Single-thread event loop — async resolver pipeline, DataLoader for batching
- **Memory:** GC — V8. Schema cache at boot (~10 MB). DataLoader batch window per request
- **Throughput:** ~20k queries/s
- **Cold start:** ~300ms
- **Container size:** ~150 MB (node:alpine)
- **Thread model:** Single-thread event loop
- **Scaling:** Horizontal
- **Ecosystem:** 3M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Node.js (schema-first SDL or code-first)
- **When to use:** Node.js GraphQL APIs, large Apollo ecosystem (Federation, Studio, Rover), schema registry
- **When NOT:** Simple CRUD → REST. High throughput → gRPC. PHP/Python primary → use their impl
- **Trade-off:** vs REST: flexible client queries, higher server complexity — query parsing overhead per request
- **Home:** https://www.apollographql.com/docs/apollo-server/

### GraphQL Yoga

- **Version:** 5.6
- **License:** MIT
- **Maintained by:** The Guild
- **Maturity:** Production
- **Concurrency:** Single-thread event loop — Fetch API compatible, runs on Node.js / Edge / Bun / Deno
- **Memory:** GC — V8. Lightweight — no Apollo runtime overhead, fetch-native transport
- **Throughput:** ~30k queries/s
- **Cold start:** ~200ms
- **Container size:** ~150 MB (node:alpine) / ~60 MB (bun:alpine)
- **Thread model:** Single-thread event loop (multi-runtime)
- **Scaling:** Horizontal
- **Ecosystem:** 500k+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Node.js / Edge / Bun / Deno (code-first or SDL)
- **When to use:** Lightweight GraphQL on any JS runtime, edge GraphQL, The Guild ecosystem (mesh, codegen)
- **When NOT:** Apollo Federation at scale → Apollo Server + Federation. Complex Studio tooling → Apollo
- **Trade-off:** vs Apollo Server: lighter, multi-runtime, no Studio — smaller managed tooling ecosystem
- **Home:** https://the-guild.dev/graphql/yoga-server

### Strawberry

- **Version:** 0.235
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Async (asyncio) — ASGI-compatible, resolvers can be async coroutines
- **Memory:** Python heap + SQLAlchemy/Django ORM per request. GIL limits CPU parallelism
- **Throughput:** ~5k queries/s (Python GIL)
- **Cold start:** ~500ms
- **Container size:** ~130 MB (python:3.12-alpine)
- **Thread model:** Async (asyncio ASGI — GIL limits parallel handler threads)
- **Scaling:** Horizontal (multiple processes)
- **Ecosystem:** 4k+ GitHub stars
- **Package manager:** pip / poetry / uv
- **Build tool:** Python (type annotations drive schema generation — no SDL file required)
- **When to use:** Python teams, type-annotation-driven schema, Django/FastAPI + GraphQL, Pydantic integration
- **When NOT:** High throughput → gRPC. JS team → Apollo. Go team → gqlgen
- **Trade-off:** vs Ariadne (SDL-first): code-first types feel native to Python, SDL-first gives schema portability
- **Home:** https://strawberry.rocks

### gqlgen

- **Version:** 0.17
- **License:** MIT
- **Maintained by:** 99designs / Community
- **Maturity:** Production
- **Concurrency:** Goroutines — SDL-first code generation, each resolver in its own goroutine
- **Memory:** GC — Go. Code-generated type-safe resolvers — no runtime reflection overhead
- **Throughput:** ~50k queries/s
- **Cold start:** ~20ms
- **Container size:** ~15 MB (golang:alpine)
- **Thread model:** Goroutines (M:N — each resolver can run in parallel goroutine)
- **Scaling:** Horizontal
- **Ecosystem:** 10k+ GitHub stars
- **Package manager:** go mod
- **Build tool:** Go (gqlgen generate — SDL → Go type-safe resolver stubs)
- **When to use:** Go GraphQL APIs, type-safe resolver generation, high-throughput Go microservices
- **When NOT:** JS team → Apollo. Python team → Strawberry. Simple REST → chi/gin REST
- **Trade-off:** vs graphql-go: gqlgen generates type-safe resolver code — no runtime reflection, better perf
- **Home:** https://gqlgen.com

### Spring for GraphQL

- **Version:** 1.3
- **License:** Apache 2.0
- **Maintained by:** VMware / Spring
- **Maturity:** Production
- **Concurrency:** Async (Spring WebFlux / Reactor) or blocking (Spring MVC) — annotation-driven resolvers
- **Memory:** JVM heap — Spring context + schema registration at boot. ~150 MB heap baseline
- **Throughput:** ~30k queries/s
- **Cold start:** ~3s (Spring context startup)
- **Container size:** ~200 MB (eclipse-temurin:21-alpine)
- **Thread model:** Async reactive (Reactor — Project Loom in JDK 21 for virtual thread option)
- **Scaling:** Horizontal
- **Ecosystem:** 3k+ GitHub stars (part of Spring ecosystem)
- **Package manager:** Maven / Gradle
- **Build tool:** Maven / Gradle (Spring Initializr — annotation-driven, no code generation step)
- **When to use:** Java Spring teams adding GraphQL, existing Spring Boot microservices, Spring Security integration
- **When NOT:** New Go/Python project → use that language. Startup critical → gqlgen
- **Trade-off:** vs REST (Spring MVC): adds GraphQL query flexibility, higher schema maintenance overhead
- **Home:** https://spring.io/projects/spring-graphql

### Hot Chocolate

- **Version:** 14
- **License:** MIT
- **Maintained by:** ChilliCream
- **Maturity:** Production
- **Concurrency:** Async/await (Task) — DataLoader built-in, query plan execution engine
- **Memory:** .NET GC — DataLoader batching reduces per-field heap allocation. Schema pre-compiled
- **Throughput:** ~40k queries/s
- **Cold start:** ~500ms
- **Container size:** ~80 MB (dotnet:8.0-alpine)
- **Thread model:** Async/await (Thread pool — scales to all CPUs)
- **Scaling:** Horizontal
- **Ecosystem:** 5k+ GitHub stars
- **Package manager:** NuGet (dotnet CLI)
- **Build tool:** dotnet CLI (code-first or SDL-first, no external code generation)
- **When to use:** .NET teams, schema stitching / federation, built-in DataLoader, Banana Cake Pop IDE
- **When NOT:** JS team → Apollo. Go team → gqlgen. Simple APIs → REST
- **Trade-off:** vs REST (ASP.NET): flexible queries, higher schema complexity — justified for multi-client APIs
- **Home:** https://chillicream.com/docs/hotchocolate

### graphql-ruby

- **Version:** 2.3
- **License:** MIT
- **Maintained by:** Robert Mosolgo / Community
- **Maturity:** Production
- **Concurrency:** Single-thread (MRI GIL) — async via Dataloader gem, Fiber-based concurrency with Async
- **Memory:** Ruby GC — object heap per request. Rails integration adds ~200 MB baseline
- **Throughput:** ~3k queries/s (MRI GIL)
- **Cold start:** ~800ms (Rails boot)
- **Container size:** ~160 MB (ruby:3.3-alpine)
- **Thread model:** Single-thread (MRI GIL — Puma multi-process for concurrency)
- **Scaling:** Horizontal
- **Ecosystem:** 5M+ monthly Rubygems downloads
- **Package manager:** Bundler / gem
- **Build tool:** Bundler (code-first schema DSL, no proto or SDL file)
- **When to use:** Rails apps adding GraphQL, GitHub-style API (GitHub's GraphQL runs on graphql-ruby)
- **When NOT:** High throughput → gRPC. Python team → Strawberry. New project → gqlgen or Apollo
- **Trade-off:** vs REST (Rails): GitHub proved large-scale viability — MRI GIL limits single-process concurrency
- **Home:** https://graphql-ruby.org

### async-graphql

- **Version:** 7.0
- **License:** MIT / Apache 2.0
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Async (Tokio) — derive macro–driven schema, zero-cost async resolvers
- **Memory:** No GC — deterministic allocation. Derive macros generate schema at compile time, no runtime cost
- **Throughput:** ~80k queries/s
- **Cold start:** ~10ms
- **Container size:** ~15 MB (rust:alpine / distroless)
- **Thread model:** Async Tokio (multi-threaded work-stealing — scales to all CPUs)
- **Scaling:** Horizontal
- **Ecosystem:** 3k+ GitHub stars
- **Package manager:** cargo
- **Build tool:** cargo (derive macros — schema generated from Rust struct annotations at compile time)
- **When to use:** Lowest latency GraphQL, Rust microservices, compile-time schema validation, zero runtime overhead
- **When NOT:** Rapid prototyping → Apollo or Yoga. Java/Python team → use their impl
- **Trade-off:** vs Apollo Server: 10× throughput, no runtime overhead, high Rust compile complexity
- **Home:** https://async-graphql.github.io/async-graphql

---

## A.30 Protocol — WebSocket

8 frameworks in this category.

| Framework | Version | Language | Maturity | Performance | Security posture |
|---|---|---|---|---|---|
| ws | 8.17 | js, ts | Production |  | Origin header check, per-message auth via onmessage handler, rate limiting exter |
| gorilla/websocket | 1.5 | go | Production |  | Origin checking built-in, TLS via net/http, per-message token auth pattern |
| websockets | 12.0 | python | Production |  | TLS via asyncio SSL, origin check, per-connection token auth handler |
| Java-WebSocket | 1.5 | java | Production |  | TLS via Java SSL, origin checking, per-message auth handler |
| Phoenix Channels | 1.7 | elixir | Production |  | TLS via Cowboy, per-channel topic auth, presence tracking built-in |
| tokio-tungstenite | 0.23 | rust | Production |  | TLS via rustls (memory-safe), per-message auth via tower middleware |
| SignalR | 8.0 | csharp | Production |  | TLS via Kestrel, ASP.NET Core auth, per-hub method authorization, Azure SignalR  |
| faye-websocket | 0.11 | ruby | Production |  | TLS via EventMachine SSL, origin checking, per-connection auth hook |

### ws

- **Version:** 8.17
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Single-thread event loop — each connection is an EventEmitter, message events queued
- **Memory:** GC — V8. ~10 kB per idle connection. 10k connections ≈ 100 MB heap
- **Cold start:** ~300ms
- **Container size:** ~150 MB (node:alpine)
- **Thread model:** Single-thread event loop (Node.js — cluster for multi-core)
- **Scaling:** Horizontal (sticky sessions + Redis pub/sub for broadcast)
- **Ecosystem:** 80M+ weekly npm downloads
- **Package manager:** npm, pnpm, yarn
- **Build tool:** Node.js (no bundler needed)
- **When to use:** Node.js real-time apps, chat, live dashboards, collaborative tools
- **When NOT:** 100k+ connections per node → Go gorilla or Rust tungstenite. Fan-out broadcast → Phoenix Channels
- **Trade-off:** vs socket.io: lower-level, no auto-reconnect or rooms — add manually or use socket.io
- **Home:** https://github.com/websockets/ws

### gorilla/websocket

- **Version:** 1.5
- **License:** BSD-2-Clause
- **Maintained by:** Community (archived — use nhooyr.io/websocket for new projects)
- **Maturity:** Production
- **Concurrency:** Goroutines — one goroutine per connection reader, one per writer
- **Memory:** GC — Go. ~8 kB per goroutine stack. 100k connections ≈ 1.6 GB (goroutine stack overhead)
- **Cold start:** ~20ms
- **Container size:** ~15 MB (golang:alpine)
- **Thread model:** Goroutines (one per connection — M:N green threads)
- **Scaling:** Horizontal (sticky sessions + Redis pub/sub)
- **Ecosystem:** 20k+ GitHub stars
- **Package manager:** go mod
- **Build tool:** Go (no bundler)
- **When to use:** Go real-time services, high connection count, existing gorilla/mux codebase
- **When NOT:** New Go projects → nhooyr.io/websocket (gorilla archived). Fan-out at scale → Phoenix
- **Trade-off:** vs nhooyr.io/websocket: gorilla is archived, still works — nhooyr has cleaner context API
- **Home:** https://github.com/gorilla/websocket

### websockets

- **Version:** 12.0
- **License:** BSD-3-Clause
- **Maintained by:** Community (aaugustin)
- **Maturity:** Production
- **Concurrency:** Async (asyncio) — coroutine per connection, ASGI server compatible
- **Memory:** Python heap — ~15 kB per connection object. GIL limits parallel message handling
- **Cold start:** ~500ms
- **Container size:** ~130 MB (python:3.12-alpine)
- **Thread model:** Async (asyncio — GIL limits parallel handler coroutines to one CPU)
- **Scaling:** Horizontal (sticky sessions + Redis)
- **Ecosystem:** 5M+ monthly PyPI downloads
- **Package manager:** pip / uv / poetry
- **Build tool:** Python (no bundler)
- **When to use:** Python real-time apps, ML model output streaming, asyncio services
- **When NOT:** High connection count → Go gorilla or Rust. Fast broadcast → Phoenix Channels
- **Trade-off:** vs socket.io (Python): lower-level, no rooms or events — add manually
- **Home:** https://websockets.readthedocs.io

### Java-WebSocket

- **Version:** 1.5
- **License:** MIT
- **Maintained by:** Community (TooTallNate)
- **Maturity:** Production
- **Concurrency:** Multi-thread — one thread per connection (blocking) or Netty NIO (async)
- **Memory:** JVM heap — ~30 kB per connection thread stack. 1k connections ≈ 30 MB
- **Cold start:** ~2s (JVM startup)
- **Container size:** ~200 MB (eclipse-temurin:21-alpine)
- **Thread model:** Multi-thread blocking or Netty NIO async
- **Scaling:** Horizontal (sticky sessions + Redis / Hazelcast)
- **Ecosystem:** 2k+ GitHub stars
- **Package manager:** Maven / Gradle
- **Build tool:** Maven / Gradle
- **When to use:** Java apps needing WebSocket, Android WebSocket client, existing Java codebase
- **When NOT:** High connection count → Netty raw WebSocket or grpc streaming. Kotlin → prefer Ktor
- **Trade-off:** vs Spring WebSocket (STOMP): lower-level, simpler setup, no STOMP broker routing
- **Home:** https://github.com/TooTallNate/Java-WebSocket

### Phoenix Channels

- **Version:** 1.7
- **License:** MIT
- **Maintained by:** Chris McCord / Community
- **Maturity:** Production
- **Concurrency:** BEAM actor model — each connection is a lightweight process (~1 kB per process)
- **Memory:** BEAM GC — per-process heap, collected independently. 1M connections ≈ 1 GB total
- **Cold start:** ~500ms (BEAM boot)
- **Container size:** ~80 MB (elixir:alpine)
- **Thread model:** BEAM actor model (lightweight processes — massively concurrent, preemptive scheduling)
- **Scaling:** Horizontal (Phoenix.PubSub — distributed pub/sub across nodes via pg adapter)
- **Ecosystem:** 3k+ GitHub stars
- **Package manager:** mix
- **Build tool:** mix (Elixir build tool)
- **When to use:** Massive fan-out broadcast, 1M+ concurrent users, real-time presence, chat at scale
- **When NOT:** Small team unfamiliar with Elixir → ws (Node.js) or gorilla. Simple polling → SSE
- **Trade-off:** vs Node.js ws: 100× more connections per node, Elixir learning curve required
- **Home:** https://hexdocs.pm/phoenix/channels.html

### tokio-tungstenite

- **Version:** 0.23
- **License:** MIT
- **Maintained by:** Community
- **Maturity:** Production
- **Concurrency:** Async (Tokio) — one Tokio task per connection, no goroutine/thread overhead
- **Memory:** No GC — ~4 kB per connection task. 100k connections ≈ 400 MB (all connections active)
- **Cold start:** ~10ms
- **Container size:** ~15 MB (rust:alpine / distroless)
- **Thread model:** Async Tokio (multi-threaded work-stealing — scales to all CPUs)
- **Scaling:** Horizontal (sticky sessions + NATS / Redis pub/sub)
- **Ecosystem:** 3k+ GitHub stars
- **Package manager:** cargo
- **Build tool:** cargo
- **When to use:** Lowest latency WebSocket, Rust real-time services, game servers, trading systems
- **When NOT:** Rapid prototyping → ws (Node.js). Fan-out at scale → Phoenix. Team unfamiliar with Rust
- **Trade-off:** vs Phoenix: similar connection density, lower latency — no built-in pub/sub or presence
- **Home:** https://github.com/snapview/tokio-tungstenite

### SignalR

- **Version:** 8.0
- **License:** MIT
- **Maintained by:** Microsoft
- **Maturity:** Production
- **Concurrency:** Async/await (Task) — Hub pattern, transport negotiation (WebSocket → SSE → Long Polling fallback)
- **Memory:** .NET GC — Hub group state per connection. Backplane (Redis/Azure) offloads connection state
- **Cold start:** ~500ms
- **Container size:** ~80 MB (dotnet:8.0-alpine)
- **Thread model:** Async/await (Thread pool — scales to all CPUs)
- **Scaling:** Horizontal (Azure SignalR Service backplane — no sticky sessions needed)
- **Ecosystem:** 3k+ GitHub stars (part of ASP.NET Core)
- **Package manager:** NuGet (dotnet CLI)
- **Build tool:** dotnet CLI
- **When to use:** .NET real-time apps, Blazor integration, Azure-hosted apps, enterprise with mixed transport needs
- **When NOT:** Non-.NET clients at scale → Phoenix or ws. Simple WebSocket → use raw WebSocket
- **Trade-off:** vs raw WebSocket: auto-reconnect, groups/broadcast, transport fallback — higher abstraction overhead
- **Home:** https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction

### faye-websocket

- **Version:** 0.11
- **License:** Apache 2.0
- **Maintained by:** James Coglan / Community
- **Maturity:** Production
- **Concurrency:** Single-thread async (EventMachine) — non-blocking event loop for Ruby
- **Memory:** Ruby GC — ~20 kB per connection object. EventMachine event loop heap
- **Cold start:** ~800ms (Rails/EventMachine boot)
- **Container size:** ~160 MB (ruby:3.3-alpine)
- **Thread model:** Single-thread async (EventMachine — non-blocking Reactor pattern)
- **Scaling:** Horizontal (sticky sessions + Redis pub/sub via Faye pub/sub layer)
- **Ecosystem:** 500k+ monthly Rubygems downloads
- **Package manager:** Bundler / gem
- **Build tool:** Bundler
- **When to use:** Ruby/Rails real-time features, Action Cable alternative, Rack-compatible WebSocket upgrades
- **When NOT:** High connection count → Go gorilla. New Ruby real-time → Action Cable (Rails built-in)
- **Trade-off:** vs Action Cable: lower-level, Rack-compatible, no Rails dependency — more flexible, less convenient
- **Home:** https://github.com/faye/faye-websocket-ruby

---

# Part B — The platform, stage by stage

## B.0 Swappable build axes — every option

Each axis is a knob. Swap any value at build time. The same service ships every combination.

| Axis | Controls | Default | All valid options | Applies to |
|---|---|---|---|---|
| auth |  | all | none, jwt, oauth2, apikey, all | All API services |
| build-image |  | node | node, python, golang, java, dotnet, rust, elixir, ruby, php | All services |
| build-tool |  | tsc | tsc, esbuild, swc | Node backends only |
| compliance |  | standard | standard, hipaa, pci, pipeda, fips, soc2, cmmc, nerc | All API services |
| observability |  | none | none, otel, prometheus, datadog | All API services |
| orm |  | prisma (Node) / sqlalchemy (Python) / gorm (Go) | prisma, typeorm, drizzle, none, sqlalchemy, tortoise, gorm, ent | Backend services |
| pkg-mgr |  | npm (Node) / pip (Python) | npm, pnpm, yarn, bun, pip, poetry, uv | Node, Python |
| runtime |  | alpine | alpine, slim, fips | All services |

## B.1 CI/CD pipeline

The pipeline runs in phases. Each phase has stages, each stage a tool.

### Bootstrap

| Stage | Type | Tool |
|---|---|---|
| Branch protection | DevOps |  |
| CODEOWNERS | DevOps |  |
| OIDC trust | DevSecOps |  |
| Registry access | DevOps |  |
| Kyverno admission policy | DevSecOps |  |
| Dependency update automation | DevSecOps |  |

### Local Dev

| Stage | Type | Tool |
|---|---|---|
| IDE plugins | DevOps |  |
| Pre-commit hooks | DevSecOps |  |
| Local secret scan | DevSecOps |  |

### PR Gate

| Stage | Type | Tool |
|---|---|---|
| Pre-commit (CI) | DevSecOps |  |
| SCA | DevSecOps |  |
| SAST | DevSecOps |  |
| License scan | DevSecOps |  |
| IaC scan | DevSecOps |  |
| Secrets scan | DevSecOps |  |
| Build (no push) | DevOps |  |
| SBOM generate | DevSecOps |  |
| Container scan | DevSecOps |  |
| PR review | DevOps |  |

### Main Build

| Stage | Type | Tool |
|---|---|---|
| Pre-commit (CI) | DevSecOps |  |
| SCA | DevSecOps |  |
| SAST | DevSecOps |  |
| License scan | DevSecOps |  |
| IaC scan | DevSecOps |  |
| Secrets scan | DevSecOps |  |
| Build + Push | DevOps |  |
| Release tag | DevOps |  |
| Container scan | DevSecOps |  |
| Sign | DevSecOps |  |
| SBOM generate + attest | DevSecOps |  |
| SLSA provenance | DevSecOps |  |
| Tests + Codecov | DevOps |  |
| DAST | DevSecOps |  |
| Perf test | DevOps |  |
| Notify | DevOps |  |

### Image store

| Stage | Type | Tool |
|---|---|---|
| Image store | DevOps |  |
| Sign verify | DevSecOps |  |
| SBOM attach | DevSecOps |  |
| SLSA attach | DevSecOps |  |

### 4 environments

| Stage | Type | Tool |
|---|---|---|
| GitOps PR | DevOps |  |
| ArgoCD / Flux deploy | DevOps |  |
| cosign verify | DevSecOps |  |
| Env tests | DevOps |  |
| Gate | DevOps |  |
| Argo Rollouts | DevOps |  |
| Monitor | DevOps |  |

### B.1.1 Tool catalog — every stage tool in detail

#### GitHub branch protection (built-in)

- **Stage:** Branch protection (DevOps)
- **License:** Included in GitHub
- **Applies to:** All
- **Output:** N/A
- **CI integration:** GitHub native — Settings → Branches
- **Mandatory:** Yes
- **When to use:** Every repo deploying to production
- **When NOT:** Never skip for prod repos
- **Trade-off:** vs GitLab protected branches: GitHub has fine-grained token control; GitLab has more granular merge approval counts

#### GitHub CODEOWNERS (built-in)

- **Stage:** CODEOWNERS (DevOps)
- **License:** Included in GitHub
- **Applies to:** All
- **Output:** N/A
- **CI integration:** GitHub native — .github/CODEOWNERS
- **Mandatory:** Yes
- **When to use:** Always — auto-assigns reviewers on paths containing secrets config, IaC, or auth code
- **When NOT:** Never skip for security-critical paths
- **Trade-off:** vs manual reviewer assignment: CODEOWNERS auto-assigns; manual assignment requires each PR author to know the owner

#### GitHub Actions OIDC (built-in)

- **Stage:** OIDC trust (DevSecOps)
- **License:** Included in GitHub
- **Applies to:** All
- **Output:** N/A
- **CI integration:** GitHub native — permissions: id-token: write in workflow
- **Mandatory:** Yes
- **When to use:** Always — eliminates long-lived static credentials from CI
- **When NOT:** Use stored secrets only when the cloud provider does not support OIDC federation
- **Trade-off:** vs static secrets: OIDC tokens expire per job; static secrets persist until manually rotated

#### GHCR — GitHub Container Registry

- **Stage:** Registry access (DevOps)
- **License:** Included in GitHub
- **Applies to:** All container workloads
- **Output:** N/A
- **CI integration:** docker/login-action with registry: ghcr.io
- **Mandatory:** Yes
- **When to use:** Default for GitHub-hosted repos — free private registry, tight OIDC integration
- **When NOT:** Use ECR when AWS VPC endpoint access is required by compliance
- **Trade-off:** vs ECR: GHCR needs no AWS account; ECR has deeper IAM and VPC endpoint policy control

#### ECR — Elastic Container Registry

- **Stage:** Registry access (DevOps)
- **License:** AWS — pay per GB stored + transferred
- **Applies to:** AWS workloads
- **Output:** N/A
- **CI integration:** aws-actions/amazon-ecr-login
- **Mandatory:** No
- **When to use:** AWS workloads requiring VPC endpoint registry access or cross-account pull policies
- **When NOT:** Skip when not on AWS
- **Trade-off:** vs GHCR: ECR has deeper AWS IAM integration; GHCR needs no AWS account

#### Kyverno v1.13

- **Stage:** Kyverno admission policy (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Kubernetes only
- **Output:** JSON (PolicyReport CRD)
- **CI integration:** kubectl apply / Helm chart
- **Mandatory:** Conditional
- **When to use:** Any Kubernetes cluster — blocks unsigned images at admission before the pod starts
- **When NOT:** Skip for non-Kubernetes deployments (serverless, VMs)
- **Trade-off:** vs OPA/Gatekeeper: Kyverno policies are plain Kubernetes YAML; Gatekeeper requires Rego language

#### Renovate v43

- **Stage:** Dependency update automation (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** Pull request (GitHub)
- **CI integration:** GitHub Action or self-hosted Renovate bot
- **Mandatory:** Yes
- **When to use:** Multiple repos or monorepos needing grouped, automerge-capable dependency updates
- **When NOT:** Use Dependabot when zero-config GitHub-native updates are sufficient
- **Trade-off:** vs Dependabot: Renovate has grouping, automerge, and multi-registry support; Dependabot needs no config file

#### Dependabot (built-in)

- **Stage:** Dependency update automation (DevSecOps)
- **License:** Included in GitHub
- **Applies to:** All
- **Output:** Pull request (GitHub)
- **CI integration:** GitHub native — .github/dependabot.yml
- **Mandatory:** No
- **When to use:** Simple single-ecosystem repos where Renovate config overhead is not justified
- **When NOT:** Replace with Renovate for monorepos or multi-ecosystem repos
- **Trade-off:** vs Renovate: Dependabot needs zero setup; Renovate needs renovate.json but gives far more control

#### SonarLint (VS Code / JetBrains)

- **Stage:** IDE plugins (DevOps)
- **License:** LGPL-3.0 (free)
- **Applies to:** JS/TS/Java/Python/Go/PHP/C#
- **Output:** In-editor highlights
- **CI integration:** N/A — developer installs manually
- **Mandatory:** No
- **When to use:** Any developer wanting real-time SAST feedback without waiting for CI
- **When NOT:** Skip for editors without SonarLint support
- **Trade-off:** vs CodeQL IDE extension: SonarLint works in VS Code and JetBrains; CodeQL IDE is VS Code only

#### hadolint IDE extension

- **Stage:** IDE plugins (DevOps)
- **License:** MIT
- **Applies to:** Dockerfile only
- **Output:** In-editor highlights
- **CI integration:** N/A — developer installs manually
- **Mandatory:** No
- **When to use:** Any developer writing Dockerfiles — catches FROM, RUN, and layer issues inline
- **When NOT:** Skip for non-container workloads
- **Trade-off:** vs manual Dockerfile review: hadolint checks all instructions automatically; manual review misses subtle layer ordering issues

#### pre-commit v3.8 (framework)

- **Stage:** Pre-commit hooks (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** CLI pass/fail
- **CI integration:** pre-commit/action GitHub Action
- **Mandatory:** Yes
- **When to use:** Every repo — manages all hooks in one config file, runs on git commit
- **When NOT:** Never skip on repos with a CI gate
- **Trade-off:** vs husky: pre-commit supports all languages; husky is Node.js-only

#### gitleaks v8.21

- **Stage:** Pre-commit hooks (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** CLI pass/fail + JSON
- **CI integration:** Run as pre-commit hook via .gitleaks.toml
- **Mandatory:** Yes
- **When to use:** Every repo — blocks commit if a secret pattern is detected in staged files
- **When NOT:** Never skip
- **Trade-off:** vs truffleHog: gitleaks is faster with deterministic regex rules; truffleHog adds entropy-based detection for unknown formats

#### hadolint v2.12

- **Stage:** Pre-commit hooks (DevSecOps)
- **License:** MIT
- **Applies to:** Dockerfile only
- **Output:** CLI pass/fail
- **CI integration:** Run as pre-commit hook
- **Mandatory:** Conditional
- **When to use:** Any repo containing Dockerfiles
- **When NOT:** Skip for repos with no Dockerfiles
- **Trade-off:** vs dockerfile-lint: hadolint is actively maintained with more rules; dockerfile-lint is unmaintained

#### checkov v3

- **Stage:** Pre-commit hooks (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Terraform / Helm / K8s / CloudFormation / Dockerfile
- **Output:** CLI pass/fail + JSON
- **CI integration:** Run as pre-commit hook via bridgecrewio/checkov
- **Mandatory:** Conditional
- **When to use:** Any repo with IaC files
- **When NOT:** Skip for repos with no IaC
- **Trade-off:** vs KICS: checkov has broader multi-framework support; KICS has deeper Terraform-specific rule coverage

#### gitleaks v8.21

- **Stage:** Local secret scan (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** CLI pass/fail + JSON
- **CI integration:** Pre-commit hook (local) + gitleaks/gitleaks-action (CI)
- **Mandatory:** Yes
- **When to use:** Every repo — runs on staged files at git commit, blocks before push
- **When NOT:** Never skip
- **Trade-off:** vs truffleHog: gitleaks is faster for pre-commit use; truffleHog v3 scans full repo history with entropy detection

#### pre-commit v3.8

- **Stage:** Pre-commit (CI) (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** CLI pass/fail
- **CI integration:** pre-commit/action@v3 — triggered on pull_request event
- **Mandatory:** Yes
- **When to use:** Every PR — re-runs hooks in CI to catch bypassed local hooks (--no-verify)
- **When NOT:** Never skip
- **Trade-off:** vs running hooks individually: pre-commit manages all hooks in one config; individual runs require separate CI steps

#### Trivy v0.58 (fs mode)

- **Stage:** SCA — Software Composition Analysis (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** All — npm, pip, Maven, Go, Cargo, RubyGems, NuGet
- **Output:** SARIF / JSON
- **CI integration:** aquasecurity/trivy-action
- **Mandatory:** Yes
- **When to use:** Default — one tool scans all package managers without extra config
- **When NOT:** Use Snyk when commercial fix PR automation or SBOM export is required
- **Trade-off:** vs Snyk: Trivy is free and open source; Snyk auto-creates fix PRs and has better remediation UX

#### Snyk v1.1280

- **Stage:** SCA — Software Composition Analysis (DevSecOps)
- **License:** Commercial — free tier available
- **Applies to:** All
- **Output:** SARIF / JSON
- **CI integration:** snyk/actions
- **Mandatory:** No
- **When to use:** When the team needs Snyk's automated fix PR and license scanning in one platform
- **When NOT:** Replace with Trivy when cost is a constraint
- **Trade-off:** vs Trivy: Snyk auto-creates fix PRs; Trivy only reports findings — no auto-remediation

#### OWASP Dependency-Check v10.0

- **Stage:** SCA — Software Composition Analysis (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Java/Maven/Gradle / .NET primary; also JS, Python
- **Output:** JSON / HTML / SARIF
- **CI integration:** dependency-check/dependency-check-action
- **Mandatory:** No
- **When to use:** Java/Maven/Gradle repos where NVD-sourced CVE data is required by compliance policy
- **When NOT:** Skip when Trivy covers the language ecosystem and NVD-specific sourcing is not required
- **Trade-off:** vs Trivy: Dependency-Check queries NVD directly; Trivy aggregates multiple advisory databases

#### osv-scanner v1.8

- **Stage:** SCA — Software Composition Analysis (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** All — lockfile-based: npm, pip, Maven, Go, Cargo, RubyGems, NuGet, Composer, Gradle
- **Output:** JSON / table output
- **CI integration:** CLI via google/osv-scanner-action
- **Mandatory:** No
- **When to use:** When Google OSV database coverage is required — broader advisory source than NVD alone; lockfile-based with zero false positives from missing lockfiles
- **When NOT:** Skip when Trivy fs mode is already configured and OSV-specific sourcing is not required by policy
- **Trade-off:** vs Trivy: osv-scanner uses the OSV database (superset of NVD for many ecosystems); Trivy aggregates multiple sources including OSV

#### CodeQL v2.19

- **Stage:** SAST — Static Application Security Testing (DevSecOps)
- **License:** MIT (queries) / included in GitHub
- **Applies to:** JS/TS, Python, Java, Go, C/C++, Ruby, Swift
- **Output:** SARIF → GitHub Security tab
- **CI integration:** github/codeql-action
- **Mandatory:** Yes
- **When to use:** Default for GitHub repos on supported languages — deep dataflow and taint tracking
- **When NOT:** Use Semgrep for unsupported languages or rapid custom rule authoring
- **Trade-off:** vs Semgrep: CodeQL does deep semantic dataflow analysis; Semgrep has simpler rule syntax and faster scan time

#### Semgrep v1.75

- **Stage:** SAST — Static Application Security Testing (DevSecOps)
- **License:** LGPL-2.1 / Semgrep Pro commercial
- **Applies to:** All — 100+ language parsers
- **Output:** SARIF / JSON
- **CI integration:** semgrep/semgrep-app-action
- **Mandatory:** No
- **When to use:** Languages not supported by CodeQL, or when custom security rules are needed in days not weeks
- **When NOT:** Skip when CodeQL coverage is sufficient for the languages in use
- **Trade-off:** vs CodeQL: Semgrep rules are easier to write; CodeQL has deeper interprocedural analysis

#### SonarCloud / SonarQube v10.5

- **Stage:** SAST — Static Application Security Testing (DevSecOps)
- **License:** LGPL (Community) / Commercial (Developer+)
- **Applies to:** JS/TS/Java/Python/Go/C#/Ruby/Kotlin/PHP/Swift
- **Output:** SonarCloud PR decoration + JSON via API
- **CI integration:** SonarSource/sonarcloud-github-action or SonarSource/sonarqube-scan-action
- **Mandatory:** No
- **When to use:** When code quality metrics (duplication, complexity, maintainability ratings) are needed alongside security findings
- **When NOT:** Skip when CodeQL coverage is sufficient and code quality gates are tracked elsewhere
- **Trade-off:** vs CodeQL: SonarCloud covers code quality and security in one tool; CodeQL does deeper security dataflow analysis only

#### FOSSA v3

- **Stage:** License scan (DevSecOps)
- **License:** Commercial — free tier available
- **Applies to:** All
- **Output:** JSON / HTML + GitHub PR comment
- **CI integration:** fossa-contrib/fossa-action
- **Mandatory:** Yes
- **When to use:** Commercial products where GPL or AGPL in a dependency creates legal risk — FOSSA blocks PRs automatically
- **When NOT:** Use ORT or licensefinder for internal tools with no strict compliance requirement
- **Trade-off:** vs ORT: FOSSA enforces policy automatically and has commercial support; ORT is open source and self-hostable

#### ORT — OSS Review Toolkit v25.0

- **Stage:** License scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** All — npm, Maven, pip, Cargo, Go modules, NuGet, RubyGems
- **Output:** JSON / Web App report
- **CI integration:** oss-review-toolkit/ort-ci-github-action
- **Mandatory:** No
- **When to use:** Monorepos with multiple package managers needing one open-source license audit tool
- **When NOT:** Use FOSSA when automated PR-blocking policy enforcement is required
- **Trade-off:** vs FOSSA: ORT is fully open source and self-hostable; FOSSA has automated enforcement and commercial SLA

#### licensefinder v7

- **Stage:** License scan (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** JSON / HTML
- **CI integration:** CLI via Docker image
- **Mandatory:** No
- **When to use:** Internal tools needing a simple license audit without commercial tooling or ORT complexity
- **When NOT:** Replace with FOSSA or ORT when automated policy enforcement is needed
- **Trade-off:** vs FOSSA: licensefinder is free and simple; FOSSA has automated policy enforcement and commercial support

#### checkov v3

- **Stage:** IaC scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Terraform / Helm / K8s / CloudFormation / Dockerfile / ARM / Ansible
- **Output:** SARIF / JSON
- **CI integration:** bridgecrewio/checkov-action
- **Mandatory:** Conditional
- **When to use:** Any repo with IaC files — broadest multi-framework coverage in one tool
- **When NOT:** Skip for repos with no IaC. Use KICS for deeper Terraform-specific rules.
- **Trade-off:** vs KICS: checkov covers more frameworks; KICS has stronger Terraform rule depth

#### KICS v2.1

- **Stage:** IaC scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Terraform / K8s / Dockerfile / Ansible / ARM
- **Output:** SARIF / JSON
- **CI integration:** Checkmarx/kics-github-action
- **Mandatory:** No
- **When to use:** Repos where Terraform is the primary IaC and maximum Terraform rule coverage is needed
- **When NOT:** Skip when checkov is already configured
- **Trade-off:** vs checkov: KICS has deeper Terraform rules; checkov has broader multi-framework support

#### Trivy v0.58 (config mode) — replaces tfsec

- **Stage:** IaC scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Terraform / K8s manifests / Dockerfile / Helm
- **Output:** SARIF / JSON
- **CI integration:** aquasecurity/trivy-action with scan-type: config
- **Mandatory:** No
- **When to use:** When Trivy is already used for SCA or container scanning — reuse same tool for IaC with no extra install
- **When NOT:** Skip when checkov or KICS is already configured. Note: tfsec was absorbed into this mode in 2023.
- **Trade-off:** vs checkov: Trivy config consolidates all Trivy scans in one binary; checkov has broader ARM and Ansible coverage

#### Snyk IaC (part of Snyk CLI v1.1280+)

- **Stage:** IaC scan (DevSecOps)
- **License:** Commercial — free tier available
- **Applies to:** Terraform / K8s / CloudFormation / ARM / Helm
- **Output:** JSON + Snyk dashboard
- **CI integration:** snyk/actions/iac
- **Mandatory:** No
- **When to use:** When Snyk SCA is already deployed and consolidating to one vendor reduces tool sprawl
- **When NOT:** Skip when checkov is already configured — duplicate IaC scanning adds noise
- **Trade-off:** vs checkov: Snyk IaC consolidates with Snyk SCA in one platform; checkov is open source with no commercial dependency

#### gitleaks v8.21

- **Stage:** Secrets scan (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** SARIF / JSON
- **CI integration:** gitleaks/gitleaks-action
- **Mandatory:** Yes
- **When to use:** Default — scans full repo history and PR diff for known secret patterns
- **When NOT:** Never skip
- **Trade-off:** vs truffleHog: gitleaks is faster with deterministic rules; truffleHog adds entropy detection for non-patterned secrets

#### truffleHog v3.80

- **Stage:** Secrets scan (DevSecOps)
- **License:** AGPL-3.0
- **Applies to:** All
- **Output:** JSON
- **CI integration:** trufflesecurity/trufflehog GitHub Action
- **Mandatory:** No
- **When to use:** When entropy-based detection is needed for non-patterned secrets that gitleaks misses
- **When NOT:** Skip when gitleaks rule coverage is sufficient
- **Trade-off:** vs gitleaks: truffleHog finds secrets without fixed patterns; gitleaks is faster on known patterns

#### GitHub Advanced Security (GHAS) — Secret Scanning

- **Stage:** Secrets scan (DevSecOps)
- **License:** Included with GitHub Advanced Security — free for public repos; paid for private repos on GitHub Enterprise
- **Applies to:** All GitHub-hosted repos
- **Output:** GitHub Security tab alerts
- **CI integration:** GitHub native — enabled in Settings → Security → Secret scanning
- **Mandatory:** No
- **When to use:** GitHub Enterprise repos with GHAS license — scans every push and full historical commits with zero config
- **When NOT:** Use gitleaks when GHAS is not available (GitHub Free/Team plans without GHAS add-on)
- **Trade-off:** vs gitleaks: GHAS requires no config file and covers all history automatically; gitleaks requires .gitleaks.toml but works on any plan

#### Docker buildx v0.15

- **Stage:** Build (no push) (DevOps)
- **License:** Apache 2.0
- **Applies to:** Container workloads
- **Output:** Local image tarball (not pushed)
- **CI integration:** docker/build-push-action with push: false
- **Mandatory:** Conditional
- **When to use:** Default for GitHub-hosted runners with Docker daemon access
- **When NOT:** Use kaniko when Docker daemon is unavailable in the CI runner
- **Trade-off:** vs kaniko: Docker buildx requires Docker daemon; kaniko runs rootless inside Kubernetes pods

#### kaniko v1.23

- **Stage:** Build (no push) (DevOps)
- **License:** Apache 2.0
- **Applies to:** Container workloads — Kubernetes CI runners
- **Output:** Local image tarball (not pushed)
- **CI integration:** gcr.io/kaniko-project/executor Docker image
- **Mandatory:** No
- **When to use:** Kubernetes-native CI runners where Docker daemon is unavailable (Tekton, Argo Workflows)
- **When NOT:** Skip when Docker buildx is sufficient
- **Trade-off:** vs Docker buildx: kaniko runs without daemon; Docker buildx needs daemon access

#### Buildah v1.36

- **Stage:** Build (no push) (DevOps)
- **License:** Apache 2.0
- **Applies to:** Container workloads — RHEL / OpenShift environments
- **Output:** OCI-format image (not pushed)
- **CI integration:** redhat-actions/buildah-build
- **Mandatory:** No
- **When to use:** RHEL or OpenShift environments where Red Hat tooling is standardized; rootless builds without Docker or Kubernetes
- **When NOT:** Skip when Docker buildx or kaniko is already configured
- **Trade-off:** vs kaniko: Buildah is OCI-native and RHEL-standard; kaniko is designed specifically for Kubernetes CI pods

#### Syft v1.6

- **Stage:** SBOM generate (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** All — container images + filesystems, all major package managers
- **Output:** CycloneDX JSON / SPDX
- **CI integration:** anchore/sbom-action
- **Mandatory:** Yes
- **When to use:** Default — generates SBOM from the built image tarball before container scan
- **When NOT:** Use cdxgen for Java/Maven/Gradle repos needing class-level dependency resolution
- **Trade-off:** vs cdxgen: Syft is faster and multi-ecosystem; cdxgen has deeper JVM class-level resolution

#### cdxgen v10.1

- **Stage:** SBOM generate (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Java/Maven/Gradle primary; also JS/TS/Python/Go/PHP
- **Output:** CycloneDX JSON
- **CI integration:** CycloneDX/gh-java-action / CLI via Docker
- **Mandatory:** No
- **When to use:** Java/Maven/Gradle repos where Syft misses class-level transitive dependencies
- **When NOT:** Use Syft when multi-ecosystem scanning is needed — cdxgen has deeper JVM but narrower overall ecosystem support
- **Trade-off:** vs Syft: cdxgen resolves JVM class-level dependencies; Syft is faster and covers more package managers

#### Trivy v0.58 (image mode)

- **Stage:** Container scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** SARIF / JSON
- **CI integration:** aquasecurity/trivy-action
- **Mandatory:** Yes
- **When to use:** Default — scans OS packages and app dependencies without a pre-built SBOM
- **When NOT:** Use Grype when Syft SBOM already exists and re-scanning from SBOM is preferred
- **Trade-off:** vs Grype: Trivy scans without a pre-generated SBOM; Grype uses a Syft SBOM for faster re-scanning

#### Grype v0.82

- **Stage:** Container scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images + filesystems
- **Output:** JSON / table output
- **CI integration:** anchore/scan-action
- **Mandatory:** No
- **When to use:** When Syft SBOM already exists in the pipeline and re-scanning from SBOM is faster than a full image pull
- **When NOT:** Skip when Trivy is already configured and Syft SBOM is not pre-generated
- **Trade-off:** vs Trivy: Grype re-scans from a Syft SBOM (faster on repeat runs); Trivy scans the image directly every time

#### Docker Scout (Docker CLI v25+)

- **Stage:** Container scan (DevSecOps)
- **License:** Free for GitHub Actions — public and private repos
- **Applies to:** Container images
- **Output:** SARIF / JSON + GitHub PR comment with base image upgrade path
- **CI integration:** docker/scout-action
- **Mandatory:** No
- **When to use:** Docker Desktop or Docker Hub users — free scanning with actionable base image upgrade recommendations
- **When NOT:** Skip when Trivy or Grype is already configured — duplicate scanning adds no extra coverage
- **Trade-off:** vs Trivy: Docker Scout recommends specific base image upgrades that fix CVEs; Trivy reports CVEs without upgrade paths

#### GitHub required reviewers + CODEOWNERS

- **Stage:** PR review (DevOps)
- **License:** Included in GitHub
- **Applies to:** All
- **Output:** N/A — merge is blocked until approved
- **CI integration:** GitHub native — branch protection rule
- **Mandatory:** Yes
- **When to use:** Every PR on a repo that deploys to production
- **When NOT:** Never skip for prod-adjacent repos
- **Trade-off:** vs auto-merge on green CI: human review catches logic and design issues that automated tools miss

#### pre-commit v3.8

- **Stage:** Pre-commit (CI) (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** CLI pass/fail
- **CI integration:** pre-commit/action@v3 — triggered on push to main
- **Mandatory:** Yes
- **When to use:** Every merge to main — catches any hooks bypassed with --no-verify before the merge was reviewed
- **When NOT:** Never skip
- **Trade-off:** vs running hooks individually: pre-commit manages all hooks in one config; individual runs require separate CI steps

#### Trivy v0.58 (fs mode)

- **Stage:** SCA (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** All ecosystems
- **Output:** SARIF → GitHub Security tab (main branch)
- **CI integration:** aquasecurity/trivy-action — triggered on push to main
- **Mandatory:** Yes
- **When to use:** Re-run on merged code — the merge commit is new code that was not scanned as a unit before merge
- **When NOT:** Never skip
- **Trade-off:** vs Snyk: same as Phase 2

#### Snyk v1.1280

- **Stage:** SCA (DevSecOps)
- **License:** Commercial — free tier
- **Applies to:** All
- **Output:** SARIF / JSON
- **CI integration:** snyk/actions — triggered on push to main
- **Mandatory:** No
- **When to use:** When Snyk SCA is already in use in Phase 2 — re-run on merged state to update main branch baseline
- **When NOT:** Skip if Trivy covers the requirement
- **Trade-off:** vs Trivy: same as Phase 2

#### OWASP Dependency-Check v10.0

- **Stage:** SCA (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Java/Maven/Gradle / .NET primary
- **Output:** JSON / HTML / SARIF
- **CI integration:** dependency-check/dependency-check-action
- **Mandatory:** No
- **When to use:** Same as Phase 2 — re-run on merged code for NVD-sourced compliance reporting
- **When NOT:** Skip when Trivy covers the requirement
- **Trade-off:** vs Trivy: same as Phase 2

#### osv-scanner v1.8

- **Stage:** SCA (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** All — lockfile-based: npm, pip, Maven, Go, Cargo, RubyGems, NuGet, Composer, Gradle
- **Output:** JSON / table output
- **CI integration:** CLI via google/osv-scanner-action
- **Mandatory:** No
- **When to use:** When Google OSV database coverage is required — broader advisory source than NVD alone; lockfile-based with zero false positives from missing lockfiles
- **When NOT:** Skip when Trivy fs mode is already configured and OSV-specific sourcing is not required by policy
- **Trade-off:** vs Trivy: osv-scanner uses the OSV database (superset of NVD for many ecosystems); Trivy aggregates multiple sources including OSV

#### CodeQL v2.19

- **Stage:** SAST (DevSecOps)
- **License:** MIT / included in GitHub
- **Applies to:** JS/TS, Python, Java, Go, C/C++, Ruby, Swift
- **Output:** SARIF → GitHub Security tab (main branch baseline)
- **CI integration:** github/codeql-action — triggered on push to main
- **Mandatory:** Yes
- **When to use:** Establish the SAST baseline for main. All future Phase 2 PR scans compare against this baseline.
- **When NOT:** Never skip
- **Trade-off:** vs Semgrep: same as Phase 2

#### Semgrep v1.75

- **Stage:** SAST (DevSecOps)
- **License:** LGPL-2.1 / Semgrep Pro commercial
- **Applies to:** All — 100+ language parsers
- **Output:** SARIF / JSON
- **CI integration:** semgrep/semgrep-app-action
- **Mandatory:** No
- **When to use:** Same as Phase 2 — re-run on merged state to update Semgrep main branch baseline
- **When NOT:** Skip if CodeQL covers the requirement
- **Trade-off:** vs CodeQL: same as Phase 2

#### SonarCloud / SonarQube v10.5

- **Stage:** SAST (DevSecOps)
- **License:** LGPL / Commercial
- **Applies to:** JS/TS/Java/Python/Go/C#/Ruby/Kotlin
- **Output:** SonarCloud project dashboard + API JSON
- **CI integration:** SonarSource/sonarcloud-github-action
- **Mandatory:** No
- **When to use:** Same as Phase 2 — re-run on merged state to keep SonarCloud project status current
- **When NOT:** Skip if CodeQL and other SAST tools cover the requirement
- **Trade-off:** vs CodeQL: same as Phase 2

#### FOSSA v3

- **Stage:** License scan (DevSecOps)
- **License:** Commercial — free tier
- **Applies to:** All
- **Output:** JSON / HTML
- **CI integration:** fossa-contrib/fossa-action — triggered on push to main
- **Mandatory:** Yes
- **When to use:** Re-run on merged code — confirm the merge did not introduce a policy-violating dependency from either branch
- **When NOT:** Never skip
- **Trade-off:** vs ORT: same as Phase 2

#### ORT v25.0

- **Stage:** License scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** All
- **Output:** JSON / Web App report
- **CI integration:** oss-review-toolkit/ort-ci-github-action
- **Mandatory:** No
- **When to use:** Same as Phase 2 — re-run on merged monorepo state
- **When NOT:** Skip if FOSSA covers the requirement
- **Trade-off:** vs FOSSA: same as Phase 2

#### licensefinder v7

- **Stage:** License scan (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** JSON / HTML
- **CI integration:** CLI via Docker
- **Mandatory:** No
- **When to use:** Same as Phase 2 — re-run on merged state
- **When NOT:** Skip if FOSSA or ORT covers the requirement
- **Trade-off:** vs FOSSA: same as Phase 2

#### checkov v3

- **Stage:** IaC scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Terraform / Helm / K8s / CloudFormation / Dockerfile / ARM
- **Output:** SARIF / JSON
- **CI integration:** bridgecrewio/checkov-action — triggered on push to main
- **Mandatory:** Conditional
- **When to use:** Re-run on merged IaC state — catch misconfigurations introduced in either branch during the merge
- **When NOT:** Skip for repos with no IaC
- **Trade-off:** vs KICS: same as Phase 2

#### KICS v2.1

- **Stage:** IaC scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Terraform / K8s / Dockerfile / Ansible
- **Output:** SARIF / JSON
- **CI integration:** Checkmarx/kics-github-action
- **Mandatory:** No
- **When to use:** Same as Phase 2 — re-run on merged Terraform state
- **When NOT:** Skip when checkov is sufficient
- **Trade-off:** vs checkov: same as Phase 2

#### Trivy v0.58 (config mode)

- **Stage:** IaC scan (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Terraform / K8s / Dockerfile / Helm
- **Output:** SARIF / JSON
- **CI integration:** aquasecurity/trivy-action with scan-type: config
- **Mandatory:** No
- **When to use:** Same as Phase 2 — reuse existing Trivy installation for IaC scan
- **When NOT:** Skip when checkov is already configured
- **Trade-off:** vs checkov: same as Phase 2

#### Snyk IaC

- **Stage:** IaC scan (DevSecOps)
- **License:** Commercial — free tier
- **Applies to:** Terraform / K8s / CloudFormation / ARM / Helm
- **Output:** JSON + Snyk dashboard
- **CI integration:** snyk/actions/iac
- **Mandatory:** No
- **When to use:** Same as Phase 2 — re-run on merged state for Snyk platform users
- **When NOT:** Skip when checkov is sufficient
- **Trade-off:** vs checkov: same as Phase 2

#### gitleaks v8.21

- **Stage:** Secrets scan (DevSecOps)
- **License:** MIT
- **Applies to:** All
- **Output:** SARIF / JSON
- **CI integration:** gitleaks/gitleaks-action — triggered on push to main
- **Mandatory:** Yes
- **When to use:** Scan the merge commit specifically — a secret that exists in neither parent branch can appear in the merge result
- **When NOT:** Never skip
- **Trade-off:** vs truffleHog: same as Phase 2

#### truffleHog v3.80

- **Stage:** Secrets scan (DevSecOps)
- **License:** AGPL-3.0
- **Applies to:** All
- **Output:** JSON
- **CI integration:** trufflesecurity/trufflehog GitHub Action
- **Mandatory:** No
- **When to use:** Same as Phase 2 — entropy-based detection for non-patterned secrets in the merge commit
- **When NOT:** Skip when gitleaks is sufficient
- **Trade-off:** vs gitleaks: same as Phase 2

#### GitHub Advanced Security — Secret Scanning

- **Stage:** Secrets scan (DevSecOps)
- **License:** Included with GHAS
- **Applies to:** All GitHub-hosted repos
- **Output:** GitHub Security tab alerts (automatic)
- **CI integration:** GitHub native — automatic on push events when GHAS is enabled
- **Mandatory:** No
- **When to use:** Same as Phase 2 — GHAS scans every push to main automatically with no workflow config needed
- **When NOT:** Use gitleaks when GHAS is not available
- **Trade-off:** vs gitleaks: same as Phase 2

#### Docker buildx v0.15 + GHCR

- **Stage:** Build + Push (DevOps)
- **License:** Apache 2.0 / Included in GitHub
- **Applies to:** Container workloads
- **Output:** Image pushed to registry with digest
- **CI integration:** docker/build-push-action with push: true
- **Mandatory:** Conditional
- **When to use:** Default for GitHub-hosted runners — single action builds and pushes with layer caching
- **When NOT:** Use kaniko or Buildah when Docker daemon is unavailable
- **Trade-off:** vs kaniko: Docker buildx needs daemon; kaniko is daemonless and runs inside Kubernetes pods

#### kaniko v1.23

- **Stage:** Build + Push (DevOps)
- **License:** Apache 2.0
- **Applies to:** Container workloads — Kubernetes CI runners
- **Output:** Image pushed to registry with digest
- **CI integration:** gcr.io/kaniko-project/executor
- **Mandatory:** No
- **When to use:** Kubernetes-native CI runners where Docker daemon is unavailable
- **When NOT:** Skip when Docker buildx is sufficient
- **Trade-off:** vs Docker buildx: kaniko runs without daemon; Docker buildx needs daemon access

#### Buildah v1.36

- **Stage:** Build + Push (DevOps)
- **License:** Apache 2.0
- **Applies to:** Container workloads — RHEL / OpenShift environments
- **Output:** OCI image pushed to registry
- **CI integration:** redhat-actions/buildah-build + redhat-actions/push-to-registry
- **Mandatory:** No
- **When to use:** RHEL or OpenShift environments where Red Hat tooling is standardized
- **When NOT:** Skip when Docker buildx or kaniko is already configured
- **Trade-off:** vs kaniko: Buildah is OCI-native and RHEL-standard; kaniko is designed specifically for Kubernetes CI pods

#### semantic-release v24

- **Stage:** Release tag (DevOps)
- **License:** MIT
- **Applies to:** All
- **Output:** Git tag + GitHub Release + CHANGELOG
- **CI integration:** semantic-release/semantic-release GitHub Action
- **Mandatory:** Yes
- **When to use:** Repos using conventional commits — fully automated semver tagging and release notes on every merge
- **When NOT:** Use Release Please when a review PR before tagging is required
- **Trade-off:** vs Release Please: semantic-release tags and publishes immediately on merge; Release Please creates a PR for human review first

#### Release Please v4

- **Stage:** Release tag (DevOps)
- **License:** Apache 2.0
- **Applies to:** All
- **Output:** Release PR + Git tag on merge of that PR
- **CI integration:** googleapis/release-please-action
- **Mandatory:** No
- **When to use:** When the team wants to review and edit release notes before the tag is cut
- **When NOT:** Skip when semantic-release's immediate tagging is acceptable
- **Trade-off:** vs semantic-release: Release Please creates a review PR; semantic-release tags automatically without review

#### Trivy v0.58 (image mode — registry pull)

- **Stage:** Container scan (registry image) (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** SARIF / JSON
- **CI integration:** aquasecurity/trivy-action scanning the pushed registry digest
- **Mandatory:** Yes
- **When to use:** Scans the pushed registry image — the actual artifact that will be signed. Never sign before scanning. Invariant I-P3-1.
- **When NOT:** Never skip
- **Trade-off:** vs Phase 2 container scan: Phase 2 scans a local tarball; Phase 3 scans the registry image to catch base image updates that occurred after Phase 2 ran

#### Grype v0.82

- **Stage:** Container scan (registry image) (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** JSON / table output
- **CI integration:** anchore/scan-action
- **Mandatory:** No
- **When to use:** When Syft SBOM was generated in the same pipeline run and re-scanning from SBOM is faster than a full registry pull
- **When NOT:** Skip when Trivy is already configured
- **Trade-off:** vs Trivy: Grype re-scans from SBOM (faster); Trivy scans the registry image directly every time

#### Docker Scout

- **Stage:** Container scan (registry image) (DevSecOps)
- **License:** Free for GitHub Actions
- **Applies to:** Container images
- **Output:** SARIF / JSON + base image upgrade recommendation
- **CI integration:** docker/scout-action
- **Mandatory:** No
- **When to use:** Docker Hub users wanting base image upgrade paths alongside CVE findings
- **When NOT:** Skip when Trivy or Grype is already configured
- **Trade-off:** vs Trivy: Docker Scout recommends specific base image upgrades; Trivy reports CVEs without upgrade paths

#### cosign v2.4 (keyless OIDC)

- **Stage:** Sign (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** Sigstore signature stored in registry alongside image digest
- **CI integration:** sigstore/cosign-installer
- **Mandatory:** Yes
- **When to use:** Always — Kyverno admission policy blocks unsigned images before pod start
- **When NOT:** Never skip
- **Trade-off:** vs notation (CNCF Notary): cosign uses Sigstore transparency log for public auditability; notation uses X.509 certificate chains

#### Syft v1.6 + cosign v2.4 attest

- **Stage:** SBOM generate + attest (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** CycloneDX JSON SBOM attached as cosign attestation to the registry digest
- **CI integration:** anchore/sbom-action + sigstore/cosign-installer
- **Mandatory:** Yes
- **When to use:** Always — SBOM attestation must be present before Registry stage. Invariant I-P3-2: SBOM after sign.
- **When NOT:** Never skip
- **Trade-off:** vs SPDX format: CycloneDX is NTIA-recommended and VEX-compatible; SPDX is better for license-focused analysis

#### cdxgen v10.1 + cosign v2.4 attest

- **Stage:** SBOM generate + attest (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Java/Maven/Gradle primary
- **Output:** CycloneDX JSON SBOM (class-level) attested via cosign
- **CI integration:** CycloneDX/gh-java-action + sigstore/cosign-installer
- **Mandatory:** No
- **When to use:** Java/Maven/Gradle repos where Syft misses class-level transitive JVM dependencies
- **When NOT:** Use Syft when multi-ecosystem scanning is needed
- **Trade-off:** vs Syft: cdxgen resolves JVM class-level dependencies; Syft is faster and covers more ecosystems

#### slsa-github-generator v2.1

- **Stage:** SLSA provenance (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images + binaries — GitHub Actions CI
- **Output:** SLSA Level 3 provenance JSON attested via cosign
- **CI integration:** slsa-framework/slsa-github-generator reusable workflow
- **Mandatory:** Yes
- **When to use:** GitHub Actions CI — every build producing a promoted artifact. Invariant I-P3-4: SLSA after sign.
- **When NOT:** Use Tekton Chains when CI runs on Tekton Pipelines, not GitHub Actions
- **Trade-off:** vs Tekton Chains: slsa-github-generator works natively in GitHub Actions; Tekton Chains runs as a Kubernetes controller for Tekton CI

#### Tekton Chains v0.22

- **Stage:** SLSA provenance (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Kubernetes — Tekton Pipelines CI only
- **Output:** SLSA provenance stored as TaskRun annotation in the cluster
- **CI integration:** Installed as Kubernetes controller alongside Tekton Pipelines
- **Mandatory:** No
- **When to use:** Kubernetes-native CI using Tekton Pipelines — Chains runs as a controller and signs every TaskRun automatically
- **When NOT:** Skip when using GitHub Actions — use slsa-github-generator instead
- **Trade-off:** vs slsa-github-generator: Tekton Chains signs every TaskRun without workflow changes; slsa-github-generator requires a specific GitHub Actions workflow structure

#### Language test runner (Jest / pytest / JUnit / go test) + Codecov

- **Stage:** Tests + Codecov (DevOps)
- **License:** MIT + Codecov free tier
- **Applies to:** Language-specific
- **Output:** JUnit XML + Codecov JSON report + PR comment
- **CI integration:** codecov/codecov-action
- **Mandatory:** Yes
- **When to use:** Every repo with application code — coverage gates block PRs below the threshold
- **When NOT:** Never skip for application repos
- **Trade-off:** vs Coveralls: Codecov has better GitHub PR comment integration and trend graphs; Coveralls is simpler but has fewer features

#### OWASP ZAP v2.15

- **Stage:** DAST — Dynamic Application Security Testing (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Web apps with HTTP endpoints
- **Output:** SARIF / JSON / HTML
- **CI integration:** zaproxy/action-full-scan against the locally running container
- **Mandatory:** Conditional
- **When to use:** Web applications with exposed HTTP endpoints. Invariant I-P3-6: DAST after tests.
- **When NOT:** Skip for non-HTTP services: batch jobs, CLIs, queue processors, pure gRPC services
- **Trade-off:** vs Nuclei: ZAP does active spider-and-attack scanning; Nuclei runs template-based checks (faster, fewer false-positives)

#### Nuclei v3.3

- **Stage:** DAST — Dynamic Application Security Testing (DevSecOps)
- **License:** MIT
- **Applies to:** HTTP services / APIs / web apps
- **Output:** JSON / SARIF
- **CI integration:** projectdiscovery/nuclei-action
- **Mandatory:** No
- **When to use:** API-heavy services where ZAP's spider-based approach produces excessive false-positives
- **When NOT:** Skip when OWASP ZAP full-scan coverage is sufficient for the web app surface
- **Trade-off:** vs OWASP ZAP: Nuclei uses community templates (fast, low false-positive); ZAP does active spider-and-attack (thorough, more false-positives)

#### k6 v0.53

- **Stage:** Perf test (DevOps)
- **License:** AGPL-3.0
- **Applies to:** HTTP services
- **Output:** JSON + InfluxDB (optional)
- **CI integration:** grafana/k6-action
- **Mandatory:** Conditional
- **When to use:** Any HTTP service with a defined latency SLA — catches regressions before promotion
- **When NOT:** Skip for internal-only services with no latency SLA
- **Trade-off:** vs Artillery: k6 uses JavaScript scripts; Artillery uses YAML scenario definitions — pick based on team preference

#### Artillery v2.0

- **Stage:** Perf test (DevOps)
- **License:** MPL-2.0 / Artillery Pro commercial
- **Applies to:** HTTP / WebSocket / gRPC services
- **Output:** JSON + Artillery Cloud dashboard (optional)
- **CI integration:** artilleryio/artillery-action
- **Mandatory:** No
- **When to use:** Node.js teams preferring YAML-based scenario definitions, or services needing WebSocket load testing
- **When NOT:** Skip when k6 is already configured
- **Trade-off:** vs k6: Artillery uses YAML scenarios (easier to read); k6 uses JavaScript (more flexible for complex logic)

#### Gatling v3.11

- **Stage:** Perf test (DevOps)
- **License:** Apache 2.0 / Gatling Enterprise commercial
- **Applies to:** HTTP / WebSocket services
- **Output:** HTML report + JSON
- **CI integration:** Maven/Gradle plugin or gatling/enterprise-action
- **Mandatory:** No
- **When to use:** JVM-heavy teams (Java/Kotlin/Scala) where Gatling's Scala DSL is the team standard
- **When NOT:** Skip when k6 is already configured and team is not JVM-based
- **Trade-off:** vs k6: Gatling uses Scala/Java DSL and has richer HTML reports; k6 uses JavaScript and is simpler to set up

#### slackapi/slack-github-action v2

- **Stage:** Notify (DevOps)
- **License:** MIT
- **Applies to:** All
- **Output:** Slack message in channel
- **CI integration:** slackapi/slack-github-action
- **Mandatory:** Yes
- **When to use:** Any team using Slack — notifies build success, failure, and image digest on every main build
- **When NOT:** Replace with PagerDuty when build failures require on-call escalation
- **Trade-off:** vs PagerDuty: Slack sends to a shared channel; PagerDuty pages the on-call engineer directly

#### PagerDuty Events API v2

- **Stage:** Notify (DevOps)
- **License:** Commercial
- **Applies to:** All
- **Output:** PagerDuty incident
- **CI integration:** PagerDuty/pagerduty-send-event-action
- **Mandatory:** No
- **When to use:** When Phase 3 build failures require immediate on-call escalation outside business hours
- **When NOT:** Use Slack for notifications that do not require immediate human response
- **Trade-off:** vs Slack: PagerDuty escalates to the on-call engineer; Slack sends to a channel that may not be monitored off-hours

#### Microsoft Teams incoming webhook

- **Stage:** Notify (DevOps)
- **License:** Included in Microsoft 365
- **Applies to:** All
- **Output:** Teams channel message
- **CI integration:** aliencube/microsoft-teams-deploy-card or curl to webhook URL
- **Mandatory:** No
- **When to use:** Organizations where Microsoft Teams is the primary communication tool
- **When NOT:** Skip when Slack is already configured
- **Trade-off:** vs Slack: Teams webhook is free with M365; Slack requires a separate Slack workspace account

#### GitHub Actions + yq v4 + peter-evans/create-pull-request

- **Stage:** GitOps PR (DevOps)
- **License:** MIT
- **Applies to:** All
- **Output:** Pull request bumping the image digest in the target environment overlay
- **CI integration:** peter-evans/create-pull-request GitHub Action
- **Mandatory:** Yes
- **When to use:** Every promotion — the PR is the explicit promotion gate requiring human approval before merge
- **When NOT:** Never use direct push to the GitOps repo — that bypasses the review gate
- **Trade-off:** vs Flux image automation: manual PR gives an explicit review gate; Flux auto-PR removes the human approval step for fully automatic promotion

#### ArgoCD v2.12

- **Stage:** ArgoCD / Flux deploy (DevOps)
- **License:** Apache 2.0
- **Applies to:** Kubernetes
- **Output:** Kubernetes resources reconciled — sync status: Synced / OutOfSync / Degraded
- **CI integration:** ArgoCD CLI / argoproj/argocd-github-action
- **Mandatory:** Yes
- **When to use:** Default GitOps controller — sync Kubernetes manifests from Git with UI visibility and multi-cluster support
- **When NOT:** Use Flux v2 when a UI-free, purely Kubernetes-native controller is required
- **Trade-off:** vs Flux v2: ArgoCD has a UI dashboard and richer RBAC model; Flux is purely API-driven with no UI dependency

#### Flux v2.4

- **Stage:** ArgoCD / Flux deploy (DevOps)
- **License:** Apache 2.0
- **Applies to:** Kubernetes
- **Output:** Kubernetes resources reconciled via Flux CRDs
- **CI integration:** Flux CLI / fluxcd/flux2-github-action
- **Mandatory:** No
- **When to use:** When Kubernetes-native, UI-free GitOps is required — Flux runs as Kubernetes controllers only
- **When NOT:** Skip when ArgoCD is already deployed
- **Trade-off:** vs ArgoCD: Flux has no UI and is fully CRD-driven; ArgoCD has a richer UI and centralized multi-cluster view

#### cosign v2.4 verify

- **Stage:** cosign verify (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** CLI pass/fail — blocks promotion if signature is invalid or missing
- **CI integration:** sigstore/cosign-installer + cosign verify
- **Mandatory:** Yes
- **When to use:** Every promotion in every environment — re-verify before deploying to that environment
- **When NOT:** Never skip — this is the only explicit check between Registry and cluster admission
- **Trade-off:** vs relying on Kyverno alone: cosign verify fails the pipeline before deployment; Kyverno only blocks after a pod is submitted to the API server

#### pytest / Newman (Postman CLI) / k6 — per environment type

- **Stage:** Env tests (DEV / TEST / STAGING) (DevOps)
- **License:** MIT / MIT / AGPL-3.0
- **Applies to:** Stack-specific
- **Output:** JUnit XML / JSON
- **CI integration:** Language-specific GitHub Action
- **Mandatory:** Conditional
- **When to use:** DEV: integration tests. TEST: integration + contract tests. STAGING: regression tests.
- **When NOT:** Replace with Argo Rollouts for PROD — live traffic canary analysis replaces pre-deployment test suites
- **Trade-off:** vs smoke tests only: full env tests catch integration failures; smoke tests only verify the app started and responds

#### GitHub Environments with protection rules

- **Stage:** Gate (DEV / TEST / STAGING) (DevOps)
- **License:** Included in GitHub
- **Applies to:** All
- **Output:** N/A — workflow pauses until explicitly approved
- **CI integration:** GitHub native — Settings → Environments
- **Mandatory:** Conditional
- **When to use:** DEV · TEST · STAGING — explicit human approval required before each promotion
- **When NOT:** Replace with Argo Rollouts + Monitor for PROD
- **Trade-off:** vs automatic promotion on test pass: Gate requires explicit approval; auto-promotion promotes on green tests without human sign-off

#### Argo Rollouts v1.8

- **Stage:** Argo Rollouts — PROD only (replaces Env tests) (DevOps)
- **License:** Apache 2.0
- **Applies to:** Kubernetes — PROD only
- **Output:** Rollout status: progressing / paused / degraded / healthy
- **CI integration:** kubectl argo rollouts plugin + Argo Rollouts controller
- **Mandatory:** Conditional
- **When to use:** PROD only — shifts real traffic gradually to the new version instead of big-bang deploy
- **When NOT:** Skip for DEV / TEST / STAGING — use Gate. Use Flagger when Flux is the GitOps controller.
- **Trade-off:** vs Flagger: Argo Rollouts is native to ArgoCD; Flagger is native to Flux — match to the GitOps controller in use

#### Argo Rollouts AnalysisTemplate + Prometheus v3.0

- **Stage:** Monitor — PROD only (replaces Gate) (DevOps)
- **License:** Apache 2.0
- **Applies to:** Kubernetes — PROD only
- **Output:** Rollout auto-complete or auto-rollback based on live metric analysis
- **CI integration:** Argo Rollouts AnalysisTemplate CRD — no separate CI action needed
- **Mandatory:** Conditional
- **When to use:** PROD only — auto-completes or auto-rolls back based on error rate, latency, and custom SLO metrics
- **When NOT:** Skip for DEV / TEST / STAGING — Gate handles those environments
- **Trade-off:** vs manual monitoring during deploy: automated analysis removes human watch-and-decide; manual monitoring requires someone watching dashboards during the canary window

#### GHCR — GitHub Container Registry

- **Stage:** Image store (DevOps)
- **License:** Included in GitHub
- **Applies to:** All container workloads
- **Output:** Immutable image digest in registry
- **CI integration:** docker/login-action with registry: ghcr.io
- **Mandatory:** Yes
- **When to use:** Default for GitHub repos — zero extra cost, tight OIDC integration
- **When NOT:** Use ECR when AWS VPC endpoint access is required
- **Trade-off:** vs ECR: GHCR needs no AWS account; ECR has deeper AWS IAM and lifecycle policy control

#### ECR — Elastic Container Registry

- **Stage:** Image store (DevOps)
- **License:** AWS — pay per GB
- **Applies to:** AWS workloads
- **Output:** Immutable image digest in registry
- **CI integration:** aws-actions/amazon-ecr-login
- **Mandatory:** No
- **When to use:** AWS workloads requiring VPC endpoint registry access or cross-account pull policies
- **When NOT:** Skip when not on AWS
- **Trade-off:** vs GHCR: ECR has deeper AWS IAM integration; GHCR needs no AWS account

#### Google Artifact Registry

- **Stage:** Image store (DevOps)
- **License:** Google Cloud — pay per GB stored + transferred
- **Applies to:** GCP workloads
- **Output:** Immutable image digest in registry
- **CI integration:** google-github-actions/auth + docker/login-action with registry: [region]-docker.pkg.dev
- **Mandatory:** No
- **When to use:** GCP workloads requiring Artifact Analysis (CVE scanning), VPC Service Controls, or Binary Authorization integration
- **When NOT:** Skip when not on GCP
- **Trade-off:** vs GHCR: Artifact Registry integrates with GCP Binary Authorization and Artifact Analysis natively; GHCR needs no GCP account

#### Harbor v2.11

- **Stage:** Image store (DevOps)
- **License:** Apache 2.0 (self-hosted)
- **Applies to:** All container workloads — on-premises or private cloud
- **Output:** Immutable image digest + built-in scan results
- **CI integration:** Docker login + push to Harbor domain
- **Mandatory:** No
- **When to use:** On-premises or air-gapped environments where cloud registries are prohibited by security policy
- **When NOT:** Use GHCR or ECR when cloud-hosted registry is acceptable
- **Trade-off:** vs GHCR: Harbor is fully self-hosted with built-in Trivy scanning and replication; GHCR needs no infrastructure management

#### Docker Hub

- **Stage:** Image store (DevOps)
- **License:** Commercial — free tier for public images; paid for private
- **Applies to:** All container workloads
- **Output:** Image digest in public or private registry
- **CI integration:** docker/login-action with registry: docker.io
- **Mandatory:** No
- **When to use:** Public open-source images that need maximum pull accessibility across all cloud providers and tools
- **When NOT:** Use GHCR for private repos — Docker Hub's free tier rate-limits unauthenticated pulls
- **Trade-off:** vs GHCR: Docker Hub has maximum public reach; GHCR is free for private GitHub repos with no rate limits

#### cosign v2.4 verify

- **Stage:** Sign verify (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** CLI pass/fail — exits non-zero if signature is invalid or missing
- **CI integration:** sigstore/cosign-installer + cosign verify
- **Mandatory:** Yes
- **When to use:** Re-verify after push to registry — confirms the pushed digest matches the signed digest before any promotion
- **When NOT:** Never skip — Kyverno also blocks unsigned images at admission but only when a pod is submitted
- **Trade-off:** vs Kyverno admission check alone: cosign verify is an explicit pre-promotion check; Kyverno blocks at deployment but does not block registry storage

#### cosign v2.4 attach sbom

- **Stage:** SBOM attach (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** SBOM stored as OCI artifact attached to the registry digest
- **CI integration:** sigstore/cosign-installer + cosign attach sbom
- **Mandatory:** Yes
- **When to use:** Always — SBOM must be retrievable from the registry digest before any consumer or promotion can use it
- **When NOT:** Never skip
- **Trade-off:** vs oras CLI: cosign stores SBOM as a Sigstore attestation with provenance; oras stores as an arbitrary OCI artifact without signing

#### slsa-verifier v2.5 + cosign v2.4

- **Stage:** SLSA attach (DevSecOps)
- **License:** Apache 2.0
- **Applies to:** Container images
- **Output:** SLSA provenance attached as OCI artifact + verification pass/fail
- **CI integration:** slsa-framework/slsa-verifier action
- **Mandatory:** Yes
- **When to use:** Always — SLSA provenance must be attached and verified before any promotion starts. SLSA Level 3 requires this.
- **When NOT:** Never skip
- **Trade-off:** vs in-toto verification: slsa-verifier is SLSA-native with no custom layout; in-toto requires a custom supply chain layout file

## B.2 Compliance regimes — all 26

Every regime: what it forces, the controls, audit retention, data residency, how to meet it.

### PIPEDA — Personal Information Protection and Electronic Documents Act

- **Region:** CA
- **Regulator:** Office of the Privacy Commissioner of Canada (OPC)
- **Applies to:** saas, fintech, ecommerce, healthtech, edtech, insurance, marketing, telecom
- **Forces:** runtime = any-patched-distro, auth = consent-gated-access + RBAC, observability = access-audit-log (actor, action, resource, request-id, ts), data = PII field-level encryption + masking (name, email, phone, address, SIN), network = X-Data-Residency: CA header; TLS 1.2+ in transit
- **Required controls:** Meaningful consent capture before collection/use/disclosure (10 fair information principles), Breach reporting to OPC and affected individuals when real risk of significant harm (RROSH), Breach record-keeping for ALL breaches regardless of harm threshold, Right of access and correction workflow with 30-day response SLA, Encryption at rest (AES-256) and in transit (TLS 1.2+), Data minimization and purpose limitation enforced at API layer, Accountability: designated Privacy Officer and documented privacy program
- **Audit retention:** Breach records: minimum 24 months from determination. Consent + access logs: retain for life of relationship plus limitation period (commonly 7 years).
- **Data residency:** No hard residency mandate, but cross-border transfer requires comparable-protection contracts and transparency; Canadian region strongly recommended.
- **How to meet:**
  - Deploy a consent gate middleware: block POST/PUT/PATCH lacking X-Consent: granted, return 451.
  - Implement field-level masking in the logger for name/email/phone/address/SIN before any sink.
  - Stand up an OPC breach-notification runbook with RROSH assessment template and 72h internal trigger.
  - Build access/correction request API backed by an immutable audit trail (e.g. append-only Postgres + S3 Object Lock).
  - Pin TLS 1.2+ (prefer 1.3) and AES-256 at-rest via KMS-managed keys in a Canadian region.

### PHIPA — Personal Health Information Protection Act (Ontario)

- **Region:** CA
- **Regulator:** Information and Privacy Commissioner of Ontario (IPC)
- **Applies to:** healthtech, hospital, ehr, pharmacy, insurance, telehealth
- **Forces:** runtime = auditd-capable distro (Debian 12 / Ubuntu 24.04 / RHEL UBI 9), auth = RBAC + break-glass with mandatory justification, observability = PHI access audit log (who accessed which record, when, why), data = PHI encryption at rest + masking (MRN, diagnosis, DOB, patientName), network = Canadian/Ontario region; no PHI egress without lockbox/agreement
- **Required controls:** Audit log of every PHI access including agent identity, record, purpose, timestamp, Lockbox support: individual can withhold/withdraw consent for specific HIC sharing, Health Information Custodian (HIC) and electronic service provider (ESP/agent) agreements, Breach notification to individual and IPC Ontario at first reasonable opportunity, Mandatory IPC statistical reporting of PHI breaches annually (since 2018), Role-based minimum-necessary access; break-glass logged and reviewed, De-identification standard for secondary use / research
- **Audit retention:** PHI and access logs: minimum 10 years after last service or, for minors, 10 years past age of majority (aligns with Ontario medical records retention).
- **Data residency:** Ontario/Canada strongly required; PHI hosted by ESP must remain under HIC control with written agreement and no unauthorized foreign access.
- **How to meet:**
  - Run auditd + app-level PHI access log keyed by clinician ID, record ID, and access reason.
  - Implement lockbox flags on patient records that hard-block downstream disclosure APIs.
  - Sign HIC/ESP agreements and pin hosting to a Canadian region (ca-central-1 / Canada Central).
  - Wire an IPC Ontario breach runbook with first-reasonable-opportunity notification trigger.
  - Mask MRN/diagnosis/DOB/patientName in all logs and enforce minimum-necessary RBAC.

### PIPA-AB — Personal Information Protection Act (Alberta)

- **Region:** CA
- **Regulator:** Office of the Information and Privacy Commissioner of Alberta
- **Applies to:** saas, retail, fintech, healthtech, insurance
- **Forces:** runtime = any-patched-distro, auth = consent + RBAC, observability = access + breach audit log, data = PII encryption + masking, network = TLS 1.2+; residency-aware logging
- **Required controls:** Mandatory breach notification to Alberta OIPC where real risk of significant harm exists, OIPC determines whether affected individuals must be notified (unique to Alberta), Consent for collection/use/disclosure with opt-out for non-sensitive secondary use, Reasonable safeguards proportional to sensitivity, Access and correction rights with statutory response timelines, Cross-border transfer notice to individuals when PI handled outside Canada
- **Audit retention:** Breach assessment records retained to evidence OIPC reporting; PI retained only as long as reasonable for legal/business purpose, then destroyed (recommend 7 years for commercial records).
- **Data residency:** No strict residency, but must disclose to individuals if PI is stored/processed outside Canada and by whom.
- **How to meet:**
  - Implement RROSH assessment and report breaches to Alberta OIPC (note: OIPC, not the org, decides on individual notice).
  - Add a cross-border transfer disclosure to the privacy notice naming foreign processors.
  - Enforce consent capture and opt-out for secondary uses at the collection API.
  - Encrypt PI at rest/in transit and mask identifiers in logs.
  - Build access/correction request handling with statutory SLA tracking.

### PIPA-BC — Personal Information Protection Act (British Columbia)

- **Region:** CA
- **Regulator:** Office of the Information and Privacy Commissioner for British Columbia
- **Applies to:** saas, retail, fintech, healthtech, publicsector-contractor
- **Forces:** runtime = any-patched-distro, auth = consent + RBAC, observability = access audit log, data = PII encryption + masking, network = Canada-preferred residency; TLS 1.2+
- **Required controls:** Consent (express/implied/deemed) for collection, use, disclosure, Reasonable security arrangements against unauthorized access, Access and correction rights with 30-business-day response, Privacy Officer designation and complaint process, Historic data-residency sensitivity from FIPPA legacy for public-sector contracts, Breach handling per BC OIPC guidance (mandatory notification added via 2025 amendments)
- **Audit retention:** PI retained at least one year if used to make a decision about an individual; commercial records recommend 7 years. Breach records retained to evidence OIPC compliance.
- **Data residency:** Private sector: Canada-preferred. Public-sector contracts under FIPPA historically required BC/Canada storage; confirm contract clauses.
- **How to meet:**
  - Capture and version consent records tied to each collection purpose.
  - Add 30-business-day access/correction request workflow with audit trail.
  - For public-sector contracts, pin storage and processing to a Canadian region and document it.
  - Designate a Privacy Officer and publish a complaints channel.
  - Implement BC OIPC breach-notification trigger per 2025 mandatory-reporting amendments.

### Law25-Quebec — Quebec Law 25 (Act to modernize legislative provisions respecting protection of personal information)

- **Region:** CA
- **Regulator:** Commission d'accès à l'information du Québec (CAI)
- **Applies to:** saas, fintech, ecommerce, adtech, healthtech, insurance
- **Forces:** runtime = any-patched-distro, auth = consent (explicit for sensitive) + RBAC + privacy-by-default, observability = confidentiality-incident register + access log, data = PII encryption, automated-decision flagging, de-indexing/portability, network = cross-border transfer impact assessment (PIA) required
- **Required controls:** Privacy by default: highest-confidentiality settings enabled without user action, Explicit, separate consent for sensitive personal information, Confidentiality Incident (breach) notification to CAI and individuals on serious risk of harm, Maintain a confidentiality incident register for ALL incidents, Privacy Impact Assessment (PIA) before any cross-border transfer or new system, Automated decision-making transparency + right to human review, Right to data portability (in force) and de-indexing/erasure, Designated Privacy Officer (default: highest authority) published publicly
- **Audit retention:** Confidentiality incident register: indefinite/long-term to evidence CAI compliance (recommend 7+ years). PI destroyed or anonymized once purpose fulfilled.
- **Data residency:** Quebec/Canada strongly favored; any transfer outside Quebec requires a documented PIA assessing adequacy of protection.
- **How to meet:**
  - Default all privacy/visibility settings to most protective; require opt-in to loosen.
  - Separate explicit consent capture for sensitive PI categories at the API.
  - Stand up a confidentiality incident register and CAI notification runbook (serious-risk trigger).
  - Run and archive a PIA before any cross-border data transfer or new processing system.
  - Expose automated-decision flags and a human-review request path; implement portability + de-indexing endpoints.

### PCI-DSS-4 — Payment Card Industry Data Security Standard v4.0.1

- **Region:** global
- **Regulator:** PCI Security Standards Council (enforced via acquiring banks / card brands)
- **Applies to:** fintech, ecommerce, retail, payments, saas
- **Forces:** runtime = minimal-footprint (Distroless/Wolfi) — PCI 6.3.3 no unnecessary software, auth = MFA for all CDE access (12.x), phishing-resistant where possible, observability = immutable audit trail, FIM, daily log review, 12-month retention, data = PAN truncation/tokenization, strong cryptography, no storage of SAD, network = segmented CDE, default-deny, TLS 1.2+ (prefer 1.3), WAF/payment-page integrity
- **Required controls:** Render PAN unreadable (truncation, tokenization, or strong crypto) — never store SAD after auth, MFA for ALL access into the CDE (v4.0 expanded from admin-only), Network segmentation isolating the cardholder data environment, File integrity monitoring (FIM) and change-detection on critical files, Client-side script integrity + payment-page tamper detection (6.4.3, 11.6.1) — mandatory since 31 Mar 2025, Targeted risk analysis (TRA) for any control frequency the org defines, Quarterly ASV external scans + annual penetration testing, Automated log review mechanisms (v4 future-dated requirement now in force)
- **Audit retention:** Audit logs: minimum 12 months, with at least 3 months immediately available for analysis (Req 10.5.1).
- **Data residency:** No geographic mandate; residency follows acquirer/issuer contracts and applicable privacy law (e.g. Canadian region for PIPEDA overlap).
- **How to meet:**
  - Tokenize PAN at ingest; ensure SAD (CVV, full track, PIN) is never persisted post-authorization.
  - Deploy Distroless/Wolfi images and remove all non-essential packages to pass 6.3.3.
  - Enforce MFA on every CDE entry point and segment the CDE with default-deny network policy.
  - Add 6.4.3/11.6.1 payment-page script inventory + SRI + change alerting (now mandatory).
  - Centralize immutable logs (12-month retention), run FIM, schedule ASV quarterly scans + annual pentest.

### HIPAA — Health Insurance Portability and Accountability Act (Privacy + Security Rules)

- **Region:** US
- **Regulator:** US Department of Health and Human Services, Office for Civil Rights (HHS OCR)
- **Applies to:** healthtech, hospital, ehr, pharmacy, insurance, telehealth
- **Forces:** runtime = auditd-capable distro (Debian 12 / Ubuntu 24.04 / RHEL UBI 9), auth = unique user IDs, RBAC, automatic logoff, MFA (2025 NPRM trend), observability = PHI access audit controls + integrity monitoring, data = ePHI encryption at rest + in transit, PHI masking in logs, network = transmission security (TLS), segmentation, BAA-backed cloud
- **Required controls:** Administrative, Physical, and Technical safeguards per Security Rule §164.312, Access control with unique user identification and automatic logoff, Audit controls recording ePHI access and activity, Integrity controls + transmission security (encryption in transit), Encryption at rest as an addressable-but-effectively-required safeguard, Business Associate Agreements (BAA) with every vendor touching ePHI, Breach notification to individuals, HHS, and media (60-day rule) on unsecured PHI, Annual risk analysis and risk management documentation
- **Audit retention:** HIPAA documentation (policies, risk analyses, BAAs, audit logs): retain 6 years from creation or last effective date (§164.316(b)(2)).
- **Data residency:** No US-only mandate; offshore handling permitted under a compliant BAA, though many covered entities contractually restrict to US.
- **How to meet:**
  - Sign BAAs with all ePHI-handling vendors before any data flows.
  - Enable auditd + app-level PHI access logging; mask SSN/MRN/diagnosis/DOB in logs.
  - Encrypt ePHI at rest (AES-256) and in transit (TLS 1.2+) with KMS-managed keys.
  - Run an annual Security Rule risk analysis and remediate to a documented risk-management plan.
  - Stand up a 60-day breach-notification runbook covering individuals, HHS OCR, and media thresholds.

### SOC1 — SOC 1 (SSAE 18 / ISAE 3402) Report on Controls Relevant to Financial Reporting

- **Region:** global
- **Regulator:** AICPA framework; attested by an independent CPA firm (no government regulator)
- **Applies to:** fintech, payroll, saas, payments, lending, insurance
- **Forces:** runtime = change-controlled, hardened images, auth = RBAC + segregation of duties on financially-relevant systems, observability = immutable audit log of changes affecting financial data, data = integrity controls over transaction processing (ICFR), network = controlled access to financial-reporting systems
- **Required controls:** Defined control objectives tied to user entities' internal control over financial reporting (ICFR), Segregation of duties between development, deployment, and financial operations, Change management with approvals and traceability for financial systems, Logical access controls and access reviews on financial-data systems, Type II covers operating effectiveness over a 6–12 month observation period, Complementary User Entity Controls (CUECs) documented for clients
- **Audit retention:** Control evidence and report period documentation retained ≥7 years to align with SOX/financial audit cycles.
- **Data residency:** No residency mandate; driven by user-entity contracts and overlapping privacy regimes.
- **How to meet:**
  - Define control objectives mapped to client ICFR (e.g. completeness/accuracy of transaction processing).
  - Enforce segregation of duties and approval gates on all financially-relevant deploys.
  - Maintain immutable change logs and quarterly logical-access reviews.
  - Run a Type II observation window of 6–12 months with auditor evidence collection.
  - Document CUECs so client auditors can rely on the report.

### SOC2-TypeII — SOC 2 Type II (SSAE 18) Trust Services Criteria Report

- **Region:** global
- **Regulator:** AICPA framework; attested by an independent CPA firm (no government regulator)
- **Applies to:** saas, fintech, healthtech, platform, devtools, data
- **Forces:** runtime = hardened, patched, change-controlled images, auth = MFA + RBAC + least privilege + periodic access reviews, observability = centralized immutable logging, monitoring, alerting, data = encryption at rest/in transit, data classification, secure disposal, network = segmentation, default-deny, vulnerability management
- **Required controls:** Security (Common Criteria) mandatory; Availability/Confidentiality/Processing Integrity/Privacy optional, Type II tests operating effectiveness over a 3–12 month period (commonly 6–12), MFA, least-privilege RBAC, and documented quarterly access reviews, Change management, vulnerability management, and incident response programs, Centralized immutable audit logging with monitoring and alerting, Vendor risk management and annual risk assessment, Encryption at rest and in transit with documented key management
- **Audit retention:** Control evidence retained for the audit period plus ≥1 year; most orgs keep 7 years. Audit logs commonly retained ≥1 year (security incidents longer).
- **Data residency:** No mandate; region selection driven by customer contracts and overlapping privacy law (Canadian region for PIPEDA/PHIPA clients).
- **How to meet:**
  - Select the Common Criteria plus relevant TSCs (typically Availability + Confidentiality).
  - Enforce MFA, least-privilege RBAC, and run quarterly access reviews with evidence.
  - Centralize immutable logs with monitoring/alerting and a tested incident-response runbook.
  - Operate change/vuln management programs and an annual risk assessment.
  - Run a 6–12 month Type II observation window and remediate exceptions before report issuance.

### ISO27001 — ISO/IEC 27001:2022 Information Security Management System

- **Region:** global
- **Regulator:** Accredited certification body (e.g. BSI, Schellman); ISO/IEC standard, no government regulator
- **Applies to:** saas, fintech, healthtech, manufacturing, government, platform
- **Forces:** runtime = hardened images under documented config management, auth = access control policy, MFA, least privilege (Annex A 5.15–5.18, 8.5), observability = logging + monitoring (A.8.15, A.8.16), data = classification, cryptography, data masking (A.8.10–8.12, 8.24), network = network security + segregation (A.8.20–8.22)
- **Required controls:** ISMS with documented scope, risk assessment, and risk treatment plan (Statement of Applicability), Annex A 2022: 93 controls across 4 themes (Organizational, People, Physical, Technological), Leadership commitment, security objectives, and internal audit program, Threat intelligence, secure development, and config management (new 2022 controls), Logging, monitoring, and information-deletion controls, Management review and continual improvement cycle, Mandatory transition to 2022 revision completed (2013 certs expired Oct 2025)
- **Audit retention:** Certification cycle: 3 years with annual surveillance audits. ISMS records and risk documentation retained ≥3 years (recommend full cert cycle + 1).
- **Data residency:** No mandate; residency handled as a risk-treatment decision within the ISMS scope.
- **How to meet:**
  - Define ISMS scope, run a risk assessment, and produce a Statement of Applicability against the 93 Annex A controls.
  - Implement 2022 control additions: threat intel, secure coding, config management, data masking.
  - Operate logging/monitoring and information-deletion controls across in-scope systems.
  - Run internal audits and a management review before the Stage 2 certification audit.
  - Maintain annual surveillance evidence and continual-improvement records through the 3-year cycle.

### ISO27017 — ISO/IEC 27017:2015 Code of Practice for Cloud Services Security

- **Region:** global
- **Regulator:** Accredited certification body; ISO/IEC standard (typically certified together with ISO 27001)
- **Applies to:** saas, cloud, platform, fintech, healthtech
- **Forces:** runtime = cloud-hardened images with shared-responsibility clarity, auth = cloud IAM, tenant isolation, admin operational security, observability = cloud monitoring, customer-accessible logs, data = VM/storage encryption, secure return/removal of customer assets, network = virtual network segregation, tenant isolation
- **Required controls:** Extends ISO 27001/27002 with 7 cloud-specific controls + cloud-context guidance, Clear shared-responsibility allocation between cloud provider and customer, Segregation in virtual computing environments (tenant isolation), Virtual machine hardening and administrator operational security, Customer monitoring of cloud service activity (provider must enable), Alignment of security management for virtual and physical networks, Removal/return of customer assets on contract termination
- **Audit retention:** Follows ISO 27001 cycle: 3-year certification, annual surveillance; records ≥3 years.
- **Data residency:** No mandate; provider must disclose data locations so customers can meet their own residency obligations.
- **How to meet:**
  - Publish a shared-responsibility matrix mapping each control to provider vs customer.
  - Implement strong tenant isolation and VM hardening baselines in the virtual environment.
  - Expose customer-accessible monitoring/logging of their cloud service usage.
  - Define and test secure asset return/deletion on offboarding.
  - Certify alongside ISO 27001 with the 27017 cloud controls in the Statement of Applicability.

### FedRAMP-Mod — FedRAMP Moderate Baseline (NIST SP 800-53 Rev 5)

- **Region:** US
- **Regulator:** FedRAMP PMO (GSA) + authorizing federal agency
- **Applies to:** govtech, saas, cloud, defense-adjacent
- **Forces:** runtime = FIPS-validated crypto, hardened CIS-benchmarked images, US-based ops, auth = PIV/CAC or phishing-resistant MFA, RBAC, least privilege, observability = continuous monitoring (ConMon), SIEM, monthly scans, data = FIPS 140-3 encryption at rest/in transit, US data residency, network = boundary protection, TIC/zero-trust, US-only access
- **Required controls:** ~323 NIST 800-53 Rev 5 controls at the Moderate impact level, FIPS 140-2/140-3 validated cryptographic modules for all crypto, Continuous Monitoring (ConMon): monthly vulnerability scans + POA&M management, US persons supporting the system; US-based data centers, Authorization to Operate (ATO) via Agency or the FedRAMP PMO (post-2024 modernization: rev5 + automation), Incident reporting to US-CERT/CISA within 1 hour for confirmed incidents, Annual assessment by an accredited 3PAO
- **Audit retention:** Audit records retained ≥90 days online and ≥1 year archived (AU-11); many agencies require 3 years. Authorization package maintained for the life of the ATO.
- **Data residency:** US data residency required; data and processing must remain within the US, supported by US persons.
- **How to meet:**
  - Deploy in a FedRAMP-authorized US cloud region with FIPS 140-3 validated crypto end-to-end.
  - Implement the Moderate control set; build an SSP, SAP, SAR, and POA&M with a 3PAO.
  - Stand up ConMon: monthly scans, POA&M tracking, and SIEM-backed continuous monitoring.
  - Enforce phishing-resistant MFA (PIV/CAC or FIDO2) and US-persons access restrictions.
  - Pursue Agency or PMO ATO and maintain 1-hour CISA incident reporting.

### FedRAMP-High — FedRAMP High Baseline (NIST SP 800-53 Rev 5)

- **Region:** US
- **Regulator:** FedRAMP PMO (GSA) + authorizing federal agency
- **Applies to:** govtech, defense, law-enforcement, healthcare-federal
- **Forces:** runtime = FIPS-validated crypto, STIG/CIS-hardened images, US-citizen ops where required, auth = PIV/CAC + phishing-resistant MFA, strict least privilege, JIT access, observability = real-time ConMon, full SIEM, automated POA&M, data = FIPS 140-3 encryption, US residency, strict data-loss prevention, network = hardened boundary, micro-segmentation, GovCloud isolation
- **Required controls:** ~410 NIST 800-53 Rev 5 controls at the High impact level (loss = catastrophic), Used for the most sensitive unclassified data (law enforcement, emergency services, financial, health), Typically deployed in AWS GovCloud / Azure Government / equivalent isolated regions, FIPS 140-3 validated cryptography mandatory throughout, Enhanced continuous monitoring with tighter POA&M remediation timelines, Stringent personnel screening and US-citizen support requirements, 1-hour CISA incident reporting and annual 3PAO assessment
- **Audit retention:** Audit records ≥90 days online, ≥1 year archived (often 3+ years for High). Authorization package maintained for the ATO lifetime.
- **Data residency:** US data residency in isolated government cloud regions (GovCloud/Azure Gov); US-citizen support commonly required.
- **How to meet:**
  - Deploy in AWS GovCloud / Azure Government with full FIPS 140-3 validated crypto.
  - Implement the High control set (~410 controls) with STIG-hardened images.
  - Run real-time ConMon with automated POA&M and tighter remediation SLAs.
  - Enforce US-citizen support, personnel screening, and JIT least-privilege access.
  - Engage a 3PAO for the High assessment and maintain 1-hour CISA reporting.

### FIPS-140-3 — FIPS 140-3 (Security Requirements for Cryptographic Modules)

- **Region:** US
- **Regulator:** NIST Cryptographic Module Validation Program (CMVP), joint US NIST / Canada CCCS
- **Applies to:** govtech, defense, fintech, healthcare-federal, cloud
- **Forces:** runtime = FIPS-validated OpenSSL/crypto module; RHEL UBI 9 / Amazon Linux 2023 / Oracle Linux 9, auth = FIPS-approved algorithms for all key exchange and authentication, observability = crypto self-test logging, module-state monitoring, data = FIPS-approved ciphers only (AES, SHA-2/3, RSA/ECDSA approved curves), network = TLS limited to FIPS-approved cipher suites
- **Required controls:** Use only CMVP-validated cryptographic modules (validation certificate on the NIST CMVP list), FIPS-approved algorithms only: AES, SHA-2/SHA-3, RSA-2048+, ECDSA P-256/384, approved DRBGs, Power-on self-tests (POST) and conditional self-tests with documented failure handling, Module enters an error state and halts crypto on self-test failure, Based on ISO/IEC 19790:2012 (FIPS 140-3 supersedes 140-2; 140-2 modules sunset), Avoid musl-based distros (Alpine/Wolfi) lacking FIPS-validated OpenSSL
- **Audit retention:** Validation certificate and module documentation retained for the operational life of the module; crypto self-test logs retained per overlapping regime (≥1 year).
- **Data residency:** Not a residency standard; applied alongside FedRAMP/CMMC which impose US residency.
- **How to meet:**
  - Select a base image with CMVP-validated OpenSSL FIPS provider (RHEL UBI 9 / Amazon Linux 2023 / Oracle Linux 9).
  - Enable FIPS mode at the OS and runtime; restrict TLS to FIPS-approved cipher suites only.
  - Add a startup check that fatally exits if the OpenSSL FIPS provider is not active.
  - Restrict all crypto to FIPS-approved algorithms and validated DRBGs.
  - Verify the exact module version against the NIST CMVP validated-modules list before shipping.

### CMMC-L2 — Cybersecurity Maturity Model Certification Level 2 (NIST SP 800-171 Rev 2)

- **Region:** US
- **Regulator:** US Department of Defense (DoD CIO) via DFARS; assessed by C3PAOs accredited by the Cyber AB
- **Applies to:** defense, manufacturing, aerospace, govtech-contractor
- **Forces:** runtime = FIPS-validated crypto, hardened images, CUI-marked data handling, auth = MFA, RBAC, least privilege, session lock (800-171 3.1/3.5), observability = audit + accountability (3.3), log review, FIM, data = FIPS-validated encryption of CUI at rest/in transit (3.13), network = boundary protection, no unauthorized egress (3.13)
- **Required controls:** 110 controls from NIST SP 800-171 Rev 2 across 14 families, Protects Controlled Unclassified Information (CUI) in the defense supply chain, MFA, audit logging, FIPS-validated cryptography, and incident response, Level 2 final rule (32 CFR) effective Dec 2024; 48 CFR DFARS rule phasing into contracts through 2025–2028, Triennial third-party assessment by a C3PAO (for prioritized CUI) + annual affirmation, Supplier Performance Risk System (SPRS) score posting, DFARS 252.204-7012 incident reporting to DoD within 72 hours
- **Audit retention:** Audit logs retained ≥90 days active and ≥1 year (3.3.1); assessment evidence retained for the 3-year certification cycle. SSP/POA&M maintained continuously.
- **Data residency:** CUI must be handled within the US or a US-controlled environment; cloud must meet FedRAMP Moderate equivalency.
- **How to meet:**
  - Implement all 110 NIST 800-171 controls; produce an SSP and POA&M, post the SPRS score.
  - Use FIPS-validated crypto for CUI at rest/in transit and a FedRAMP-Moderate-equivalent cloud.
  - Enforce MFA, least privilege, audit logging (≥1 year), and FIM in the CUI enclave.
  - Set NO_EGRESS / boundary controls and mark/segregate CUI explicitly.
  - Engage a C3PAO for the triennial assessment and file the annual affirmation + 72-hour DoD incident reporting.

### NERC-CIP — NERC Critical Infrastructure Protection Standards (CIP-002 through CIP-014)

- **Region:** US
- **Regulator:** North American Electric Reliability Corporation (NERC), overseen by FERC (US) and provincial bodies (Canada)
- **Applies to:** energy, utilities, grid-operations, ot
- **Forces:** runtime = OT/IT-boundary-aware, hardened images, baseline config control (CIP-010), auth = electronic access controls, MFA for interactive remote access (CIP-005), observability = security event monitoring + logging (CIP-007), data = BES Cyber System Information protection (CIP-011), network = Electronic Security Perimeter, no unauthorized egress (CIP-005)
- **Required controls:** Categorize BES Cyber Systems as High/Medium/Low impact (CIP-002), Electronic Security Perimeter and Intermediate System for remote access (CIP-005), System security management: ports/services, patching, malware, logging (CIP-007), Configuration change management and vulnerability assessments (CIP-010), Incident reporting to E-ISAC and CISA (CIP-008), Personnel & training, physical security, and supply-chain risk (CIP-004/006/013), Recovery plans for BES Cyber Systems (CIP-009)
- **Audit retention:** Compliance evidence retained for 3 calendar years (or since last audit, whichever is longer); security event logs retained ≥90 days minimum per CIP-007.
- **Data residency:** No explicit residency, but BES Cyber System Information access and OT systems are tightly geofenced within North American grid operator control.
- **How to meet:**
  - Categorize BES Cyber Systems and define the Electronic Security Perimeter (CIP-005).
  - Enforce OT/IT boundary controls, NO_EGRESS, and MFA for interactive remote access via an Intermediate System.
  - Implement CIP-007 system hardening, patch management, malware prevention, and event logging.
  - Run CIP-010 configuration baselines, change management, and vulnerability assessments.
  - Maintain CIP-008 incident response with E-ISAC/CISA reporting and CIP-009 recovery plans.

### GDPR — General Data Protection Regulation (EU 2016/679)

- **Region:** EU
- **Regulator:** National Data Protection Authorities coordinated via the European Data Protection Board (EDPB)
- **Applies to:** saas, ecommerce, adtech, fintech, healthtech, any-eu-data
- **Forces:** runtime = any-patched-distro with privacy-by-design defaults, auth = RBAC, least privilege, consent/legal-basis enforcement, observability = processing records (Art 30), breach evidence, data = encryption/pseudonymization, DSAR/erasure tooling, data classification, network = EU/adequacy transfer controls (SCCs/adequacy), TLS 1.2+
- **Required controls:** Lawful basis for every processing activity (consent, contract, legitimate interest, etc.), Data subject rights: access, rectification, erasure, portability, objection (1-month SLA), Records of processing activities (Article 30), Breach notification to supervisory authority within 72 hours of awareness, Data Protection Impact Assessment (DPIA) for high-risk processing, Privacy by design and by default (Article 25); DPO where required, International transfer mechanism: adequacy decision or SCCs + transfer impact assessment, Pseudonymization/encryption as Article 32 security measures
- **Audit retention:** Records of processing kept while processing continues; breach records retained to evidence compliance (recommend 3–7 years). Personal data only as long as necessary, then erased.
- **Data residency:** No strict EU-residency mandate, but transfers outside the EEA require an adequacy decision or SCCs + a transfer impact assessment.
- **How to meet:**
  - Map every processing activity to a lawful basis and maintain Article 30 records.
  - Build DSAR tooling for access/erasure/portability with a 1-month response SLA.
  - Stand up a 72-hour supervisory-authority breach-notification runbook.
  - Apply SCCs + transfer impact assessment for any non-adequate-country transfer.
  - Implement encryption/pseudonymization and run DPIAs for high-risk processing.

### CCPA — California Consumer Privacy Act, as amended by CPRA

- **Region:** US
- **Regulator:** California Privacy Protection Agency (CPPA) + California Attorney General
- **Applies to:** saas, ecommerce, adtech, retail, fintech
- **Forces:** runtime = any-patched-distro, auth = RBAC + identity verification for consumer requests, observability = request handling audit log, data = opt-out / Do-Not-Sell-or-Share signals (GPC), sensitive-PI limits, network = TLS 1.2+; Global Privacy Control honoring at the edge
- **Required controls:** Consumer rights: know, delete, correct, opt-out of sale/sharing, limit sensitive PI use, Honor Global Privacy Control (GPC) browser signal as a valid opt-out, Notice at collection + clear 'Do Not Sell or Share My Personal Information' link, 45-day response window (extendable to 90) for consumer requests, Reasonable security procedures (CPRA private right of action for breaches), Data Processing Agreements with service providers/contractors, Risk assessments and cybersecurity audits (CPPA regulations phasing in 2026–2028)
- **Audit retention:** Records of consumer requests and responses retained ≥24 months (CCPA recordkeeping requirement). Personal information retained only as disclosed.
- **Data residency:** No residency mandate; applies to California residents' data regardless of where processed.
- **How to meet:**
  - Implement GPC honoring at the edge/CDN as an automatic opt-out of sale/sharing.
  - Add 'Do Not Sell or Share' + notice-at-collection and a verified consumer-request flow.
  - Track all requests with a ≥24-month audit log and a 45-day (max 90) SLA.
  - Sign DPAs with every service provider/contractor handling consumer PI.
  - Limit sensitive-PI use and prepare for CPPA risk-assessment/cyber-audit rules phasing in.

### GLBA — Gramm-Leach-Bliley Act (Safeguards Rule + Privacy Rule)

- **Region:** US
- **Regulator:** US Federal Trade Commission (FTC) + federal banking regulators (OCC, FDIC, Federal Reserve)
- **Applies to:** fintech, banking, lending, insurance, wealth, mortgage
- **Forces:** runtime = hardened images, encryption-capable runtime, auth = MFA for systems accessing customer financial info, RBAC, observability = monitoring/logging of access to customer information, data = encryption of customer financial info at rest/in transit, secure disposal, network = access controls, segmentation, change management
- **Required controls:** Safeguards Rule: written information security program with a Qualified Individual, Encryption of customer information in transit and at rest, MFA for any individual accessing customer information systems, Continuous monitoring or annual pentest + biannual vulnerability assessment, Service-provider oversight and secure data disposal, Incident response plan + notify FTC of breaches affecting 500+ consumers within 30 days, Privacy Rule: annual privacy notices and opt-out of nonpublic info sharing
- **Audit retention:** Security program documentation and risk assessments retained ≥5 years (aligns with financial recordkeeping); breach records to evidence FTC reporting.
- **Data residency:** No residency mandate; driven by overlapping financial regulations and contracts.
- **How to meet:**
  - Appoint a Qualified Individual and maintain a written information security program.
  - Encrypt customer financial info at rest/in transit and enforce MFA on all access.
  - Run continuous monitoring or annual pentest + biannual vulnerability scans.
  - Establish service-provider oversight, secure disposal, and an incident-response plan.
  - Add a 30-day FTC breach-notification trigger for incidents affecting 500+ consumers.

### SOX — Sarbanes-Oxley Act (Sections 302, 404, 802)

- **Region:** US
- **Regulator:** US Securities and Exchange Commission (SEC) + PCAOB (auditor oversight)
- **Applies to:** fintech, public-company, saas-public, banking, enterprise
- **Forces:** runtime = change-controlled, immutable build pipeline, auth = segregation of duties, RBAC, no self-approval on financial systems, observability = immutable audit trail of changes to financial-reporting systems, data = integrity controls over financial data (ICFR), network = controlled access to financial-reporting infrastructure
- **Required controls:** Section 404: management + auditor assessment of internal control over financial reporting (ICFR), Section 302: executive certification of financial report accuracy, Section 802: criminal penalties for altering/destroying records, IT general controls (ITGC): access, change management, and operations over financial systems, Segregation of duties — no single actor can both build and deploy financial changes, Immutable, tamper-evident audit logs of financial-system changes, Annual external auditor attestation
- **Audit retention:** Section 802: audit work papers and records retained 7 years; many financial records retained 7 years. ITGC evidence retained for the fiscal-year audit cycle.
- **Data residency:** No residency mandate; driven by overlapping regulations and corporate policy.
- **How to meet:**
  - Implement segregation of duties so no actor can both author and approve financial deploys.
  - Enforce change management with approvals and immutable, tamper-evident audit logs.
  - Map ITGCs (access, change, operations) to ICFR control objectives.
  - Retain audit work papers and financial records for 7 years (Section 802).
  - Support management/auditor ICFR testing with quarterly access reviews and evidence collection.

### FFIEC — Federal Financial Institutions Examination Council IT Examination Guidance

- **Region:** US
- **Regulator:** FFIEC member agencies (OCC, FDIC, Federal Reserve, NCUA, CFPB)
- **Applies to:** banking, fintech, credit-union, lending, payments
- **Forces:** runtime = hardened images, patch/vuln management, auth = layered/MFA authentication, RBAC, privileged access management, observability = continuous monitoring, SIEM, threat intelligence, data = encryption at rest/in transit, secure backup, integrity controls, network = segmentation, DDoS resilience, secure remote access
- **Required controls:** Risk-based information security program aligned to FFIEC IT Handbook booklets, Cybersecurity controls per the Architecture, Infrastructure & Operations + Information Security booklets, Layered authentication / MFA proportional to transaction risk, Business continuity and resilience (BCM booklet) including RTO/RPO testing, Third-party / vendor risk management, Incident response and timely notification to the primary federal regulator (36-hour rule for banks), Board and senior management oversight of IT risk
- **Audit retention:** Examination and risk-program evidence retained ≥5 years (financial recordkeeping norms); log retention per Information Security booklet (≥1 year typical).
- **Data residency:** No residency mandate; cross-border processing subject to vendor-risk and regulator scrutiny.
- **How to meet:**
  - Build a risk-based InfoSec program mapped to FFIEC IT Handbook booklets.
  - Enforce layered/MFA authentication scaled to transaction risk and PAM for privileged access.
  - Operate continuous monitoring/SIEM with threat intelligence and a tested incident-response plan.
  - Run BCM with measured RTO/RPO and third-party risk management.
  - Add a 36-hour computer-security-incident notification trigger to the primary federal regulator.

### OSFI-B13 — OSFI Guideline B-13: Technology and Cyber Risk Management

- **Region:** CA
- **Regulator:** Office of the Superintendent of Financial Institutions (OSFI), Canada
- **Applies to:** banking, insurance, fintech-frfi, wealth, pensions
- **Forces:** runtime = hardened images, secure SDLC, change management, auth = MFA, identity & access management, privileged access controls, observability = security monitoring, threat detection, logging, data = encryption, data classification, integrity and confidentiality controls, network = secure architecture, segmentation, resilience
- **Required controls:** Technology and cyber risk governance with accountable senior management, Technology operations, asset management, and secure system development lifecycle, Cyber security: identify, defend, detect, respond, recover (NIST-aligned), Third-party / cloud risk management (interacts with Guideline B-10), Resilience: incident, problem, and change management with RTO/RPO objectives, Reporting of technology/cyber incidents to OSFI within 24 hours (Incident Reporting Advisory), Effective since Jan 2024 for federally regulated financial institutions (FRFIs)
- **Audit retention:** Technology/cyber risk and incident records retained ≥7 years to align with Canadian financial recordkeeping; logs per security monitoring program (≥1 year).
- **Data residency:** No absolute residency mandate, but OSFI expects FRFIs to retain control, access, and oversight; Canadian region strongly preferred for supervisory access.
- **How to meet:**
  - Establish technology/cyber risk governance with documented senior accountability.
  - Implement secure SDLC, asset management, MFA, IAM, and privileged access controls.
  - Operate security monitoring/threat detection mapped to identify-defend-detect-respond-recover.
  - Manage cloud/third-party risk per B-10 and define tested RTO/RPO resilience objectives.
  - Add a 24-hour OSFI technology/cyber incident reporting runbook; prefer Canadian hosting.

### OSFI-B10 — OSFI Guideline B-10: Third-Party Risk Management

- **Region:** CA
- **Regulator:** Office of the Superintendent of Financial Institutions (OSFI), Canada
- **Applies to:** banking, insurance, fintech-frfi, wealth, pensions
- **Forces:** runtime = vendor-hardened images, supply-chain assurance, auth = vendor access governance, RBAC over third-party integrations, observability = third-party monitoring, concentration-risk dashboards, data = data-handling clauses, encryption, subcontractor controls, network = secure integration, exit/portability planning
- **Required controls:** Risk-based, principles-based third-party risk management lifecycle, Criticality assessment of each third-party arrangement, Contractual provisions: audit rights, sub-contracting, data location, business continuity, Ongoing monitoring of third-party performance and risk (incl. concentration risk), Exit strategy and portability for critical arrangements, Cloud and technology service-provider oversight (links to B-13), Effective since May 2024 for FRFIs
- **Audit retention:** Third-party arrangement records, due diligence, and monitoring evidence retained for the life of the contract plus ≥7 years.
- **Data residency:** OSFI expects clarity on data location and the ability to access/audit; Canadian data location preferred for critical/material arrangements.
- **How to meet:**
  - Build a third-party inventory with criticality/materiality ratings.
  - Embed audit rights, data-location, sub-contracting, and continuity clauses in every critical contract.
  - Stand up ongoing third-party monitoring including concentration-risk dashboards.
  - Define documented exit and portability strategies for critical providers.
  - Align cloud TPRM with B-13 controls and prefer Canadian data location for material arrangements.

### FINTRAC-PCMLTFA — FINTRAC obligations under the Proceeds of Crime (Money Laundering) and Terrorist Financing Act

- **Region:** CA
- **Regulator:** Financial Transactions and Reports Analysis Centre of Canada (FINTRAC)
- **Applies to:** fintech, banking, crypto, money-services, payments, lending, insurance
- **Forces:** runtime = auditable transaction-processing runtime, auth = RBAC + identity verification (KYC) controls, observability = immutable transaction + report audit trail, data = KYC/beneficial-ownership records, secure long-term retention, network = secure reporting channel to FINTRAC (F2R)
- **Required controls:** Know Your Client (KYC): verify identity of clients per prescribed methods, Report Large Cash Transactions (LCTR ≥ CAD 10,000), Large Virtual Currency Transactions (LVCTR ≥ CAD 10,000), EFTs, Suspicious Transaction Reports (STR) filed as soon as practicable, Maintain a compliance program: officer, policies, risk assessment, training, biennial effectiveness review, Beneficial ownership and politically-exposed-person (PEP) determinations, Ongoing monitoring and record-keeping of business relationships, Travel rule for electronic funds and virtual currency transfers
- **Audit retention:** Records (client ID, transaction, account, reports) retained 5 years from creation / end of relationship (some account records 5 years after closure) per PCMLTFA.
- **Data residency:** No absolute residency mandate, but records must be retrievable within 30 days for FINTRAC examination; Canadian storage strongly preferred.
- **How to meet:**
  - Implement KYC identity verification and beneficial-ownership/PEP determination at onboarding.
  - Automate LCTR/LVCTR/EFT and STR generation and submit via FINTRAC F2R.
  - Maintain an immutable transaction and report audit trail with 5-year retention.
  - Run a documented compliance program with an officer, risk assessment, training, and biennial effectiveness review.
  - Ensure records are retrievable within 30 days for examination; prefer Canadian hosting.

### SOCI — Security of Critical Infrastructure Act 2018 (Australia)

- **Region:** global
- **Regulator:** Cyber and Infrastructure Security Centre (CISC), Department of Home Affairs, Australia
- **Applies to:** energy, telecom, data-centres, financial-services, healthcare, water, transport
- **Forces:** runtime = hardened images, critical-asset protection, auth = access governance over critical infrastructure assets, observability = incident detection + mandatory reporting pipeline, data = asset register, protected information handling, network = segmentation, supply-chain hazard controls
- **Required controls:** Register of Critical Infrastructure Assets ownership/operator reporting, Critical Infrastructure Risk Management Program (CIRMP) across cyber, personnel, supply-chain, physical hazards, Mandatory cyber incident reporting to the Australian Signals Directorate (ASD/ACSC): 12 hours for critical, 72 hours for other significant incidents, Enhanced cyber security obligations for Systems of National Significance (SoNS), Government assistance / last-resort intervention powers acknowledgment, Annual board-approved CIRMP attestation
- **Audit retention:** CIRMP and annual attestation records retained ≥6 years (aligns with Australian corporate recordkeeping); incident records retained to evidence reporting.
- **Data residency:** No strict residency, but critical-asset and protected information handling is geofenced to authorized operators; sovereign-control expectations apply for SoNS.
- **How to meet:**
  - Register applicable critical infrastructure assets and maintain the asset register.
  - Build a CIRMP covering cyber, personnel, supply-chain, and physical hazards.
  - Stand up incident reporting to ASD/ACSC with 12-hour (critical) / 72-hour (significant) triggers.
  - For SoNS, implement enhanced obligations and vulnerability assessments.
  - Produce an annual board-approved CIRMP attestation.

### DORA — Digital Operational Resilience Act (EU Regulation 2022/2554)

- **Region:** EU
- **Regulator:** European Supervisory Authorities (EBA, ESMA, EIOPA) + national competent authorities
- **Applies to:** banking, insurance, fintech, crypto, payments, investment, ict-providers
- **Forces:** runtime = resilient, change-controlled, tested runtime, auth = ICT access controls, MFA, identity management, observability = ICT incident detection, classification, and reporting, data = ICT risk-managed data integrity, backup, recovery, network = resilience testing, segmentation, third-party ICT oversight
- **Required controls:** ICT risk management framework with board accountability, ICT-related incident classification and reporting to competent authorities (initial within hours, intermediate, final), Digital operational resilience testing, incl. threat-led penetration testing (TLPT) for significant entities, ICT third-party risk management with a register of information on all ICT providers, Oversight framework for Critical ICT Third-Party Providers (CTPPs) by the ESAs, Information sharing on cyber threats among financial entities, Applies since 17 January 2025 across the EU financial sector
- **Audit retention:** ICT incident records, resilience-testing results, and the register of information retained ≥5 years to align with EU financial recordkeeping and supervisory access.
- **Data residency:** No strict EU-residency mandate, but supervisory access, exit strategies, and CTPP oversight effectively constrain offshoring of critical ICT functions.
- **How to meet:**
  - Implement a board-owned ICT risk management framework mapped to DORA's five pillars.
  - Build ICT incident classification + tiered reporting (initial/intermediate/final) to the competent authority.
  - Run digital operational resilience testing, including TLPT for significant entities.
  - Maintain the register of information on all ICT third-party providers and embed exit strategies.
  - Prepare for ESA oversight of Critical ICT Third-Party Providers and join threat-sharing arrangements.

## B.3 Industries (Canada) — by vertical

Each vertical states its required auth, observability, data controls, and regimes.

**Financial Services — requirements:**

- Required auth: OIDC/OAuth2 + phishing-resistant MFA (FIDO2/WebAuthn) for all privileged and customer access; mTLS service-to-service; hardware-backed keys for signing
- Required observability: Full immutable audit logging (WORM) with 7-year retention; SIEM ingestion (e.g. Splunk/Sentinel) with 90-day hot + 7yr cold; tamper-evident logs; transaction-level traceability; 30-min SLA on incident detection
- Required data controls: AES-256 at rest + TLS 1.3 in transit; field-level encryption + tokenization for PAN/PII; HSM/KMS with BYOK; Canadian data residency (in-region) for regulated workloads; key rotation <=1yr; DLP on egress
- Mandatory regimes: OSFI B-13 (Technology & Cyber Risk), OSFI B-10 (Third-Party Risk), OSFI E-21 (Operational Resilience), FINTRAC / PCMLTFA (AML/ATF), PIPEDA, PCI-DSS v4.0.1, Quebec Law 25, FCAC market conduct
- Recommended cluster: Dedicated regulated-tier cluster in Canadian region (e.g. ca-central-1 / Canada Central); private networking, no public ingress; SOC 2 Type II + ISO 27001 substrate; isolated from non-regulated tenants
- Key risks: AML/sanctions screening gaps triggering FINTRAC penalties, OSFI technology incident reporting breach (24-72hr notification), Cross-border data transfer without adequacy / consent, Payment fraud and account takeover, Third-party/concentration risk (B-10), Insider trading / data exfiltration

**Healthcare & Life Sciences — requirements:**

- Required auth: OIDC + MFA for all PHI access; role-based + attribute-based access control (least privilege); break-glass with mandatory justification logging; provincial EHR federation (e.g. SAML to provincial IAM)
- Required observability: Full audit trail of every PHI access (who/what/when/why) with 10-year minimum retention; access-disclosure logging per PHIPA; anomaly detection on bulk PHI reads; consent-event logging
- Required data controls: AES-256 at rest + TLS 1.3; PHI segregation; de-identification/pseudonymization for analytics; strict Canadian residency (PHIPA/provincial law often prohibits US storage); KMS with BYOK; data minimization; secure disposal
- Mandatory regimes: PHIPA (Ontario), PIPEDA, Provincial health privacy acts (HIA Alberta, PHIA Manitoba/NS, FOIP, BC PIPA/E-Health Act), Quebec Law 25 + Act respecting health and social services information, Health Canada / SOR (medical devices, SaMD), GCP/ICH for clinical trials, FDA 21 CFR Part 11 (if US trials)
- Recommended cluster: Canadian-resident, single-tenant or strongly isolated cluster with HITRUST/SOC 2 controls; provincial residency where required (e.g. BC data must stay in Canada under prior FIPPA rules, now relaxed but verify); no cross-border PHI flow without consent
- Key risks: PHI breach mandatory notification (IPC/OIPC + affected individuals), Unauthorized secondary use of health data, Cross-border storage violating provincial residency rules, De-identification re-identification attacks, Clinical trial data integrity (Part 11 / GCP), Ransomware on hospital/EHR systems

**Government & Public Sector — requirements:**

- Required auth: GC-approved IAM (e.g. credential broker / Sign-In Canada / provincial IDP) + MFA; PKI for PROTECTED data; zero-trust per ITSG-33; mandatory account recertification
- Required observability: Centralized audit logging per ITSG-33 AU controls; SIEM with min 2-year retention (longer for records-management obligations); continuous monitoring; security event reporting to CCCS
- Required data controls: Encryption per CSE-approved algorithms (CNSA/ITSP.40.111); Canadian residency mandatory for PROTECTED B and above; data sovereignty; CSE/CCCS cloud guardrails; key management under GC control
- Mandatory regimes: Privacy Act (federal), PIPEDA (where applicable), ITSG-33 / ITSP.40.x (CSE security controls), GC Cloud Guardrails, Protected A/B/C classification (ITSP.40.111), Provincial FOIP/FIPPA, Directive on Service and Digital (TBS), Quebec Law 25 (provincial bodies)
- Recommended cluster: GC-assessed cloud (Protected B Medium-Integrity-Medium-Availability) in Canadian region; FedRAMP/CCCS-assessed; dedicated landing zone with GC guardrails; segregated from commercial tenants
- Key risks: PROTECTED data residency or sovereignty violation, Inadequate ITSG-33 control implementation blocking ATO, FOIP/access-to-information mishandling, Supply-chain compromise of GC systems, Citizen PII breach and Privacy Commissioner findings, Records retention/disposition non-compliance

**Defense & Intelligence — requirements:**

- Required auth: PKI / smart-card (DND PKI) + hardware MFA; air-gapped or cross-domain-solution-mediated access for classified; strict need-to-know with compartmentalization; continuous adjudication of clearances
- Required observability: Full audit on all classified-system access with indefinite/long retention; cross-domain transfer logging; insider-threat monitoring (UAM); air-gap integrity monitoring; CCCS incident reporting
- Required data controls: CSE-approved cryptography (CNSA 2.0 / post-quantum migration in progress); strict Canadian sovereignty; classified data never on commercial cloud without accreditation; CDS for any cross-domain flow; controlled goods handling
- Mandatory regimes: ITSG-33 (high baseline), Security of Information Act, Controlled Goods Program (CGP), Canadian Industrial Security Directorate (CISD/Contract Security Program), ITAR / EAR (US-origin tech), NATO security policy (where applicable), CSE/CCCS classified handling directives
- Recommended cluster: Accredited classified enclave (air-gapped or CDS-mediated); DND/CAF-approved on-prem or sovereign cloud; no commercial multi-tenant; physically and logically isolated; TEMPEST considerations for SECRET+
- Key risks: Spillage of classified data to lower-classification networks, ITAR/Controlled Goods export violation, Foreign-ownership-control-influence (FOCI) on suppliers, Insider threat / espionage, Supply-chain implant in defense systems, Post-quantum cryptographic exposure

**Energy & Environment — requirements:**

- Required auth: OIDC + MFA for IT; strict IT/OT separation; jump-host + privileged access management for OT/ICS; no shared credentials on control systems; vendor remote access brokered and recorded
- Required observability: Full audit on control systems and IT; OT network monitoring (e.g. Claroty/Dragos); 3-year+ retention for critical infrastructure; CER/NERC CIP event logging; mandatory cyber incident reporting under critical-infra rules
- Required data controls: Encryption at rest + in transit for IT/business data; OT segmentation (Purdue model / IEC 62443 zones); SCADA data integrity; Canadian residency for critical-infrastructure operational data; secure historian
- Mandatory regimes: NERC CIP (bulk electric system), CER (Canada Energy Regulator) cybersecurity / OEDIT, Critical Cyber Systems Protection Act (CCSPA / Bill C-26), IEC 62443 (OT security), PIPEDA, Provincial energy regulators (e.g. OEB, AUC, BCUC), Environmental reporting (ECCC / GHGRP)
- Recommended cluster: Segregated IT cluster in Canadian region for business workloads; OT kept on isolated, air-gapped-leaning networks; CCSPA-designated operators need documented cyber security program; SOC 2 substrate
- Key risks: ICS/SCADA compromise causing physical outage, NERC CIP violation with monetary penalties, CCSPA non-compliance once in force (designated critical operators), Ransomware crossing IT/OT boundary (Colonial-style), GHG/environmental misreporting, Nation-state targeting of grid

**Technology — requirements:**

- Required auth: OIDC/OAuth2 + MFA (TOTP min, WebAuthn preferred); SSO with SCIM provisioning; short-lived tokens; secrets in vault (not env); least-privilege IAM with regular access reviews
- Required observability: Centralized structured logging + distributed tracing (OpenTelemetry); SIEM/observability stack (e.g. Datadog/Grafana); 1-year audit log retention minimum; SLO-based alerting; security event monitoring
- Required data controls: TLS 1.3 + AES-256; tenant isolation (logical or physical); customer-managed keys option (BYOK); data residency choice incl Canadian region; secrets rotation; DLP for source/IP
- Mandatory regimes: PIPEDA, Quebec Law 25, SOC 2 Type II (market expectation), ISO 27001 / 27017 / 27018, GDPR (if EU customers), PCI-DSS (if payments), CASL (anti-spam)
- Recommended cluster: Multi-region Kubernetes with Canadian-region option for Canada-first customers; SOC 2 + ISO 27001 controls; logical multi-tenancy with hardened isolation; offer single-tenant for regulated buyers
- Key risks: Multi-tenant data leakage / IDOR, Supply-chain attack (dependency/CI-CD compromise), Secrets exposure in repos/logs, Account takeover via weak SSO config, Vendor lock-in undermining data portability, CASL violation on transactional/marketing email

**Telecommunications — requirements:**

- Required auth: OIDC + MFA for subscriber-data and network-management access; PAM for network elements; lawful-intercept systems on isolated, tightly-controlled access; SIM/eSIM provisioning security
- Required observability: CDR and network event logging; subscriber-access audit with multi-year retention; SIEM with OT/network monitoring; CCSPA incident reporting; lawful-intercept audit segregation
- Required data controls: Encryption of subscriber PII + traffic metadata; CPNI-equivalent confidentiality; Canadian residency for subscriber data; secure storage of lawful-intercept data; network segmentation (5G core isolation)
- Mandatory regimes: Telecommunications Act + CRTC rules, Critical Cyber Systems Protection Act (CCSPA / Bill C-26 — telecom is designated), PIPEDA, Quebec Law 25, Lawful access (e.g. solicitor-general / court orders), CCCS / CSE security guidance (incl Huawei/ZTE 5G restrictions), CASL
- Recommended cluster: Carrier-grade segregated infrastructure; subscriber data in Canadian region; 5G core on isolated network slices; CCSPA cyber security program; supplier restrictions on high-risk vendors
- Key risks: Network compromise enabling mass surveillance/outage, CCSPA non-compliance (telecom is a designated sector), Subscriber PII breach at scale, High-risk-vendor (Huawei/ZTE) equipment exposure, SS7/Diameter signaling attacks, Lawful-intercept system misuse

**Retail & Commerce — requirements:**

- Required auth: OIDC/OAuth2 + MFA for admin/back-office; customer auth with passwordless/MFA option; PCI-scoped systems behind strict access controls; POS terminal hardening
- Required observability: Transaction + access audit logging; PCI-DSS log retention (min 1 year, 3 months immediately available); fraud monitoring; cardholder-data-environment (CDE) logging segregation; SIEM
- Required data controls: PAN tokenization + AES-256; PCI-DSS scope minimization (never store CVV); TLS 1.3 at checkout; PII encryption; Canadian residency option for customer data; consent management for marketing
- Mandatory regimes: PCI-DSS v4.0.1, PIPEDA, Quebec Law 25, CASL (marketing/loyalty email), Consumer protection acts (provincial), Competition Act (pricing/advertising), Payment Card Networks rules (Interac/Visa/MC)
- Recommended cluster: PCI-scoped CDE isolated from general workloads; Canadian-region option for customer PII; tokenization service; SOC 2 substrate; CDN/WAF at edge for bot/fraud defense
- Key risks: Cardholder data breach (Magecart/skimming), PCI-DSS v4 non-compliance after 2025 mandatory date, Loyalty/account takeover and credential stuffing, CASL violation on marketing consent, Bot-driven inventory/checkout abuse, Deceptive pricing under Competition Act

**Manufacturing & Industrial — requirements:**

- Required auth: OIDC + MFA for IT/ERP/MES; strict IT/OT separation; PAM and brokered remote access for plant-floor/OT; no default vendor credentials on PLCs; jump hosts for maintenance
- Required observability: IT audit logging + OT network monitoring (Dragos/Claroty/Nozomi); 1-3 year retention; production-line event logging; supply-chain traceability; anomaly detection on OT protocols (Modbus/OPC-UA)
- Required data controls: Encryption of IP/CAD/PLM data; OT segmentation per IEC 62443 / Purdue; secure historian; IP exfiltration DLP; Canadian residency for sensitive trade-secret data; backup integrity
- Mandatory regimes: IEC 62443 (OT security), PIPEDA, Quebec Law 25, Controlled Goods Program (if defense/dual-use), ITAR/EAR (if US-origin tech), Product safety / CSA standards, Environmental (ECCC) where applicable
- Recommended cluster: Segregated IT cluster for ERP/MES in Canadian region; OT on isolated networks with one-way data diodes to historian; SOC 2 substrate; IP-sensitive workloads single-tenant
- Key risks: OT/ICS ransomware halting production, Trade-secret/IP theft (CAD, process recipes), Supply-chain compromise via vendor remote access, Legacy PLC vulnerabilities with no patch path, Dual-use export control violation, Safety-system tampering

**Media & Entertainment — requirements:**

- Required auth: OIDC + MFA for production/asset systems; DRM-tied entitlement auth for distribution; vendor/freelancer access time-boxed; MFA on MAM/DAM and editorial CMS
- Required observability: Asset-access and content-movement audit logging; watermarking/forensic tracing on pre-release; 1-year+ retention; piracy/leak detection; CDN access logs
- Required data controls: Encryption of master/pre-release assets; DRM (Widevine/PlayReady/FairPlay) for distribution; forensic watermarking; access-controlled MAM; Canadian residency option for subscriber data; geo-fencing rights
- Mandatory regimes: Copyright Act, PIPEDA, Quebec Law 25, CASL, CRTC / Online Streaming Act (Bill C-11), Canadian content (CanCon) obligations, MPA content-security best practices (TPN), GDPR (if EU subscribers)
- Recommended cluster: Content-secure cluster aligned to TPN (Trusted Partner Network) controls; pre-release assets isolated and watermarked; Canadian-region option for subscriber PII; CDN with token-auth and DRM at edge
- Key risks: Pre-release content leak / piracy, Subscriber PII breach at scale, DRM bypass and unauthorized redistribution, Rights/geo-fencing violation, CanCon / Online Streaming Act non-compliance, CASL violation on subscriber communications

**Education — requirements:**

- Required auth: OIDC/SAML + MFA for staff/faculty; SSO federation (e.g. provincial/institutional IDP); student auth with MFA option; parental-consent flows for minors; LMS access controls
- Required observability: Access audit on student records (SIS/LMS); 1-3 year retention; FOIP/FIPPA disclosure logging; anomaly detection on bulk record access; consent-event logging for minors
- Required data controls: Encryption of student PII/records; data minimization; Canadian residency (many provincial K-12/post-secondary rules and FIPPA require it); de-identification for analytics; restricted EdTech vendor data sharing
- Mandatory regimes: PIPEDA (private institutions), Provincial FOIP/FIPPA (public institutions, e.g. BC, Alberta, Ontario FIPPA/MFIPPA), Quebec Law 25 + education-sector rules, Provincial education acts, PHIPA (campus health services), COPPA (if US minors)
- Recommended cluster: Canadian-resident cluster for student records; FIPPA-aligned where the institution is public; SOC 2 substrate; isolated EdTech integrations with vetted data-sharing agreements
- Key risks: Student PII / records breach, EdTech vendor over-collection and secondary use, Cross-border storage violating provincial FIPPA residency, Minor data handling without proper consent, Research data integrity and IP, Ransomware on school boards/universities

**Transportation & Logistics — requirements:**

- Required auth: OIDC + MFA for TMS/WMS and operations; PAM for fleet/telematics and signaling systems; driver/operator credential management; vendor access brokered for connected vehicles
- Required observability: Shipment + access audit logging; telematics event logging; 1-3 year retention; OT monitoring for rail/port control systems; CCSPA incident reporting (transport is designated); chain-of-custody traceability
- Required data controls: Encryption of shipment, customs, and PII data; telematics/location data protection; Canadian residency for critical-infra operational data; secure EDI/API; customs data integrity
- Mandatory regimes: Critical Cyber Systems Protection Act (CCSPA / Bill C-26 — transport designated), Transport Canada regulations (TDG, aviation/marine/rail security), PIPEDA, Quebec Law 25, CBSA customs / ACI (Advance Commercial Info), C-TPAT / PIP (trusted trader), IMO/IATA security where applicable
- Recommended cluster: Segregated IT cluster in Canadian region for ops/customer data; OT (rail/port/ATC-adjacent) isolated; CCSPA cyber security program for designated operators; SOC 2 substrate
- Key risks: OT compromise of rail/port/fleet control systems, CCSPA non-compliance (transport is a designated sector), Cargo/customs data manipulation and theft, Telematics/location-data privacy breach, Supply-chain disruption via vendor compromise, Dangerous-goods (TDG) data integrity

**Real Estate & Construction — requirements:**

- Required auth: OIDC + MFA for transaction/escrow and document systems; role-based access to deal data; MFA on wire/trust-account approvals; vendor access scoped for BIM/project portals
- Required observability: Audit logging on transactions, trust accounts, and document access; 7-year retention for financial/trust records; wire-fraud anomaly detection; access logs on sensitive deal rooms
- Required data controls: Encryption of PII, financial, and deal data; trust-account segregation; document integrity (e-signature audit); Canadian residency for client PII; secure BIM/CAD storage; DLP on deal exfiltration
- Mandatory regimes: PIPEDA, Quebec Law 25, FINTRAC / PCMLTFA (real estate is a reporting sector for AML), Provincial real estate acts + RECO/regulators, Consumer protection acts, Building codes / safety (CSA, provincial), Tarion/HCRA (Ontario new-home)
- Recommended cluster: Canadian-region cluster for client PII and financial data; SOC 2 substrate; isolated deal-room/document store with strong access control; trust-account systems segregated
- Key risks: Real-estate wire/escrow fraud (BEC), FINTRAC AML obligations missed (real estate is a reporting entity), Client PII and financial-data breach, Deal-data leakage / insider misuse, Title/document forgery, Construction IP (BIM/design) theft

**Agriculture — requirements:**

- Required auth: OIDC + MFA for farm-management and supply-chain platforms; device auth for IoT/precision-ag sensors; PAM for equipment telematics; scoped grower/vendor access
- Required observability: Audit logging on farm data and traceability events; 1-3 year retention; IoT device telemetry monitoring; food-traceability event logging (lot/batch); anomaly detection on data feeds
- Required data controls: Encryption of farm/agronomic and PII data; grower data-ownership controls; Canadian residency option (food-security sensitivity); IoT data integrity; secure equipment OTA; traceability data immutability
- Mandatory regimes: PIPEDA, Quebec Law 25, Safe Food for Canadians Act/Regulations (SFCR — CFIA traceability), CFIA food-safety standards, Pest Control Products Act (PMRA), Environmental (ECCC, provincial), Plant/animal health regs
- Recommended cluster: Canadian-region cluster for grower data and traceability; SOC 2 substrate; IoT ingest isolated with device identity; immutable traceability ledger; offer grower data-ownership guarantees
- Key risks: Food-traceability gap violating SFCR (recall failure), Grower data exploitation / ownership disputes, Precision-ag IoT compromise (equipment, sensors), Supply-chain contamination data integrity, Biosecurity data breach, Climate/yield data manipulation

**Legal & Professional Services — requirements:**

- Required auth: OIDC + MFA for all matter/client access; strict ethical-wall (information-barrier) access controls; PAM for document management; client-matter scoped permissions; MFA on trust-account approvals
- Required observability: Audit logging on all client/matter document access; 7-10 year retention (limitation + records rules); ethical-wall breach detection; trust-account audit trail; anomaly detection on bulk document export
- Required data controls: Encryption of privileged/client data; solicitor-client privilege protection; information barriers enforced technically; Canadian residency strongly preferred (privilege + law-society guidance); DLP on document exfiltration; secure disposal
- Mandatory regimes: PIPEDA, Quebec Law 25, FINTRAC / PCMLTFA (legal counsel — note SCC carve-out, but law-society AML rules apply), Law Society rules (per province — confidentiality, trust accounting), Solicitor-client privilege (common law), Limitations Acts (records retention)
- Recommended cluster: Canadian-region cluster for privileged data; SOC 2 + ISO 27001 substrate; single-tenant or strongly isolated; technical ethical walls; vendor with law-society-aligned cloud guidance
- Key risks: Privileged/client-confidential data breach, Ethical-wall (conflict) breach via shared access, Trust-account fraud or accounting failure, Cross-border storage waiving or weakening privilege, AML obligations under law-society client-ID rules, Insider exfiltration of matter data

**Non-profit & Social — requirements:**

- Required auth: OIDC/OAuth2 + MFA for staff and donor/case-management systems; role-based access to beneficiary data; MFA on financial/grant systems; volunteer access scoped and time-boxed
- Required observability: Audit logging on donor and beneficiary records; 7-year retention for charitable financial records (CRA); access logging on sensitive case files; anomaly detection on donor-data export
- Required data controls: Encryption of donor PII, payment, and beneficiary data; vulnerable-population data minimization; Canadian residency option; PCI scope for donations; consent management; secure disposal of case records
- Mandatory regimes: PIPEDA, Quebec Law 25, CRA charitable registration + Income Tax Act reporting, CASL (fundraising email), PCI-DSS (donation processing), Provincial charity/fundraising regulations, PHIPA (if health/social services delivered)
- Recommended cluster: Canadian-region cluster for donor and beneficiary data; SOC 2 substrate (or cost-appropriate equivalent); PCI-scoped donation path isolated; strong access control on vulnerable-population records
- Key risks: Donor PII / payment-card breach, Vulnerable-population (beneficiary) data exposure, CRA compliance / charitable-status risk on financial records, CASL violation on fundraising communications, Under-resourced security posture (common in sector), Grant/financial fraud

### Financial Services

#### Retail Banking

- **Mandatory compliance:** OSFI B-10/B-13, Bank Act, PIPEDA, FINTRAC PCMLTFA, AML/ATF
- **Optional compliance:** SOC 2 Type II, ISO 27001, PCI DSS
- **Regulators:** OSFI, FINTRAC, Bank of Canada
- **Data sensitivity:** PII, PCI, Financial
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** MFA on all customer-facing systems, AES-256 encryption, FINTRAC transaction monitoring, fraud detection, secure core banking access
- **auditRequirements:** Financial records 7 yr, FINTRAC records 5 yr, Suspicious transaction reports 5 yr
- **Notes:** OSFI B-13 requires vendor notification for cloud. Core system data must reside in Canada unless OSFI-approved.

#### Investment Banking

- **Mandatory compliance:** OSFI, CIRO (formerly IIROC), Provincial securities acts, PIPEDA
- **Optional compliance:** SOC 2 Type II, ISO 27001
- **Regulators:** OSFI, CIRO, OSC/AMF (provincial)
- **Data sensitivity:** PII, MNPI, Financial
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** MNPI access controls, Chinese Wall enforcement, audit trail for all trades and communications, voice recording archiving
- **auditRequirements:** Trade records 7 yr, Electronic communications 5 yr, Voice communications 3 yr
- **Notes:** CIRO Rule 3200 data segregation. MNPI firewall enforcement between trading desks. Trading systems require sub-50ms latency.

#### Life Insurance

- **Mandatory compliance:** OSFI, Provincial Insurance Acts, PIPEDA, PHIPA (where health data)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** OSFI, FSRA (ON), AMF (QC), BCFSA (BC)
- **Data sensitivity:** PII, PHI, Financial
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, DAST
- **keySecurityRequirements:** PHI encryption per PHIPA, underwriting model integrity, claims fraud detection, actuarial data access controls
- **auditRequirements:** Policy records 10 yr, Claims 7 yr, PHIPA breach notification required
- **Notes:** Health data triggers PHIPA (ON) or provincial equivalent. OSFI Guideline E-21 for operational risk. Federal insurers under OSFI; provincial under provincial acts.

#### P&C Insurance

- **Mandatory compliance:** Provincial Insurance Acts, PIPEDA, Motor Vehicle Act (auto lines)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** FSRA (ON), BCFSA (BC), AMF (QC), provincial regulators
- **Data sensitivity:** PII, Financial
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Claims processing integrity, telematics data protection, broker portal security, fraud detection
- **auditRequirements:** Policy and claims records 7 yr
- **Notes:** Auto insurance publicly administered in BC (ICBC), MB (MPI), SK (SGI), QC (SAAQ) — separate regulatory regime. IFRS 17 financial reporting compliance.

#### Asset Management

- **Mandatory compliance:** CIRO, CSA, NI 81-102, NI 31-103, PIPEDA
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** CIRO, CSA, OSC (ON primary)
- **Data sensitivity:** PII, Financial
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** NAV calculation integrity, client account segregation, trade order management security, benchmark manipulation prevention
- **auditRequirements:** Trade records 7 yr, Compliance records 5 yr
- **Notes:** NI 81-102 governs mutual funds. ETFs under NI 41-101. NI 31-103 registration required. Fund accounting systems require 99.9% uptime SLA.

#### Fintech & Neobanks

- **Mandatory compliance:** FINTRAC (if MSB), PIPEDA, OSFI (if licensed), Provincial consumer protection
- **Optional compliance:** PCI DSS, SOC 2, ISO 27001, Open Banking Canada framework
- **Regulators:** FINTRAC, OSFI (if licensed), Provincial regulators
- **Data sensitivity:** PII, PCI, Financial
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** KYC/AML onboarding, FINTRAC transaction monitoring, API security for open banking, fraud detection, biometric authentication
- **auditRequirements:** FINTRAC records 5 yr, AML records 5 yr, Transaction logs 1 yr rolling
- **Notes:** Canada Open Banking framework: federal progress disrupted by April 2025 election; legislative timeline under review. OSFI B-13 applies to tech-heavy operations. FINTRAC MSB registration mandatory for money services businesses.

#### Credit Unions

- **Mandatory compliance:** Provincial credit union legislation, DICO (ON)/CUDIC (BC), PIPEDA, FINTRAC
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** FSRA (ON), BCFSA (BC), AMF (QC)
- **Data sensitivity:** PII, PCI, Financial
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Member data protection, core banking security, FINTRAC reporting, ATM/debit network security (Interac)
- **auditRequirements:** Financial records 7 yr, FINTRAC records 5 yr
- **Notes:** Provincially regulated only (no federal charter). Desjardins Group (QC) is Canada's largest credit union network. Deposit insurance varies by province.

#### Payments Processing

- **Mandatory compliance:** Payments Canada rules, PIPEDA, FINTRAC, PCI DSS, Bank Act (if bank-affiliated)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** Payments Canada, Bank of Canada, FINTRAC
- **Data sensitivity:** PCI, PII, Transaction records
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** PCI DSS Level 1, transaction integrity, real-time fraud prevention, tokenization, HSM secure key management
- **auditRequirements:** PCI DSS quarterly ASV scans, Transaction logs 1 yr rolling, Compliance records 5 yr
- **Notes:** Payments Canada Modernization: Lynx RTGS system live, RTR real-time rail programme restructured (2024) — launch timeline under review. Interac dominant domestic network. ISO 20022 migration underway.

### Healthcare & Life Sciences

#### Hospitals & Health Systems

- **Mandatory compliance:** PHIPA (ON), HIA (AB), PIPA (BC), Provincial equivalents, Health Canada
- **Optional compliance:** SOC 2, ISO 27001, CAN/CIOSC 103-1
- **Regulators:** Provincial health ministries, provincial OIPCs
- **Data sensitivity:** PHI, PII
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** PHI encryption at rest and in transit, access controls per circle of care, breach notification within 24 hr (PHIPA), medical device integration security, PACS/DICOM security
- **auditRequirements:** Patient records 10 yr, Breach log indefinitely, Access logs 2 yr
- **Notes:** Data must stay within the province for patient records. PHIPA (ON) most stringent provincial law. Federal hospitals (Veterans Affairs, DND) follow PIPEDA additionally.

#### Provincial Health Insurance

- **Mandatory compliance:** Provincial health insurance acts (OHIP-ON, MSP-BC, AHCIP-AB), PHIPA equivalent, PIPEDA
- **Optional compliance:** ISO 27001, SOC 2
- **Regulators:** Provincial ministries of health, provincial OIPCs
- **Data sensitivity:** PHI, PII, Government
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Interprovincial data sharing controls, billing fraud prevention, health card identity verification, clinician credential validation
- **auditRequirements:** Billing records 10 yr, Eligibility verification logs 5 yr
- **Notes:** Each province operates own health insurance program. Data residency within province mandatory. Federal transfers via Canada Health Act. Billing systems require HL7/FHIR integration security.

#### Pharmaceutical

- **Mandatory compliance:** Health Canada (Food and Drug Regulations), ICH GCP/GMP, PIPEDA, CDSA (Controlled Drugs)
- **Optional compliance:** FDA 21 CFR Part 11 (US exports), ISO 27001, GxP
- **Regulators:** Health Canada (Drug Directorate), PHAC
- **Data sensitivity:** PHI, PII, Trade secrets
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** GxP validation of CI/CD systems, chain of custody for controlled substances, clinical trial data integrity, IP/trade secret protection
- **auditRequirements:** Clinical trial records 25 yr, Drug approval files permanent
- **Notes:** Health Canada requires 21 CFR Part 11-equivalent electronic records validation. CDSA for controlled substance tracking. GCP/GMP validation requirements affect CI/CD pipeline (change control procedures).

#### Biotech & Life Sciences Research

- **Mandatory compliance:** PIPEDA, TCPS 2 (Tri-Council research ethics), Health Canada (if clinical), Provincial privacy acts
- **Optional compliance:** ISO 27001, NIH-equivalent security guidelines
- **Regulators:** Health Canada, Institutional REBs, PHAC
- **Data sensitivity:** PHI, PII, Genomic, Research IP
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Genomic data de-identification, research data sovereignty (data stays in Canada), IP protection, chain of custody for specimens
- **auditRequirements:** Research records 10 yr minimum, Ethics approvals permanent
- **Notes:** Genomic data requires explicit consent under TCPS 2 Article 13. ELSI (Ethical, Legal, Social Implications) framework applies. National Security Guidelines for Research Partnerships (2023) affect foreign-funded research.

#### Medical Devices

- **Mandatory compliance:** Health Canada SOR/98-282, PIPEDA, IEC 62443, IEC 62304
- **Optional compliance:** ISO 13485, ISO 14971, FDA 21 CFR 820 (US market)
- **Regulators:** Health Canada (Therapeutic Products Directorate)
- **Data sensitivity:** PHI, PII, Device telemetry
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, DAST
- **keySecurityRequirements:** IEC 62304 software lifecycle documentation, vulnerability disclosure program, patch management for deployed devices, firmware signing
- **auditRequirements:** Design history file: product lifetime + 10 yr, Post-market surveillance 15 yr
- **Notes:** Health Canada Class I–IV determines regulatory pathway. Class III/IV require QMS. SaMD (Software as Medical Device) follows IMDRF guidance. SBOM required for Class III/IV devices.

#### Clinical Diagnostics & Labs

- **Mandatory compliance:** PIPEDA, Provincial lab accreditation (CMLTO-ON, CSMLS), PHIPA/equivalent, Health Canada
- **Optional compliance:** ISO 15189, CAP accreditation, ISO 27001
- **Regulators:** Provincial colleges of laboratory technologists, provincial health ministries
- **Data sensitivity:** PHI, PII, Lab results
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Result integrity and non-repudiation, access controls by ordering physician circle of care, LIS/HIS interface security, specimen tracking chain of custody
- **auditRequirements:** Lab results 10 yr, QC records 5 yr
- **Notes:** LIS (Laboratory Information System) integration requires HL7 v2/FHIR security. Result sign-off workflow integrity mandatory. POCT (Point-of-Care Testing) devices follow specific Health Canada regulations.

#### Telehealth & Digital Health

- **Mandatory compliance:** PHIPA (ON)/provincial equivalent, PIPEDA, Health Canada (if SaMD), CASL
- **Optional compliance:** SOC 2, ISO 27001, CAN/CIOSC 103-1
- **Regulators:** Provincial colleges of regulated health professionals, provincial OIPCs
- **Data sensitivity:** PHI, PII, Video/audio
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** End-to-end encryption of video sessions, PHIPA-compliant BAA with cloud providers, MFA for practitioners, session recording consent management
- **auditRequirements:** Session records per PHIPA (10 yr), Consent logs 10 yr
- **Notes:** Canadian data centres required for patient video/audio. Provincial practitioner licensing restricts cross-provincial care delivery. CASL applies to appointment reminders.

#### Long-term Care & Home Care

- **Mandatory compliance:** Provincial long-term care acts (LTCHA-ON), PHIPA/equivalent, PIPEDA
- **Optional compliance:** ISO 27001, Accreditation Canada standards
- **Regulators:** Provincial ministries of health and long-term care, provincial OIPCs
- **Data sensitivity:** PHI, PII (vulnerable populations)
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Resident PHI protection, medication administration security, family portal access controls, IoT/sensor device security
- **auditRequirements:** Resident records 10 yr, Medication administration records 7 yr
- **Notes:** IoT/smart home integration for resident monitoring requires additional security controls. Mobile care worker apps require MDM. Data sharing with acute care follows provincial health information custodian rules.

### Government & Public Sector

#### Federal Government

- **Mandatory compliance:** Privacy Act, ATIA, Security of Information Act, ITSG-33, TBS policies, <span class="tag-pbmm">GC PBMM</span>
- **Optional compliance:** ISO 27001, NIST CSF
- **Regulators:** TBS, OPC, CSE/CCCS
- **Data sensitivity:** <span class="tag-protected-b">Protected B</span>, Secret, PII
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** PBMM cloud controls, CCCS-approved encryption, separation of classified/unclassified networks, identity via GCKey or Sign-In Canada, SA&A (Security Assessment and Authorization)
- **auditRequirements:** Access logs 2 yr, Security incident logs 10 yr, Classified audit trails indefinitely
- **Notes:** GC PBMM mandatory for cloud workloads. CCCS ITSG-33 IT security controls. Data residency in Canada mandatory. PSPC cloud procurement rules apply. ATO (Authority to Operate) process required.

#### Provincial Government

- **Mandatory compliance:** Provincial FIPPA/FOIPPA/ATI Acts, Provincial privacy acts, ITSG-33 equivalent policies
- **Optional compliance:** ISO 27001, CAN/CIOSC 103-1
- **Regulators:** Provincial OIPCs, provincial CISOs
- **Data sensitivity:** Protected, PII, Public
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Access controls per provincial RBAC policies, data residency enforcement, BC/ON/QC-specific cloud security standards, citizen data protection
- **auditRequirements:** Administrative records 7 yr, FOIPPA request logs 5 yr
- **Notes:** Data residency within province mandatory for most provincial systems. BC Cloud Hosting Services, Ontario Government cloud policy vary. Identity via provincial SSO.

#### Municipal Government

- **Mandatory compliance:** Provincial MFIPPA/FOIPPA (Municipal), Provincial privacy acts, PIPEDA (limited)
- **Optional compliance:** ISO 27001, NIST CSF
- **Regulators:** Provincial OIPCs, municipal auditors
- **Data sensitivity:** PII, Public, Local government records
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Citizen data protection, 311 system security, smart city IoT security, open data privacy review before publication
- **auditRequirements:** Municipal records 7 yr, Council minutes permanent
- **Notes:** Smart city deployments require Privacy Impact Assessments (PIAs). IoT/sensor data in public spaces regulated by provincial FIPPA. Procurement through municipal procurement offices.

#### Crown Corporations

- **Mandatory compliance:** Privacy Act (if federal), ATIA, Financial Administration Act, mixed provincial/federal
- **Optional compliance:** ISO 27001, SOC 2
- **Regulators:** TBS (federal), provincial equivalents, OPC
- **Data sensitivity:** PII, Commercial, Government
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Crown-specific security policies, commercial customer data protection, government information handling, critical infrastructure protection
- **auditRequirements:** Varies by Crown mandate, Financial records 7 yr
- **Notes:** Each Crown operates under its own mandate act (CBC Act, Canada Post Act, VIA Rail). Commercial activities follow PIPEDA; government activities follow Privacy Act. Canada Post is critical infrastructure designated.

#### Public Safety & Law Enforcement

- **Mandatory compliance:** Privacy Act, RCMP Act, Criminal Code (lawful interception), PIPEDA, Provincial police acts
- **Optional compliance:** ISO 27001, NIST CSF
- **Regulators:** RCMP, provincial police oversight bodies, CISC
- **Data sensitivity:** <span class="tag-protected-b">Protected B</span>, Criminal records, PII
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** CPIC connection security, biometric data protection, officer safety data controls, intercept capability per Criminal Code Part VI, chain of evidence integrity
- **auditRequirements:** Criminal records permanent, Occurrence reports 7 yr minimum, Intercept authorizations sealed by court
- **Notes:** RCMP CPIC system requires CCCS approval. Provincial police systems (OPP, SQ) follow provincial data governance. Biometric data (fingerprints, DNA) under Privacy Act with additional restrictions.

#### Justice & Courts

- **Mandatory compliance:** Privacy Act, Provincial court administration acts, PIPEDA, Court Records Management standards
- **Optional compliance:** ISO 27001
- **Regulators:** Courts Administration Service (federal), provincial court services branches
- **Data sensitivity:** <span class="tag-protected-b">Protected B</span>, PII, Court records, Publication ban records
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Publication ban enforcement in court record systems, accused/witness identity protection, judicial independence of court systems, evidence integrity chain
- **auditRequirements:** Court records permanent, Publication ban orders indefinitely
- **Notes:** Electronic court filing systems (eCourt, Caselines) require strict access controls. Publication bans enforced at data access layer. Federal courts follow CAS IT standards; provincial courts follow provincial systems.

### Defense & Intelligence

#### Canadian Armed Forces

- **Mandatory compliance:** Security of Information Act, DND Security Orders, NATO security requirements, COMSEC standards
- **Optional compliance:** CMMC (working group), ISO 27001
- **Regulators:** DND/ADM(IM), CSE, NATO
- **Data sensitivity:** <span class="tag-secret">Secret</span>, NATO RESTRICTED/SECRET, Protected B/C
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** COMSEC equipment approval, personnel security (Top Secret clearance), physical security zones, NATO interoperability standards, supply chain integrity for weapons systems
- **auditRequirements:** Classified logs indefinitely, COMSEC accounting permanent, Personnel security records permanent
- **Notes:** Classified networks (SNET/DWAN) separated from unclassified. COMSEC device approval by CSE. NATO interoperability requirements. ITSG-33 mandatory. Five Eyes data sharing protocols apply.

#### CSE (Signals Intelligence)

- **Mandatory compliance:** CSE Act, Security of Information Act, Five Eyes agreements
- **Optional compliance:** N/A — classified
- **Regulators:** Minister of National Defence, NSICOP, NSIRA
- **Data sensitivity:** <span class="tag-secret">Secret</span>, Top Secret, EYES ONLY
- **Pipeline stages affected:** All stages with classified controls
- **keySecurityRequirements:** Classified COMSEC, cryptographic key management, SIGINT protection, signals protection
- **auditRequirements:** Classified, oversight by NSICOP and NSIRA
- **Notes:** Most requirements classified. Public-facing CCCS cloud security guidance published. CCCS vulnerability disclosure coordination. CCCS Annual Threat Report governs GC cyber posture.

#### CSIS (Domestic Intelligence)

- **Mandatory compliance:** CSIS Act, Security of Information Act, Privacy Act, Five Eyes protocols
- **Optional compliance:** N/A — classified
- **Regulators:** Minister of Public Safety, NSIRA, NSICOP
- **Data sensitivity:** <span class="tag-secret">Secret</span>, Top Secret, HUMINT source protection
- **Pipeline stages affected:** All stages with classified controls
- **keySecurityRequirements:** Source protection systems, counter-surveillance in dev environments, HUMINT data compartmentalization, secure development facilities
- **auditRequirements:** Classified, warrant records sealed by court order
- **Notes:** HUMINT source data has absolute legal protection. Warrant-based collection under CSIS Act. NSIRA oversight. Intelligence community data sharing via classified channels.

#### Defense Contractors

- **Mandatory compliance:** PSPC Industrial Security Program (ISP), ITAR (US-origin tech), Security of Information Act, CAN/CIOSC 103-2, Controlled Goods Program
- **Optional compliance:** CMMC (if prime to US DoD), ISO 27001, AS9100
- **Regulators:** PSPC Industrial Security Directorate, Global Affairs Canada (export), US State Dept (ITAR)
- **Data sensitivity:** <span class="tag-protected-b">Protected B</span>, Controlled Goods, ITAR-controlled, NATO RESTRICTED
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Facility security clearance, personnel security screening, Controlled Goods handling, ITAR export control compliance, supply chain security, foreign ownership disclosure
- **auditRequirements:** Controlled Goods records 10 yr, PSPC contract records 7 yr, ITAR records 5 yr
- **Notes:** PSPC ISP mandatory for all defense contracts. Controlled Goods Program registration required. ITAR compliance for US-origin defense tech. PSPC requires facility security clearance. CITP (Canadian IT security profile) for system classification.

#### DRDC (Defence Research)

- **Mandatory compliance:** Security of Information Act, DND Security Orders, PSPC ISP, Scientific data management policy
- **Optional compliance:** ISO 27001, ISO 9001
- **Regulators:** DND/ADM(S&T), CSE
- **Data sensitivity:** <span class="tag-protected-b">Protected B</span>, Confidential, Secret, Research IP
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Research IP protection, dual-use technology controls, classified research environment security, foreign entity relationships management, lab access controls
- **auditRequirements:** Research records 25 yr, Classified project files permanent
- **Notes:** Research facilities hold facility security clearances. Quantum computing research has additional controls. Export controls on dual-use research. University collaborations require Tech Transfer Agreements.

### Energy & Environment

#### Oil & Gas (Upstream)

- **Mandatory compliance:** AER (AB), BCER (BC), CER (cross-border), CEPA, PIPEDA
- **Optional compliance:** ISO 27001, IEC 62443 (OT), NERC CIP (if power generation)
- **Regulators:** CER, AER (AB), BCER (BC), NSPB (SK)
- **Data sensitivity:** OT/SCADA, Commercial, Environmental
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** IT/OT network segregation, SCADA system hardening, emergency shutdown system integrity, seismic/geological data IP protection, wellbore reporting integrity
- **auditRequirements:** Regulatory filings 10 yr, SCADA event logs 5 yr, Environmental incident records permanent
- **Notes:** OT (Operational Technology) networks strictly separated from IT. SCADA security per IEC 62443. Wellbore data subject to provincial Crown royalty reporting. Alberta is Canada's primary upstream hub.

#### Pipelines & Midstream

- **Mandatory compliance:** CER Pipeline Regulations, Transportation of Dangerous Goods Act, CEPA, PIPEDA
- **Optional compliance:** ISO 27001, IEC 62443, NIST CSF
- **Regulators:** CER (Canada Energy Regulator)
- **Data sensitivity:** OT/SCADA, Commercial, Critical infrastructure
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** SCADA/DCS isolation, emergency management system security, leak detection system integrity, geospatial data protection, cross-border data sharing with US NERC
- **auditRequirements:** Pipeline integrity logs permanent, SCADA records 10 yr, Incident records permanent
- **Notes:** CER Critical Energy Infrastructure protection program. Trans Mountain, Enbridge, TC Energy pipelines under federal oversight. SCADA/DCS systems on isolated OT networks. Geospatial pipeline route data is sensitive.

#### Electricity & Utilities

- **Mandatory compliance:** NERC CIP (cross-border grids), OEB (ON), BCUC (BC), AUC (AB), REGIE (QC), PIPEDA
- **Optional compliance:** ISO 27001, IEC 62443, NIST CSF
- **Regulators:** OEB (ON), BCUC (BC), AUC (AB), CER (interprovincial)
- **Data sensitivity:** OT/SCADA, Customer PII, Critical infrastructure
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** NERC CIP CIP-002 through CIP-013 controls, AMI (Advanced Metering Infrastructure) security, grid SCADA protection, customer energy usage data privacy
- **auditRequirements:** NERC CIP records 6 yr, Smart meter data varies by province, Grid event logs permanent
- **Notes:** NERC CIP mandatory for bulk electric systems connected to North American grid. Smart meter data is PII under PIPEDA. Ontario IESO and BC Hydro operate under distinct provincial frameworks.

#### Nuclear Energy

- **Mandatory compliance:** Nuclear Safety and Control Act, CNSC regulations, IAEA safeguards, PIPEDA, Security of Information Act (national security aspects)
- **Optional compliance:** ISO 27001, IEC 62443, IAEA nuclear security recommendations
- **Regulators:** CNSC, IAEA (international safeguards)
- **Data sensitivity:** <span class="tag-protected-b">Protected B</span>, Nuclear, OT/SCADA
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Air-gapped safety systems, nuclear material accountancy system integrity, CANDU-specific cybersecurity, physical protection systems integration, IAEA safeguards reporting integrity, insider threat controls
- **auditRequirements:** Nuclear records permanent (CNSC), IAEA safeguards records permanent, Security incident reports 25 yr
- **Notes:** CNSC regulates all Canadian nuclear facilities. Bruce Power, OPG (ON), NB Power Point Lepreau, AECL/CNL. Safety systems on air-gapped networks. Nuclear material accounting reported to IAEA. CANDU reactor-specific cybersecurity requirements.

#### Renewables & Cleantech

- **Mandatory compliance:** CER (interprovincial), Provincial energy regulators (OEB, AUC, BCUC), PIPEDA, CEPA (environmental)
- **Optional compliance:** ISO 27001, IEC 62443, ISO 50001
- **Regulators:** CER, Provincial energy regulators, ECCC
- **Data sensitivity:** OT/SCADA, Commercial, Environmental
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** SCADA for wind/solar farms, carbon registry system integrity, energy management system access controls, smart grid device security, grid stability event logging
- **auditRequirements:** Grid event logs 10 yr, Carbon credit records 10 yr, Environmental reports permanent
- **Notes:** Grid interconnection requires NERC CIP compliance for bulk systems. Smart inverter protocols (IEEE 2030.5) security requirements. Carbon credit systems subject to PIPEDA and provincial regulations. IESO/AESO market data feeds require secure access.

#### Mining & Resources

- **Mandatory compliance:** Provincial Mines Acts, CEPA, PIPEDA, TSX financial disclosure rules
- **Optional compliance:** ISO 27001, ISO 14001, TSM (Towards Sustainable Mining)
- **Regulators:** EMLI (BC), AER (AB), MNDM (ON), CEPA, TSX
- **Data sensitivity:** OT/SCADA, Commercial, Geological IP, Environmental
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Geological IP protection, OT/SCADA for automated mining, tailings management system integrity, Indigenous consultation record management, financial disclosure control systems
- **auditRequirements:** Environmental records permanent, Financial disclosure 7 yr, Geological data retained as trade secret
- **Notes:** Geological survey data (seismic, assay) is commercially sensitive IP. TSX/TSX-V material information disclosure rules. Indigenous consultation records may require privacy protections. Automated mine systems follow IEC 62443.

### Technology

#### Software & SaaS

- **Mandatory compliance:** PIPEDA (if handling Canadian personal data), CASL, Provincial privacy acts (Law 25-QC, PIPA-BC)
- **Optional compliance:** SOC 2 Type II, ISO 27001, CSA STAR, CAN/CIOSC 103-1
- **Regulators:** OPC, CRTC (CASL), provincial OIPCs
- **Data sensitivity:** PII, Customer data
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** PIPEDA privacy-by-design, CASL consent management, SBOM for software supply chain, vulnerability disclosure policy, data minimization enforcement
- **auditRequirements:** PIPEDA breach log 3 yr, CASL consent records 3 yr, Security logs 1 yr rolling
- **Notes:** CASL applies to all commercial electronic messages to Canadian addresses. Quebec Law 25 is stricter than PIPEDA. GC customers require GC PBMM compliance.

#### AI & ML Platforms

- **Mandatory compliance:** PIPEDA, Provincial privacy acts, CASL
- **Optional compliance:** ISO 42001 (AI management), NIST AI RMF, IEEE AI standards
- **Regulators:** OPC, provincial OIPCs
- **Data sensitivity:** PII, Training data, Model IP
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest
- **keySecurityRequirements:** Training data privacy protection, model extraction attack prevention, adversarial robustness, bias/fairness monitoring, explainability for regulated decisions, consent for personal data in training
- **auditRequirements:** Training data provenance 5 yr, Model versioning 5 yr, Automated decision logs 5 yr
- **Notes:** AIDA (Bill C-27) lapsed when Parliament dissolved April 2025 — not in force as of May 2026. TBS Directive on Automated Decision-Making applies to federal government AI. Biometric data in training sets has heightened requirements.

#### Cloud Services

- **Mandatory compliance:** PIPEDA, CASL, Provincial privacy acts, <span class="tag-pbmm">GC PBMM</span> (for federal workloads)
- **Optional compliance:** SOC 2 Type II, ISO 27001, CSA STAR, CAN/CIOSC 103-1
- **Regulators:** OPC, TBS (GC PBMM), provincial OIPCs
- **Data sensitivity:** PII, Customer data, Varies by tenant
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Data residency enforcement, GC PBMM controls, multi-tenant isolation, Canadian data sovereignty, CCCS cloud security assessment, zero-trust architecture
- **auditRequirements:** Access logs 1 yr min (GC: 2 yr), Incident response records 5 yr
- **Notes:** AWS Canada (Central and West), Azure Canada Central/East, GCP Canada provide Canadian data residency. GC Marketplace for PSPC-approved cloud services. CCCS ITSP.50.105 cloud security guidance. GC PBMM required for all federal workloads.

#### Cybersecurity

- **Mandatory compliance:** PIPEDA, CASL, Sector-specific laws (OSFI, PHIPA, etc.), CCCS guidance (ITSG-33)
- **Optional compliance:** SOC 2, ISO 27001, NIST CSF, CIS Controls, ITSG-33
- **Regulators:** CCCS, OPC, Sector regulators
- **Data sensitivity:** Security telemetry, Client data, Vulnerability intelligence
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Secure development (supply chain integrity), vulnerability research ethics, client data segmentation, CCCS notifications for critical vulnerabilities, threat intelligence data sovereignty
- **auditRequirements:** Security logs 1 yr rolling, Incident reports 5 yr, Penetration test reports 3 yr
- **Notes:** CCCS (Canadian Centre for Cyber Security) is primary guidance body. GC clients require ITSG-33. CCCS Coordinated Vulnerability Disclosure guidelines for security research. CCCS Annual Threat Assessment governs national posture.

#### Hardware & Semiconductor

- **Mandatory compliance:** PIPEDA (if collecting data), ITAR (for defense-use chips), Export Controls Order (Canada)
- **Optional compliance:** ISO 27001, IEC 62443, Common Criteria
- **Regulators:** ISED, Global Affairs Canada (export controls)
- **Data sensitivity:** Commercial, IP, Export-controlled
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Chip design IP protection, supply chain integrity for components, export control classification review, tamper evidence for security chips, firmware signing
- **auditRequirements:** Export control records 5 yr, Design IP records retained as trade secret
- **Notes:** Canada's National Quantum Strategy (2022) includes security implications. ITAR/EAR applies to exported goods containing US technology. Quantum hardware research at IQC (Waterloo) and TRIUMF.

### Telecommunications

#### Wireless Carriers (MNO)

- **Mandatory compliance:** Telecommunications Act, CRTC regulations, PIPEDA, CASL, ISED spectrum licensing
- **Optional compliance:** SOC 2, ISO 27001, GSMA security guidelines
- **Regulators:** CRTC, ISED (spectrum), OPC
- **Data sensitivity:** PII, Location data, Call records
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Lawful interception compliance, subscriber data protection, SS7/Diameter signaling security, 5G network slicing security, roaming agreement security
- **auditRequirements:** Call records 1 yr, CRTC complaints 2 yr, Network security events 2 yr
- **Notes:** Big 3: Bell, Rogers, Telus. CRTC-mandated MVNO wholesale access (2021 decision). Lawful interception under Criminal Code Part VI. 5G security guidance from CCCS (ITSAP.80.004). ISED manages spectrum allocation.

#### Internet Service Providers

- **Mandatory compliance:** Telecommunications Act, CRTC, PIPEDA, CASL, Mandatory breach notification
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** CRTC, OPC
- **Data sensitivity:** PII, Browsing patterns, Network logs
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** Subscriber data minimization, network logging per court orders, DDoS mitigation, DNSSEC deployment, BGP route origin validation (RPKI), CASL compliance systems
- **auditRequirements:** Traffic logs 1 yr (court order may extend), CRTC requests 5 yr
- **Notes:** CRTC net neutrality rules (Internet Traffic Management Practices). Mandatory DMARC/DNSSEC deployment guidance. Domain blocking orders (piracy via court order). CASL requires cooperation with CRTC enforcement.

#### Broadcasting & Cable

- **Mandatory compliance:** Broadcasting Act, CRTC broadcasting regulations, CanCon rules, PIPEDA, CASL, Online Streaming Act (C-11, 2023)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** CRTC
- **Data sensitivity:** PII, Subscriber data, Content rights
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Emergency alert system hardening, broadcast automation security, DRM for premium content, CanCon tracking system integrity, subscriber authentication
- **auditRequirements:** CRTC broadcast logs 7 yr, CanCon certification records 7 yr, Subscriber data 3 yr
- **Notes:** Online Streaming Act (C-11, 2023) extends CRTC jurisdiction to streaming platforms (Netflix, Disney+). CanCon requirements mandate % of Canadian programming. National Public Alerting System (NPAS) emergency broadcast mandatory.

#### Satellite Communications

- **Mandatory compliance:** Radiocommunications Act, Telecommunications Act, CRTC, ISED spectrum licensing, PIPEDA
- **Optional compliance:** ISO 27001, ITU-T standards
- **Regulators:** ISED (spectrum licensing), CRTC, Global Affairs Canada (foreign satellite)
- **Data sensitivity:** PII, Transmission data, Defense-adjacent
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Ground station security, satellite command integrity, anti-jamming measures, earth observation data classification, COMSEC for defense-adjacent systems
- **auditRequirements:** Transmission logs 2 yr, Spectrum use reports annually
- **Notes:** Telesat, MDA Group key Canadian players. Radarsat/WCAAF earth observation data may be defense-adjacent. Telesat Lightspeed LEO constellation under development. Canadian Space Agency data sharing protocols.

### Retail & Commerce

#### Grocery & Food Retail

- **Mandatory compliance:** PIPEDA, CASL, CFIA (food safety), Competition Act, Provincial consumer protection
- **Optional compliance:** PCI DSS, SOC 2, ISO 27001
- **Regulators:** Competition Bureau, CFIA, OPC
- **Data sensitivity:** PII, PCI, Purchase history
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, DAST
- **keySecurityRequirements:** POS system security, loyalty program data minimization, CFIA traceability system integrity, supply chain fraud prevention, loyalty point fraud detection
- **auditRequirements:** Transaction records 7 yr, PCI DSS quarterly scans, CFIA traceability 5 yr
- **Notes:** Loblaws, Metro, Sobeys, Costco. Loyalty programs (PC Optimum, Scene+) subject to PIPEDA consent. CFIA food safety traceability systems (STELA). PIPEDA breach notification if loyalty data compromised.

#### E-Commerce & Marketplace

- **Mandatory compliance:** PIPEDA, CASL, Competition Act, Provincial consumer protection acts, Quebec Law 25
- **Optional compliance:** PCI DSS, SOC 2, ISO 27001
- **Regulators:** OPC (privacy), CRTC (CASL), Competition Bureau
- **Data sensitivity:** PII, PCI, Purchase history, Behavioral
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Fraud detection, CASL consent management, PCI DSS for payment card, behavioral tracking consent, bot detection, account takeover prevention
- **auditRequirements:** CASL consent records 3 yr, Transaction records 7 yr, Fraud reports 5 yr
- **Notes:** Shopify (Waterloo/Ottawa origin), Amazon.ca, Kijiji. CASL consent mandatory for transactional email. Quebec Law 25 stricter consent requirements than federal PIPEDA. PIPEDA consent for behavioral tracking.

#### General Retail

- **Mandatory compliance:** PIPEDA, CASL, Provincial consumer protection acts
- **Optional compliance:** PCI DSS, SOC 2
- **Regulators:** OPC, Provincial consumer protection offices
- **Data sensitivity:** PII, PCI, Purchase history
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** POS/payment security, loyalty data consent, video surveillance compliance, data breach notification, staff PII protection
- **auditRequirements:** Financial records 7 yr, PCI DSS quarterly scans, PIPEDA breach logs 3 yr
- **Notes:** Hudson's Bay Company, Canadian Tire, Dollarama. In-store facial recognition analytics banned under OPC/provincial orders. Quebec Law 25 applies to Quebec retail operations. Loyalty programs under PIPEDA.

### Manufacturing & Industrial

#### Automotive Manufacturing

- **Mandatory compliance:** Transport Canada (Motor Vehicle Safety Act), PIPEDA, Environmental Protection Act, Provincial OHS
- **Optional compliance:** ISO/SAE 21434 (automotive cybersecurity), ISO 27001, IATF 16949
- **Regulators:** Transport Canada, Provincial labour ministries, ECCC
- **Data sensitivity:** PII (connected vehicles), OT/SCADA, IP/trade secrets
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Connected vehicle OTA update signing, manufacturing OT/SCADA security, EDR data privacy, supply chain SBOM, EV charging infrastructure security, assembly line automation security
- **auditRequirements:** Safety incident records permanent, Vehicle recall records permanent, Environmental reports 10 yr
- **Notes:** Ontario auto corridor: Windsor, Oshawa, Cambridge, Ingersoll. Stellantis, GM, Toyota, Honda plants. Connected vehicle data follows PIPEDA. Autonomous vehicle testing regulated by Transport Canada and Ontario.

#### Aerospace & Aviation

- **Mandatory compliance:** Aeronautics Act, Canadian Aviation Regulations (CARs), ITAR (defense components), PSPC ISP, Export Controls Order, DO-178C (avionics)
- **Optional compliance:** AS9100, DO-326A, ISO 27001
- **Regulators:** Transport Canada (TCCA), PSPC, Global Affairs Canada (export)
- **Data sensitivity:** OT, IP/trade secrets, Controlled Goods, ITAR-controlled
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** DO-178C software qualification traceability, ITAR export controls on tech transfer, supply chain counterfeit part prevention, avionics firmware signing, flight data security, CAE simulation IP protection
- **auditRequirements:** Aircraft maintenance records: lifetime + 25 yr, DO-178C qualification records retained with aircraft, ITAR records 5 yr
- **Notes:** Bombardier, Pratt & Whitney Canada, Magellan Aerospace, CAE. DO-178C/DO-326A for avionics software certification. ITAR applies to US-origin aerospace components. Defense contracts require PSPC ISP. Montreal is Canada's aerospace hub.

#### Food Processing & Manufacturing

- **Mandatory compliance:** Safe Food for Canadians Act (SFCA), CFIA, HACCP, PIPEDA, Provincial OHS
- **Optional compliance:** ISO 22000, SQF, BRC, ISO 27001
- **Regulators:** CFIA, Provincial health and labour ministries
- **Data sensitivity:** PII, Commercial, Food safety records
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** CFIA traceability system integrity, PCP documentation access controls, allergen management system security, recall management system, supplier verification systems, cold chain monitoring integrity
- **auditRequirements:** CFIA traceability records 5 yr, PCP records 5 yr, Recall records permanent
- **Notes:** SFCR requires traceability one step back, one step forward. CFIA Preventive Control Plans (PCPs) must be in digital systems. McCain Foods, Maple Leaf Foods, Saputo are key anchors. Allergen management system integrity is critical.

#### Industrial Equipment & Heavy Mfg

- **Mandatory compliance:** Provincial OHS Acts, Environmental permits, PIPEDA (employee data), Export Controls Order (dual-use)
- **Optional compliance:** ISO 27001, IEC 62443, ISO 9001
- **Regulators:** Provincial labour ministries, ECCC, Global Affairs Canada (dual-use export)
- **Data sensitivity:** OT/SCADA, IP/trade secrets, Commercial
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** OT/SCADA network segmentation, predictive maintenance IoT security, equipment telematics data protection, dual-use export control screening, ERP system access controls
- **auditRequirements:** Safety incident records permanent, OHS inspections 5 yr, Environmental records 10 yr
- **Notes:** Finning International, Toromont, CNH Industrial Canada. OT/SCADA for automated production lines. Predictive maintenance IoT creates data obligations. Export of dual-use equipment under Export Controls Order.

### Media & Entertainment

#### Broadcasting (TV & Radio)

- **Mandatory compliance:** Broadcasting Act, CRTC conditions of licence, CanCon regulations, PIPEDA, CASL, Online Streaming Act (C-11, 2023)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** CRTC
- **Data sensitivity:** PII, Content rights, Subscriber data
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Emergency alert system hardening, broadcast automation security, DRM for premium content, CanCon tracking system integrity, subscriber authentication
- **auditRequirements:** CRTC broadcast logs 7 yr, CanCon certification records 7 yr, Subscriber data 3 yr
- **Notes:** CBC/Radio-Canada, CTV, Global, Corus, Bell Media. CanCon requirements per CRTC. National Public Alerting System (NPAS) emergency broadcast mandatory. French-language programming requirements for QC-distributed content.

#### Video Gaming

- **Mandatory compliance:** PIPEDA, CASL, Quebec Law 25, Competition Act, COPPA (for US child users)
- **Optional compliance:** SOC 2, ISO 27001, ESRB, PEGI (European)
- **Regulators:** OPC, CRTC (CASL), Quebec CAI, provincial consumer protection
- **Data sensitivity:** PII, Payment, Behavioral, Minor data
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Minor age verification, in-game purchase controls, DDoS protection, cheat detection, PII/behavioral data minimization, Quebec Law 25 privacy consent, anti-piracy
- **auditRequirements:** CASL consent records 3 yr, Financial/in-app purchase 7 yr, Security incidents 5 yr
- **Notes:** Montreal gaming hub: Ubisoft, Eidos-Montréal, WB Games, Square Enix. Quebec government game tax credits. Loot box regulation under review in Canada. Quebec Law 25 stricter for QC studios.

#### Film & TV Production

- **Mandatory compliance:** PIPEDA, CRTC (broadcasters), CRA (film tax credits), CASL
- **Optional compliance:** ISO 27001, MPA content security standards
- **Regulators:** Telefilm Canada, CMF, CRA (tax credits), CRTC (broadcast)
- **Data sensitivity:** PII (cast/crew), IP/creative, Financial (tax credits)
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Production IP/dailies protection, tax credit documentation integrity, ACTRA/union member PII, digital cinema mastering (DCP) security, NDA enforcement systems, anti-piracy for screeners
- **auditRequirements:** Tax credit records 7 yr, Union records 7 yr, Insurance claims permanent
- **Notes:** Vancouver (BC Film) and Toronto (Ontario Creates) primary hubs. Federal/provincial tax credits (CAVCO, OMDC) require Canadian content certification. MPA content security standards for major studio co-productions. ACTRA/IATSE union data management.

#### Digital Media & Publishing

- **Mandatory compliance:** PIPEDA, CASL, Competition Act, Copyright Act, Online News Act (C-18, 2023), CRTC (if broadcaster)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** OPC, CRTC (CASL), Competition Bureau
- **Data sensitivity:** PII, Behavioral, Subscriber
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** CASL consent management, copyright protection for digital assets, subscriber authentication, ad fraud prevention, Quebec Law 25 consent implementation, paywall security
- **auditRequirements:** CASL records 3 yr, Subscriber data 3 yr after subscription ends, Copyright licensing records 7 yr
- **Notes:** Online News Act (C-18, 2023) governs Google/Meta payments to news publishers. CASL consent for newsletters and notifications. Copyright Act AI training data exemptions under review. Quebec Law 25 cookie consent requirements.

### Education

#### Universities & Research

- **Mandatory compliance:** PIPEDA, FIPPA/ATIA (public institutions), TCPS 2 (research ethics), Provincial university acts
- **Optional compliance:** ISO 27001, NIST CSF, CAN/CIOSC 103-1
- **Regulators:** OPC, Provincial ministries of advanced education, Tri-Council (CIHR/NSERC/SSHRC)
- **Data sensitivity:** PII, PHI (health research), Research IP, Student records
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Research data sovereignty, national security vetting for research partnerships (NSICOP guidance), student FIPPA rights, clinical research PHI under TCPS 2/PHIPA, lab control systems security, foreign researcher oversight
- **auditRequirements:** Student records 10 yr post-graduation, Research data per RDM plan (typically 10 yr), Ethics approvals permanent
- **Notes:** Tri-Agency Research Data Management Policy requires data management plans. National Security Guidelines for Research Partnerships (2023) restrict some foreign-funded research. NSERC restrictions apply to sensitive research areas.

#### K-12 Schools

- **Mandatory compliance:** Provincial education acts, Provincial FIPPA/MFIPPA, PIPEDA (limited — provincial primary), COPPA (for US platforms used)
- **Optional compliance:** SOC 2, Provincial ed-tech procurement requirements
- **Regulators:** Provincial ministries of education, provincial OIPCs
- **Data sensitivity:** PII, Minor data, Student records
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Minor data protection, parental consent management, cloud vendor data residency for student data, cybersecurity training integration, video conferencing security
- **auditRequirements:** Student records 10 yr, Access logs 2 yr, Incident records 5 yr
- **Notes:** Ontario school boards under MFIPPA. BC under FOIPPA. US-hosted platforms (Google Workspace for Education, Microsoft 365) under OPC scrutiny. Ed-tech vendor reviews required. Indigenous student data sovereignty per OCAP® principles.

#### Online Learning & EdTech

- **Mandatory compliance:** PIPEDA, CASL, COPPA (if children), Quebec Law 25, Provincial consumer protection
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** OPC, CRTC (CASL), provincial OIPCs
- **Data sensitivity:** PII, Behavioral (learning), Minor data (if applicable)
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** CASL consent for notifications, learning analytics privacy, minor consent management, plagiarism detection system access controls, payment card security for course fees, Quebec Law 25 privacy dashboard
- **auditRequirements:** CASL records 3 yr, Student learning data 5 yr, Financial records 7 yr
- **Notes:** D2L (Desire2Learn — Waterloo), Top Hat, Prodigy are Canadian EdTech anchors. CASL consent for course reminders. AODA accessibility compliance mandatory in Ontario. Quebec Law 25 cookie consent for QC learners.

### Transportation & Logistics

#### Air Transport

- **Mandatory compliance:** Aeronautics Act, Canadian Aviation Regulations (CARs), Transport Canada, IATA standards, PIPEDA, CATSA (screening)
- **Optional compliance:** SOC 2, ISO 27001, IOSA
- **Regulators:** Transport Canada (TCCA), Nav Canada, CATSA
- **Data sensitivity:** PII, Passenger data, Security (CATSA)
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** Passenger screening data security, PNR/API encryption, CBSA data sharing protocols, baggage system security, aircraft OTA update signing, ACARS communication security
- **auditRequirements:** Passenger records 5 yr, Security event logs 10 yr, Maintenance records: aircraft lifetime
- **Notes:** Air Canada, WestJet, Transat. CATSA for passenger screening. API/PNR data shared with CBSA under CANPASS. Nav Canada air traffic control systems are critical infrastructure. ICAO cybersecurity standards (Doc 10164).

#### Rail Transport

- **Mandatory compliance:** Railway Safety Act, Transport Canada, PIPEDA, Transportation of Dangerous Goods Act
- **Optional compliance:** ISO 27001, NIST CSF
- **Regulators:** Transport Canada, TSB (Transportation Safety Board)
- **Data sensitivity:** PII, OT/SCADA, Dangerous goods
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** Signaling system isolation (SCADA/PTC), dangerous goods tracking integrity, passenger manifest security, bridge/infrastructure monitoring system security, employee OHS data protection
- **auditRequirements:** Safety records permanent, SCADA logs 5 yr, Dangerous goods records 5 yr
- **Notes:** CN, CP (CPKC), VIA Rail, commuter rail (GO Transit, RTM). SCADA for wayside signaling and PTC (Positive Train Control). TDG Act for dangerous goods manifests. Critical infrastructure designation for transcontinental rail.

#### Trucking & Logistics

- **Mandatory compliance:** Motor Vehicle Transport Act, Provincial Highway Traffic Acts, PIPEDA, Transportation of Dangerous Goods Act, ELD mandate (2021)
- **Optional compliance:** C-TPAT (if cross-border), SOC 2, ISO 27001
- **Regulators:** Transport Canada, Provincial transport ministries, CBSA (cross-border)
- **Data sensitivity:** PII (driver/ELD), Commercial, Location/telematics
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** ELD data protection (driver hours and location), supply chain integrity, dangerous goods compliance system, border clearance data security, cargo theft prevention systems
- **auditRequirements:** ELD records 6 months minimum, TDG records 2 yr, CBSA records 7 yr
- **Notes:** ELD (Electronic Logging Device) mandate (2021) creates regulated driver data. CBSA eManifest for cross-border shipments. C-TPAT for Canada-US border trade. PIP (Partners in Protection) program for trusted shippers.

#### Marine, Ports & Shipping

- **Mandatory compliance:** Canada Shipping Act 2001, Transport Canada (marine), PIPEDA, Marine Transportation Security Act, ISPS Code
- **Optional compliance:** ISO 27001, IMO guidelines
- **Regulators:** Transport Canada (marine safety), Port Authorities, Coast Guard
- **Data sensitivity:** PII, Commercial, Critical infrastructure, ISPS-classified
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest
- **keySecurityRequirements:** Port access control systems, vessel tracking (AIS) security, ISPS security plan protection, cargo manifest encryption, port OT security, Arctic communications security
- **auditRequirements:** Security plans classified/permanent, Vessel records 10 yr, Cargo manifests 5 yr
- **Notes:** Port authorities (Vancouver, Montreal, Halifax, Prince Rupert) designated critical infrastructure. ISPS Code security plans are classified. VTS (Vessel Traffic Services) under Nav Canada/Coast Guard. Arctic sovereignty implications for Northern shipping routes.

#### Urban & Public Transit

- **Mandatory compliance:** Provincial transit acts, AODA (ON accessibility), Provincial privacy acts, PIPEDA, PCI DSS (fare payments)
- **Optional compliance:** SOC 2, ISO 27001, IEC 62443
- **Regulators:** Provincial transit authorities, municipal governments, provincial OIPCs
- **Data sensitivity:** PII, Payment, Location, Tap-in/tap-out data
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Fare payment security (PCI DSS), commuter location data minimization, transit card data protection, OT/SCADA security, real-time data API security, AODA app compliance
- **auditRequirements:** Transaction records 1 yr, Security incidents 5 yr, PCI DSS quarterly scans
- **Notes:** Presto (Metrolinx-ON), Compass (TransLink-BC), Opus (STM-QC). Tap-in/tap-out creates detailed location history under PIPEDA. AODA accessibility compliance mandatory for Ontario transit apps. TTC, OC Transpo, STM, Calgary Transit, Edmonton Transit.

### Real Estate & Construction

#### Residential Real Estate

- **Mandatory compliance:** FINTRAC (AML for realtors), PIPEDA, Provincial real estate acts (TRESA-ON, RESA-BC), Prohibition on Purchase by Non-Canadians Act (2022)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** FINTRAC, RECO (ON), BCFSA (BC), OACIQ (QC)
- **Data sensitivity:** PII, Financial, PCI (deposits)
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** FINTRAC beneficial ownership verification, client identity management, land title system integration, deposit trust account security, foreign buyer verification, BC beneficial ownership registry access
- **auditRequirements:** FINTRAC client records 5 yr, Transaction records 7 yr, Trust account records 5 yr
- **Notes:** FINTRAC requires realtors to collect client ID and beneficial ownership (since 2023 amendments). Foreign buyer ban under Prohibition on Purchase by Non-Canadians Act (2022). BC Beneficial Ownership Land Title Registry (LOTR) integration required.

#### Commercial Real Estate

- **Mandatory compliance:** FINTRAC (AML), PIPEDA, Provincial real estate and planning acts, Competition Act (REIT disclosure)
- **Optional compliance:** SOC 2, ISO 27001, BOMA standards
- **Regulators:** FINTRAC, OSFI (REIT financing), provincial regulators
- **Data sensitivity:** PII, Financial, Commercial IP
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Tenant PII protection, building access control system security, BAS/smart building IoT security, FINTRAC client verification, REIT financial disclosure systems, property management platform security
- **auditRequirements:** FINTRAC records 5 yr, Financial records 7 yr, Building safety inspections permanent
- **Notes:** Cadillac Fairview, Oxford Properties, RioCan. Building automation systems (BAS) require OT security. REIT disclosure rules under CSA National Instruments. Smart building IoT creates new PIPEDA obligations.

#### Property Management

- **Mandatory compliance:** Provincial Residential Tenancy Acts (RTA-ON, RTA-BC), PIPEDA, FINTRAC (AML, cash rental)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** Provincial landlord-tenant boards, FINTRAC, provincial OIPCs
- **Data sensitivity:** PII, Financial, Location, Tenant data
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Tenant PII minimization, credit bureau access controls, rental payment processing (PCI), smart building access data security, tenant portal authentication, maintenance worker data collection limits
- **auditRequirements:** Tenancy records 3 yr after tenancy ends, Financial records 7 yr, FINTRAC records 5 yr
- **Notes:** Boardwalk, Killam, Minto. Tenant credit checks under provincial tenancy acts. Smart lock and access fob data creates location PII under PIPEDA. Maintenance request data is PII. FINTRAC applies for cash rental transactions.

### Agriculture

#### Crop Farming & Grain

- **Mandatory compliance:** CFIA (Feeds Act, Seeds Act, Plant Protection Act), SFCA, PIPEDA (agtech platforms), Canada Grain Act
- **Optional compliance:** ISO 22000, GlobalG.A.P., SOC 2 (agtech platforms)
- **Regulators:** CFIA, Canadian Grain Commission, Provincial agriculture ministries
- **Data sensitivity:** Commercial, IP (crop data), Agricultural records
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Crop yield data sovereignty, precision agriculture platform data portability, grain trading system integrity, supply chain traceability for CFIA, farm equipment telematics privacy, provincial grain elevator system security
- **auditRequirements:** CFIA records 5 yr, Agri-program records 7 yr, Grain commission records 5 yr
- **Notes:** Canadian Grain Commission regulates grain grading and weighing. Prairie grain belt (SK, MB, AB) is primary region. Precision agriculture platforms (Farmers Edge, Trimble) handle sensitive crop yield/soil data. Provincial farm data legislation emerging (Alberta leading).

#### Livestock & Aquaculture

- **Mandatory compliance:** Health of Animals Act (CFIA), SFCA, PIPEDA, DFO (aquaculture), Animal Health Act (provincial)
- **Optional compliance:** ISO 22000, HACCP, GlobalG.A.P.
- **Regulators:** CFIA, DFO (Fisheries and Oceans Canada), Provincial agriculture ministries
- **Data sensitivity:** Commercial, Animal health records, PII (producers)
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Animal ID traceability system integrity, DFO fish harvest data security, disease outbreak reporting system security, supply chain traceability farm-to-table, HACCP plan access controls, producer PII protection
- **auditRequirements:** Animal traceability records 3 yr, CFIA inspection records 5 yr, DFO catch records 10 yr
- **Notes:** RFID animal traceability via CCIA (Canadian Cattle Identification Agency) for bovine. DFO aquaculture licensing for BC salmon and shellfish. Avian influenza/disease outbreak reporting is mandatory. HACCP plans must be in digital systems.

#### AgriTech & Precision Ag

- **Mandatory compliance:** PIPEDA (farmer data), CASL, CFIA (crop/pest data), Provincial privacy acts
- **Optional compliance:** SOC 2, ISO 27001, ISO 22000
- **Regulators:** OPC, CFIA, ISED (IoT devices)
- **Data sensitivity:** PII (farmer), Commercial (crop data), IP (algorithms)
- **Pipeline stages affected:** SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST
- **keySecurityRequirements:** Farm data ownership controls, IoT field sensor security, drone data handling, precision agriculture API security, crop yield prediction model IP protection, CASL consent for farming recommendations
- **auditRequirements:** CASL records 3 yr, Financial records 7 yr, Crop data per contract terms, Security incidents 5 yr
- **Notes:** Farmers Edge, Decisive Farming, Veritas Farm Management are key Canadian AgriTech firms. Farm data ownership legislation has no federal law yet (Alberta leading with emerging rules). Satellite/drone imagery creates data sovereignty questions. Saskatoon is Canada's AgriTech hub.

### Legal & Professional Services

#### Law Firms

- **Mandatory compliance:** PIPEDA, Provincial law society rules (LSO-ON, LSBC, BSQ-QC), Solicitor-client privilege, FINTRAC (real estate/corporate transactions)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** Provincial law societies, FINTRAC (designated activities), OPC
- **Data sensitivity:** PII, Privileged communications, Financial
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Solicitor-client privilege technical controls, encrypted client file storage, trust account segregation, FINTRAC client verification, law society-compliant cloud storage, MDM for remote lawyers
- **auditRequirements:** File retention per law society rules (typically 10 yr), FINTRAC records 5 yr, Trust account records 5 yr
- **Notes:** Solicitor-client privilege creates absolute confidentiality obligation. Law Society of Ontario Technology Practice Area guidelines. FINTRAC reporting for real estate lawyers and trust accounts. Cloud storage requires law society compliance assessment before adoption.

#### Accounting, Audit & Tax

- **Mandatory compliance:** CPA Canada standards, Income Tax Act (CRA), PIPEDA, FINTRAC (designated activities)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** CPA Canada (via provincial bodies), CRA (tax), FINTRAC
- **Data sensitivity:** PII, Financial, Tax records, PCI
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Client financial data segmentation, CRA EFILE credential security, tax return data encryption, audit file access controls, CRA MyAccount API security, independence documentation integrity
- **auditRequirements:** Tax files 7 yr minimum (CRA), Audit working papers 7 yr, CPA quality management records 5 yr
- **Notes:** Big 4 Canadian practices (Deloitte, PwC, KPMG, EY). CSQM (Canadian Standard on Quality Management) for firms. CRA e-filing security (EFILE). PCAOB oversight for US-listed Canadian companies. Data analytics in audit creates bulk financial data obligations.

#### Management Consulting

- **Mandatory compliance:** PIPEDA, CASL, Provincial employment standards (where employee data), PSPC supplier qualification (gov contracts)
- **Optional compliance:** SOC 2, ISO 27001, ISO 20000
- **Regulators:** OPC, CRTC (CASL), PSPC (government contracts)
- **Data sensitivity:** PII, Confidential client data, IP
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Client data compartmentalization, NDA technical enforcement, government security screening compliance, knowledge management platform security, AI-assisted tool data privacy, CASL consent for client communications
- **auditRequirements:** Client records per contract (typically 7 yr), CASL consent records 3 yr, Government contracts per PSPC requirements
- **Notes:** McKinsey, Deloitte, PwC, Accenture, KPMG Canadian practices. Government consulting contracts require PSPC security screening (reliability or secret). No sector-specific regulation — inherits client regulatory context.

### Non-profit & Social

#### Registered Charities

- **Mandatory compliance:** Income Tax Act (CRA charity registration), PIPEDA, Provincial Charities Acts, CASL
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** CRA (Charities Directorate), Provincial charity regulators (PGT-BC, PGT-ON), OPC
- **Data sensitivity:** PII, Donor data, Beneficiary data
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Donor database security, CASL consent for fundraising emails, CRA T3010 reporting system integrity, donation processing PCI DSS, beneficiary data sensitivity, international transfer AML controls
- **auditRequirements:** CRA charity records 7 yr, CASL consent records 3 yr, Donor PII 7 yr post last donation
- **Notes:** CRA charity registration requires annual T3010 reporting. CASL rules for non-profits relaxed but commercial electronic message rules still apply for fundraising. International fund transfer reporting if political activities exceed 10% threshold.

#### Healthcare Charities

- **Mandatory compliance:** PIPEDA, PHIPA (if patient data), Provincial charity acts, CASL, Health Canada (if clinical research funded)
- **Optional compliance:** SOC 2, ISO 27001
- **Regulators:** CRA, Provincial OIPCs, Provincial charity regulators
- **Data sensitivity:** PHI, PII, Donor data
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** Patient PII/PHI segmentation from donor data, PHIPA-compliant patient engagement, research participant consent management, CASL fundraising consent, donor PII protection
- **auditRequirements:** Patient records per PHIPA (10 yr), CRA records 7 yr, Research data per RDM plan
- **Notes:** Canadian Cancer Society, Heart & Stroke, MS Society. Patient data subject to PHIPA where circle-of-care adjacent. Research funding requires TCPS 2 alignment. Patient registries under PHIPA. CRA charity rules limit advocacy activities.

#### Indigenous Community Services

- **Mandatory compliance:** PIPEDA, OCAP® principles (Ownership, Control, Access, Possession), Indian Act (where applicable), Provincial/federal social service acts
- **Optional compliance:** ISO 27001, FNFMB standards
- **Regulators:** ISC (Indigenous Services Canada), provincial child welfare, band councils
- **Data sensitivity:** <span class="tag-ocap">OCAP®</span>, PII, Cultural heritage data, Genealogical
- **Pipeline stages affected:** Secrets scan, Container scan, SAST, Sign
- **keySecurityRequirements:** OCAP® compliance for data sovereignty, cultural data access restrictions, genealogical data special handling, community-controlled identity systems, residential school survivor data security, federal/band dual jurisdiction access controls
- **auditRequirements:** Band council records per community governance, ISC reporting 7 yr, Cultural records permanent (community-governed)
- **Notes:** OCAP® principles: data must be Owned and Controlled by the community. FNIGC (First Nations Information Governance Centre) governs standards. Sixties Scoop and residential school records require special handling. ISC funding agreements require data sharing with consent.

## B.4 Base images & distros (compliance-rated)

| Image | FIPS | FedRAMP Mod | FedRAMP High | HIPAA | PCI-DSS | SOC 2 |
|---|---|---|---|---|---|---|
| scratch | — | Par | — | Par | — | Par |
| Alpine Linux 3.21 | — | — | — | Par | Par | Yes |
| UBI-micro 9 | Yes | Yes | Yes | Yes | Yes | Yes |
| UBI-minimal 9 | Yes | Yes | Yes | Yes | Yes | Yes |
| Distroless (gcr.io) | — | Par | — | Par | Par | Par |
| Wolfi / Chainguard | Par | Par | — | Par | Par | Par |
| Azure Linux 3 (CBL-Mariner) | Yes | Yes | Yes | Yes | Par | Par |
| Debian 12 (Bookworm) | — | — | — | Par | Par | Yes |
| Ubuntu 22.04 LTS | Par | Yes | Par | Yes | Yes | Yes |
| Ubuntu 24.04 LTS | Par | Yes | Par | Yes | Yes | Yes |
| Fedora 42 | Par | — | — | — | — | — |
| Amazon Linux 2023 | Yes | Yes | Yes | Yes | Yes | Yes |
| VMware Photon OS 5 | Par | Par | — | Par | Par | Par |
| RHEL 9 | Yes | Yes | Yes | Yes | Yes | Yes |
| CentOS Stream 9 | Par | — | — | Par | Par | Yes |
| Rocky Linux 9 | Par | Par | — | Par | Par | Yes |
| AlmaLinux 9 | Par | Par | — | Par | Par | Yes |
| Oracle Linux 9 | Yes | Yes | Yes | Yes | Yes | Yes |
| Flatcar Container Linux | — | — | — | Par | Par | Par |
| Talos Linux 1.10 | Par | Par | — | Par | Par | Par |
| Bottlerocket 1.x | Yes | Yes | Yes | Yes | Yes | Yes |
| Google COS | Par | Par | — | Par | Par | Par |

## B.5 Libraries (most used across services)

| Library | Ecosystem | Used by |
|---|---|---|
| typescript | npm | 25 services |
| pino | npm | 19 services |
| prom-client | npm | 19 services |
| vitest | npm | 16 services |
| vite | npm | 15 services |
| @types/node | npm | 12 services |
| jest | npm | 12 services |
| @opentelemetry/sdk-node | npm | 10 services |
| @opentelemetry/auto-instrumentations-node | npm | 10 services |
| @opentelemetry/api | npm | 10 services |
| @opentelemetry/exporter-trace-otlp-http | npm | 10 services |
| express-rate-limit | npm | 10 services |
| pino-pretty | npm | 10 services |
| react | npm | 8 services |
| react-dom | npm | 8 services |
| ts-jest | npm | 8 services |
| dotenv | npm | 7 services |
| structlog | pip | 7 services |
| prometheus-client | pip | 7 services |
| slowapi | pip | 7 services |
| opentelemetry-sdk | pip | 7 services |
| opentelemetry-instrumentation-fastapi | pip | 7 services |
| github.com/golang-jwt/jwt/v5 | go | 7 services |
| github.com/google/uuid | go | 7 services |
| gorm.io/driver/postgres | go | 7 services |
| gorm.io/gorm | go | 7 services |
| github.com/beorn7/perks | go | 7 services |
| github.com/cespare/xxhash/v2 | go | 7 services |
| github.com/jackc/pgpassfile | go | 7 services |
| github.com/jackc/pgservicefile | go | 7 services |
| github.com/jackc/pgx/v5 | go | 7 services |
| github.com/jackc/puddle/v2 | go | 7 services |
| github.com/jinzhu/inflection | go | 7 services |
| github.com/jinzhu/now | go | 7 services |
| github.com/klauspost/compress | go | 7 services |
| github.com/munnerz/goautoneg | go | 7 services |
| github.com/prometheus/client_model | go | 7 services |
| github.com/prometheus/common | go | 7 services |
| github.com/prometheus/procfs | go | 7 services |
| golang.org/x/crypto | go | 7 services |

## B.6 Deployment — clusters, GitOps hub-and-spoke, every component

Hub-and-spoke: one central GitOps controller (the hub) manages every cluster (the spokes).
Why: one source of truth deploys to AKS, EKS, GKE, and OpenShift the same way.

### B.6.1 Cluster creation (the spokes)

| Cluster | Cloud | Storage class | Secret identity |
|---|---|---|---|
| EKS | AWS | gp3 | IRSA |
| GKE | GCP | pd-ssd | Workload Identity |
| AKS | Azure | managed-premium | Managed Identity |
| OpenShift | Multi/On-prem |  |  |

- **Amazon EKS:** Terraform creates the Kubernetes cluster on EKS/GKE/AKS/OpenShift. EKS uses gp3 StorageClass; ESO authenticates via IRSA.
- **Google GKE:** Terraform creates the Kubernetes cluster on EKS/GKE/AKS/OpenShift. GKE uses pd-ssd StorageClass; ESO authenticates via Workload Identity.
- **Azure AKS:** Terraform creates the Kubernetes cluster on EKS/GKE/AKS/OpenShift. AKS uses managed-premium StorageClass; ESO authenticates via Managed Identity.
- **Red Hat OpenShift:** Terraform (Component 27) creates the Kubernetes cluster on EKS/GKE/AKS/OpenShift.

### B.6.2 GitOps tools (the hub)

#### ArgoCD

- **Role:** GitOps controller
- **What:** GitOps controller that watches Git repositories and automatically deploys changes to Kubernetes — reconciling actual cluster state with desired state in Git.
- **Version:** 6.7.3
- **Sync interval:** 3 minutes (default ArgoCD polling interval)
- **Watches:** infra/argocd/, services/*/helm/values.yaml
- **Install:**

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd --create-namespace \
  --values infra/argocd/values.yaml \
  --version 6.7.3
```
- **Decision:** ArgoCD over Flux v2
- **Rejected:** Flux v2 — no built-in UI, harder to debug sync failures for non-Kubernetes-expert developers

#### Argo Rollouts

- **Role:** Progressive delivery (canary / blue-green)
- **What:** Extends Kubernetes Deployments with canary and blue-green release strategies — sends a small percentage of traffic to the new version and auto-rolls back if error rate or latency exceeds thresholds.
- **Version:** 2.35.1
- **Install:**

```bash
helm upgrade --install argo-rollouts argo/argo-rollouts \
  --namespace argo-rollouts --create-namespace \
  --version 2.35.1
```
- **Decision:** Argo Rollouts canary with Prometheus analysis
- **Rejected:** Manual canary via ingress weight annotations — requires human watching metrics and manually adjusting weights; no automatic rollback

#### Helm

- **Role:** Kubernetes package manager / chart templating
- **What:** Packages Kubernetes manifests as charts; ArgoCD runs helm template with per-service values.yaml then diffs against the cluster. Manual deploy uses helm upgrade --install.
- **Install:**

```bash
helm upgrade --install <release> <chart> \
  --namespace <env-namespace> \
  --values values.yaml \
  --values values.<env>.yaml \
  --set image.tag=<sha>
```

#### Kustomize

- **Role:** Per-environment config overlays
- **What:** Per-environment config patches layered on top of the base Helm values — lets dev/staging/prod diverge on exactly the fields they need (replicaCount, resources, image tag) while inheriting everything else.
- **Overlays:** kustomize/overlays/staging/kustomization.yaml, kustomize/overlays/prod/kustomization.yaml

#### Flux v2

- **Role:** GitOps controller (rejected alternative)
- **What:** Considered as the GitOps controller but rejected in favor of ArgoCD.
- **Not used:** Flux v2 — no built-in UI, harder to debug sync failures for non-Kubernetes-expert developers.

### B.6.3 Cluster components — all 30, in install order

Each component: what, why, install, verify, failure, decision.

#### Layer — Foundation

##### 01. Namespaces + ResourceQuota + LimitRange  (EXISTS)

- **What:** Creates isolated environments (dev/staging/prod) and caps how much CPU/memory all pods in each namespace can consume.
- **Why:** Without ResourceQuota, one misconfigured service can consume all cluster CPU and starve every other service. LimitRange sets default requests/limits on pods that don't specify them.
- **Wired to:** Every other component deploys into a namespace. StorageClass quotas affect PostgreSQL and Redis. ResourceQuota is enforced alongside Kyverno require-resource-limits policy.
- **Install:**

```bash
kubectl apply -f infra/namespaces.yaml
kubectl apply -f infra/namespace-quotas.yaml
```
- **Verify:** `kubectl get resourcequota -n prod`
  - Expected: prod-quota with limits.cpu: 40 and limits.memory: 80Gi
- **If it fails:** ResourceQuota missing from namespace
  - System: A service requests unlimited CPU; scheduler grants it; starves other services
  - User sees: Other services become unresponsive; Prometheus alerts fire for latency spikes
  - To fix: kubectl apply -f infra/namespace-quotas.yaml; then restart starving services
- **Decision: ResourceQuota per namespace, not per deployment**
  - Rejected: Resource limits only in Helm values — individual deployments can be changed; namespace quota cannot be bypassed by a single service

##### 02. StorageClass  (EXISTS)

- **What:** Defines how Kubernetes dynamically provisions persistent disks for PVCs (PersistentVolumeClaims).
- **Why:** Without a default StorageClass, any PVC stays in Pending state indefinitely. PostgreSQL, Redis, and Loki all require persistent volumes.
- **Wired to:** PostgreSQL (CNPG), Redis (Sentinel), Loki, Tempo all claim PVCs. Must exist before any of those are installed.
- **Install:**

```bash
kubectl apply -f infra/storage-class.yaml
```
- **Verify:** `kubectl get storageclass`
  - Expected: at least one StorageClass with (default) annotation
- **If it fails:** No default StorageClass exists when a PVC is created
  - System: PVC status stays Pending; pods that depend on it stay in ContainerCreating
  - User sees: kubectl get pods shows PostgreSQL, Redis, Loki pods stuck in ContainerCreating
  - To fix: kubectl apply -f infra/storage-class.yaml; PVC binds automatically within 30s
- **Decision: gp3 (EKS) / pd-ssd (GKE) — SSD-backed storage class as default**
  - Rejected: gp2 (EKS) — older generation, lower throughput, higher latency for database workloads

##### 03. RBAC — ClusterRoles, RoleBindings, ServiceAccounts  (EXISTS)

- **What:** Grants minimum necessary permissions to each team (dev read-only, ops deploy, CI service account) and to each service's ServiceAccount.
- **Why:** Without RBAC, every team member has cluster-admin by default — a compromised CI token can delete all namespaces.
- **Wired to:** ArgoCD uses its own ServiceAccount with deploy permissions. ESO uses a ServiceAccount with secret-read permissions. Kyverno webhook uses a ClusterRole.
- **Install:**

```bash
kubectl apply -f infra/rbac/service-accounts.yaml
kubectl apply -f infra/rbac/roles.yaml
kubectl apply -f infra/rbac/bindings.yaml
```
- **Verify:** `kubectl auth can-i create pods --as=system:serviceaccount:ci:ci-runner -n prod`
  - Expected: no (CI runner must not create pods directly in prod)
- **If it fails:** ServiceAccount missing for a component (e.g., ESO, ArgoCD)
  - System: The component's pod starts but immediately fails API calls with 403 Forbidden
  - User sees: ESO logs show "forbidden: User cannot get secret"; secrets never sync
  - To fix: kubectl apply -f infra/rbac/ to recreate all roles and bindings; restart affected pods
- **Decision: Namespace-scoped Roles over ClusterRoles wherever possible**
  - Rejected: Single ClusterRole for all components — simpler to write, but a compromised component gains cluster-wide access

#### Layer — Security

##### 04. cert-manager  (EXISTS)

- **What:** Automatically issues and renews TLS certificates from Let's Encrypt for every Ingress object in the cluster.
- **Why:** Without cert-manager, certificates expire silently. Manual renewal across 106 services × 3 environments = 315 certificates to track manually.
- **Wired to:** ingress-nginx references cert-manager ClusterIssuers. Every Ingress object with a tls block triggers a cert-manager Certificate resource. Must be installed before ingress-nginx.
- **Install:**

```bash
helm repo add jetstack https://charts.jetstack.io
helm upgrade --install cert-manager jetstack/cert-manager \
--namespace cert-manager --create-namespace \
--set installCRDs=true \
--version v1.14.0
```
- **Verify:** `kubectl get clusterissuer letsencrypt-prod -o jsonpath='{.status.conditions[0].type}'`
  - Expected: Ready
- **If it fails:** cert-manager pod crashes or ClusterIssuer is missing
  - System: Existing certificates continue working until they expire. New certificates cannot be issued.
  - User sees: Browser shows "Your connection is not private" after certificate expiry (90 days max)
  - To fix: kubectl rollout restart deploy/cert-manager -n cert-manager; verify ClusterIssuer with kubectl get clusterissuer
- **Decision: Let's Encrypt via cert-manager HTTP-01 challenge**
  - Rejected: AWS ACM / GCP-managed certificates — cloud-provider-specific, breaks portability across EKS/GKE/AKS

##### 05. ingress-nginx  (EXISTS)

- **What:** Runs the NGINX reverse proxy that routes all external HTTP/HTTPS traffic into the cluster based on hostname and path rules.
- **Why:** Without ingress-nginx, each service would need its own cloud load balancer — that is one load balancer per service × 3 environments = 315 load balancers.
- **Wired to:** cert-manager provisions TLS certs for every Ingress object. ExternalDNS creates DNS records pointing to the ingress-nginx LoadBalancer IP. All 106 services create Ingress objects referencing this controller.
- **Install:**

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
--namespace ingress-nginx --create-namespace \
--set controller.replicaCount=2 \
--version 4.9.1
```
- **Verify:** `kubectl get svc ingress-nginx-controller -n ingress-nginx`
  - Expected: TYPE=LoadBalancer with an EXTERNAL-IP (not pending)
- **If it fails:** ingress-nginx controller pods crash or the LoadBalancer IP is lost
  - System: All external traffic to every service fails. Services still run internally.
  - User sees: All service URLs return connection refused or timeout
  - To fix: kubectl rollout restart deploy/ingress-nginx-controller -n ingress-nginx
- **Decision: ingress-nginx over cloud-native load balancers (ALB, GCP LB)**
  - Rejected: AWS ALB Ingress Controller — AWS-only, requires IRSA, incompatible with GKE/AKS

##### 06. Kyverno + Policies  (EXISTS)

- **What:** Policy engine that validates, mutates, and generates Kubernetes resources. Blocks pods that run as root, lack resource limits, or use unscanned images.
- **Why:** Without Kyverno, every developer must manually remember to set security contexts, resource limits, and non-root users. One forgotten setting = privilege escalation vector.
- **Wired to:** Policies enforce ResourceQuota by requiring all pods to have resource limits. Trivy Operator provides image scan results that Kyverno's verify-image policy checks. Must be installed before ArgoCD deploys any workloads.
- **Install:**

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm upgrade --install kyverno kyverno/kyverno \
--namespace kyverno --create-namespace \
--version 3.1.4
kubectl apply -f infra/kyverno-policies/
```
- **Verify:** `kubectl get clusterpolicy`
  - Expected: disallow-root-user, require-resource-limits, disallow-privilege-escalation all in READY state
- **If it fails:** Kyverno webhook is unavailable when a new pod is scheduled
  - System: If webhook is set to Fail, all pod creation is blocked. If set to Ignore, policies are skipped.
  - User sees: kubectl describe pod shows "failed calling webhook" or pods deploy without policy enforcement
  - To fix: kubectl rollout restart deploy/kyverno -n kyverno; check webhook config with kubectl get validatingwebhookconfiguration
- **Decision: Kyverno over OPA/Gatekeeper**
  - Rejected: OPA Gatekeeper — requires writing Rego; steeper learning curve; no mutation support for auto-setting missing fields

##### 07. Network Policies  (EXISTS)

- **What:** Kubernetes NetworkPolicy resources that restrict pod-to-pod traffic — each service can only talk to the services it explicitly needs.
- **Why:** Without network policies, any compromised container can reach every database, secret store, and internal service in the cluster — flat network = complete lateral movement.
- **Wired to:** Requires a CNI plugin that enforces NetworkPolicy (Calico, Cilium, or cloud-native VPC CNI with NetworkPolicy support). ingress-nginx must be whitelisted to reach services. Prometheus must be whitelisted to scrape metrics.
- **Install:**

```bash
kubectl apply -f infra/network-policies/default-deny-all.yaml
kubectl apply -f infra/network-policies/allow-ingress-nginx.yaml
kubectl apply -f infra/network-policies/allow-monitoring.yaml
kubectl apply -f infra/network-policies/per-service/
```
- **Verify:** `kubectl run test --rm -it --image=busybox -- wget -q --timeout=3 http://postgres-service.prod.svc.cluster.local 2>&1`
  - Expected: wget: download timed out (blocked by default-deny policy)
- **If it fails:** CNI plugin does not support NetworkPolicy enforcement (e.g., flannel without policy support)
  - System: NetworkPolicy objects are accepted by the API server but silently ignored; all traffic passes
  - User sees: No immediate error — policies appear installed but provide zero protection
  - To fix: Verify CNI: kubectl get pods -n kube-system / grep calico. Replace CNI if needed (requires node drain).
- **Decision: Default-deny-all base policy with explicit allow rules per service**
  - Rejected: Allow-all base with deny rules for sensitive services — too easy to miss a new service that should be restricted

##### 08. Falco  (EXISTS)

- **What:** Runtime security tool that monitors kernel system calls inside containers and alerts when behavior matches known attack patterns (shell spawn, file read in /etc/shadow, network scan).
- **Why:** Kyverno and network policies prevent misconfigurations but do nothing once a container is running and compromised. Falco is the only component that detects attacks happening inside a live container.
- **Wired to:** Falco alerts route to Alertmanager via falco-exporter. Alertmanager sends to Slack/PagerDuty. Falco requires privileged DaemonSet access to host kernel — must coexist with Kyverno's disallow-privilege-escalation policy (falco namespace is exempted).
- **Install:**

```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm upgrade --install falco falcosecurity/falco \
--namespace falco --create-namespace \
--set falco.grpc.enabled=true \
--set falco.grpc_output.enabled=true \
--version 3.8.7
```
- **Verify:** `kubectl exec -n falco $(kubectl get pod -n falco -l app=falco -o jsonpath='{.items[0].metadata.name}') -- cat /var/log/falco.log / head -5`
  - Expected: Falco version line + "Loading rules from file /etc/falco/falco_rules.yaml"
- **If it fails:** Falco DaemonSet pod crashes (kernel version mismatch with eBPF probe)
  - System: Runtime monitoring stops for that node; no alerts for attacks on that node
  - User sees: No alerts — silence, not an error. Only detected by checking DaemonSet pod health.
  - To fix: kubectl get daemonset falco -n falco; check driver compatibility at falco.org/docs; update driver version in Helm values
- **Decision: Falco eBPF driver over kernel module**
  - Rejected: Falco kernel module — requires loading a kernel module on each node; blocked by managed Kubernetes (GKE, EKS) which disallow unsigned kernel modules

##### 09. Pod Security Admission (PSA)  (EXISTS)

- **What:** Kubernetes built-in admission controller (no install required) that enforces pod security standards (restricted/baseline/privileged) per namespace via namespace labels.
- **Why:** PSA is a second, independent enforcement layer. Even if Kyverno is misconfigured or temporarily down, PSA still blocks privileged pods at the API server level.
- **Wired to:** Works alongside Kyverno — PSA catches violations Kyverno might miss (e.g., during Kyverno pod restart). Falco namespace must be labeled privileged to allow its DaemonSet.
- **Install:**

```bash
kubectl label namespace prod pod-security.kubernetes.io/enforce=restricted
kubectl label namespace prod pod-security.kubernetes.io/warn=restricted
kubectl label namespace prod pod-security.kubernetes.io/audit=restricted
```
- **Verify:** `kubectl get namespace prod -o jsonpath='{.metadata.labels}'`
  - Expected: pod-security.kubernetes.io/enforce=restricted present in labels
- **If it fails:** Namespace label missing — PSA not applied
  - System: Privileged pods deploy without warning; PSA is opt-in, not global
  - User sees: No error — the pod runs as root with no indication
  - To fix: kubectl label namespace prod pod-security.kubernetes.io/enforce=restricted --overwrite
- **Decision: PSA restricted mode on prod, baseline on dev/test**
  - Rejected: restricted mode everywhere — too many dev-only tools (debug containers, profilers) need elevated permissions

#### Layer — GitOps

##### 10. ArgoCD  (EXISTS)

- **What:** GitOps controller that watches Git repositories and automatically deploys changes to Kubernetes — reconciling actual cluster state with desired state in Git.
- **Why:** Without ArgoCD, every deploy requires a human running kubectl apply. With 106 services × 3 environments, that is manual work on 315 deployments.
- **Wired to:** ESO must exist before ArgoCD deploys workloads that reference ExternalSecrets. cert-manager and ingress-nginx must exist before ArgoCD deploys services with Ingress objects. GHCR pull secret must exist before ArgoCD triggers image pulls.
- **Install:**

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm upgrade --install argocd argo/argo-cd \
--namespace argocd --create-namespace \
--values infra/argocd/values.yaml \
--version 6.7.3
```
- **Verify:** `argocd app list --server argocd.yarova.ca`
  - Expected: all applications show STATUS=Synced and HEALTH=Healthy
- **If it fails:** ArgoCD server pod crashes or Git repo becomes unreachable
  - System: Existing running services are unaffected. New commits are not deployed until ArgoCD recovers.
  - User sees: ArgoCD UI unreachable; no new deploys reach the cluster
  - To fix: kubectl rollout restart deploy/argocd-server -n argocd; verify git connectivity with argocd repo list
- **Decision: ArgoCD over Flux v2**
  - Rejected: Flux v2 — no built-in UI, harder to debug sync failures for non-Kubernetes-expert developers

##### 11. Argo Rollouts  (EXISTS)

- **What:** Extends Kubernetes Deployments with canary and blue-green release strategies — sends a small percentage of traffic to the new version and auto-rolls back if error rate or latency exceeds thresholds.
- **Why:** Standard Kubernetes Deployment sends 100% of traffic to the new version immediately. One bad deploy = complete outage. Argo Rollouts limits blast radius to the canary percentage.
- **Wired to:** Uses Prometheus metrics to make auto-rollback decisions — requires Prometheus to be running and scraping the target service. ArgoCD deploys Rollout objects instead of standard Deployment objects.
- **Install:**

```bash
helm upgrade --install argo-rollouts argo/argo-rollouts \
--namespace argo-rollouts --create-namespace \
--version 2.35.1
```
- **Verify:** `kubectl argo rollouts get rollout <service-name> -n prod --watch`
  - Expected: shows canary weight progression and Healthy status
- **If it fails:** Argo Rollouts controller pod crashes during an active canary
  - System: The canary stops progressing; traffic split freezes at current percentage; no auto-rollback fires
  - User sees: Rollout appears stuck; must manually promote or abort via kubectl argo rollouts abort
  - To fix: kubectl rollout restart deploy/argo-rollouts -n argo-rollouts; then manually promote or abort the stuck rollout
- **Decision: Argo Rollouts canary with Prometheus analysis**
  - Rejected: Manual canary via ingress weight annotations — requires human watching metrics and manually adjusting weights; no automatic rollback

#### Layer — Secrets

##### 12. External Secrets Operator (ESO)  (EXISTS)

- **What:** Operator that watches ExternalSecret custom resources and synchronizes secrets from AWS Secrets Manager, GCP Secret Manager, or Azure Key Vault into Kubernetes Secret objects.
- **Why:** Without ESO, secrets must be base64-encoded and stored in etcd (the Kubernetes database). etcd is not encrypted at rest by default — storing raw secrets there is a security violation.
- **Wired to:** Requires IRSA (EKS), Workload Identity (GKE), or Managed Identity (AKS) to authenticate to the cloud secret store. ArgoCD deploys ExternalSecret objects. Must be installed before ArgoCD deploys any service that needs a secret.
- **Install:**

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm upgrade --install external-secrets external-secrets/external-secrets \
--namespace external-secrets --create-namespace \
--version 0.9.18
```
- **Verify:** `kubectl get externalsecret -n prod`
  - Expected: all ExternalSecrets show STATUS=SecretSynced
- **If it fails:** Cloud IAM permission revoked from ESO's ServiceAccount
  - System: ESO cannot read from the secret store; existing Kubernetes Secrets retain their last-synced values; new secrets cannot be created
  - User sees: kubectl get externalsecret shows STATUS=SecretSyncedError; new pod deployments fail if they reference the missing secret
  - To fix: Restore IAM permission; kubectl annotate externalsecret <name> force-sync=$(date +%s) to trigger resync
- **Decision: ESO over Kubernetes native Secrets with Sealed Secrets**
  - Rejected: Bitnami Sealed Secrets — encrypts secrets in Git, but still stores them in etcd; requires managing decryption keys per cluster

##### 13. GHCR Pull Secret  (EXISTS)

- **What:** A Kubernetes Secret of type docker-registry containing GitHub Container Registry credentials — required for the cluster to pull private container images.
- **Why:** Without this secret, every pod that tries to pull an image from ghcr.io/yarova-ca/* gets ImagePullBackOff — no service can start.
- **Wired to:** Every pod spec references this secret via imagePullSecrets. The default ServiceAccount in each namespace must be patched to include the pull secret, or each Deployment must explicitly reference it.
- **Install:**

```bash
kubectl create secret docker-registry ghcr-pull-secret \
--docker-server=ghcr.io \
--docker-username=<github-username> \
--docker-password=<github-pat-with-packages-read> \
--namespace prod
# Repeat for dev and test namespaces
# Or use ESO to sync from the cloud secret store automatically
```
- **Verify:** `kubectl get secret ghcr-pull-secret -n prod -o jsonpath='{.type}'`
  - Expected: kubernetes.io/dockerconfigjson
- **If it fails:** GitHub PAT expires or is revoked
  - System: New pod starts trigger image pulls that fail with 401 Unauthorized; existing running pods are unaffected
  - User sees: kubectl get events -n prod shows ErrImagePull for any pod that restarts or is newly scheduled
  - To fix: Generate new PAT; kubectl delete secret ghcr-pull-secret -n prod; kubectl create secret docker-registry ghcr-pull-secret ... with new PAT
- **Decision: Single shared pull secret managed via ESO, synced from cloud secret store**
  - Rejected: Per-service pull secrets — 105 secrets to rotate every time the PAT expires

#### Layer — Data

##### 14. PostgreSQL — CloudNativePG (CNPG)  (EXISTS)

- **What:** HA PostgreSQL cluster with 1 primary + 2 replicas running inside Kubernetes. CloudNativePG handles streaming replication, automatic failover, and connection management.
- **Why:** Services need a database. Running PostgreSQL in Kubernetes with CNPG gives automated failover in under 30 seconds — critical for the 99.9% SLO.
- **Wired to:** StorageClass (Component 2) must exist — CNPG creates PVCs for each instance. PgBouncer (Component 15) connects to the CNPG primary service. Backup (Component 25) configures WAL archival on the CNPG cluster object.
- **Install:**

```bash
helm upgrade --install cnpg cloudnative-pg/cloudnative-pg \
--namespace cnpg-system --create-namespace \
--version 0.21.0
kubectl apply -f infra/postgres/cluster.yaml
```
- **Verify:** `kubectl get cluster -n postgres`
  - Expected: READY=3/3, STATUS=Cluster in healthy state
- **If it fails:** Primary PostgreSQL pod crashes
  - System: CNPG promotes one replica to primary within 30 seconds; new connections route to the new primary
  - User sees: ~30s of database errors, then automatic recovery. Services log "connection refused" briefly then resume.
  - To fix: Monitor with kubectl get cluster -n postgres --watch; CNPG handles failover automatically
- **Decision: CNPG (CloudNativePG) over managed RDS/Cloud SQL**
  - Rejected: AWS RDS — managed and reliable, but cloud-provider-locked and 3× more expensive per month at production sizing

##### 15. PgBouncer — Connection Pooler  (EXISTS)

- **What:** Connection pooler that sits between all 106 services and PostgreSQL — multiplexes many service connections into a small pool of actual PostgreSQL connections.
- **Why:** PostgreSQL max_connections defaults to 100. With 106 services each maintaining a connection pool, the total exceeds max_connections within minutes of startup — without PgBouncer, the database refuses new connections.
- **Wired to:** Services connect to PgBouncer's ClusterIP (not directly to CNPG). PgBouncer connects to the CNPG primary read-write service. Credentials stored as an ESO-managed Kubernetes Secret.
- **Install:**

```bash
kubectl apply -f infra/pgbouncer/deployment.yaml
kubectl apply -f infra/pgbouncer/service.yaml
kubectl apply -f infra/pgbouncer/configmap.yaml
```
- **Verify:** `kubectl exec -n postgres deploy/pgbouncer -- psql -h localhost -p 5432 -U pgbouncer pgbouncer -c "SHOW POOLS;"`
  - Expected: pools table showing active client and server connections
- **If it fails:** PgBouncer deployment is unavailable (pod crash or misconfiguration)
  - System: All services that connect through PgBouncer lose database access immediately; services that connect directly to CNPG are unaffected
  - User sees: HTTP 500 errors from all services that require database reads or writes
  - To fix: kubectl rollout restart deploy/pgbouncer -n postgres; verify with SHOW POOLS command above
- **Decision: PgBouncer in transaction pooling mode**
  - Rejected: Session pooling mode — holds a server connection per client session; does not solve the max_connections problem under load

##### 16. Redis — Sentinel HA  (EXISTS)

- **What:** HA Redis cluster (1 primary + 2 replicas + 3 Sentinel processes) for distributed caching, token blacklist, and rate limiting across all 106 services.
- **Why:** Without a shared Redis, token revocation only works on the pod that processed the logout — other pods still accept the revoked token. Rate limiting is per-pod, not per-user-globally.
- **Wired to:** All 106 services connect to the Redis Sentinel endpoint (not the primary directly). Token blacklist entries written by auth-service are read by all API services. ESO syncs the redis-password secret.
- **Install:**

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm upgrade --install redis bitnami/redis \
--namespace redis --create-namespace \
--set architecture=replication \
--set sentinel.enabled=true \
--set auth.existingSecret=redis-password \
--version 18.19.4
```
- **Verify:** `kubectl exec -n redis redis-master-0 -- redis-cli -a <password> ping`
  - Expected: PONG
- **If it fails:** Redis primary pod crashes
  - System: Sentinel promotes a replica to primary within 10–30 seconds; services briefly see connection errors then reconnect
  - User sees: ~15s of rate limit bypass possible during failover; token revocations during this window may not propagate
  - To fix: Monitor with kubectl get pods -n redis; Sentinel handles failover automatically
- **Decision: Redis Sentinel over Redis Cluster**
  - Rejected: Redis Cluster — horizontal sharding; adds complexity for key routing that is unnecessary at current scale (well under 100GB keyspace)

#### Layer — Observability

##### 17. Prometheus + Grafana  (EXISTS)

- **What:** Prometheus scrapes metrics from all pods every 15 seconds and stores them in a time-series database. Grafana visualizes the metrics as dashboards and SLO burn rate charts.
- **Why:** Without Prometheus, you cannot answer "is the service slow right now, or did it slow down 20 minutes ago?" You cannot detect an SLO breach before it becomes an outage.
- **Wired to:** Argo Rollouts reads Prometheus metrics for canary analysis. Alertmanager (Component 18) routes alerts triggered by Prometheus rules. Grafana datasources include Loki (Component 19) and Tempo (Component 20) via Component 29.
- **Install:**

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install kube-prometheus-stack \
prometheus-community/kube-prometheus-stack \
--namespace monitoring --create-namespace \
--values infra/monitoring/prometheus-values.yaml \
--version 57.2.0
```
- **Verify:** `kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090 # Then open http://localhost:9090/targets`
  - Expected: all service targets show State=UP
- **If it fails:** Prometheus pod runs out of disk (default 50Gi PVC)
  - System: Prometheus stops ingesting metrics; existing data is readable until TSDB compaction fails
  - User sees: Grafana dashboards show "No data" for recent timeframes; Alertmanager stops firing alerts
  - To fix: kubectl get pvc -n monitoring; expand PVC or reduce retention from 15d to 7d in Helm values; restart Prometheus pod
- **Decision: kube-prometheus-stack (all-in-one Helm chart) over installing Prometheus and Grafana separately**
  - Rejected: Separate Prometheus and Grafana installs — requires manually wiring datasources, recording rules, and default dashboards

##### 18. Alertmanager  (EXISTS)

- **What:** Receives alerts from Prometheus, deduplicates them, groups related alerts, and routes them to Slack channels or PagerDuty based on severity and namespace.
- **Why:** Prometheus fires alerts into a void without Alertmanager. A disk full event at 3am is never seen until a developer checks dashboards in the morning.
- **Wired to:** Prometheus sends alerts to Alertmanager via its built-in alertmanager endpoint. Alertmanager reads a Secret containing Slack webhook URL and PagerDuty integration key (synced by ESO).
- **Install:**

```bash
kubectl apply -f infra/monitoring/alertmanager-config.yaml
```
- **Verify:** `kubectl port-forward svc/kube-prometheus-stack-alertmanager -n monitoring 9093:9093 # Then open http://localhost:9093/#/alerts`
  - Expected: Alertmanager UI loads; check that Slack/PagerDuty receivers are listed under Status > Config
- **If it fails:** Slack webhook URL rotated; old URL stored in Alertmanager config
  - System: Alertmanager fires alerts but all Slack notifications fail with 403; PagerDuty still works if configured separately
  - User sees: No Slack alerts; only discoverable by checking Alertmanager logs
  - To fix: Update Slack webhook in cloud secret store; ESO syncs to Kubernetes Secret; kubectl rollout restart alertmanager pods
- **Decision: Alertmanager routing: critical=PagerDuty, warning=Slack**
  - Rejected: All alerts to Slack — alert fatigue; critical alerts buried under warnings; no escalation path

##### 19. Loki + Promtail  (EXISTS)

- **What:** Loki is a log aggregation system. Promtail is a DaemonSet agent that reads logs from all pod stdout and ships them to Loki with Kubernetes metadata labels.
- **Why:** Without Loki, finding what happened on a specific request across 14 microservices requires SSHing to nodes and grepping individual pod logs — impossible when pods have already restarted.
- **Wired to:** Promtail runs as a DaemonSet and reads /var/log/pods/* on each node. Loki stores logs and is queried by Grafana (Component 29 wires this). Structured JSON logs from services include a trace_id field that links to Tempo (Component 20).
- **Install:**

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm upgrade --install loki grafana/loki-stack \
--namespace monitoring \
--set promtail.enabled=true \
--set loki.persistence.enabled=true \
--set loki.persistence.size=50Gi \
--version 2.10.2
```
- **Verify:** `kubectl logs -n monitoring -l app=promtail --tail=20`
  - Expected: "level=info msg=Sending batch" entries with non-zero byte counts
- **If it fails:** Loki PVC fills up (50Gi default, 7-day retention)
  - System: Loki stops accepting new logs; Promtail buffers briefly then drops logs
  - User sees: Grafana log queries return no recent results; Promtail logs show "429 Too Many Requests" from Loki
  - To fix: Expand Loki PVC or reduce retention; kubectl delete pod loki-0 -n monitoring to restart after expansion
- **Decision: Loki over Elasticsearch/OpenSearch for logs**
  - Rejected: Elasticsearch — indexes all log fields, which is powerful but requires 8–16GB RAM per node at this log volume

##### 20. Tempo — Distributed Tracing  (EXISTS)

- **What:** Distributed tracing backend that stores OpenTelemetry spans. Every request gets a trace ID; Tempo shows the full call chain across all 14 microservices it touched.
- **Why:** A 500ms latency spike in prod spans 8 services. Without tracing you cannot tell which service added 400ms. With Tempo you see the exact span — 400ms was the PostgreSQL query in user-service.
- **Wired to:** Services send OTel spans to the Tempo endpoint (OTLP gRPC port 4317). Loki logs include trace_id; Grafana can jump from a log line to the matching trace. Component 29 wires Tempo as a Grafana datasource.
- **Install:**

```bash
helm upgrade --install tempo grafana/tempo \
--namespace monitoring \
--set tempo.storage.trace.backend=local \
--set tempo.storage.trace.local.path=/var/tempo/traces \
--version 1.7.1
```
- **Verify:** `kubectl port-forward svc/tempo -n monitoring 3200:3200 curl http://localhost:3200/api/echo`
  - Expected: {"status":"ok"}
- **If it fails:** Tempo pod crashes or disk fills up
  - System: New trace spans are dropped; existing stored traces remain readable until TTL
  - User sees: Grafana Explore shows "No data" for traces; services continue working normally
  - To fix: kubectl rollout restart deploy/tempo -n monitoring; clear old traces if disk is full
- **Decision: Tempo over Jaeger**
  - Rejected: Jaeger — does not integrate natively with Grafana; separate UI required; no out-of-the-box Loki log correlation

##### 21. Trivy Operator  (EXISTS)

- **What:** Continuously scans every container image running in the cluster for CVEs and exposes scan results as Kubernetes CRDs (VulnerabilityReport) queryable via kubectl.
- **Why:** CI scans images at build time. Trivy Operator scans images while they are running — a CVE published after the last build is caught within hours, not in the next quarterly security review.
- **Wired to:** Scan results are exposed as Prometheus metrics (trivy_image_vulnerabilities gauge) scraped by Prometheus. Grafana dashboard shows CVE counts per image. Kyverno can reference scan results to block images with critical CVEs.
- **Install:**

```bash
helm repo add aqua https://aquasecurity.github.io/helm-charts
helm upgrade --install trivy-operator aqua/trivy-operator \
--namespace trivy-system --create-namespace \
--version 0.21.4
```
- **Verify:** `kubectl get vulnerabilityreport -n prod --no-headers / wc -l`
  - Expected: count equal to number of unique container images running in prod namespace
- **If it fails:** Trivy Operator cannot pull the vulnerability database (air-gapped cluster or network policy blocks egress)
  - System: Scan jobs fail; VulnerabilityReports become stale; new CVEs not detected
  - User sees: kubectl get vulnerabilityreport shows old scan dates; kubectl describe vulnerabilityreport shows "failed to download DB"
  - To fix: Mirror Trivy DB to internal registry; configure operator to use mirror via Helm values trivyOperator.trivyImageRepository
- **Decision: Trivy Operator (cluster-side continuous scan) in addition to CI-time Trivy scan**
  - Rejected: CI-only scanning — CVEs published after build are invisible until next build cycle, which can be weeks for stable services

#### Layer — Reliability

##### 22. Velero — Cluster Backup  (EXISTS)

- **What:** Backs up all Kubernetes resource definitions (Deployments, ConfigMaps, Secrets, CRDs, RBAC) and PVC snapshots to S3/GCS. Enables full cluster restore from scratch.
- **Why:** Without Velero, a catastrophic cluster failure (accidental deletion, cloud provider incident) requires manually recreating every resource. With Velero, restore is one command and takes under 30 minutes.
- **Wired to:** Requires cloud IAM permissions to write to S3/GCS (via IRSA/Workload Identity). PVC snapshots use the cloud provider's snapshot API. ESO-synced secrets are backed up as Kubernetes Secret objects (already pulled from the cloud store).
- **Install:**

```bash
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm upgrade --install velero vmware-tanzu/velero \
--namespace velero --create-namespace \
--values infra/velero/values.yaml \
--version 6.4.0
# values.yaml sets S3 bucket, schedule: "0 2 * * *", TTL: 720h (30 days)
```
- **Verify:** `velero backup get`
  - Expected: most recent backup with STATUS=Completed and ERRORS=0
- **If it fails:** Velero backup job fails (S3 permission error, disk snapshot quota hit)
  - System: The cluster continues running; only the backup copy is missing; previous backup is still valid
  - User sees: velero backup get shows STATUS=Failed; Alertmanager fires VeleroBackupFailed alert
  - To fix: velero backup describe <name> --details to see error; fix IAM permission or quota; velero backup create manual-backup to retry
- **Decision: Velero daily backup at 02:00 UTC, 30-day retention**
  - Rejected: Hourly backups — EBS/PD snapshot costs scale linearly; 30 snapshots per PVC per day at prod scale exceeds $500/month

##### 23. ExternalDNS  (EXISTS)

- **What:** Watches Ingress objects and automatically creates/updates DNS A records in Route53/Cloud DNS/Azure DNS pointing to the ingress-nginx LoadBalancer IP.
- **Why:** Without ExternalDNS, deploying a new service requires a manual DNS entry. With 106 services × 3 environments, that is 315 DNS entries to keep synchronized manually.
- **Wired to:** Reads hostname from Ingress spec.rules[].host. Creates DNS records pointing to the ingress-nginx LoadBalancer external IP. Requires Route53 write permissions via IRSA (EKS) or equivalent.
- **Install:**

```bash
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm upgrade --install external-dns external-dns/external-dns \
--namespace external-dns --create-namespace \
--set provider=aws \
--set policy=upsert-only \
--set txtOwnerId=prod-cluster \
--version 1.14.4
```
- **Verify:** `kubectl logs -n external-dns deploy/external-dns / grep "Desired change"`
  - Expected: "Desired change: 0" when DNS is in sync with Ingress objects
- **If it fails:** ExternalDNS IAM permission revoked
  - System: Existing DNS records remain valid; new Ingress objects do not get DNS entries; deleted services keep their DNS records
  - User sees: New service URL returns NXDOMAIN; ExternalDNS logs show "AccessDenied" from Route53
  - To fix: Restore IAM permission; ExternalDNS will reconcile on next sync cycle (default 1 minute)
- **Decision: policy=upsert-only (never deletes DNS records)**
  - Rejected: policy=sync — automatically deletes DNS records for removed Ingresses; one accidental Ingress deletion = prod URL goes dark

##### 24. Cluster Autoscaler  (EXISTS)

- **What:** Monitors pods in Pending state due to insufficient node resources and automatically adds nodes to the cluster; removes underutilized nodes during low traffic periods.
- **Why:** Without the autoscaler, node capacity must be over-provisioned to handle peak load — wasting money at off-peak hours. Or nodes run full and new pods stay Pending indefinitely during traffic spikes.
- **Wired to:** Reads ResourceQuota and node taints to calculate whether a pending pod can fit on a new node. Node groups must have autoscaling enabled in the cloud provider (ASG on EKS, MIG on GKE). ResourceQuota caps still apply — autoscaler cannot add capacity beyond namespace quota.
- **Install:**

```bash
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm upgrade --install cluster-autoscaler autoscaler/cluster-autoscaler \
--namespace kube-system \
--set autoDiscovery.clusterName=prod \
--set awsRegion=us-east-1 \
--version 9.36.0
```
- **Verify:** `kubectl logs -n kube-system deploy/cluster-autoscaler / grep "Scale-up"`
  - Expected: scale-up events matching traffic spikes; or "No scale up needed" during normal load
- **If it fails:** Node group max size reached; cluster cannot add more nodes
  - System: Pods remain in Pending state; existing services are unaffected; autoscaler logs "max node group size reached"
  - User sees: New deployments or scaled replicas stay Pending; kubectl get pods shows Pending with "0/N nodes are available"
  - To fix: Increase node group max size in cloud console or Terraform; autoscaler detects the higher limit within 10 minutes
- **Decision: Cluster Autoscaler over Karpenter (EKS)**
  - Rejected: Karpenter — more flexible instance selection and faster provisioning, but EKS-only; incompatible with the multi-cloud cluster design

##### 25. PostgreSQL Backup (CNPG WAL Archival)  (EXISTS)

- **What:** Configures CloudNativePG to continuously archive WAL (Write-Ahead Log) segments to S3/GCS and take daily base backups — enabling point-in-time recovery (PITR) to any second in the last 7 days.
- **Why:** Velero backs up Kubernetes resources. PostgreSQL data lives inside PVCs and is not safely backed up by volume snapshots alone — a snapshot mid-transaction produces a corrupted backup. WAL archival is the only correct PostgreSQL backup strategy.
- **Wired to:** Requires S3 write access via IRSA. The CNPG Cluster object must be updated (not a separate install). Velero backs up the Cluster CRD object; the actual data is in S3 via CNPG.
- **Install:**

```bash
kubectl apply -f infra/postgres/cluster-with-backup.yaml
# cluster-with-backup.yaml sets:
#   backup.barmanObjectStore.destinationPath: s3://yarova-pg-backup
#   backup.barmanObjectStore.wal.compression: gzip
#   scheduledBackup: "0 3 * * *" (daily at 03:00 UTC)
```
- **Verify:** `kubectl get scheduledbackup -n postgres kubectl get backup -n postgres --sort-by=.metadata.creationTimestamp / tail -3`
  - Expected: most recent backup shows phase=completed
- **If it fails:** S3 bucket deleted or CNPG IAM role loses write permission
  - System: WAL archival fails silently; database continues serving queries; CNPG logs show archival errors
  - User sees: kubectl describe cluster -n postgres shows "WAL archiving failing" in status conditions
  - To fix: Fix S3 permission; CNPG will resume archival and catch up on buffered WAL segments automatically
- **Decision: CNPG WAL archival to S3, 7-day PITR window**
  - Rejected: PVC snapshots as the sole database backup — snapshots are not crash-consistent for PostgreSQL; risk of data corruption on restore

#### Layer — Cost

##### 26. OpenCost  (EXISTS)

- **What:** Real-time cost allocation tool that breaks down the cloud bill by namespace, service, label, and team — visible in Grafana and queryable via API.
- **Why:** Without OpenCost, the AWS/GCP bill is one number per month. You cannot tell whether the $4,000 spike was caused by the new ML service in prod or a runaway dev namespace.
- **Wired to:** Reads Prometheus metrics for CPU/memory usage (requires Prometheus to be running). Uses cloud pricing APIs to calculate cost per resource unit. Grafana dashboard shows cost breakdown by namespace and label.
- **Install:**

```bash
helm repo add opencost https://opencost.github.io/opencost-helm-chart
helm upgrade --install opencost opencost/opencost \
--namespace opencost --create-namespace \
--set opencost.exporter.cloudProviderApiKey="" \
--version 1.38.1
```
- **Verify:** `kubectl port-forward svc/opencost -n opencost 9090:9090 curl http://localhost:9090/allocation?window=1d / jq '.data[0] / keys'`
  - Expected: JSON with namespace names and cost breakdowns
- **If it fails:** OpenCost cannot reach the cloud pricing API (network policy blocks egress)
  - System: OpenCost falls back to default on-demand pricing estimates; actual cost data is unavailable
  - User sees: Grafana cost dashboard shows estimates marked "(estimate)" rather than actuals
  - To fix: Allow opencost namespace egress to pricing endpoints in network policy; restart OpenCost pod
- **Decision: OpenCost over Kubecost**
  - Rejected: Kubecost — OpenCost is the open-source core of Kubecost; enterprise Kubecost adds a $2,000+/year license for features (governance, anomaly detection) not needed at this scale

#### Layer — Infra

##### 27. Terraform — Cluster Provisioning  (EXISTS)

- **What:** Infrastructure-as-code tool that creates and manages the Kubernetes cluster itself (EKS/GKE/AKS), node groups, VPC networking, IAM roles, and cloud resources from .tf files in Git.
- **Why:** Without Terraform, cluster creation is a series of console clicks that cannot be reproduced exactly. A new environment takes days. With Terraform, a new cluster is terraform apply — identical to the existing ones.
- **Wired to:** Terraform creates the cluster; all other components (cert-manager, ArgoCD, etc.) are installed into the cluster via the Helm install commands documented in each component above (run in the dependency order shown in the Full Install Sequence section below) after terraform apply completes. Terraform state stored in Component 28.
- **Install:**

```bash
cd infra/clusters/terraform/prod
cp terraform.tfvars.example terraform.tfvars
# Edit: set region, account_id, node_count, node_type
terraform init
terraform apply
```
- **Verify:** `terraform show / grep cluster_name kubectl get nodes`
  - Expected: nodes in Ready state matching the node_count in terraform.tfvars
- **If it fails:** terraform apply fails mid-run due to cloud API throttling or quota exceeded
  - System: Terraform partially creates resources; state file records what was created; next apply completes remaining resources
  - User sees: terraform apply exits with error; running terraform apply again resolves partial state
  - To fix: Run terraform apply again — Terraform is idempotent; re-running completes the partial apply safely
- **Decision: Terraform over Pulumi or cloud-native CLI tools (eksctl, gcloud container clusters create)**
  - Rejected: eksctl — AWS-only; scripts would need rewriting for GKE and AKS

##### 28. Terraform State Backend (S3 / GCS)  (EXISTS)

- **What:** Remote storage for the Terraform state file — an S3 bucket (EKS) or GCS bucket (GKE) with DynamoDB/GCS locking to prevent concurrent terraform applies from corrupting state.
- **Why:** Without a remote state backend, two developers running terraform apply simultaneously create duplicate resources (two clusters, two VPCs) — neither knows about the other's changes.
- **Wired to:** Every Terraform module's backend.tf references this bucket. DynamoDB (AWS) or GCS object locking provides mutual exclusion for concurrent applies.
- **Install:**

```bash
# AWS
aws s3 mb s3://yarova-terraform-state --region us-east-1
aws dynamodb create-table --table-name terraform-lock \
--attribute-definitions AttributeName=LockID,AttributeType=S \
--key-schema AttributeName=LockID,KeyType=HASH \
--billing-mode PAY_PER_REQUEST

# GCP
gcloud storage buckets create gs://yarova-terraform-state \
--uniform-bucket-level-access
```
- **Verify:** `terraform state list / head -5`
  - Expected: list of managed resources (module.eks.aws_eks_cluster.main, etc.)
- **If it fails:** State file locked (previous terraform apply crashed mid-run)
  - System: All subsequent terraform commands fail with "Error acquiring the state lock"
  - User sees: terraform apply output: "Error locking state: Error acquiring the state lock"
  - To fix: Verify the previous run is truly stopped; then terraform force-unlock <lock-id> (use with caution)
- **Decision: S3 + DynamoDB state backend (AWS) / GCS with object locking (GCP)**
  - Rejected: Terraform Cloud remote state — adds external SaaS dependency; free tier is limited; team prefers self-hosted state

#### Layer — Observability

##### 29. Grafana Datasources — Loki + Tempo  (EXISTS)

- **What:** Configures Grafana to use Loki as a log datasource and Tempo as a tracing datasource — enabling log search and trace browsing from the Grafana UI without separate dashboards.
- **Why:** Loki and Tempo run and collect data regardless. Without the datasource wiring, they are invisible in Grafana. This is the final 5-minute step that unlocks the full observability stack.
- **Wired to:** Loki (Component 19) and Tempo (Component 20) must be running before datasources are wired. Grafana Operator CRDs required — included in kube-prometheus-stack.
- **Install:**

```bash
kubectl apply -f infra/monitoring/grafana-datasources.yaml
```
- **Verify:** `kubectl port-forward svc/kube-prometheus-stack-grafana -n monitoring 3000:80 # Open http://localhost:3000 > Connections > Data Sources`
  - Expected: Loki and Tempo listed with green "Data source connected and labels found" status
- **If it fails:** Loki or Tempo service ClusterIP changes after a reinstall
  - System: Grafana datasource URL points to old IP; queries return "connection refused"
  - User sees: Grafana shows "Data source connected but no labels found" or timeout errors in Explore
  - To fix: kubectl get svc loki -n monitoring to confirm current URL; update datasource URL; kubectl apply -f infra/monitoring/grafana-datasources.yaml
- **Decision: GrafanaDatasource CRDs managed in Git, not Grafana UI**
  - Rejected: Configure datasources via Grafana UI — configuration is lost on Grafana pod restart unless persistence is configured

#### Layer — Developer Platform

##### 30. Backstage Developer Portal  (EXISTS)

- **What:** Internal developer portal providing a service catalog of all 106 services, TechDocs for browsable documentation, and software templates for scaffolding new services from the CLI.
- **Why:** Without Backstage, developers discover services by searching GitHub or asking teammates. With 106 services across 3 environments, service ownership, runbooks, and onboarding paths are invisible without a catalog.
- **Wired to:** PostgreSQL (Component 14) — Backstage stores catalog state in a PostgreSQL database. GitHub OAuth — all authentication flows through GitHub. catalog-info.yaml files in each of the 106 service repos register the service in the catalog. backstage/catalog/all.yaml is the root catalog file that imports all service registrations.
- **Install:**

```bash
See backstage/GITHUB-OAUTH-SETUP.md and scripts/setup-backstage.sh
```
- **Verify:** `curl http://localhost:7007/api/catalog/entities`
  - Expected: JSON array of catalog entries — one object per registered service
- **If it fails:** Backstage shows "No catalog results" after login
  - System: Backstage frontend loads but the catalog API returns an empty array; backend is running but catalog ingestion failed
  - User sees: Empty catalog — no services, no components, no APIs listed in the UI
  - To fix: Verify backstage/catalog/all.yaml is readable and all catalog-info.yaml files have valid YAML; restart the Backstage backend pod to trigger a fresh catalog sync
- **If it fails:** Backstage backend fails to start — PostgreSQL unreachable or required env var missing
  - System: Backend pod crashes on startup with a database connection error or missing config error; frontend cannot reach the API
  - User sees: curl http://localhost:7007/api/catalog/entities returns connection refused or HTTP 500
  - To fix: Verify PostgreSQL is running (Component 14); verify GITHUB_TOKEN, AUTH_GITHUB_CLIENT_ID, AUTH_GITHUB_CLIENT_SECRET are all set; check backend pod logs for the exact missing variable name
- **Decision: Backstage with PostgreSQL backend over SQLite**
  - Rejected: SQLite backend — Backstage default for local dev only; data is lost on pod restart; does not support multiple Backstage replicas

## B.7 Auth — every option, decided

### None (Anonymous / No Auth)

- **What:** No identity or credential is required; every caller is treated as an anonymous, fully trusted principal.
- **How it works:** The endpoint accepts requests with zero credential verification. No token, key, or certificate is checked. Authorization, rate-limiting, and abuse controls (if any) rely entirely on network position (VPC, private subnet, service mesh) or an upstream gateway that already authenticated the caller.
- **Security level:** low
- **When to pick:** Public read-only data, health/liveness probes, static asset CDNs, or an internal hop already behind mutual auth at the mesh (Istio/Linkerd) where the app delegates identity to the sidecar.
- **When NOT:** Any endpoint that mutates state, returns PII/PHI/cardholder data, or is reachable from the public internet without an upstream auth layer. Never for Canada-first workloads touching personal information under PIPEDA.
- **Trade-off vs:**
  - jwt: none has zero crypto cost and zero key management, but provides no caller identity, no audit subject, and no revocation story.
  - apikey: none cannot attribute usage to a tenant or enforce per-key quotas; apikey gives a minimal identity for metering and revocation.
  - mtls: none trusts the network blindly; mtls cryptographically proves both peers even on a hostile network.
- **Compliance fit:**
  - pci: prohibited for any CDE component (PCI-DSS 4.0 Req 8 mandates unique IDs)
  - hipaa: prohibited where ePHI is accessible (164.312(d) person/entity authentication)
  - soc2: fails CC6.1 logical access unless compensated by an upstream auth gateway
  - pipeda: prohibited for endpoints exposing personal information (Principle 7 Safeguards)
  - phipa: prohibited for PHI access; Ontario PHIPA s.12 requires access controls
  - osfi: prohibited for FRFI systems; OSFI B-13 requires authenticated access
  - fintrac: prohibited for systems holding KYC/transaction records (PCMLTFA recordkeeping integrity)
- **Per industry:**
  - banking: Never on any OSFI-regulated path. Acceptable only for unauthenticated marketing/health-check endpoints carved out of the CDE/regulated zone.
  - healthcare: Never on PHI paths. Permitted only for public clinic-info or appointment-availability lookups with no patient data.
  - government: Permitted only for fully public open-data portals; BC Gov / GC Digital standards still require WAF + rate-limiting in front.
  - retail: Acceptable for public catalog/inventory reads; never for cart, checkout, account, or anything touching payment.
- **Implementation:** No library. Enforce defense-in-depth: WAF (Cloudflare/AWS WAF), rate-limit, and network isolation. Document the explicit no-auth decision in a threat model.

### JWT (Bearer Token)

- **What:** Self-contained signed token carrying claims, verified statelessly by the resource server without a DB lookup.
- **How it works:** An issuer signs a JSON payload (claims like sub, exp, aud, scope) producing a JWS. The client sends it as 'Authorization: Bearer <jwt>'. The API verifies the signature against the issuer's public key (JWKS), then checks exp, nbf, aud, and iss before trusting claims. Stateless: no session store needed, which makes revocation hard.
- **Security level:** med
- **When to pick:** Stateless microservices, mobile/SPA backends, and service-to-service calls where you control issuance and want fast verification without a central session DB.
- **When NOT:** When you need instant revocation, long-lived sessions, or you cannot protect the signing key. Avoid as a hand-rolled login system; prefer OIDC for human users and let an IdP mint the JWT.
- **Trade-off vs:**
  - oauth2: jwt is just the token format; oauth2 is the full delegation/issuance framework. Use oauth2 to obtain JWTs properly rather than minting them yourself.
  - oidc: jwt alone proves nothing about who issued it for a human login; oidc adds the id_token, discovery, and standardized identity claims.
  - apikey: jwt expires and carries scoped claims; apikey is long-lived and opaque with no built-in expiry.
  - none: jwt gives a verifiable audited subject; none gives nothing.
- **Compliance fit:**
  - pci: acceptable as token format but PCI-DSS Req 8.4/8.5 still mandates MFA for CDE access
  - hipaa: acceptable with short exp (<=15 min access token) + audit logging of sub on every PHI access
  - soc2: meets CC6.1 when verified server-side with JWKS rotation and bounded lifetime
  - pipeda: acceptable; log token subject for accountability (Principle 1)
  - phipa: acceptable with audit trail tying sub to PHI access events
  - osfi: acceptable as transport; OSFI B-13 expects key rotation and short lifetimes
  - fintrac: acceptable; ensure subject identity maps to a recorded user for audit
- **Per industry:**
  - banking: Use RS256/ES256 (never HS256 shared secrets across services), exp <= 15 min, refresh rotation, and a revocation list (denylist or short TTL) for OSFI auditability.
  - healthcare: Bind sub to a clinician identity, exp <= 15 min, and emit an audit event on every ePHI read for HIPAA 164.312(b) / PHIPA logging.
  - government: Align with GC PKI / BC Gov SSO; prefer asymmetric signing and validate aud strictly to prevent token replay across services.
  - retail: Fine for customer sessions; keep access tokens short and store refresh tokens in httpOnly secure cookies, not localStorage.
- **Implementation:** jose (JS) or PyJWT/python-jose; verify with JWKS. Standards: RFC 7519 (JWT), RFC 7515 (JWS), RFC 7517 (JWKS). Prefer ES256.

### OAuth 2.1 (Authorization Framework)

- **What:** Delegated authorization framework letting a client obtain scoped access tokens to call APIs on a user's behalf.
- **How it works:** An authorization server issues access tokens after a flow (Authorization Code + PKCE for apps, Client Credentials for machine-to-machine). The client presents the access token to the resource server, which validates it (introspection RFC 7662 or local JWT verify). Scopes bound what the token can do. Refresh tokens obtain new access tokens without re-prompting.
- **Security level:** high
- **When to pick:** Third-party/delegated access, multi-client platforms, and any time a user grants an app limited access to their data. Client Credentials for service-to-service.
- **When NOT:** Pure machine-to-machine inside one trust domain where mTLS is simpler. Overkill for a single first-party API with one client (a signed JWT or session may suffice).
- **Trade-off vs:**
  - jwt: oauth2 standardizes how tokens are issued, scoped, and refreshed; jwt is only the optional token encoding.
  - oidc: oauth2 handles authorization (what you can do); oidc layers authentication (who you are) on top of oauth2.
  - oauth2+mfa: plain oauth2 proves possession of a token; +mfa proves the human re-authenticated with a second factor at issuance.
  - apikey: oauth2 gives scoped, expiring, revocable tokens; apikey is a static long-lived secret with coarse access.
- **Compliance fit:**
  - pci: oauth2+mfa required for CDE admin/remote access (Req 8.4/8.5); oauth2 alone insufficient for cardholder access
  - hipaa: oauth2 + audit acceptable; add MFA for remote/privileged ePHI access
  - soc2: oauth2 satisfies CC6.1/CC6.6 with scoped tokens and revocation
  - pipeda: oauth2 supports consent-driven delegated access aligning with Principle 3 (Consent)
  - phipa: oauth2 + audit; scope tokens to minimum necessary PHI
  - osfi: oauth2 with FAPI 2.0 profile expected for open-banking-style APIs under B-13
  - fintrac: oauth2 acceptable; tie token subject to recorded customer identity
- **Per industry:**
  - banking: Adopt FAPI 2.0 Security Profile (PAR, DPoP or mTLS-bound tokens, no implicit flow) for Canadian open-banking / OSFI B-13 alignment.
  - healthcare: Use SMART on FHIR (OAuth 2.0 + scopes) for EHR integration; enforce launch context and patient-scoped tokens.
  - government: Map to GC/BC SSO authorization servers; require PAR and sender-constrained tokens for high-assurance services.
  - retail: Standard Authorization Code + PKCE for 'Sign in with' partners and loyalty integrations; scope tokens tightly.
- **Implementation:** Use a managed AS (Auth0, Keycloak, Okta, AWS Cognito, Azure Entra). Standards: OAuth 2.1 draft, RFC 6749/6750, RFC 7636 (PKCE), RFC 9126 (PAR), FAPI 2.0. Library: passport + jose, or oauthlib.

### API Key

- **What:** A long-lived opaque secret string identifying a calling application or tenant, sent on each request.
- **How it works:** The server generates a high-entropy key, stores a hash (not the plaintext), and returns the plaintext once. The client sends it via a header (X-API-Key or Authorization). The server hashes the incoming key and looks it up to identify the tenant and enforce quotas/scopes. No expiry by default; rotation and revocation are manual.
- **Security level:** low
- **When to pick:** Server-to-server API access, developer/partner programs, billing/metering by tenant, and CLI tools where a static credential is acceptable and stored in a secret manager.
- **When NOT:** User-facing auth (no per-user identity, no MFA), browser/SPA clients (keys leak), or anything in the PCI CDE as a sole control. Not a substitute for delegated user authorization.
- **Trade-off vs:**
  - jwt: apikey is static and opaque with manual revocation; jwt is short-lived, self-describing, and self-expiring.
  - oauth2: apikey has coarse all-or-nothing access; oauth2 gives scoped, expiring, user-delegated tokens.
  - mtls: apikey is a bearer secret that can be replayed if leaked; mtls binds identity to a private key that never leaves the client.
  - none: apikey gives tenant attribution, quotas, and revocation; none gives nothing.
- **Compliance fit:**
  - pci: not acceptable as sole CDE control; MFA required (Req 8.4). OK for non-CDE metered APIs
  - hipaa: acceptable only for system-to-system non-interactive access with audit; never for user ePHI access
  - soc2: acceptable with hashing at rest, rotation policy, and revocation evidence (CC6.1)
  - pipeda: acceptable for B2B integrations; rotate and store in a vault (Principle 7)
  - phipa: acceptable only for backend integrations, not clinician PHI access
  - osfi: acceptable for internal service APIs with rotation; insufficient for customer-facing financial access
  - fintrac: acceptable for system integrations; map key to an accountable party
- **Per industry:**
  - banking: Restrict to internal/partner service APIs only; enforce IP allowlists, 90-day rotation, and HSM/secret-manager storage. Never sole control on customer money movement.
  - healthcare: Use for HL7/FHIR backend system integration, not clinician logins; pair with mTLS for PHI transport.
  - government: Acceptable for open-data API quotas; require registration and rotation; never for citizen identity.
  - retail: Common for partner/affiliate and inventory feeds; scope per-key and rate-limit aggressively.
- **Implementation:** Hash with SHA-256 + per-key salt or use a prefixed key scheme (e.g. sk_live_...). Store hash only. Manage via AWS Secrets Manager / HashiCorp Vault. No single RFC; follow OWASP API Security guidance.

### OAuth 2.1 + MFA

- **What:** OAuth 2.1 delegated authorization where token issuance requires a verified second authentication factor.
- **How it works:** During the Authorization Code flow, the authorization server forces a step-up: after the password/passkey, it requires a second factor (TOTP, WebAuthn/FIDO2, push) before minting the access token. The resulting token (and amr/acr claims) attests MFA was performed. Resource servers can require acr=mfa for sensitive scopes.
- **Security level:** high
- **When to pick:** Any access to regulated or high-value data: payments, ePHI, admin consoles, money movement, or PCI CDE access. The default for human auth in banking and healthcare.
- **When NOT:** Low-risk public reads or pure machine-to-machine (no human factor exists; use Client Credentials + mTLS instead). Avoid forcing MFA on every low-sensitivity call (use step-up only where needed).
- **Trade-off vs:**
  - oauth2: +mfa adds phishing-resistant second-factor assurance and acr claims; plain oauth2 only proves token possession.
  - saml: oauth2+mfa is API/mobile-native with step-up; saml is browser-redirect SSO better suited to legacy enterprise web apps.
  - oidc: oauth2+mfa is the authorization+factor layer; oidc is the identity layer often combined with it for full login+MFA.
  - mtls: oauth2+mfa authenticates the human; mtls authenticates the machine/transport. They compose for strongest assurance.
- **Compliance fit:**
  - pci: required for all CDE and remote/admin access (PCI-DSS 4.0 Req 8.4.2/8.5 phishing-resistant MFA by 2025)
  - hipaa: strongly expected for remote and privileged ePHI access; satisfies 164.312(d)
  - soc2: satisfies CC6.1/CC6.6/CC6.7 access controls; auditors expect MFA on admin
  - pipeda: exceeds baseline; appropriate safeguard for sensitive personal info (Principle 7)
  - phipa: expected for clinician remote PHI access in Ontario health systems
  - osfi: required for privileged and customer access under OSFI B-13 and Cyber Security Self-Assessment
  - fintrac: expected for access to KYC and large-transaction records; supports recordkeeping integrity
- **Per industry:**
  - banking: Mandate phishing-resistant FIDO2/WebAuthn (not SMS OTP) for OSFI alignment; require step-up MFA on every payment/transfer above threshold.
  - healthcare: Require MFA for all remote clinician access to ePHI/PHI; WebAuthn or push with number-matching to resist MFA fatigue.
  - government: Align to GC ITSP.30.031 LoA / Pan-Canadian Trust Framework Level 2-3; prefer hardware/WebAuthn factors.
  - retail: Apply MFA to admin/seller consoles and high-value account changes; risk-based step-up for customers to limit friction.
- **Implementation:** Keycloak/Auth0/Entra with WebAuthn + step-up policies. Standards: OAuth 2.1, FIDO2/WebAuthn (W3C), RFC 9470 (step-up), acr/amr claims. Avoid SMS OTP (NIST SP 800-63B deprecates as primary).

### Mutual TLS (mTLS)

- **What:** Both client and server present and verify X.509 certificates during the TLS handshake, proving each peer's identity.
- **How it works:** The server requests a client certificate during the TLS handshake. The client proves possession of its private key; the server validates the cert chain against a trusted CA and checks SAN/CN, expiry, and revocation (OCSP/CRL). Identity is bound to a key that never leaves the client, so credentials cannot be replayed by a network attacker.
- **Security level:** high
- **When to pick:** Zero-trust service-to-service, service mesh (Istio/Linkerd SPIFFE/SPIRE), high-assurance B2B/financial APIs, and sender-constrained OAuth tokens (mTLS-bound access tokens, RFC 8705).
- **When NOT:** Browser/consumer-facing auth (client cert UX is painful and unmanageable at scale). When you lack a PKI/cert lifecycle (issuance, rotation, revocation) you can operate reliably.
- **Trade-off vs:**
  - apikey: mtls binds identity to a non-exportable private key and survives a leaked-secret attack; apikey is a replayable bearer string.
  - jwt: mtls authenticates the transport peer continuously; jwt authenticates a bearer that anyone holding it can present.
  - oauth2: mtls proves machine identity at the connection; oauth2 carries delegated authorization. Combine via mTLS-bound tokens.
  - oauth2+mfa: mtls secures machine-to-machine; oauth2+mfa secures human access. They address different principals.
- **Compliance fit:**
  - pci: strongly satisfies Req 4 (encrypt transmission) and supports Req 8 service identity; sender-constrained tokens recommended
  - hipaa: satisfies 164.312(e) transmission security and entity authentication for system-to-system PHI
  - soc2: satisfies CC6.1/CC6.6/CC6.7 for service identity and encrypted channels
  - pipeda: strong safeguard for inter-system personal info transfer (Principle 7)
  - phipa: strong control for backend PHI exchange between health systems
  - osfi: expected for high-value financial API channels and FAPI mTLS-bound tokens under B-13
  - fintrac: supports integrity of transmitted transaction/KYC data between reporting entities
- **Per industry:**
  - banking: Use for Interac/open-banking API channels and FAPI mTLS sender-constrained tokens; automate rotation via short-lived certs (SPIFFE) to meet OSFI resilience.
  - healthcare: Use between EHR/HIE systems for HL7v2/FHIR transport; pair with audit logging of the cert subject per PHI exchange.
  - government: Align to GC PKI / Entrust managed CA; enforce OCSP stapling and revocation checking for inter-departmental services.
  - retail: Use for payment-processor and 3DS server-to-server channels; rarely for consumer endpoints.
- **Implementation:** Istio/Linkerd + SPIFFE/SPIRE for mesh, or envoy/nginx client-cert verification. Standards: RFC 8446 (TLS 1.3), RFC 5280 (X.509), RFC 8705 (mTLS-bound tokens). Automate certs with cert-manager.

### SAML 2.0

- **What:** XML-based browser SSO standard where an Identity Provider asserts a user's identity to a Service Provider.
- **How it works:** The Service Provider (SP) redirects the browser to the Identity Provider (IdP) with an AuthnRequest. The IdP authenticates the user, then POSTs a digitally signed XML assertion (subject, attributes, conditions) back to the SP's ACS endpoint. The SP validates the XML signature, audience, and timestamps, then establishes a local session. Enterprise web SSO; not API-friendly.
- **Security level:** high
- **When to pick:** Enterprise workforce SSO into web apps, integration with legacy IdPs (ADFS, Shibboleth), and B2B federation where the partner only speaks SAML.
- **When NOT:** Mobile apps, SPAs, and modern APIs (use OIDC). New greenfield consumer auth. Anywhere XML signature complexity raises attack surface (XML signature wrapping, comment-injection bugs).
- **Trade-off vs:**
  - oidc: saml is XML/browser-redirect and verbose; oidc is JSON/OAuth2-based, API/mobile-native, and the modern replacement.
  - oauth2: saml does authentication via assertions; oauth2 does authorization via tokens. Different concerns, often bridged.
  - oauth2+mfa: saml typically delegates MFA to the IdP; oauth2+mfa makes the factor and acr claim explicit in the protocol.
  - jwt: saml uses signed XML assertions consumed server-side; jwt is compact signed JSON suited to stateless APIs.
- **Compliance fit:**
  - pci: acceptable for workforce SSO into CDE-adjacent web apps when paired with MFA (Req 8.4)
  - hipaa: acceptable for clinician web SSO with IdP-enforced MFA and audit
  - soc2: satisfies CC6.1 for federated workforce access with centralized deprovisioning
  - pipeda: acceptable; centralizes identity and supports accountability (Principle 1)
  - phipa: acceptable for provincial health IdP federation (e.g. ONE ID in Ontario)
  - osfi: acceptable for enterprise workforce SSO; pair with MFA for privileged access
  - fintrac: acceptable for employee access to reporting systems with audit trail
- **Per industry:**
  - banking: Common for internal employee SSO via ADFS/Entra; require IdP MFA and validate signatures with pinned cert to block signature-wrapping attacks.
  - healthcare: Used by provincial health IdPs (Ontario ONE ID, federation hubs); map assertion attributes to clinician role for PHI authorization.
  - government: Widely deployed (Shibboleth, GC SAML federations); enforce strict assertion validation and NameID encryption.
  - retail: Mostly for corporate/back-office SSO, not customer-facing storefronts where OIDC is preferred.
- **Implementation:** passport-saml / python3-saml / Shibboleth SP; validate via xmlsec. Standards: SAML 2.0 Core/Bindings/Profiles (OASIS). Mitigate XSW per OWASP. Encrypt NameID.

### OpenID Connect (OIDC)

- **What:** Identity layer on top of OAuth 2.0 that returns a signed id_token proving who the user is.
- **How it works:** OIDC runs the OAuth Authorization Code + PKCE flow and adds the 'openid' scope. The provider returns an id_token (a signed JWT with sub, iss, aud, nonce, auth_time, acr/amr) alongside the access token. The client validates the id_token signature and nonce to authenticate the user, and uses the access token for API authorization. Discovery (.well-known) and JWKS standardize integration.
- **Security level:** high
- **When to pick:** The default for modern human login: web, mobile, SPA, and B2B SSO. 'Sign in with' flows, enterprise workforce SSO via Entra/Okta/Keycloak, and federated consumer identity.
- **When NOT:** Pure machine-to-machine (use Client Credentials/mTLS; there is no human to authenticate). When a partner only speaks SAML and cannot adopt OIDC.
- **Trade-off vs:**
  - saml: oidc is JSON/REST, mobile and SPA native, and far simpler to secure than saml's XML signatures.
  - oauth2: oidc adds the authentication layer (id_token, who the user is) that plain oauth2 deliberately omits.
  - oauth2+mfa: oidc carries acr/amr to attest MFA; the +mfa variant is OIDC/OAuth with the factor enforced and required.
  - jwt: oidc standardizes how id_tokens (JWTs) are issued, discovered, and validated; jwt alone is just the container.
- **Compliance fit:**
  - pci: oidc + MFA required for CDE/admin access; oidc alone insufficient for cardholder access (Req 8.4)
  - hipaa: oidc + audit acceptable; enforce MFA via acr for remote ePHI access
  - soc2: satisfies CC6.1/CC6.6 with centralized IdP, SSO, and deprovisioning
  - pipeda: supports consent and accountability; id_token gives a clear audited subject (Principles 1, 3)
  - phipa: acceptable with audit linking sub to PHI access; integrate provincial health IdP
  - osfi: preferred for customer-facing financial auth; combine with FAPI 2.0 for high assurance
  - fintrac: acceptable; id_token subject maps cleanly to a recorded customer identity
- **Per industry:**
  - banking: Use OIDC with FAPI 2.0 (PAR + PKCE + DPoP/mTLS-bound tokens) for Canadian open-banking and OSFI B-13 customer auth; enforce acr=mfa for transactions.
  - healthcare: SMART on FHIR builds on OIDC; validate id_token nonce and bind sub to a verified clinician for PHIPA/HIPAA audit.
  - government: GC Sign-In / provincial IdPs increasingly OIDC; map to Pan-Canadian Trust Framework LoA via acr values.
  - retail: Best choice for customer login and social federation; httpOnly cookies for tokens, short access-token TTL.
- **Implementation:** openid-client (JS) / authlib (Python) / Keycloak/Auth0/Entra. Standards: OpenID Connect Core 1.0, OAuth 2.1, RFC 7636 (PKCE), FAPI 2.0. Always validate nonce + iss + aud.

### All (Layered / Defense-in-Depth Auth Stack)

- **What:** A composite posture combining transport, machine, and human auth so the right control applies at each layer.
- **How it works:** Layer the methods by principal and boundary: mTLS for service-to-service and the mesh, OIDC + step-up MFA for human login, OAuth 2.1 scoped (and sender-constrained) tokens for API authorization, and API keys for partner/system metering. Each request crosses only the controls relevant to its principal; no single failure grants access. Identity is centralized in one IdP; tokens are short-lived and revocable.
- **Security level:** high
- **When to pick:** Regulated, multi-tenant, multi-channel platforms (banking, health, gov) where human users, partner systems, and internal services all hit the same APIs and each needs a fit-for-purpose control.
- **When NOT:** Early-stage products or single-client APIs where the operational cost of running PKI + IdP + key management outweighs the threat. Layering you cannot operate reliably is weaker than one control done well.
- **Trade-off vs:**
  - none: all maximizes assurance and auditability at high operational cost; none has zero cost and zero assurance.
  - oauth2+mfa: all adds transport (mTLS) and machine identity beyond human MFA; oauth2+mfa covers only the human factor.
  - mtls: all combines mtls with human and authorization layers; mtls alone proves machine identity but not user intent or scope.
  - oidc: all wraps oidc with transport and machine controls; oidc alone authenticates humans but not service peers.
- **Compliance fit:**
  - pci: exceeds Req 8 with layered MFA, scoped tokens, and encrypted authenticated transport
  - hipaa: exceeds 164.312 with per-layer authentication and end-to-end audit of sub per PHI access
  - soc2: strongly satisfies CC6.1-CC6.7 with centralized identity and least privilege
  - pipeda: exceeds safeguard baseline; clear accountability across every principal (Principle 7, 1)
  - phipa: strong PHI control across human and system actors with full audit
  - osfi: aligns to OSFI B-13 and Cyber Self-Assessment for layered, resilient access control
  - fintrac: supports KYC/transaction record integrity across human and system access paths
- **Per industry:**
  - banking: Target architecture for OSFI-regulated platforms: FAPI 2.0 OIDC for customers, FIDO2 step-up for transactions, mTLS+SPIFFE in the mesh, rotating API keys for partners.
  - healthcare: OIDC/SMART-on-FHIR for clinicians + MFA, mTLS for EHR/HIE exchange, audited sub on every PHI touch for HIPAA/PHIPA.
  - government: OIDC to GC/provincial IdP at the required LoA, mTLS for inter-departmental services, hardware MFA for privileged roles.
  - retail: OIDC for customers, MFA on admin/seller consoles, mTLS to payment processors, scoped API keys for affiliates.
- **Implementation:** Keycloak/Entra (IdP) + Istio/SPIFFE (mTLS) + jose/openid-client (tokens) + Vault (keys). Standards: OIDC Core, OAuth 2.1, FAPI 2.0, FIDO2/WebAuthn, RFC 8705, RFC 8446. Centralize identity; keep tokens short-lived.

## B.7b ORM / data access — every option, decided

### Prisma

- **What:** Schema-first ORM for Node/TypeScript. You define models in a `schema.prisma` DSL; Prisma generates a fully typed client. As of v6.x (current 2026) the default query engine is the Rust binary, but the TypeScript-native client (`queryCompiler`, GA in v6.7+) removes the Rust engine entirely and ships pure-WASM/TS for edge runtimes (Cloudflare Workers, Vercel Edge). Supports Postgres, MySQL, MariaDB, SQLite, SQL Server, CockroachDB, MongoDB.
- **Language:** TypeScript, JavaScript
- **Type safety:** high — fully generated client, compile-time types for models, relations, selects, and filters. Drops to none inside `$queryRaw`/`$executeRaw` unless you use the `sql` tagged-template typed-row helper.
- **When to pick:** New TypeScript product where developer velocity and end-to-end type safety beat raw control. Teams that want migrations, schema, and types from one source of truth. Greenfield SaaS, especially Next.js/NestJS. Pick the TS-native client when deploying to Cloudflare Workers or other edge runtimes.
- **When NOT:** Heavy analytical/reporting workloads with complex joins, window functions, CTEs, or DB-specific features (PostGIS, LISTEN/NOTIFY). Prisma's query builder is relational-CRUD-shaped; complex SQL forces `$queryRaw` which discards type safety. Also avoid when you need fine-grained connection-pool control under extreme concurrency without an external pooler.
- **Trade-off vs:**
  - drizzle: Prisma = schema DSL + codegen + opinionated client; Drizzle = SQL-in-TypeScript, no codegen step, smaller cold start. Pick Prisma for productivity/migrations maturity, Drizzle for edge cold-start and raw-SQL fidelity.
  - typeorm: Prisma has dramatically better type safety and migration ergonomics; TypeORM offers Active Record + Data Mapper patterns and decorator entities but has historically flaky migrations and partial type inference.
  - none(raw): Prisma trades ~5-15% query overhead and abstraction for codegen safety; raw SQL is faster and fully flexible but you hand-maintain types and SQL-injection guards.
- **Migrations:** `prisma migrate dev` (shadow DB diffs schema → SQL migration) in dev; `prisma migrate deploy` applies pending migrations in CI/CD. Migration files are plain SQL under `prisma/migrations/`, reviewable in PRs. `prisma migrate diff` for drift detection. Destructive changes are flagged and require confirmation.
- **Compliance:** Encryption-at-rest is delegated to the DB engine (e.g. AWS RDS/Aurora KMS, Azure TDE) — Prisma has no field-level encryption built in; use pgcrypto or app-layer envelope encryption for PII (PIPEDA/PHIPA personal/health data). Audit columns: add `createdAt`/`updatedAt` (`@default(now())`/`@updatedAt`) and a `createdBy`/`updatedBy` pattern; for tamper-evident audit logs use DB triggers, not the ORM. Data residency: Prisma is region-agnostic — pin the underlying Postgres to ca-central-1 (AWS) / Canada Central (Azure) to satisfy PIPEDA/PHIPA/OSFI B-10 residency expectations. Prisma Accelerate/Data Proxy routes through Prisma-hosted infra — disable or self-host the pooler for OSFI/FINTRAC workloads to avoid data leaving Canada.
- **Implementation:** schema.prisma → `prisma generate` → import `PrismaClient`. Instantiate a single client (singleton) per process; in serverless reuse across invocations. Use `$transaction([...])` for atomic multi-writes or interactive transactions for read-modify-write. Pair with PgBouncer in transaction mode (set `pgbouncer=true` in the connection URL). For Workers: enable `queryCompiler` + `driverAdapters` preview features and the `@prisma/adapter-pg` driver adapter.

### TypeORM

- **What:** Decorator-based ORM for Node/TypeScript supporting both Active Record and Data Mapper patterns. Entities are classes with `@Entity`/`@Column` decorators. Default ORM in the NestJS ecosystem via `@nestjs/typeorm`. Supports Postgres, MySQL, MariaDB, SQLite, MSSQL, Oracle, CockroachDB, SAP Hana, MongoDB. Current line is 0.3.x (2026); the project is maintained but slow-moving.
- **Language:** TypeScript, JavaScript
- **Type safety:** medium — entities are typed but query results from QueryBuilder are loosely typed (often `any`/partial), and `find` options don't fully constrain selected fields. Better than raw SQL, well below Prisma/Drizzle.
- **When to pick:** Existing NestJS codebase already standardized on TypeORM. Teams that prefer class/decorator entities and the repository pattern, and who need multi-DB portability (MSSQL/Oracle) that Prisma/Drizzle handle less well. Brownfield apps where migration cost away from TypeORM is not justified.
- **When NOT:** New greenfield TypeScript projects — choose Prisma or Drizzle instead. Avoid when you need rock-solid migrations: TypeORM's `synchronize: true` is dangerous in prod and auto-generated migrations frequently produce incorrect or destructive diffs. Avoid for edge runtimes (heavy, reflect-metadata dependency).
- **Trade-off vs:**
  - prisma: TypeORM gives OOP entity classes and Data Mapper flexibility but weaker type inference and far more migration foot-guns; Prisma wins on safety and DX for new builds.
  - drizzle: TypeORM is heavyweight with runtime decorators/reflection; Drizzle is lean SQL-first with better inference and no decorators. Drizzle is the modern replacement for most new TypeORM use.
  - none(raw): TypeORM adds entity mapping and a query builder but its abstraction leaks; raw SQL avoids the mapping layer at the cost of manual types.
- **Migrations:** `typeorm migration:generate` diffs entities vs DB and emits a TS migration class with `up`/`down`; `typeorm migration:run`/`migration:revert` apply/rollback. Generated diffs are unreliable — review and hand-edit every migration. NEVER use `synchronize: true` outside local dev; it silently alters/drops columns.
- **Compliance:** No built-in encryption-at-rest — rely on DB TDE/KMS (RDS/Aurora, Azure SQL TDE) for PIPEDA/PHIPA. Column-level encryption can be done with a `ValueTransformer` (encrypt/decrypt on read/write) for PII fields, but key management is on you (use AWS KMS/Azure Key Vault, not hardcoded keys). Audit columns: `@CreateDateColumn`, `@UpdateDateColumn`, `@VersionColumn`, and `@DeleteDateColumn` for soft deletes give built-in audit/temporal fields. Data residency: pin the DB to ca-central-1 / Canada Central; TypeORM itself is region-agnostic. For OSFI B-10 third-party concerns there is no SaaS dependency — fully self-hosted, which simplifies the residency story vs Prisma Accelerate.
- **Implementation:** Define entities → register in `DataSource` (0.3.x replaced the legacy `Connection`). In NestJS use `TypeOrmModule.forRoot`/`forFeature` and inject `Repository<T>`. Keep `synchronize:false`, `migrationsRun:true` in prod. Use `dataSource.transaction()` for atomicity. Add a `ValueTransformer` for encrypted PII columns wired to a KMS-backed key.

### Drizzle ORM

- **What:** SQL-first, fully type-safe TypeScript ORM with zero codegen and a tiny runtime. You declare tables in TypeScript; queries are written in a SQL-shaped fluent API that infers result types directly. Ships as ESM, runs on Node, Bun, Deno, and edge runtimes (Cloudflare Workers/D1, Vercel Edge, Neon serverless). Supports Postgres, MySQL, SQLite/D1, SingleStore, and (via adapters) more. Stable and widely adopted by 2026.
- **Language:** TypeScript, JavaScript
- **Type safety:** high — result types are inferred from the query and schema with no codegen; selects, joins, and partial projections are all statically typed. Raw SQL via the `sql` template tag stays parameterized and can be typed.
- **When to pick:** New TypeScript services, especially edge/serverless where cold start and bundle size matter (no Rust binary, no reflection). Teams that want SQL fidelity with full type inference and the ability to drop to raw SQL without losing types. Cloudflare Workers + D1/Neon/PlanetScale stacks. The default modern choice alongside Prisma.
- **When NOT:** Teams wanting a fully opinionated, batteries-included schema/migration/Studio experience identical to Prisma — Drizzle's migration tooling (drizzle-kit) is lighter and you own more of the SQL. Avoid if the team is uncomfortable thinking in SQL; the API mirrors SQL semantics deliberately.
- **Trade-off vs:**
  - prisma: Drizzle = no codegen, smaller cold start, SQL-shaped queries, full raw-SQL escape hatch with types; Prisma = richer tooling/Studio, schema DSL, more guardrails. Drizzle wins on edge + SQL control, Prisma on out-of-box completeness.
  - typeorm: Drizzle has better inference, no decorators/reflection, far smaller footprint — strictly preferable for new code.
  - none(raw): Drizzle gives you raw SQL's flexibility plus compile-time row types and parameterization, with almost no runtime cost; near-zero overhead vs hand-written queries.
- **Migrations:** drizzle-kit: `drizzle-kit generate` diffs TS schema → SQL migration files; `drizzle-kit migrate` applies them; `drizzle-kit push` for rapid dev sync (avoid in prod). Migrations are plain SQL, fully reviewable. `drizzle-kit studio` provides a DB browser. You can also write migrations by hand.
- **Compliance:** Encryption-at-rest delegated to the DB (RDS/Aurora KMS, Neon, D1-at-rest); no field-level encryption built in — use pgcrypto or app-layer envelope encryption with KMS for PIPEDA/PHIPA PII. Audit columns: declare `createdAt`/`updatedAt` with `.default(sql\`now()\`)` and `$onUpdate`; tamper-evident audit trails should use DB triggers. Data residency: Drizzle is region-agnostic; pin Postgres to ca-central-1 / Canada Central. Note Cloudflare D1 default location can be non-Canadian — for FINTRAC/OSFI workloads use a Canadian-region Postgres (Neon ca, RDS ca-central-1) rather than D1, since D1 region pinning guarantees are weaker.
- **Implementation:** Declare tables in `schema.ts` → create `db = drizzle(driver, { schema })`. Pick the driver per runtime: `node-postgres`/`postgres-js` for Node, `@neondatabase/serverless` for edge HTTP, `drizzle-orm/d1` for Workers+D1. Use `db.transaction(async (tx) => ...)` for atomicity. Co-locate drizzle-kit config (`drizzle.config.ts`) and run `generate`+`migrate` in CI.

### SQLAlchemy

- **What:** The de-facto Python ORM and Core SQL toolkit. Two layers: Core (a composable SQL expression language) and the ORM (declarative mapped classes). SQLAlchemy 2.0 (current in 2026) unified the API around `select()`, added first-class async (`AsyncSession` over asyncpg/aiomysql), and full PEP 484 typed models via `Mapped[...]` and `mapped_column()`. Backs Django-alternative stacks, FastAPI, Flask, Litestar.
- **Language:** Python
- **Type safety:** medium-high — SQLAlchemy 2.0 `Mapped[T]` + `mapped_column()` give real static types for models and many query results under mypy/Pyright, a major jump from 1.x. Not as airtight as Prisma/Drizzle TS, but strong for Python.
- **When to pick:** Any serious Python service needing real SQL power: complex joins, CTEs, window functions, bulk operations, and multi-dialect support (Postgres, MySQL, SQLite, MSSQL, Oracle). Default for FastAPI/Flask. Choose async SQLAlchemy 2.0 with asyncpg for high-concurrency Postgres APIs.
- **When NOT:** Tiny scripts or when you want batteries-included admin/auth — Django ORM is friendlier there. Avoid forcing the ORM layer on pure analytical pipelines; use Core or raw SQL directly. The learning curve (sessions, identity map, unit of work) is steep for simple CRUD.
- **Trade-off vs:**
  - tortoise: SQLAlchemy 2.0 is more powerful, mature, and dialect-rich, with both sync and async; Tortoise is async-native and Django-like/simpler but far less capable for complex SQL. Pick SQLAlchemy for depth, Tortoise for simple async apps.
  - none(raw): SQLAlchemy Core gives you composable, dialect-aware, injection-safe SQL with optional ORM mapping; raw SQL is faster to write for one-offs but loses composability and type help.
  - django-orm: SQLAlchemy is framework-agnostic and more expressive for complex queries; Django ORM is tightly integrated with the Django stack and easier for standard CRUD.
- **Migrations:** Alembic (sibling project) is the standard: `alembic revision --autogenerate` diffs models vs DB → Python migration with `upgrade`/`downgrade`; `alembic upgrade head` applies. Autogenerate is good but review every revision (it misses some constraint/enum/server-default changes). Version table tracks applied revisions.
- **Compliance:** Encryption-at-rest delegated to the DB (RDS/Aurora KMS, Azure TDE); for PIPEDA/PHIPA PII use a `TypeDecorator` to transparently encrypt/decrypt columns (e.g. wrapping `cryptography` Fernet or a KMS data key) — keep keys in AWS KMS/Azure Key Vault, never in code. Audit columns: declare `created_at`/`updated_at` with `server_default=func.now()` and `onupdate=func.now()`; for immutable audit logs use Postgres triggers or the `versioned` history pattern. Data residency: pin DB to ca-central-1 / Canada Central; SQLAlchemy is region-agnostic and fully self-hosted (no SaaS dependency), which keeps the OSFI/FINTRAC residency story clean.
- **Implementation:** Define models via `DeclarativeBase` + `Mapped`/`mapped_column`. Create an `Engine` (or `create_async_engine`) once at startup; use `Session`/`AsyncSession` per request (FastAPI dependency yielding a session, closed in finally). Wrap writes in `with session.begin():` for atomic commit/rollback. Set `pool_pre_ping=True` for resilient pooled connections behind PgBouncer.

### Tortoise ORM

- **What:** Async-native Python ORM with a Django-inspired API (model classes, `Model.filter()`, querysets). Built for asyncio from the ground up; pairs naturally with FastAPI/Starlette/aiohttp. Supports Postgres (asyncpg/psycopg), MySQL/MariaDB (asyncmy), SQLite. Migrations via the companion tool Aerich.
- **Language:** Python
- **Type safety:** medium — model fields are typed, but queryset results are loosely typed under static checkers; weaker than SQLAlchemy 2.0's `Mapped[T]`. Expect `Any` in places.
- **When to pick:** Async-first Python services where you want a familiar Django-style ORM without Django, and your queries are mostly straightforward CRUD with relations. Good for FastAPI apps where the team already knows Django's ORM idioms.
- **When NOT:** Complex SQL (advanced joins, window functions, CTEs, heavy aggregation) — Tortoise's query API is limited; you'll hit raw-SQL escape hatches quickly. Avoid for large/critical systems needing the dialect depth, ecosystem, and tooling maturity of SQLAlchemy. Smaller community and slower release cadence than SQLAlchemy.
- **Trade-off vs:**
  - sqlalchemy: Tortoise is simpler and async-native with a gentler Django-like API; SQLAlchemy 2.0 is far more powerful, mature, and now also async. Pick Tortoise for simple async apps, SQLAlchemy for anything serious.
  - django-orm: Tortoise mirrors Django ORM ergonomics but is async and framework-free; Django ORM is sync-rooted (async support still partial) and tied to Django.
  - none(raw): Tortoise gives Django-like convenience for CRUD; raw SQL is needed anyway for its weak spots, so heavy-SQL apps gain little from it.
- **Migrations:** Aerich: `aerich init` + `aerich init-db` to bootstrap; `aerich migrate` generates a migration from model diffs; `aerich upgrade`/`downgrade` apply/rollback. Less mature than Alembic — autogenerated migrations sometimes need hand-editing, and complex schema changes (enum/constraint renames) can be missed.
- **Compliance:** Encryption-at-rest delegated to the DB (RDS/Aurora KMS, Azure TDE) for PIPEDA/PHIPA. No built-in field encryption — implement a custom field type or encrypt at the service layer with a KMS-managed key for PII/PHI. Audit columns: declare `created_at = fields.DatetimeField(auto_now_add=True)` and `updated_at = fields.DatetimeField(auto_now=True)`; for tamper-evident logs use DB triggers, not the ORM. Data residency: pin DB to ca-central-1 / Canada Central; Tortoise is region-agnostic and self-hosted. Given Aerich's lower maturity, OSFI/regulated workloads should add stricter migration review/sign-off than they would with Alembic.
- **Implementation:** Define `Model` subclasses with `fields.*`. Register via `Tortoise.init(db_url=..., modules={'models': [...]})` at startup; for FastAPI use `register_tortoise(app, ...)`. Use `async with in_transaction():` for atomic writes. Configure Aerich in `pyproject.toml`/`aerich.ini` and run `aerich upgrade` in deploy.

### GORM

- **What:** The most popular full-featured ORM for Go. Struct-tag-based model mapping with associations, hooks, preloading, soft deletes, and a chainable API. Supports Postgres, MySQL, SQLite, SQL Server, ClickHouse. Uses code generation via `gorm.io/gen` for type-safe query DSL when desired. Current v2 (`gorm.io/gorm`) is stable and dominant in 2026.
- **Language:** Go
- **Type safety:** medium — struct fields are typed but the chainable API (`Where`, `Find` into interfaces) loses compile-time guarantees and can panic at runtime. `gorm.io/gen` raises this to high by generating typed query methods.
- **When to pick:** Go services that want ORM conveniences — associations, auto-migrations in dev, hooks, soft deletes — over hand-written SQL. Standard CRUD-heavy APIs (Gin/Echo/Fiber/Chi backends) where developer speed matters more than micro-optimized SQL.
- **When NOT:** Latency-critical or high-throughput hot paths where reflection overhead matters — prefer sqlc/sqlx/pgx. Complex analytical SQL where GORM's chain API obscures the generated query. Teams that strongly prefer explicit SQL (Go culture often does) will find GORM's magic and reflection cost off-putting.
- **Trade-off vs:**
  - ent: GORM is struct-tag/reflection-based and quicker to start; Ent (Facebook/Meta) is schema-as-code with codegen, graph-traversal API, and stronger compile-time guarantees. Pick Ent for large/typed domains, GORM for fast conventional CRUD.
  - sqlx: GORM gives associations/migrations/hooks; sqlx is a thin typed wrapper over database/sql with no ORM layer. GORM for productivity, sqlx for explicit SQL + speed.
  - none(raw): GORM adds reflection overhead and abstraction; raw `database/sql`/pgx is fastest and most explicit but you write all SQL and scanning yourself.
- **Migrations:** `db.AutoMigrate(&Model{})` for dev convenience (adds tables/columns; never drops) — do NOT rely on it in prod. For prod use a real migration tool (golang-migrate or goose) with versioned SQL files in CI/CD; treat GORM models and migration SQL as separate sources and diff-review them.
- **Compliance:** Encryption-at-rest delegated to the DB (RDS/Aurora KMS, Cloud SQL CMEK) for PIPEDA/PHIPA. No built-in column encryption — implement GORM serializers or a custom field type that encrypts/decrypts via AWS KMS/GCP KMS data keys for PII/PHI. Audit columns: GORM auto-manages `CreatedAt`/`UpdatedAt` and `DeletedAt gorm.DeletedAt` enables soft delete (important: soft-deleted PII still resides in the DB, so PIPEDA erasure requests need a hard-delete path). Data residency: pin DB to ca-central-1 / Canada Central; GORM is region-agnostic and self-hosted. For OSFI, prefer goose/golang-migrate over AutoMigrate for auditable, reversible schema changes.
- **Implementation:** Define structs with `gorm` tags → `gorm.Open(postgres.Open(dsn), &gorm.Config{PrepareStmt:true})`. Get the underlying `*sql.DB` to set pool limits. Use `db.Transaction(func(tx *gorm.DB) error {...})` for atomicity. Generate typed queries with `gorm.io/gen` for hot paths. Run versioned migrations with goose in deploy; keep AutoMigrate to local dev only.

### Ent

- **What:** Graph-based, schema-as-code entity framework for Go, originally from Facebook/Meta, now under the ent.io project. You define entities and edges (relations) in Go code; `ent generate` produces a fully type-safe, statically checked query/builder API. First-class graph traversal, privacy/policy layer, and Atlas-powered migrations. Supports Postgres, MySQL, MariaDB, SQLite, TiDB, CockroachDB, Gremlin.
- **Language:** Go
- **Type safety:** high — the entire query/builder API is generated and statically typed; invalid fields/edges are compile errors. Among the strongest type safety of any Go data layer.
- **When to pick:** Large, relationship-heavy Go domains where compile-time type safety and a generated, IDE-autocompleted API are worth a codegen step. Services needing built-in field-level privacy/authorization rules, or graph-shaped data. Strong fit for big internal platforms and regulated systems that benefit from generated, reviewable query code.
- **When NOT:** Small services or rapid prototypes where the codegen workflow and learning curve aren't justified — GORM or sqlx are faster to start. Teams that want to hand-write arbitrary SQL freely; Ent's generated API, while escapeable, is the intended path.
- **Trade-off vs:**
  - gorm: Ent is schema-as-code + codegen with strong compile-time safety, graph edges, and a privacy layer; GORM is reflection/struct-tag based and faster to start but weaker typing. Ent scales better for large typed domains.
  - sqlx: Ent generates a typed graph API and migrations; sqlx is a minimal typed wrapper with no schema/relation modeling. Ent for rich domains, sqlx for explicit lightweight SQL.
  - none(raw): Ent trades a codegen build step for end-to-end type safety and a privacy layer; raw SQL is leaner but loses generated guarantees and the policy framework.
- **Migrations:** Atlas-driven. `ent` integrates with Atlas to diff the Ent schema against the DB and produce versioned or declarative migrations. Use Atlas's versioned workflow (`atlas migrate diff`/`apply`) in CI/CD; declarative/auto mode for dev. Atlas detects destructive changes and supports linting/policy on migrations — a strong fit for regulated change control.
- **Compliance:** Encryption-at-rest delegated to the DB (RDS/Aurora KMS, Cloud SQL CMEK) for PIPEDA/PHIPA; field-level encryption can be added via custom field types/hooks calling KMS. Audit columns: model `created_at`/`updated_at` fields with `Default(time.Now)`/`UpdateDefault`, and use Ent hooks/interceptors to populate `created_by`/`updated_by` — Ent's mutation hooks make centralized audit logging straightforward. Privacy layer: Ent's built-in policy rules enforce row/field access at query time, valuable for PHIPA need-to-know and OSFI access control. Data residency: pin DB to ca-central-1 / Canada Central; Ent is region-agnostic and self-hosted. Atlas migration linting gives an auditable, reviewable change trail suited to OSFI B-10.
- **Implementation:** Write schemas in `ent/schema/*.go` → `go generate ./ent`. Open a client `ent.Open("postgres", dsn)`; share it process-wide. Use `client.Tx(ctx)` or `WithTx` helper for atomic mutations. Register privacy policies and mutation hooks for audit/encryption. Wire Atlas versioned migrations into CI; run `atlas migrate apply` in deploy.

### sqlx

- **What:** Two distinct projects share the name. Go sqlx (`jmoiron/sqlx`) is a thin extension over `database/sql` adding struct scanning, named params, and `Get`/`Select` helpers — NOT an ORM. Rust SQLx (`launchbadge/sqlx`) is an async, pure-Rust SQL toolkit with COMPILE-TIME-CHECKED queries (`query!` macros verify SQL against a live/cached DB schema). Rust SQLx supports Postgres, MySQL, SQLite, MSSQL; Go sqlx supports anything `database/sql` does.
- **Language:** Go, Rust
- **Type safety:** Go sqlx: low-medium — scans into typed structs but no compile-time SQL/column verification (typos surface at runtime). Rust SQLx: high — `query!`/`query_as!` macros verify SQL and bind/return types against the schema AT COMPILE TIME.
- **When to pick:** Go sqlx: Go teams that want explicit SQL with convenient row→struct scanning and minimal magic — the idiomatic Go middle ground. Rust SQLx: async Rust services (Axum/Actix) wanting raw SQL with compile-time verification that the SQL is valid and types match — best-in-class safety without a heavy ORM.
- **When NOT:** Teams wanting associations, migrations-from-models, lazy loading, or a generated query DSL — neither sqlx provides an ORM. For Go, if you want typed queries from SQL files prefer sqlc; for richer modeling prefer Ent/GORM. Rust SQLx requires DB access (or a prepared `.sqlx` offline cache) at compile time, which complicates some CI setups.
- **Trade-off vs:**
  - gorm: Go sqlx is explicit SQL + scanning with near-zero overhead; GORM adds ORM features and reflection cost. sqlx for control/speed, GORM for convenience.
  - ent: sqlx is hand-written SQL with no schema modeling; Ent generates a typed graph API. sqlx for lightweight explicit data access, Ent for large typed domains.
  - none(raw): Go sqlx is barely above raw `database/sql` (adds scanning sugar). Rust SQLx adds compile-time SQL verification over raw queries — strictly safer than raw with no runtime cost.
- **Migrations:** Go sqlx: no migration tooling — use golang-migrate or goose with versioned SQL files. Rust SQLx: ships `sqlx migrate` CLI and `sqlx::migrate!()` macro that embeds versioned SQL migrations into the binary and applies them at startup or via CLI. Rust SQLx's embedded migrations are a strong, auditable, in-repo SQL workflow.
- **Compliance:** Encryption-at-rest delegated to the DB (RDS/Aurora KMS, Cloud SQL CMEK) for PIPEDA/PHIPA; both require app-layer encryption for PII/PHI fields (encrypt before bind, decrypt after scan, keys in KMS/Key Vault). Audit columns: you write the SQL, so set `created_at DEFAULT now()` and `updated_at` via trigger or explicit `SET updated_at = now()` — explicit and auditable, which OSFI reviewers favor. Data residency: pin DB to ca-central-1 / Canada Central; both libraries are region-agnostic and fully self-hosted (no SaaS dependency). Rust SQLx's compile-time verification reduces a class of runtime SQL errors — a reliability plus for FINTRAC/financial-grade systems.
- **Implementation:** Go: `sqlx.Connect("pgx", dsn)`; use `db.Get`/`db.Select` with struct tags; wrap writes in `sqlx.Tx` via `db.Beginx()`. Rust: build a `PgPool` at startup; use `sqlx::query_as!(Type, "...", binds)`; for offline CI run `cargo sqlx prepare` to generate the `.sqlx` query cache. Run `sqlx migrate run` (Rust) or goose (Go) in deploy.

### none (raw SQL / query builder)

- **What:** No ORM — talk to the database through the native driver or a thin typed query layer. Per ecosystem: Go uses `database/sql`+pgx and often sqlc (compiles SQL files into type-safe Go); TypeScript uses pg/postgres.js, Kysely (type-safe query builder), or sqlc-gen-typescript; Python uses psycopg3/asyncpg with the DB-API; Rust uses tokio-postgres or SQLx macros. The unifying choice: explicit, hand-authored SQL with parameterized queries.
- **Language:** TypeScript, JavaScript, Python, Go, Rust
- **Type safety:** ranges none→high. Pure raw driver = none (runtime errors only). With sqlc (Go/TS) or Rust SQLx macros = high (compile-time-checked SQL+types). With Kysely (TS) = high (type-safe builder). Choose a typed layer to get safety without an ORM.
- **When to pick:** Latency-critical or high-throughput hot paths; complex analytical SQL (CTEs, window functions, recursive queries, PostGIS, LISTEN/NOTIFY) an ORM obscures; teams with strong SQL skill that value explicitness and full DB-feature access. sqlc/Kysely give type safety without ORM overhead — the modern raw-SQL sweet spot.
- **When NOT:** Rapid CRUD-heavy product development where an ORM's migrations, associations, and codegen accelerate delivery. Teams without SQL depth, where hand-rolled queries risk injection or N+1 mistakes. When you'd otherwise reimplement half an ORM (mapping, migrations) yourself — just use one.
- **Trade-off vs:**
  - prisma: Raw SQL = max control + speed + full DB features, but you maintain types (or use sqlc/Kysely) and SQL injection guards; Prisma = safety/migrations/DX at an abstraction and overhead cost.
  - sqlalchemy: Raw SQL is faster for one-offs and complex queries; SQLAlchemy Core gives composable, dialect-aware, reusable SQL with optional ORM mapping — better for large maintainable query layers.
  - gorm: Raw `database/sql`/pgx (or sqlc) is fastest and most explicit and idiomatic in Go; GORM trades that for associations/hooks/auto-migrate convenience.
- **Migrations:** Bring your own versioned-SQL migration tool: golang-migrate or goose (Go), node-pg-migrate or Kysely migrations (TS), Alembic-standalone or Flyway/Liquibase (Python/JVM-adjacent), sqlx-cli (Rust). All apply ordered, reviewable SQL files tracked in a version table — the most auditable migration model for regulated change control.
- **Compliance:** Encryption-at-rest delegated to the DB (RDS/Aurora KMS, Cloud SQL CMEK, Azure TDE) for PIPEDA/PHIPA — same as ORMs. PII/PHI field encryption is fully explicit: encrypt before insert, decrypt after select, using pgcrypto or app-layer envelope encryption with AWS KMS/Azure Key Vault keys — most transparent design for an OSFI/auditor review. Audit columns: explicit `created_at DEFAULT now()`, `updated_at` via trigger, and tamper-evident append-only audit tables with DB triggers — strongest, most reviewable audit story. Data residency: pin DB to ca-central-1 / Canada Central; no SaaS dependency, fully self-hosted, cleanest FINTRAC/OSFI residency posture. Parameterize EVERY query (never string-concat) to prevent SQL injection — the one safety burden raw SQL puts on you.
- **Implementation:** TS: `pg`/`postgres.js` pool + Kysely or sqlc-gen-typescript for typed queries; parameterized `$1` placeholders only. Go: pgxpool + sqlc-generated query funcs; `tx, _ := pool.Begin(ctx)` for atomicity. Python: asyncpg/psycopg3 pool with parameterized `$1`/`%s`. Rust: PgPool + SQLx `query!`. Run versioned SQL migrations (golang-migrate/goose/Flyway) in CI/CD; enforce parameterization via lint/code review.

## B.7c Observability — every option, decided

### None (No Instrumentation)

- **What:** Zero deliberate telemetry. The service emits only unstructured stdout/stderr captured by the container runtime, with no metrics, no distributed traces, and no structured log pipeline.
- **Pillars:**
  - metrics: None beyond what the orchestrator scrapes (kubelet cAdvisor CPU/mem). No app-level RED/USE metrics.
  - logs: Plain stdout captured by container runtime; rotated and discarded by default (Docker json-file 10MB x3, or k8s node log rotation). No central aggregation, no retention guarantee.
  - traces: None. No request correlation, no latency breakdown, no cross-service causality.
- **Cost:**
  - selfHost: $0 infrastructure, but unbounded incident cost: MTTR measured in hours, blind to error budgets, no forensic data after the fact.
  - saas: $0 vendor spend. The hidden cost is engineering time during outages and inability to prove compliance during an audit.
- **When to pick:** Throwaway spikes, local dev, internal cron jobs with no SLO, or a hackathon. Acceptable as a temporary state before week-1 instrumentation lands.
- **When NOT:** Any production service with users, any regulated workload, anything with an SLO, or anything you will be paged on. In Canada-first regulated stacks (PIPEDA/PHIPA/OSFI) the absence of audit logging is itself a finding.
- **Trade-off vs:**
  - otel: none has zero setup cost and zero runtime overhead, but gives you no MTTR leverage, no correlation, and no audit trail. otel costs ~3-5% CPU but makes incidents debuggable.
  - prometheus: none cannot answer 'is it up and how fast', so you find out from customers. prometheus gives you alerting in an afternoon.
  - datadog: none is free; datadog is expensive but turnkey. For anything customer-facing the datadog bill is cheaper than the outage.
- **Compliance fit:**
  - hipaa: FAILS 45 CFR 164.312(b) audit controls — no record of PHI access. Disqualifying for any ePHI system.
  - pci: FAILS PCI-DSS 4.0 Req 10 (log all access to CDE, retain 12 months). Disqualifying for CDE components.
  - soc2: FAILS CC7.1/CC7.2 — no monitoring of system components or anomaly detection.
  - pipeda: FAILS Principle 7 Safeguards and Principle 1 Accountability — cannot demonstrate access logging of personal information.
  - phipa: FAILS Ontario PHIPA s.10/12 — no audit log of who accessed PHI when.
  - osfi: FAILS OSFI B-13 — operational resilience requires logging and monitoring of critical systems.
  - fintrac: FAILS PCMLTFA recordkeeping integrity — no tamper-evident trail of access to KYC/transaction records.
- **Per industry level:**
  - banking: PROHIBITED. OSFI B-13 mandates monitoring and logging on all critical/regulated systems. Required level: full RED metrics + immutable audit logs + traces.
  - healthcare: PROHIBITED on any PHI path. PHIPA/HIPAA require access audit logs retained 6+ years. Required level: structured audit logging at minimum.
  - gov: PROHIBITED for any system handling personal info. BC Gov / GC Cloud guardrails require centralized logging. Required level: centralized structured logs + metrics.
- **Implementation:** No SDK, no agent. The only telemetry is container stdout. Treat 'none' as a documented, time-boxed decision in the threat model, never a steady state for production.

### OpenTelemetry (OTel) — Vendor-Neutral Instrumentation

- **What:** A vendor-neutral instrumentation standard and Collector. OTel is the wire format (OTLP) plus SDKs and the Collector — it instruments and routes the three pillars but is a backend-agnostic pipe, not a storage/UI backend itself.
- **Pillars:**
  - metrics: Full. SDK metrics API + auto-instrumentation emits RED metrics; OTLP exports to any backend (Prometheus via remote-write, Mimir, Datadog, Grafana Cloud). Stable spec since v1.0.
  - logs: Full and the maturing pillar. OTel logs bridge (logback/winston/structlog appenders) plus the Collector's filelog receiver. Correlates logs to traces via injected trace_id/span_id.
  - traces: Best-in-class. W3C traceparent propagation, auto-instrumentation for HTTP/gRPC/DB clients, tail-based sampling in the Collector. This is OTel's strongest pillar.
- **Cost:**
  - selfHost: Collector runs as a DaemonSet/Deployment: ~0.5 vCPU + 512MB per Collector replica per node for typical load. Otherwise the cost lands on whichever backend you choose. Instrumentation is free and open source (Apache 2.0).
  - saas: OTel itself has no SaaS fee. Grafana Cloud, Datadog, Honeycomb, and Elastic Cloud all accept native OTLP — you pay the chosen backend's rate, not an OTel tax.
- **When to pick:** You want to avoid vendor lock-in, run polyglot services, or expect to switch backends. Instrument once with OTel SDKs, point the Collector wherever you want, swap backends without touching app code.
- **When NOT:** If you want a turnkey UI/storage with zero ops, OTel alone is not enough — you still need a backend (Prometheus, Tempo, Datadog). Do not treat OTel as a destination.
- **Trade-off vs:**
  - none: otel costs ~3-5% CPU and SDK setup, but every incident becomes debuggable with trace-to-log correlation.
  - prometheus: otel is broader (3 pillars, portable) but prometheus's pull metrics model and PromQL are simpler for pure metrics+alerting. Common pattern: OTel SDK -> Collector -> Prometheus.
  - datadog: otel avoids per-host/per-GB SaaS billing and lock-in, but you operate the Collector and pick/own backends. datadog is turnkey at a price.
  - elastic: otel is the open instrumentation layer; elastic can be the backend (Elastic now ships native OTLP ingest). They are complementary, not competing.
- **Compliance fit:**
  - hipaa: Satisfies 164.312(b) audit controls when the logs pillar captures PHI-access events with trace_id correlation; retain in backend 6yr.
  - pci: Satisfies Req 10 when Collector ships CDE access logs to a 1yr-retained, write-once backend; use the Collector's redaction processor to strip PAN.
  - soc2: Strong CC7.1/CC7.2 fit — OTLP + Collector audit trail with attribute-based scrubbing is a clean SOC 2 control narrative.
  - pipeda: Supports Principle 7 — Collector redaction/transform processors let you minimize personal info in telemetry (data minimization).
  - phipa: Supports s.12 — trace-correlated access logs prove who-accessed-what; route to a PHIPA-compliant retained store.
  - osfi: Strong B-13 fit — portable instrumentation reduces concentration/lock-in risk, a stated OSFI third-party concern.
  - fintrac: Supports recordkeeping — Collector can fan-out KYC-access logs to an immutable WORM sink while keeping ops telemetry separate.
- **Per industry level:**
  - banking: REQUIRED level: traces + RED metrics + immutable audit logs, all via OTLP to a Canadian-region backend. OTel's portability directly answers OSFI B-13 lock-in concerns.
  - healthcare: REQUIRED level: logs pillar with PHI-access events, trace-correlated, redaction processor enabled before export. Retain 6yr in backend.
  - gov: REQUIRED level: full 3-pillar via Collector to a centralized, in-region store. Vendor-neutrality aligns with GC open-standards procurement.
- **Implementation:** SDK per language: @opentelemetry/sdk-node (JS), opentelemetry-python (auto via opentelemetry-instrument), otel-go SDK, OpenTelemetry .NET. Run the OpenTelemetry Collector (contrib distro v0.110+) as a DaemonSet with otlp receiver, batch + memory_limiter + redaction processors, and an exporter to your backend. Use auto-instrumentation operator on k8s to inject SDKs without code changes.

### Prometheus — Metrics & Alerting

- **What:** The CNCF de-facto standard for metrics: a pull-based time-series database with PromQL and Alertmanager. Prometheus is a metrics + alerting engine — it is not a logging or tracing system.
- **Pillars:**
  - metrics: Best-in-class. Pull-based scraping of /metrics, PromQL, recording/alerting rules, exemplars linking metrics to traces. Native histograms (v2.40+) cut cardinality cost. This is the entire point.
  - logs: None natively. Pair with Loki or Elasticsearch. Do not log through Prometheus.
  - traces: None natively. Exemplars can deep-link a metric to a Tempo/Jaeger trace, but Prometheus stores no spans.
- **Cost:**
  - selfHost: Single server handles ~1-2M active series on ~8 vCPU / 32-64GB RAM with local SSD; retention typically 15d local. Add Thanos/Mimir for long-term object storage (cheap S3/R2) and HA — that adds operational complexity but unbounded retention.
  - saas: Grafana Cloud Metrics, Amazon Managed Prometheus (AMP), or Chronosphere bill per active series / per sample ingested — roughly $0.10-0.90 per 1k series/month tier-dependent. You keep PromQL, drop the ops burden.
- **When to pick:** Kubernetes-native infra and app metrics, SLO/alerting, autoscaling signals (HPA via Prometheus Adapter/KEDA). The default first telemetry you stand up for any k8s service.
- **When NOT:** As your only observability tool — it cannot do logs or traces. For very high cardinality (per-user labels) raw Prometheus OOMs; move to Mimir/Thanos or Cortex for long-term horizontal scale.
- **Trade-off vs:**
  - none: prometheus gives alerting and dashboards in an afternoon; none gives blindness.
  - otel: prometheus is metrics-only but simpler; otel is 3-pillar and portable. They compose: OTel SDK metrics scraped or remote-written into Prometheus.
  - datadog: prometheus is free and self-hosted with full data ownership (key for Canadian data residency), but you operate it, manage retention/HA, and build dashboards. datadog is turnkey.
  - grafana-stack: prometheus IS the metrics layer of the Grafana stack; Mimir is just Prometheus-compatible storage scaled out. Picking Grafana-stack usually means Prometheus/Mimir underneath.
- **Compliance fit:**
  - hipaa: Partial — metrics rarely contain PHI, so low risk, but Prometheus alone does NOT satisfy 164.312(b) audit logging. Pair with a log store.
  - pci: Partial — supports Req 10.6 daily review via alerting, but PCI's 'log retention 1yr' is a logging requirement Prometheus does not meet alone.
  - soc2: Strong for CC7.2 anomaly/availability monitoring; Alertmanager evidences active monitoring. Not sufficient alone for the audit-trail criteria.
  - pipeda: Low personal-info exposure if you avoid PII labels; enforce a label policy to honor data minimization (Principle 7).
  - phipa: Insufficient alone for access audit (no logs/traces). Use for availability monitoring of PHIPA systems, paired with a log store.
  - osfi: Strong B-13 operational-monitoring fit; self-host enables Canadian data residency. Combine with logging for full coverage.
  - fintrac: Not a recordkeeping system — use for ops monitoring only; KYC/transaction records require an immutable log store.
- **Per industry level:**
  - banking: REQUIRED as the metrics/SLO layer (RED + USE), self-hosted in-region for OSFI residency. Must be paired with immutable logging — not sufficient alone.
  - healthcare: REQUIRED for availability/latency SLOs on PHI systems. Pair with a PHI-access log store; Prometheus does not satisfy audit-log retention.
  - gov: REQUIRED metrics layer, self-hosted in Canadian region. Combine with centralized logging for full GC guardrail coverage.
- **Implementation:** Agent/exporters: app exposes /metrics via client libs (prom-client JS, prometheus_client Python, client_golang, micrometer-registry-prometheus JVM). Deploy via kube-prometheus-stack Helm (Prometheus Operator + Alertmanager + Grafana). For scale-out long-term storage use Mimir or Thanos with S3/R2 object storage. Enable native histograms to control cardinality.

### Datadog — Full-Stack SaaS Observability

- **What:** A commercial SaaS platform unifying all three pillars plus APM, RUM, security, and CI visibility behind one agent and UI. Turnkey and broad; the most expensive option at scale.
- **Pillars:**
  - metrics: Full. Agent autodiscovery, 850+ integrations, custom metrics, Metrics Without Limits (tag-based ingest/index control), Watchdog anomaly detection.
  - logs: Full. Logging Without Limits decouples ingest from indexing — ingest everything cheaply, index/retain selectively. Sensitive Data Scanner redacts PII/PHI/PAN inline.
  - traces: Full APM. Auto-instrumentation per language, service maps, trace-to-log-to-metric correlation, trace search and live tail, ingestion sampling controls.
- **Cost:**
  - selfHost: Not applicable — SaaS only. No self-host path; this is itself a lock-in / residency consideration for regulated Canadian workloads.
  - saas: Infra Pro ~$15/host/month; APM ~$31/host/month; Logs ~$0.10/GB ingest + ~$1.70/M events indexed (15d); custom metrics ~$0.05/100 series. Real-world bills routinely hit 6-7 figures/yr at scale — custom metrics and indexed logs are the cost drivers.
- **When to pick:** You want one pane of glass fast, have budget over headcount, and value correlation across pillars plus security (CSM/CWS) without integration work. Strong for fast-scaling teams that can't staff an observability platform team.
- **When NOT:** Cost-sensitive at scale (custom metrics and high-cardinality APM bills explode), strict data-residency mandates without using the Canadian/EU/US region split, or you require full data ownership for OSFI lock-in posture.
- **Trade-off vs:**
  - none: datadog costs real money but eliminates outage blindness and audit gaps; usually cheaper than the outage.
  - otel: datadog is turnkey but proprietary; otel is portable but you run the pipeline. Datadog now ingests OTLP natively — use OTel SDKs into Datadog to hedge lock-in.
  - prometheus: datadog is push-based, hosted, and all-in-one; prometheus is self-hosted, free, and metrics-only. Datadog trades dollars for zero ops.
  - grafana-stack: datadog is one vendor and one bill with superior UX; grafana-stack is open, cheaper at scale, and self-hostable for residency. Datadog wins on time-to-value, loses on cost and ownership.
  - elastic: datadog has stronger APM/correlation UX; elastic has stronger log search/SIEM and a self-host option for data residency.
- **Compliance fit:**
  - hipaa: Datadog signs a BAA and is HIPAA-eligible; Sensitive Data Scanner + RBAC + audit trail satisfy 164.312(b). Retain logs 6yr via Archives to your own S3.
  - pci: PCI-DSS Level 1 certified service provider; Sensitive Data Scanner masks PAN; supports Req 10 with 1yr+ archive retention. CDE logs must be scrubbed before index.
  - soc2: Datadog is SOC 2 Type II audited and provides Audit Trail (admin/config changes) — satisfies CC7.1/CC7.2 with otel/agent ingest + audit trail.
  - pipeda: Use the Datadog CA (Canada) or US region per residency need; Sensitive Data Scanner enforces minimization (Principle 7). DPA available.
  - phipa: BAA + RBAC + access audit trail support s.12; pin region and archive PHI-access logs 6yr to in-region storage.
  - osfi: B-13 technology/third-party risk: Datadog is a material third party — requires a B-10 outsourcing assessment, exit plan, and concentration-risk review.
  - fintrac: Log Archives to immutable object storage (WORM/Object Lock) provide the retained KYC/transaction access trail PCMLTFA expects.
- **Per industry level:**
  - banking: ALLOWED with conditions: OSFI B-10 third-party assessment + documented exit/portability plan (prefer OTLP ingest), pin region, archive immutably. Required level: full 3-pillar + audit trail.
  - healthcare: ALLOWED with signed BAA, Sensitive Data Scanner on, region pinned, 6yr archive. Required level: PHI-access logging + APM + metrics.
  - gov: CONDITIONAL — SaaS data residency must satisfy GC/BC Gov requirements; many GC workloads mandate in-Canada control, which a US-region SaaS may not meet. Validate region + Protected B eligibility first.
- **Implementation:** Agent: datadog-agent DaemonSet on k8s (Helm/Operator) with autodiscovery; dd-trace SDK per language (dd-trace-js, ddtrace Python, dd-trace-go, dd-trace-java, dd-trace-dotnet) or OTLP ingest from OTel SDKs. Enable Sensitive Data Scanner and Logging/Metrics Without Limits to control cost and PII before storing.

### Grafana Stack — Loki / Tempo / Mimir (LGTM)

- **What:** An open-source, object-storage-backed observability suite: Mimir (metrics), Loki (logs), Tempo (traces), unified in Grafana. Cheap at scale, self-hostable for data residency, OTLP-native via Grafana Alloy.
- **Pillars:**
  - metrics: Full via Mimir — horizontally scalable, Prometheus-compatible (PromQL + remote-write), backed by S3/GCS/R2 object storage for cheap long retention.
  - logs: Full via Loki — indexes only labels, stores log bodies in object storage. Very cheap ingest; LogQL query. Trade-off: weaker full-text search than Elasticsearch.
  - traces: Full via Tempo — object-storage trace backend, no index needed (search by trace_id or TraceQL), cheapest trace storage. Exemplar/log linkage in Grafana.
- **Cost:**
  - selfHost: Object storage (S3/R2/GCS) is the bulk store at ~$0.015-0.023/GB-month — dramatically cheaper than indexed stores. Compute: distributed Mimir/Loki/Tempo each run multiple microservice components (ingester/querier/compactor) — plan a dedicated platform team or use monolithic mode for smaller scale.
  - saas: Grafana Cloud hosts LGTM: free tier (10k series, 50GB logs/traces), then ~$8/1k metrics series, ~$0.50/GB logs, ~$0.50/GB traces — typically cheaper than Datadog for equivalent volume.
- **When to pick:** You want open-source ownership, data residency control, and the lowest storage cost at scale (object storage), and you can run the platform. Ideal for Canada-first regulated stacks needing in-region self-host without per-GB SaaS bills.
- **When NOT:** Small team with no platform engineering capacity (the distributed mode is operationally heavy), or you need rich full-text log forensics/SIEM — Loki's label-only index is weaker than Elastic for arbitrary text search.
- **Trade-off vs:**
  - none: grafana-stack gives full 3-pillar ownership; none gives blindness.
  - otel: grafana-stack is the backend; otel is the instrumentation. Grafana Alloy IS a distribution of the OTel Collector — they are designed to compose, not compete.
  - prometheus: Mimir is scaled-out Prometheus with object storage; choose Mimir over raw Prometheus when you need long retention + HA + multi-tenancy.
  - datadog: grafana-stack is open, self-hostable, and far cheaper at scale with full data ownership; datadog is turnkey with better out-of-box UX. The classic cost/ownership vs convenience trade.
  - elastic: grafana-stack (Loki) is cheaper for high-volume logs you mostly filter by label; elastic wins for ad-hoc full-text search and SIEM. Pick Loki for cost, Elastic for forensics.
- **Compliance fit:**
  - hipaa: Self-host in your HIPAA boundary; Loki PHI-access logs + Grafana RBAC + audit satisfy 164.312(b). Retain 6yr cheaply in object storage with bucket Object Lock.
  - pci: Loki + object-storage Object Lock gives WORM 1yr+ retention for Req 10; scrub PAN at the Alloy/Collector stage before ingest.
  - soc2: Strong CC7.1/CC7.2 — full self-hosted audit trail; Grafana Enterprise adds reporting/RBAC/audit for the control narrative (otel + audit trail).
  - pipeda: Self-host in a Canadian region for residency; Alloy processors enforce minimization (Principle 7). Full data ownership aids Accountability (Principle 1).
  - phipa: Self-hosted in-province store of PHI-access logs with Object Lock and RBAC directly satisfies s.10/12 access-audit and retention.
  - osfi: Best B-13 posture: open source + self-host = no third-party concentration/lock-in risk, in-region residency, documented exit by design.
  - fintrac: Loki/Tempo to object storage with Object Lock provides immutable, retained KYC/transaction access trails for PCMLTFA.
- **Per industry level:**
  - banking: PREFERRED for OSFI B-13/B-10 posture — self-hosted, in-region, no lock-in. Required level: full 3-pillar, Object Lock on log/trace buckets, RBAC + Grafana audit.
  - healthcare: STRONG fit — self-host PHI telemetry in-province, 6yr Object-Lock retention, Loki access logs trace-correlated. Required level: PHI-access logging + metrics + traces.
  - gov: PREFERRED — open source + in-Canada self-host aligns with GC sovereignty/Protected B. Required level: centralized 3-pillar with RBAC and retention controls.
- **Implementation:** Agent: Grafana Alloy (OTel Collector distro) or Promtail (legacy) ships logs to Loki; OTel SDKs / Alloy export traces to Tempo and metrics to Mimir via remote-write. Deploy via official Helm charts (mimir-distributed, loki-distributed, tempo-distributed) or the monolithic single-binary mode for smaller scale. Back all three with S3/R2/GCS + Object Lock for immutability.

### Elastic Stack (ELK) — Search-Centric Observability & SIEM

- **What:** Elasticsearch + Kibana with the Elastic Agent / OTel ingest, spanning logs, metrics, APM, and a strong SIEM. The pick when full-text search, log forensics, and security analytics are first-class needs.
- **Pillars:**
  - metrics: Full via Elastic Agent + TSDB index mode; weaker PromQL ecosystem than Prometheus but adequate and unified with logs/traces in one store.
  - logs: Best-in-class search. Inverted-index full-text query (ES/QL/KQL), ideal for arbitrary forensic queries and log analytics. Higher storage cost than Loki because everything is indexed.
  - traces: Full Elastic APM — distributed traces stored in Elasticsearch, correlated with logs/metrics, service maps. Native OTLP ingest supported.
- **Cost:**
  - selfHost: Storage-heavy because all fields are indexed; use ILM hot-warm-cold-frozen tiers (frozen = searchable snapshots on S3/R2) to cut cost. Plan dedicated nodes (master/data/ingest) — a multi-TB cluster needs real RAM/SSD and operational care.
  - saas: Elastic Cloud bills by resource (RAM/storage/data-transfer) per tier, or serverless by ingest+retention GB. Generally cheaper than Datadog for log-heavy workloads, pricier than Loki for the same volume due to indexing.
- **When to pick:** Security + observability convergence (SIEM use case), heavy ad-hoc log search/forensics, or you already run Elasticsearch. Strong for fraud/AML log analytics and incident forensics where full-text search wins.
- **When NOT:** Cost-sensitive high-volume logging where you mostly filter by label (Loki is cheaper), or you want lightweight metrics-only (Prometheus is simpler). Indexing everything is powerful but storage-heavy.
- **Trade-off vs:**
  - none: elastic gives searchable forensic history + SIEM; none gives nothing to investigate with.
  - otel: elastic is the backend; otel is instrumentation. Elastic ingests OTLP natively — instrument with OTel, store/search in Elastic.
  - prometheus: elastic unifies metrics with logs/traces but PromQL/alerting ecosystem around Prometheus is deeper for pure metrics. Many run both.
  - datadog: elastic is self-hostable for residency and stronger at raw log search/SIEM; datadog has slicker APM/correlation UX out of the box.
  - grafana-stack: elastic indexes everything for full-text/SIEM power at higher storage cost; loki indexes labels only for lower cost but weaker search. Pick Elastic for forensics/SIEM, Loki for cheap volume.
- **Compliance fit:**
  - hipaa: Elastic signs a BAA (Elastic Cloud) or self-host in your boundary; field-level security + audit logging satisfy 164.312(b). Frozen tier + snapshot retention gives 6yr cheaply.
  - pci: Supports Req 10 with ILM 1yr retention and searchable archives; mask PAN via ingest pipeline processors before indexing.
  - soc2: Strong CC7.1/CC7.2 — Elastic SIEM detection rules + audit logging make a robust monitoring control narrative (otel + audit trail).
  - pipeda: Self-host or Canadian Elastic Cloud region for residency; ingest-pipeline redaction enforces minimization (Principle 7).
  - phipa: Field-level security + audit logs + in-region store satisfy s.10/12 PHI access auditing and retention.
  - osfi: Self-host gives strong B-13 residency/no-lock-in posture; SIEM directly supports operational-resilience threat detection.
  - fintrac: Elastic SIEM is purpose-built for AML/fraud detection and recordkeeping — searchable, retained KYC/transaction trails fit PCMLTFA well.
- **Per industry level:**
  - banking: STRONG for AML/fraud SIEM + forensics; self-host in-region for OSFI. Required level: full 3-pillar + SIEM detections + 1yr+ Object-Lock/snapshot retention.
  - healthcare: STRONG where PHI-access forensic search matters; self-host or BAA + region pin, field-level security on PHI, 6yr frozen-tier retention. Required level: PHI-access audit + APM.
  - gov: STRONG for security analytics; self-host in Canada for sovereignty/Protected B. Required level: centralized searchable logs + SIEM + metrics, RBAC enforced.
- **Implementation:** Agent: Elastic Agent (Fleet-managed) or native OTLP ingest from OTel SDKs into Elastic APM Server; Beats (Filebeat/Metricbeat) for legacy. Deploy self-host via ECK (Elastic Cloud on Kubernetes operator) or Elastic Cloud SaaS. Apply ILM hot-warm-cold-frozen tiers with searchable snapshots to S3/R2, ingest-pipeline redaction for PII, and field-level security + audit logging for compliance.

## B.7d Runtime base images — every option, decided

### Alpine Linux

- **Base OS:** Alpine Linux 3.21 (musl libc + BusyBox)
- **Size (MB):** 8
- **FIPS certified:** no
- **Attack surface:** low
- **When to pick:** You need a tiny image WITH a package manager and shell for debugging. Pure-Go or compiled binaries with no glibc dependency. Cost-sensitive registries where pull bytes matter.
- **When NOT:** Anything requiring glibc (most ML/CUDA, many Python wheels, Oracle/proprietary clients). FIPS-validated crypto required. PHIPA/OSFI workloads needing a vendor-certified crypto module — musl ships no FIPS module.
- **Trade-off vs:**
  - slim: Smaller than slim (8MB vs ~75MB) but musl breaks glibc-only binaries and causes subtle DNS/threading/locale bugs.
  - distroless: Has a shell and apk (easier debugging) but larger attack surface than distroless.
  - wolfi: Older musl/BusyBox toolchain; Wolfi is glibc-based, has faster CVE remediation and SBOM-by-default.
- **Compliance fit:**
  - FIPS: not-supported
  - FedRAMP: ok-with-caveats
  - PCI-DSS: ok
  - PIPEDA: ok
  - PHIPA: ok-not-for-crypto-boundary
  - OSFI-B13: ok-not-fips
- **FROM line:** FROM alpine:3.21

### Debian Slim

- **Base OS:** Debian 12 'bookworm' (glibc + dpkg/apt)
- **Size (MB):** 75
- **FIPS certified:** no
- **Attack surface:** medium
- **When to pick:** Default safe choice when you need glibc compatibility and apt. Python/Node/Java apps with native deps that expect glibc. Teams that want broad ecosystem support over minimal size.
- **When NOT:** You need the smallest possible attack surface or image size. FIPS-validated crypto required (use ubi9-fips). Air-gapped FedRAMP High where every apt package needs an SBOM attestation.
- **Trade-off vs:**
  - alpine: 10x larger than Alpine but full glibc compatibility — no musl surprises.
  - distroless: Has apt and shell for debugging but ships ~80 OS packages distroless does not.
  - ubiMinimal: Community Debian vs Red Hat UBI; UBI carries Red Hat CVE feeds and is redistributable under UBI EULA for RHEL support.
- **Compliance fit:**
  - FIPS: not-supported
  - FedRAMP: ok-with-caveats
  - PCI-DSS: ok
  - PIPEDA: ok
  - PHIPA: ok-not-for-crypto-boundary
  - OSFI-B13: ok-not-fips
- **FROM line:** FROM debian:12-slim

### UBI9 FIPS (Red Hat Universal Base Image, FIPS mode)

- **Base OS:** RHEL 9 UBI (glibc + microdnf), FIPS 140-3 validated OpenSSL/crypto modules
- **Size (MB):** 210
- **FIPS certified:** yes
- **Attack surface:** medium
- **When to pick:** FIPS 140-3 validated crypto is a hard requirement: FedRAMP, OSFI-regulated banking workloads, PHIPA crypto boundaries, federal/defence. You need a real CMVP certificate number for an auditor.
- **When NOT:** You don't need FIPS and want a small image — this is the largest option here. Crypto must be enabled at the host/kernel level too (fips=1 in GRUB or RHEL crypto-policy FIPS); the image alone is necessary but not sufficient.
- **Trade-off vs:**
  - ubiMinimal: Same UBI family but FIPS-validated crypto modules and crypto-policies enforced — larger and slower crypto, real certificate.
  - wolfi: Wolfi offers FIPS images (Chainguard FIPS) but UBI9 carries Red Hat's own CMVP certificate and full RHEL support contract.
  - azureLinux: Azure Linux FIPS targets Azure/AKS; UBI9-FIPS is vendor-neutral and the RHEL-ecosystem standard for federal.
- **Compliance fit:**
  - FIPS: required-and-validated
  - FedRAMP: required
  - PCI-DSS: ok-strong-crypto
  - PIPEDA: ok
  - PHIPA: ok-crypto-boundary-approved
  - OSFI-B13: ok-meets-strong-crypto
- **FROM line:** FROM registry.access.redhat.com/ubi9/ubi:9.5  # run host with fips=1; set update-crypto-policies --set FIPS

### Scratch (empty base)

- **Base OS:** None — zero-byte empty filesystem
- **FIPS certified:** no
- **Attack surface:** minimal
- **When to pick:** A single fully static binary (CGO_ENABLED=0 Go, static Rust). Maximum attack-surface reduction. You can bake CA certs, /etc/passwd and tzdata into the build explicitly.
- **When NOT:** You need TLS (must COPY ca-certificates.crt yourself). You need a shell, DNS resolver config, /tmp, or non-root user setup without doing it manually. Any dynamically-linked binary will not run.
- **Trade-off vs:**
  - distroless: Even smaller than distroless but distroless gives you CA certs, tzdata, /etc/passwd and a nonroot user out of the box.
  - alpine: Zero packages vs Alpine's 8MB — but no apk, no shell, nothing to debug with.
  - wolfi: Wolfi static images give you the same near-empty surface plus SBOMs and CA certs prepackaged.
- **Compliance fit:**
  - FIPS: not-supported
  - FedRAMP: ok-if-binary-uses-fips-crypto
  - PCI-DSS: ok
  - PIPEDA: ok
  - PHIPA: ok-not-for-crypto-boundary
  - OSFI-B13: ok-not-fips
- **FROM line:** FROM scratch COPY --from=build /app /app COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ ENTRYPOINT ["/app"]

### Google Distroless

- **Base OS:** Debian 12 derived (glibc), no package manager, no shell
- **Size (MB):** 22
- **FIPS certified:** no
- **Attack surface:** minimal
- **When to pick:** Production runtime where you want glibc compatibility but no shell/package-manager attack surface. Pairs with multi-stage builds. CA certs and nonroot user already present.
- **When NOT:** You need to exec into the container to debug in prod (use :debug variant only). FIPS validation required. You need apt/apk at runtime. Tag pinning matters — distroless ships no version tags, use digests.
- **Trade-off vs:**
  - scratch: Larger than scratch but includes CA certs, tzdata, nonroot user — works with dynamic glibc binaries.
  - alpine: No shell/apk so smaller surface than Alpine, but harder to debug and no musl (uses glibc).
  - wolfi: Wolfi has faster CVE patch SLAs and per-image SBOMs; distroless lags on some CVE remediation timelines.
- **Compliance fit:**
  - FIPS: not-supported
  - FedRAMP: ok-if-app-crypto-fips
  - PCI-DSS: ok
  - PIPEDA: ok
  - PHIPA: ok-not-for-crypto-boundary
  - OSFI-B13: ok-not-fips
- **FROM line:** FROM gcr.io/distroless/static-debian12:nonroot  # or base/java21/python3

### UBI9 Micro

- **Base OS:** RHEL 9 UBI (glibc), no package manager inside the image
- **Size (MB):** 26
- **FIPS certified:** no
- **Attack surface:** minimal
- **When to pick:** RHEL-ecosystem teams wanting distroless-style minimalism with Red Hat CVE feeds and support. Multi-stage builds where you install deps via builder. Redistributable under UBI terms.
- **When NOT:** You need a package manager at runtime (use ubi-minimal). You need FIPS-validated crypto (use ubi9-fips). You need an interactive shell for in-cluster debugging.
- **Trade-off vs:**
  - ubiMinimal: Smaller than ubi-minimal (no microdnf, ~26MB vs ~92MB) but you cannot install packages inside the final image.
  - distroless: Comparable size to distroless but carries Red Hat CVE data and UBI support eligibility.
  - fips: Not FIPS-validated; choose ubi9-fips when a CMVP certificate is required.
- **Compliance fit:**
  - FIPS: not-supported
  - FedRAMP: ok-if-app-crypto-fips
  - PCI-DSS: ok
  - PIPEDA: ok
  - PHIPA: ok-not-for-crypto-boundary
  - OSFI-B13: ok-not-fips
- **FROM line:** FROM registry.access.redhat.com/ubi9/ubi-micro:9.5

### UBI9 Minimal

- **Base OS:** RHEL 9 UBI (glibc + microdnf)
- **Size (MB):** 92
- **FIPS certified:** no
- **Attack surface:** low
- **When to pick:** Enterprise/RHEL shops that need microdnf to install packages plus Red Hat CVE coverage. Drop-in for teams standardizing on UBI across OpenShift. You want a shell for debugging but smaller than full UBI.
- **When NOT:** You want the absolute smallest surface (use ubi-micro or distroless). FIPS crypto required (use ubi9-fips). You're not in the RHEL ecosystem and don't need Red Hat support.
- **Trade-off vs:**
  - ubiMicro: Larger but includes microdnf so you can install packages at runtime / in the final stage.
  - slim: Red Hat support and CVE feeds vs community Debian; UBI is redistributable for RHEL-based support.
  - alpine: glibc not musl, plus enterprise support — but ~10x larger than Alpine.
- **Compliance fit:**
  - FIPS: not-supported
  - FedRAMP: ok-with-caveats
  - PCI-DSS: ok
  - PIPEDA: ok
  - PHIPA: ok-not-for-crypto-boundary
  - OSFI-B13: ok-not-fips
- **FROM line:** FROM registry.access.redhat.com/ubi9/ubi-minimal:9.5

### Wolfi (Chainguard)

- **Base OS:** Wolfi 'undistro' (glibc + apk-tools, no kernel)
- **Size (MB):** 12
- **FIPS certified:** no
- **Attack surface:** minimal
- **When to pick:** You want minimal images WITH glibc compatibility (unlike Alpine's musl) and the best CVE posture. Supply-chain requirements: signed images, SBOMs, provenance. Chainguard sells FIPS-validated variants separately.
- **When NOT:** You need a free FIPS certificate (Chainguard FIPS images are a paid product). Air-gapped with no access to Wolfi repos and no mirror. You're standardized on the RHEL/UBI support model.
- **Trade-off vs:**
  - alpine: glibc not musl (fixes Alpine's compatibility bugs) and far better CVE SLA, but slightly larger and newer ecosystem.
  - distroless: Faster CVE remediation and SBOM-per-image; Wolfi -dev variants give a shell distroless lacks.
  - fips: Base Wolfi is not FIPS; Chainguard's FIPS images carry validated modules but are a paid tier.
- **Compliance fit:**
  - FIPS: not-supported-base-paid-fips-tier
  - FedRAMP: ok-with-caveats
  - PCI-DSS: ok-strong-supply-chain
  - PIPEDA: ok
  - PHIPA: ok-not-for-crypto-boundary
  - OSFI-B13: ok-not-fips-base
- **FROM line:** FROM cgr.dev/chainguard/wolfi-base:latest  # or chainguard/static, chainguard/<lang>

### Azure Linux (CBL-Mariner 3.0)

- **Base OS:** Azure Linux 3.0 (glibc + dnf/tdnf), Microsoft-maintained
- **Size (MB):** 100
- **FIPS certified:** yes-fips-image-variant
- **Attack surface:** low
- **When to pick:** AKS / Azure-centric platforms wanting a Microsoft-supported base with matching node OS. You need FIPS on Azure (Azure Linux ships a FIPS image variant). Government cloud workloads on Azure.
- **When NOT:** You're not on Azure and want a vendor-neutral base (UBI or Wolfi fit better). You need the smallest possible image. You want the RHEL-ecosystem CVE/support model specifically.
- **Trade-off vs:**
  - fips: Azure Linux FIPS targets Azure/AKS specifically; UBI9-FIPS is vendor-neutral and federal-standard.
  - ubiMinimal: Comparable RPM-based footprint; Azure Linux is Microsoft-supported and aligns with AKS node OS.
  - wolfi: Larger and less aggressive CVE SLA than Wolfi, but first-party Azure support and a FIPS variant.
- **Compliance fit:**
  - FIPS: validated-in-fips-variant
  - FedRAMP: ok-azure-gov-aligned
  - PCI-DSS: ok
  - PIPEDA: ok
  - PHIPA: ok-crypto-boundary-with-fips-variant
  - OSFI-B13: ok-meets-strong-crypto-with-fips-variant
- **FROM line:** FROM mcr.microsoft.com/azurelinux/base/core:3.0  # FIPS: mcr.microsoft.com/azurelinux/base/core:3.0 with fips package

## B.7e Package managers & build tools — every option, decided

### npm

- **Kind:** pkg-mgr
- **Language:** JavaScript/TypeScript
- **What:** The default package manager bundled with Node.js. Reference implementation of the npm registry protocol and package.json semantics. npm 11 ships with Node 24 LTS (2026).
- **Lockfile:** package-lock.json (lockfileVersion 3). Commit it. Use `npm ci` in CI for deterministic installs that fail on lockfile drift.
- **Speed:** Slowest mainstream installer. Cold install of a large app ~60-120s; `npm ci` with cache warm ~20-40s. Has no global content-addressed store, so disk usage multiplies across projects.
- **When to pick:** Pick when you want zero extra install steps, maximum compatibility, and a single-package repo with no monorepo needs. Pick for libraries published to npmjs.org where you must validate the lowest-common-denominator install path consumers use.
- **When NOT:** Avoid for large monorepos (workspaces are functional but slow and lack the dependency-isolation guarantees of pnpm). Avoid when install speed or disk usage on CI matters at scale.
- **Trade-off vs:**
  - pnpm: npm uses a flat hoisted node_modules that allows phantom dependencies; pnpm uses a content-addressed store + symlinks that block phantom deps. npm is universally available; pnpm needs a corepack/install step.
  - yarn: npm is slower than Yarn Berry PnP but needs no .pnp.cjs loader shim; npm install just works with every tool.
  - bun: bun is 10-25x faster on cold installs but is a newer runtime+manager; npm is the conservative, audited default.
- **Implementation:** Enforce `npm ci` (not `npm install`) in CI. Pin Node via .nvmrc/engines. Run `npm audit --audit-level=high` and gate. Use `.npmrc` with `provenance=true` for publishing with Sigstore attestations. For Canada PIPEDA/OSFI supply-chain posture: enable `npm config set audit-signatures true` to verify registry signatures, mirror through a private registry (Verdaccio/Artifactory/GitHub Packages) so no direct egress to npmjs.org from build runners.

### pnpm

- **Kind:** pkg-mgr
- **Language:** JavaScript/TypeScript
- **What:** Performant npm. Content-addressable global store with hardlinks + symlinked node_modules so each package version is stored on disk exactly once. pnpm 10 (2026) is the de-facto monorepo standard.
- **Lockfile:** pnpm-lock.yaml (lockfileVersion 9.0). Commit it. Use `pnpm install --frozen-lockfile` in CI. Workspace catalogs (pnpm-workspace.yaml `catalog:`) centralize version ranges across packages.
- **Speed:** Fastest of the mature managers. Warm-store install is often near-instant because it hardlinks rather than copies. Cold CI install of a large monorepo ~25-50s; with a persisted store cache 5-15s.
- **When to pick:** Default pick for any monorepo and for any team that wants strict dependency isolation (no phantom dependencies) and minimal CI disk/network. Pick when you run many projects on one machine/runner and want shared store hits.
- **When NOT:** Avoid only when a dependency hard-assumes a flat hoisted node_modules and breaks on symlinks (rare, mostly legacy React Native / some bundler plugins). Use `node-linker=hoisted` as the escape hatch rather than switching managers.
- **Trade-off vs:**
  - npm: pnpm is 2-3x faster, uses a fraction of the disk via the global store, and blocks phantom dependencies by default; npm is preinstalled and never needs the symlink escape hatches.
  - yarn: pnpm gives strictness without Yarn PnP's .pnp loader shim that breaks some tooling; Yarn Berry has a richer plugin/protocol ecosystem.
  - bun: bun installs faster still and is also a runtime; pnpm is runtime-agnostic, more mature for large monorepos, and has deeper workspace/catalog tooling.
- **Implementation:** Enable via Corepack: `corepack enable && corepack use pnpm@10`. Commit packageManager field in package.json so the version is pinned. In CI cache `~/.local/share/pnpm/store` (or `pnpm store path`). Set `pnpm config set verify-store-integrity true`. For PIPEDA/OSFI: set `registry` to a private mirror, `pnpm audit --audit-level high`, and `minimumReleaseAge` (pnpm 10.x) to a 1440-minute (24h) cooldown to dodge just-published malicious versions.

### Yarn (Berry)

- **Kind:** pkg-mgr
- **Language:** JavaScript/TypeScript
- **What:** Yarn 4.x (Berry). Plugin-driven manager supporting node_modules, Plug'n'Play (PnP, zero-install via .pnp.cjs), and pnpm-style linkers. Successor to the deprecated Yarn 1 (Classic).
- **Lockfile:** yarn.lock (Berry format, not interchangeable with Yarn 1). Commit it. CI uses `yarn install --immutable` which fails on any lockfile change.
- **Speed:** PnP cold installs are very fast because there is no node_modules tree to materialize; zero-install means clone-and-run with no install at all. node_modules linker mode is comparable to pnpm.
- **When to pick:** Pick when you want zero-install (commit the cache, no install step on clone) and tight constraints enforcement, or when you already invested in Yarn plugins/constraints. Strong for monorepos that want deterministic CI with `--immutable`.
- **When NOT:** Avoid Yarn PnP when your toolchain (some bundlers, React Native, certain ESLint/Jest setups) can't resolve through the .pnp loader. Avoid Yarn 1 Classic entirely in 2026 — it is unmaintained.
- **Trade-off vs:**
  - npm: Yarn is faster and offers PnP/zero-install and constraints; npm needs no plugins and is universally compatible.
  - pnpm: Yarn PnP eliminates node_modules entirely (smaller, faster cold start) but the .pnp shim breaks more tools; pnpm's symlink model is broadly compatible.
  - bun: bun is faster and is a runtime; Yarn is runtime-agnostic with a mature plugin/constraints ecosystem and a longer enterprise track record.
- **Implementation:** Enable via Corepack: `corepack use yarn@4`. Choose linker explicitly in .yarnrc.yml (`nodeLinker: node-modules` for compatibility, `pnp` for speed). Commit packageManager. Use `yarn npm audit` and `enableHardenedMode: true` (Berry hardened mode verifies lockfile integrity against the registry in CI). For OSFI/PIPEDA: set `npmRegistryServer` to a private mirror and pin via constraints.pro.

### Bun

- **Kind:** pkg-mgr
- **Language:** JavaScript/TypeScript
- **What:** Bun is a Zig-based JavaScript runtime, bundler, test runner, and package manager in one binary. `bun install` is its npm-compatible installer. Bun 1.2+ (2026) added a text-based bun.lock.
- **Lockfile:** bun.lock (text, Bun 1.2+, reviewable in diffs) replacing the older binary bun.lockb. Commit it. CI uses `bun install --frozen-lockfile`.
- **Speed:** Fastest installer in the ecosystem; uses a global cache and optimized syscalls. Cold installs frequently 10-25x faster than npm. Combined with `bun build` this collapses install+bundle into one fast pass.
- **When to pick:** Pick when raw install/run speed is the priority and your stack runs on the Bun runtime, or when you want one tool for install+test+bundle+run. Excellent for greenfield apps, scripts, and Docker images wanting tiny cold-start.
- **When NOT:** Avoid for libraries that must support Node-only consumers without validation, or apps depending on native Node addons/APIs Bun hasn't matched. In regulated Canadian fintech, avoid making Bun the sole runtime until your dependency's native modules and security tooling are confirmed Bun-compatible.
- **Trade-off vs:**
  - npm: Bun installs 10-25x faster and bundles a runtime/test/bundler; npm is the audited, universally compatible baseline.
  - pnpm: Bun is faster and all-in-one; pnpm is runtime-agnostic and more battle-tested in giant monorepos with stricter isolation.
  - yarn: Bun is faster and simpler; Yarn offers PnP, constraints, and a plugin ecosystem Bun lacks.
- **Implementation:** Pin the Bun version in CI (`oven-sh/setup-bun` action or Dockerfile FROM oven/bun:1.2). Commit bun.lock. Use `bun pm trust` allowlist to control postinstall scripts (Bun blocks lifecycle scripts by default — a strong supply-chain control). For PIPEDA/OSFI: set `[install] registry` in bunfig.toml to a private mirror, keep postinstall scripts blocked, and verify Bun-runtime parity for any native deps before prod.

### pip

- **Kind:** pkg-mgr
- **Language:** Python
- **What:** The reference Python package installer bundled with CPython. Resolves and installs from PyPI using the modern backtracking resolver. Does not manage virtualenvs or lock by itself.
- **Lockfile:** None natively. Use `pip install -r requirements.txt` against a fully pinned, hashed file (`--require-hashes`) generated by pip-tools or uv. PEP 751 pylock.toml is the emerging standard lockfile pip is gaining support for.
- **Speed:** Slow resolver and serial wheel downloads relative to uv. Mitigate with `--no-deps` on pre-resolved pinned files, a wheel cache, and a local index.
- **When to pick:** Pick for simple scripts, teaching, Docker images where you control the environment, or as the install backend behind a lockfile produced elsewhere (pip-tools/uv). Pick when you need maximum compatibility with every Python package.
- **When NOT:** Avoid as your sole dependency manager on a team — bare pip has no lockfile, no reproducibility guarantee, and no project/dependency-group model. Use pip-tools, Poetry, or uv on top.
- **Trade-off vs:**
  - poetry: pip is simpler and universal but has no project model or lockfile; Poetry adds pyproject-based dependency management and poetry.lock.
  - uv: uv is 10-100x faster and does locking+venv+Python management; pip is the slow, dependency-free baseline.
  - pip-tools: bare pip can't lock; pip-tools compiles requirements.in to a pinned requirements.txt that pip then installs.
- **Implementation:** Always install into a venv. Use `pip install --require-hashes -r requirements.txt` for tamper-evident installs (PIPEDA/OSFI supply-chain control — blocks substituted artifacts). Generate the hashed file with `uv pip compile` or `pip-compile --generate-hashes`. Point `--index-url` at a private mirror (Artifactory/Azure Artifacts/pip-audit gated). Run `pip-audit` in CI and gate on high CVEs.

### Poetry

- **Kind:** pkg-mgr
- **Language:** Python
- **What:** Project + dependency manager for Python. Manages pyproject.toml, resolves and locks dependencies (poetry.lock), creates virtualenvs, and builds/publishes packages. Poetry 2.x (2026) adopted PEP 621 standard project metadata.
- **Lockfile:** poetry.lock. Commit it. CI uses `poetry install --sync` (prunes extras) or `poetry install --no-root`. Lock with `poetry lock`; check drift with `poetry check --lock`.
- **Speed:** Resolver improved in 2.x but still much slower than uv on cold resolves of large graphs. Mitigate with `--no-interaction`, cached venvs, and `poetry config installer.parallel true`.
- **When to pick:** Pick for application and library projects wanting a single mature tool for declared deps + lockfile + build/publish, where uv adoption isn't yet approved. Strong for teams already standardized on Poetry workflows.
- **When NOT:** Avoid if install/resolve speed dominates your CI cost — uv is dramatically faster. Avoid when you also need Python-version management; Poetry does not install Python interpreters (uv does).
- **Trade-off vs:**
  - pip: Poetry adds a real project model, lockfile, and publish flow; pip is simpler and universal.
  - uv: Poetry is mature with a large user base and rich publish workflow; uv is 10-100x faster, manages Python versions, and is the momentum choice in 2026.
  - pip-tools: Poetry is an integrated project manager; pip-tools is a minimal compile-a-lockfile layer over pip.
- **Implementation:** Pin Poetry via pipx or the official installer with a version constraint. Configure `poetry config repositories.private <url>` + credentials for a private index (PIPEDA/OSFI mirror). Use `poetry export --with-hashes` if a hashed requirements.txt is needed for hardened installers. Run `poetry audit` (via plugin) or `pip-audit` against the exported lock; gate high CVEs.

### uv

- **Kind:** pkg-mgr
- **Language:** Python
- **What:** Rust-based, all-in-one Python package + project manager from Astral (makers of Ruff). Does resolving, locking, venv creation, Python interpreter install/management, and tool running. The 2026 default for new Python projects.
- **Lockfile:** uv.lock (cross-platform, universal resolution across OS/arch/Python versions). Commit it. CI uses `uv sync --frozen` or `uv sync --locked`. Also emits PEP 751 pylock.toml on export.
- **Speed:** Fastest Python installer by a wide margin — Rust resolver, parallel downloads, a global cache with copy-on-write/hardlinks. Warm-cache installs are often sub-second; cold large graphs land in seconds.
- **When to pick:** Default pick for any new Python project and for accelerating CI. Pick when you want one fast tool replacing pip + pip-tools + virtualenv + pyenv + pipx. Pick for monorepos via uv workspaces.
- **When NOT:** Avoid only where org policy hasn't approved a newer Astral tool yet, or where a niche package's build needs a workflow uv doesn't model. Even then, `uv pip` can drop into pip-compatible mode.
- **Trade-off vs:**
  - pip: uv is 10-100x faster, locks, and manages venvs + Python versions; pip is the slow dependency-free baseline.
  - poetry: uv is far faster and also manages Python interpreters; Poetry is older with a longer enterprise track record.
  - pip-tools: uv replaces pip-tools with `uv pip compile` plus a full project manager; pip-tools only compiles a lockfile.
- **Implementation:** Pin uv version in CI (`astral-sh/setup-uv` action or Docker `FROM ghcr.io/astral-sh/uv`). Use `uv sync --locked` to fail on lockfile drift. Set `UV_INDEX_URL` to a private mirror and `UV_HTTP_TIMEOUT`; uv supports hashes in uv.lock for tamper-evidence (PIPEDA/OSFI). Run `uv export --format requirements-txt / pip-audit` or use `uvx pip-audit` in CI; gate high CVEs.

### Go Modules (go mod)

- **Kind:** pkg-mgr
- **Language:** Go
- **What:** The built-in dependency system of the Go toolchain. Versions are resolved by Minimal Version Selection (MVS) and verified through a global checksum database (sum.golang.org). No separate package-manager binary.
- **Lockfile:** go.mod (requirements) + go.sum (cryptographic checksums of every module + go.mod). Commit both. `go mod verify` checks the local cache against go.sum; builds fail on mismatch.
- **Speed:** Fast: the module proxy serves immutable cached zips, MVS avoids backtracking, and the build cache is aggressive. Cold builds dominated by compilation, not dependency fetch.
- **When to pick:** Always use for Go — it is the toolchain. There is no real alternative in 2026. Use the module proxy + checksum DB for fast, verifiable, reproducible builds.
- **When NOT:** N/A — it is the canonical and only mainstream Go dependency mechanism. The only knob is whether to route through a private GOPROXY/GONOSUMCHECK for private modules.
- **Trade-off vs:**
  - npm: go.sum gives cryptographic, transparency-log-backed verification out of the box; npm only recently added signatures/provenance.
  - cargo: Both use lock-like reproducibility; Go uses MVS (picks minimum compatible versions) while Cargo uses a SAT-style resolver picking newest compatible.
  - vendoring: go mod can vendor (`go mod vendor`) for fully air-gapped builds; default mode fetches via GOPROXY.
- **Implementation:** Set `GOFLAGS=-mod=readonly` in CI so builds fail on go.mod drift. Route through a private proxy: `GOPROXY=https://proxy.internal,direct` and `GONOSUMDB`/`GOPRIVATE` for internal modules; keep `GOSUMDB=sum.golang.org` for public ones (PIPEDA/OSFI: transparency-log verification). Use `govulncheck` in CI — it does call-graph-aware vuln analysis and is the canonical Go scanner; gate on reachable vulns. `go mod vendor` for air-gapped regulated builds.

### Cargo

- **Kind:** pkg-mgr
- **Language:** Rust
- **What:** The official Rust build system and package manager. Resolves crates from crates.io, builds, tests, and publishes. Tightly integrated with rustc and the Rust release toolchain.
- **Lockfile:** Cargo.lock. Commit it for binaries/apps (reproducible builds); for libraries it is conventionally gitignored. CI uses `cargo build --locked` to fail on drift.
- **Speed:** Resolution is fast; the cost is rustc compilation. Use `sccache` or the built-in incremental cache, `cargo-chef` for Docker layer caching, and the cranelift backend for faster debug builds.
- **When to pick:** Always use for Rust — it is the toolchain. Use workspaces for multi-crate repos and cargo features for conditional compilation.
- **When NOT:** N/A as a manager choice. The decisions are around feature flags, workspace layout, and whether to vendor (`cargo vendor`) for air-gapped builds.
- **Trade-off vs:**
  - gomod: Cargo resolves to newest-compatible (SemVer) versions via a real solver; Go MVS picks minimum versions. Cargo features enable fine-grained conditional compilation Go lacks.
  - npm: Cargo compiles to native binaries with a strong type system and a single canonical registry; npm is interpreted JS with a sprawling registry.
  - maven: Both have lockfile-style reproducibility and central registries; Cargo's feature system and compile-time guarantees are stronger; Maven's enterprise/mirror tooling is more mature.
- **Implementation:** Use `cargo build --locked` and `cargo install --locked` in CI. Run `cargo audit` (RustSec advisory DB) and `cargo deny` to enforce license + advisory + source policy — `cargo deny` is the key OSFI/PIPEDA supply-chain gate (allowlist registries, ban yanked/unmaintained crates). For private crates set `[registries]` in .cargo/config.toml to an internal registry; `cargo vendor` for air-gapped builds.

### Apache Maven

- **Kind:** pkg-mgr
- **Language:** Java/JVM
- **What:** Declarative XML-based JVM build + dependency manager. pom.xml defines coordinates, dependencies, plugins, and lifecycle phases. Maven 4 (2026) modernizes the model (consumer/build POM split, improved reactor).
- **Lockfile:** No lockfile by default — reproducibility comes from pinned versions + a `<dependencyManagement>` BOM. Use the `maven-enforcer-plugin` (require pinned versions, ban SNAPSHOTs) and a repository manager to freeze artifacts. The dependency-lock plugin can emit a lockfile if required.
- **Speed:** Slower incremental story than Gradle (no first-class build cache historically; Maven 4 improves the reactor). Mitigate with `-T` parallel builds, a warm `~/.m2` cache, and `mvnd` (Maven Daemon).
- **When to pick:** Pick for conservative enterprise JVM shops, large multi-module reactors needing predictable convention-over-configuration, and ecosystems where every tool assumes Maven coordinates. Strong governance/mirror tooling for regulated orgs.
- **When NOT:** Avoid when you need flexible, fast, incremental builds with custom logic — Gradle's task graph and build cache outperform Maven for large incremental builds. Avoid if XML verbosity is a team pain.
- **Trade-off vs:**
  - gradle: Maven is declarative XML with strict conventions and easier auditability; Gradle is a programmable task graph with a far superior build cache and incremental builds, at the cost of complexity.
  - cargo: Maven has mature enterprise mirror/governance tooling (Nexus/Artifactory); Cargo has a cleaner single-registry model and compile-time guarantees.
  - bazel: Bazel gives hermetic, remote-cached, language-agnostic builds at huge scale; Maven is simpler to adopt for pure-JVM projects.
- **Implementation:** Enforce pinned versions and ban SNAPSHOTs via maven-enforcer-plugin (OSFI reproducibility). Route all artifacts through Nexus/Artifactory — never let runners hit Maven Central directly (PIPEDA egress control). Verify with `mvn dependency:purge-local-repository` clean builds. Run OWASP `dependency-check` or Snyk in CI and gate on high CVSS. Generate a CycloneDX SBOM via the cyclonedx-maven-plugin for regulated supply-chain attestation.

### Gradle

- **Kind:** pkg-mgr
- **Language:** Java/JVM/Kotlin/Android
- **What:** Programmable JVM/Android build tool with a directed task graph, a powerful local + remote build cache, and incremental task execution. Build scripts in Groovy or Kotlin DSL. Gradle 8.x/9 (2026) with the configuration cache stable.
- **Lockfile:** Dependency locking is opt-in: `dependencyLocking { lockAllConfigurations() }` writes gradle.lockfile. Commit it. CI uses `--write-locks` to update and a verification metadata file (`gradle/verification-metadata.xml`) for checksum + signature pinning.
- **Speed:** Fastest JVM build for incremental work thanks to the build cache (local + remote/Develocity) and configuration cache. Cold builds are slow; warm incremental builds can be seconds.
- **When to pick:** Pick for Android (mandatory), large multi-module JVM builds where incremental speed matters, and projects needing custom build logic. Pick when remote build caching across a team/CI fleet is a meaningful cost win.
- **When NOT:** Avoid when auditability and simplicity beat speed — a programmable build can hide logic that regulators dislike. Avoid if the team can't invest in learning the task/configuration model (steeper than Maven).
- **Trade-off vs:**
  - maven: Gradle is faster (incremental + build cache + configuration cache) and far more flexible; Maven is simpler, declarative, and easier to audit.
  - bazel: Bazel offers stronger hermeticity and language-agnostic remote caching at extreme scale; Gradle integrates more smoothly into the JVM/Android ecosystem.
  - sbt: Gradle has broader tooling/IDE support; sbt is more idiomatic for pure-Scala projects.
- **Implementation:** Enable dependency verification: `gradle/verification-metadata.xml` with SHA-256 + PGP — this is the key OSFI/PIPEDA control (blocks tampered/substituted jars). Enable dependency locking and commit gradle.lockfile. Route through Artifactory/Nexus; never hit repo1.maven.org directly. Use the configuration + remote build cache (Develocity) for CI speed. Run OWASP dependency-check/Snyk and gate; emit CycloneDX SBOM via the cyclonedx-gradle-plugin.

### Composer

- **Kind:** pkg-mgr
- **Language:** PHP
- **What:** The standard PHP dependency manager. Resolves from Packagist, manages autoloading (PSR-4), and locks the full dependency tree. Composer 2.x (2026) with a fast parallel solver.
- **Lockfile:** composer.lock (full resolved tree + content hash). Commit it. CI uses `composer install --no-dev --optimize-autoloader` (never `update` in CI). `composer validate --strict` checks consistency.
- **Speed:** Composer 2 parallelized downloads and rewrote the solver — large installs that took minutes on v1 now finish in seconds. Use `--prefer-dist` and a warm cache.
- **When to pick:** Always use for PHP — it is the de-facto standard. Use platform requirements and `--no-dev` for lean production installs.
- **When NOT:** N/A as a manager choice. Decisions are around private repositories (Satis/Private Packagist) and whether to commit the vendor directory.
- **Trade-off vs:**
  - npm: Composer locks the full tree and resolves PHP platform constraints (php version, extensions); npm's flat hoisting differs structurally.
  - bundler: Both lock the full graph deterministically; Composer also generates optimized PSR-4 autoloaders.
  - pip: Composer has a real lockfile and resolver out of the box; bare pip does not.
- **Implementation:** CI: `composer install --no-dev --optimize-autoloader --classmap-authoritative`. Pin PHP via `config.platform.php`. Route through Private Packagist or Satis (PIPEDA egress control). Run `composer audit` (built-in, checks the FriendsOfPHP/PHP Security Advisories DB) in CI and gate. Verify integrity via the content-hash in composer.lock; for OSFI, mirror Packagist and disable direct egress.

### Bundler

- **Kind:** pkg-mgr
- **Language:** Ruby
- **What:** The standard Ruby dependency manager. Resolves gems from rubygems.org per the Gemfile, locks the full graph, and ensures consistent gem versions across environments. Ships with modern Ruby.
- **Lockfile:** Gemfile.lock (full graph + platform list + BUNDLED WITH version). Commit it. CI uses `bundle install --deployment` (or `bundle config set frozen true`) which fails on any Gemfile.lock drift.
- **Speed:** Resolution can be slow for large dependency graphs, but `--jobs` parallel install and a warm gem cache mitigate it. Native-extension gems dominate cold-install time (compilation).
- **When to pick:** Always use for Ruby/Rails — it is the standard. Use groups (`:development`, `:test`, `:production`) to scope installs.
- **When NOT:** N/A as a manager choice. Decisions are around private gem sources (Gemfury/Artifactory) and deployment mode.
- **Trade-off vs:**
  - composer: Both deterministically lock the full graph; Bundler integrates tightly with Ruby/Rails groups and the gem ecosystem.
  - npm: Bundler locks platform-specific gems (native extensions per arch) in the lockfile; npm handles native via optionalDependencies differently.
  - pip: Bundler has a first-class lockfile and groups; bare pip lacks both.
- **Implementation:** CI: `bundle config set frozen true && bundle install --jobs 4`. Add all needed platforms with `bundle lock --add-platform` so CI/prod arch matches. Route through a private gem source/Artifactory (PIPEDA egress control). Run `bundler-audit` (checks the ruby-advisory-db) in CI and gate on high CVEs. For OSFI: mirror rubygems and verify gem checksums via the lockfile checksum section (Bundler 2.5+ supports gem checksums in Gemfile.lock).

### TypeScript Compiler (tsc)

- **Kind:** build-tool
- **Language:** TypeScript
- **What:** The reference TypeScript compiler. Type-checks and emits JavaScript + declaration files. The canonical authority on TS semantics; other tools strip types but do not type-check.
- **Lockfile:** N/A (compiler, not a package manager). Pin the typescript version in package.json + lockfile so type-check results are reproducible across the team and CI.
- **Speed:** Slowest emit path. The native Go port of tsc ('tsc-go' / TypeScript 7, in preview through 2025-2026) targets ~10x faster type-checking. Until GA, use `tsc -b` incremental builds and run type-check in parallel with bundling.
- **When to pick:** Use tsc for type-checking and for emitting .d.ts declaration files for published libraries — no other tool produces correct declarations. Use project references (`tsc -b`) for incremental monorepo type-checking.
- **When NOT:** Avoid tsc for transpiling app bundles in production builds — it is slow. Let esbuild/swc strip types for the bundle and run `tsc --noEmit` separately as the type-check gate.
- **Trade-off vs:**
  - esbuild: tsc type-checks and emits correct .d.ts; esbuild only strips types (no type errors caught) but is ~20-50x faster at producing JS.
  - swc: Same split as esbuild — swc transpiles fast without type-checking; tsc is the source of truth for types and declarations.
  - babel: tsc understands TS types natively and emits declarations; Babel's TS preset only strips types.
- **Implementation:** Split responsibilities: bundle with esbuild/swc/vite, gate types with `tsc --noEmit` (or `tsc -b --noEmit` for project refs) in CI. Publish libraries with `tsc` emitting declarations or use `tsup`/API-Extractor. Enable `strict: true`, `noUncheckedIndexedAccess`. For reproducibility, pin TS exactly (no caret) on libraries to keep emitted .d.ts stable.

### esbuild

- **Kind:** build-tool
- **Language:** JavaScript/TypeScript
- **What:** Go-based bundler and minifier. Extremely fast transform + bundle of JS/TS/JSX. Strips TS types (does not type-check). Underpins Vite's dev pre-bundling and many toolchains.
- **Lockfile:** N/A. Pin the esbuild version in the lockfile; esbuild ships platform-specific binaries, so ensure the CI arch matches (optionalDependencies install the right binary).
- **Speed:** Among the fastest bundlers — parallel Go, minimal abstraction. Bundles large apps in tens to low-hundreds of milliseconds. Speed is its entire reason to exist.
- **When to pick:** Pick for fast library bundling, CLI tools, lambda/edge function builds, and as the transform engine inside larger tools. Pick when build speed dominates and you don't need a rich plugin ecosystem.
- **When NOT:** Avoid as the production bundler for large apps needing advanced code-splitting, CSS handling, and a deep plugin ecosystem — use Vite (which wraps Rollup/Rolldown) for that. Never rely on it to catch type errors.
- **Trade-off vs:**
  - swc: esbuild is a full bundler+minifier; swc is primarily a transform/compile engine (used inside Next.js). esbuild bundles, swc is the Babel replacement.
  - webpack: esbuild is 20-100x faster but has a far smaller plugin ecosystem and less mature code-splitting/CSS handling.
  - vite: esbuild is lower-level and used by Vite for dev; Vite adds Rollup/Rolldown production bundling, HMR, and a plugin ecosystem on top.
- **Implementation:** Use for libraries via `esbuild --bundle --format=esm,cjs --minify --sourcemap` and a separate `tsc --noEmit`/declaration step. In Docker, ensure the correct platform binary installs (set `--platform` or install on the target arch). Pin the version for reproducible output. For supply chain, esbuild has a tiny dependency tree — a security advantage worth noting in OSFI reviews.

### SWC

- **Kind:** build-tool
- **Language:** JavaScript/TypeScript/Rust
- **What:** Rust-based JS/TS compiler — a fast drop-in replacement for Babel. Transforms/transpiles (strips types), supports plugins via Wasm. Powers Next.js compilation and Jest/Vitest transforms.
- **Lockfile:** N/A. Pin @swc/core in the lockfile; it ships platform-specific native binaries — verify CI arch matches.
- **Speed:** Very fast (Rust, parallel). Roughly 20x faster than Babel single-threaded and more with parallelism. Used by Next.js precisely to cut compile time.
- **When to pick:** Pick to replace Babel for fast transpilation (JSX, decorators, target downleveling) in frameworks and test runners. Pick when you need Babel-style AST transforms but 20x faster.
- **When NOT:** Avoid as a standalone production bundler — swc transforms, it is not a full bundler (Turbopack is the bundler built on swc). Never rely on it for type-checking.
- **Trade-off vs:**
  - esbuild: swc is a Babel-replacement transform engine with a plugin model; esbuild is a full bundler+minifier. Choose swc when you need AST plugins, esbuild when you need bundling.
  - babel: swc is 20x faster and largely API-compatible; Babel has the larger, older plugin ecosystem.
  - turbopack: swc is the transform layer; Turbopack is the Rust bundler (Next.js) built on top of swc.
- **Implementation:** Configure via .swcrc (targets, jsc.parser for ts/tsx, decorators). Use as the Jest/Vitest transform (@swc/jest) to speed tests. Pair with `tsc --noEmit` for types. Pin @swc/core exactly for reproducible output. Wasm plugins run sandboxed — a supply-chain plus for regulated builds.

### webpack

- **Kind:** build-tool
- **Language:** JavaScript/TypeScript
- **What:** The veteran JS module bundler. Mature, plugin-rich, handles any asset type via loaders. webpack 5 (current in 2026) added Module Federation for micro-frontends and persistent caching.
- **Lockfile:** N/A. Pin webpack + loaders/plugins in the lockfile; webpack's large plugin tree makes exact pinning important for reproducible bundles.
- **Speed:** Slowest mainstream bundler. Mitigate with persistent filesystem cache (`cache.type: filesystem`), `thread-loader`, swc-loader/esbuild-loader instead of babel-loader, and parallel minification.
- **When to pick:** Pick when you need Module Federation (runtime-shared micro-frontends), a legacy app already on webpack, or a niche loader/plugin only webpack supports. The most battle-tested, configurable bundler.
- **When NOT:** Avoid for new projects — Vite (Rollup/Rolldown) and Turbopack are dramatically faster for dev and simpler to configure. webpack's cold builds and HMR are slow by 2026 standards.
- **Trade-off vs:**
  - vite: webpack has the richest plugin/loader ecosystem and Module Federation maturity; Vite is far faster in dev (native ESM + esbuild) and simpler to configure.
  - esbuild: webpack is slower but has mature code-splitting, CSS, and a vast plugin ecosystem esbuild lacks.
  - turbopack: Turbopack is the Rust successor (incremental, much faster); webpack is the mature incumbent with the broadest ecosystem and Module Federation.
- **Implementation:** For new work, migrate to Vite/Turbopack unless Module Federation is required. If staying: use `swc-loader` (not babel-loader) and esbuild for minification to cut build time. Enable persistent cache. Large plugin tree is a supply-chain surface — run `npm audit`/Snyk and pin exact versions for OSFI reviews. Emit a bundle SBOM if shipping to regulated environments.

### Vite

- **Kind:** build-tool
- **Language:** JavaScript/TypeScript
- **What:** The 2026 default frontend build tool. Dev server serves native ESM with esbuild pre-bundling (instant HMR); production builds use Rollup (migrating to the Rust-based Rolldown bundler in Vite 6/7). Framework-agnostic.
- **Lockfile:** N/A. Pin vite + plugins in the lockfile. With Rolldown (Rust) the native binary is platform-specific — verify CI arch.
- **Speed:** Instant dev startup and HMR via native ESM + esbuild. Production builds historically used Rollup (slower than esbuild); Rolldown (Rust) closes that gap to bring esbuild-class production speed in 2026.
- **When to pick:** Default pick for nearly all new frontend apps (React, Vue, Svelte, Solid, vanilla) and libraries (`vite build --lib`). Pick for fast dev HMR, simple config, and a healthy plugin ecosystem.
- **When NOT:** Avoid only when you specifically need Next.js's integrated full-stack framework (use Next + Turbopack) or webpack Module Federation maturity. Avoid for pure backend builds (use esbuild/tsup).
- **Trade-off vs:**
  - webpack: Vite is far faster in dev and simpler to configure; webpack has the larger legacy plugin ecosystem and Module Federation maturity.
  - turbopack: Turbopack is tied to Next.js and uses persistent incremental caching; Vite is framework-agnostic and broadly adopted across the ecosystem.
  - esbuild: Vite uses esbuild for dev transforms but adds Rollup/Rolldown production bundling, HMR, SSR, and plugins esbuild alone lacks.
- **Implementation:** Use `vite build` for prod, `vite preview` to smoke-test. Pair with `vite-plugin-checker` or a CI `tsc --noEmit` gate (Vite does not type-check). Pin vite + plugins exactly for reproducible bundles. For OSFI/PIPEDA: audit the plugin dependency tree (Snyk/npm audit), prefer first-party plugins, and emit a CycloneDX SBOM of the build.

### Turbopack

- **Kind:** build-tool
- **Language:** JavaScript/TypeScript
- **What:** Rust-based incremental bundler from Vercel, built on swc, successor to webpack for Next.js. Function-level incremental computation caches everything and recomputes only what changed. Stable for Next.js dev and shipping for production builds in 2026.
- **Lockfile:** N/A. Pin the next version (Turbopack ships inside Next.js) in the lockfile; it carries platform-specific native binaries — verify CI arch.
- **Speed:** Fastest Next.js path — function-level incremental caching means warm rebuilds touch only changed units. Dev HMR and large-app cold builds are much faster than webpack-on-Next.
- **When to pick:** Pick when you are on Next.js — it is the integrated, fastest path for both dev and (now) production builds. Pick for very large Next.js apps where webpack cold builds and HMR became the bottleneck.
- **When NOT:** Avoid outside Next.js — Turbopack is not a general-purpose standalone bundler yet. For non-Next frontends use Vite; for libraries use tsup/esbuild.
- **Trade-off vs:**
  - webpack: Turbopack is dramatically faster via Rust + function-level incremental caching; webpack is the mature, general-purpose incumbent with Module Federation.
  - vite: Turbopack is Next.js-integrated with persistent incremental caching; Vite is framework-agnostic and more broadly adopted.
  - swc: swc is the transform engine Turbopack is built on; Turbopack is the full incremental bundler.
- **Implementation:** Enable via `next dev --turbopack` and `next build --turbopack`. Validate prod-build parity with webpack output during migration (some webpack loaders/plugins have no Turbopack equivalent yet). Pin Next.js exactly for reproducible builds. For OSFI/PIPEDA: it inherits Next's dependency tree — audit via Snyk/npm audit and emit an SBOM from `next build`.

## B.8 Invariants (hard platform rules)

| ID | Rule | Enforced by | If violated |
|---|---|---|---|
| I-P0-1 | No direct push to main ever | GitHub branch protection rules | Unreviewed code ships |
| I-P0-2 | CI uses OIDC tokens — no long-lived secrets stored in CI | GitHub OIDC + cloud IAM | Credential leak if repo compromised |
| I-P0-3 | Push scoped to exact repo + branch only | Registry policy + OIDC role binding | Any branch can push any image |
| I-P0-4 | Cluster rejects any image not signed by the pipeline | Kyverno ClusterPolicy | Unsigned images run in production |
| I-P0-5 | All dependency updates arrive as PRs — never manual edits | Renovate / Dependabot config | Drift accumulates silently |
| I-P1-1 | A commit containing a detected secret is blocked before it leaves the developer machine | gitleaks pre-commit hook | Secret reaches remote, requires rotation |
| I-P1-2 | Dockerfile linting (hadolint) and IaC checks (checkov) block commit on failure | pre-commit framework + hadolint + checkov | Bad Dockerfile or IaC ships to PR |
| I-P2-1 | Image is built to tarball only — no push to registry ever | Docker build with --output type=tar or no --push | Unscanned image in registry |
| I-P2-2 | All five scans complete before build step begins | CI job ordering — scans in parallel, build depends on all five | Build promotes code that fails a scan |
| I-P2-3 | Trivy scans the tarball — not a registry image | Trivy --input tarball.tar | A pushed image is scanned; PR gate is bypassed |
| I-P2-4 | At least one human approval required before merge | GitHub branch protection — required reviewers | No human review of code changes |
| I-P2-5 | SBOM is generated from the same tarball scanned by Trivy | SBOM tool points at the same tarball | SBOM and scan diverge — different artifact |
| I-P3-1 | Image is signed only after it is pushed and scanned — never before | CI job ordering — sign depends on container scan | Signature covers unscanned image |
| I-P3-2 | SBOM attestation is attached only after signing — never before | CI job ordering — attest depends on sign | Attestation has no verified image to anchor to |
| I-P3-3 | Trivy scans the registry image digest — not a tarball or tag | Trivy --image registry/repo@sha256:... | Scan and deployed image diverge |
| I-P3-4 | SLSA provenance is generated only after image is signed | CI job ordering — SLSA depends on sign | Provenance anchors to an unsigned image |
| I-P3-5 | Semantic version tag applied before SBOM and SLSA generation | CI job ordering — tag before attest and provenance | SBOM and SLSA reference untagged digest |
| I-P3-6 | All tests pass before DAST runs | CI job ordering — DAST depends on test success | DAST runs against a broken application |
| I-R-1 | No image is promoted from registry to any environment without cosign signature verification | cosign verify at registry promotion step | Unsigned image runs in environment |
| I-R-2 | SBOM is attached to the registry image before any promotion | OCI SBOM attach step before promotion gate | Environment has no SBOM for the running image |
| I-R-3 | SLSA provenance is attached to the registry image before any promotion | OCI SLSA attach step before promotion gate | Supply chain attestation missing in environment |
| I-PR-1 | Signature verified in the target environment before ArgoCD / Flux deploys | cosign verify step in promotion workflow | Deployment of unverified image |
| I-PR-2 | Deployment references image by digest — never by mutable tag | GitOps PR sets image: repo@sha256:... | Tag re-tag swaps running image silently |
| I-PR-3 | Promotion to the next environment requires explicit gate approval | Manual approval gate or policy gate in ArgoCD | Any environment auto-promotes on test pass |
| I-PR-4 | Tests must pass before gate opens — gate cannot open on partial test results | CI gate condition — all test steps green | Broken build promotes through environments |

## B.9 Integrations (per vertical) — net-new, pending review

| System | Category | Vertical | Auth | Gateway |
|---|---|---|---|---|
| Salesforce Financial Services Cloud | CRM | financial-services | oauth2 | apigee |
| Plaid | open-banking | financial-services | oauth2 | apigee |
| Interac e-Transfer | payments | financial-services | mtls | kong |
| Temenos / Finastra core banking | core-banking | financial-services | mtls | kong |
| Epic / Cerner EHR | EHR | healthcare-and-life-sciences | oauth2 | kong |
| Health Gateway (BC) | patient-portal | healthcare-and-life-sciences | oidc | kong |
| DICOM imaging (PACS) | imaging | healthcare-and-life-sciences | mtls | nginx-gateway |
| Sign-In Canada / GCKey | identity | government-and-public-sector | oidc | azure-apim |
| ServiceNow | ITSM | government-and-public-sector | oauth2 | azure-apim |
| Canada Post / GC Notify | messaging | government-and-public-sector | apikey | azure-apim |
| DND identity (PKI/CAC) | identity | defense-and-intelligence | mtls | kong |
| SIEM (Splunk/Elastic) | security | defense-and-intelligence | apikey | kong |
| OSIsoft PI / AVEVA | scada-historian | energy-and-environment | mtls | kong |
| Salesforce Energy & Utilities Cloud | CRM | energy-and-environment | oauth2 | apigee |
| Salesforce / HubSpot CRM | CRM | technology | oauth2 | aws-api-gateway |
| Stripe | payments | technology | apikey | aws-api-gateway |
| Segment / Snowflake | analytics | technology | oauth2 | aws-api-gateway |
| Amdocs / Netcracker BSS | billing | telecommunications | mtls | apigee |
| Salesforce Communications Cloud | CRM | telecommunications | oauth2 | apigee |
| Shopify | ecommerce | retail-and-commerce | oauth2 | aws-api-gateway |
| Stripe / Adyen | payments | retail-and-commerce | apikey | aws-api-gateway |
| SAP / Oracle ERP | ERP | retail-and-commerce | oauth2 | azure-apim |
| SAP S/4HANA ERP | ERP | manufacturing-and-industrial | oauth2 | azure-apim |
| MES (Siemens Opcenter) | mes | manufacturing-and-industrial | mtls | kong |
| Salesforce Marketing Cloud | CRM | media-and-entertainment | oauth2 | aws-api-gateway |
| Stripe / Recurly | payments | media-and-entertainment | apikey | aws-api-gateway |
| Canvas / Brightspace LMS | LMS | education | oauth2 | azure-apim |
| Ellucian / PeopleSoft SIS | SIS | education | oauth2 | azure-apim |
| Project44 / FourKites | visibility | transportation-and-logistics | apikey | aws-api-gateway |
| SAP TM / Oracle OTM | TMS | transportation-and-logistics | oauth2 | azure-apim |
| Procore | construction-mgmt | real-estate-and-construction | oauth2 | aws-api-gateway |
| Yardi / MRI | property-mgmt | real-estate-and-construction | oauth2 | azure-apim |
| John Deere Operations Center | farm-mgmt | agriculture | oauth2 | aws-api-gateway |
| Climate FieldView | precision-ag | agriculture | oauth2 | aws-api-gateway |
| Salesforce / Clio | CRM-practice | legal-and-professional-services | oauth2 | aws-api-gateway |
| DocuSign | e-signature | legal-and-professional-services | oauth2 | aws-api-gateway |
| Salesforce Nonprofit Cloud | CRM | non-profit-and-social | oauth2 | aws-api-gateway |
| Stripe / Blackbaud | donations | non-profit-and-social | apikey | aws-api-gateway |

## B.10 Version registry

| Item | Kind | Version | Last verified |
|---|---|---|---|
| ubuntu:24.04 | image | 24.04 LTS | 2026-05-28 |
| node:22-alpine | image | 22-alpine | 2026-05-28 |
| node:22-bookworm-slim | image | 22-bookworm-slim | 2026-05-28 |
| python:3.12-slim | image | 3.12-slim | 2026-05-28 |
| golang:1.24-alpine | image | 1.24-alpine | 2026-05-28 |
| gcr.io/distroless/static-debian12 | image | debian12 | 2026-05-28 |
| eclipse-temurin:21-jre-alpine | image | 21-jre-alpine | 2026-05-28 |
| gcr.io/distroless/java21-debian12 | image | java21-debian12 | 2026-05-28 |
| mcr.microsoft.com/dotnet/aspnet:8.0-alpine | image | 8.0-alpine | 2026-05-28 |
| nginx:alpine | image | alpine | 2026-05-28 |
| ruby:3.3-alpine | image | 3.3-alpine | 2026-05-28 |
| php:8.3-fpm-alpine | image | 8.3-fpm-alpine | 2026-05-28 |
| oven/bun:1.1-alpine | image | 1.1-alpine | 2026-05-28 |
| denoland/deno:2.3.3 | image | 2.3.3 | 2026-05-28 |
| swift:6.1-alpine | image | 6.1-alpine | 2026-05-28 |
| rust:1.87-alpine | image | 1.87-alpine | 2026-05-28 |
| ubi9/nodejs-22-minimal | image | ubi9 | 2026-05-28 |
| ubi9/python-311 | image | ubi9 | 2026-05-28 |
| ubi9/openjdk-21-runtime | image | ubi9 | 2026-05-28 |
| ubi9/php-83 | image | ubi9 | 2026-05-28 |
| ubi9/nginx-122 | image | ubi9 | 2026-05-28 |
| Next.js | framework | 16.2.6 | 2026-05-28 |
| Remix / React Router | framework | React Router 7 | 2026-05-28 |
| Nuxt | framework | 4.4 | 2026-05-28 |
| SvelteKit | framework | 2.57 | 2026-05-28 |
| Angular SSR | framework | 20 | 2026-05-28 |
| React | framework | 19 | 2026-05-28 |
| Vue | framework | 3.5 | 2026-05-28 |
| Angular | framework | 20 | 2026-05-28 |
| Solid.js | framework | 2.0 | 2026-05-28 |
| Astro | framework | 6.3 | 2026-05-28 |
| Gatsby | framework | 5.13 | 2026-05-28 |
| Hugo | framework | 0.161 | 2026-05-28 |
| Eleventy | framework | 3.0 | 2026-05-28 |
| Qwik | framework | 2.0 | 2026-05-28 |
| Fresh | framework | 2.3 | 2026-05-28 |
| Next.js Edge Runtime | framework | 16.2.6 | 2026-05-28 |
| Hono | framework | 4.7 | 2026-05-28 |
| React Native | framework | 0.79 | 2026-05-28 |
| Flutter | framework | 3.44 | 2026-05-28 |
| Express | framework | 5.0 | 2026-05-28 |
| Fastify | framework | 5.2 | 2026-05-28 |
| NestJS | framework | 11.0 | 2026-05-28 |
| Deno (runtime) | framework | 2.3 | 2026-05-28 |
| Elysia | framework | 1.2 | 2026-05-28 |
| Django | framework | 5.2 | 2026-05-28 |
| FastAPI | framework | 0.115 | 2026-05-28 |
| Flask | framework | 3.1 | 2026-05-28 |
| Starlette | framework | 0.41 | 2026-05-28 |
| Gin | framework | 1.10 | 2026-05-28 |
| Chi | framework | 5.2 | 2026-05-28 |
| Echo | framework | 4.12 | 2026-05-28 |
| Spring Boot | framework | 3.4 | 2026-05-28 |
| Quarkus | framework | 3.35 | 2026-05-28 |
| Ktor | framework | 3.5 | 2026-05-28 |
| Micronaut | framework | 5.0 | 2026-05-28 |
| ASP.NET Core | framework | 9.0 | 2026-05-28 |
| Axum | framework | 0.8 | 2026-05-28 |
| Actix-web | framework | 4.9 | 2026-05-28 |
| Phoenix | framework | 1.7 | 2026-05-28 |
