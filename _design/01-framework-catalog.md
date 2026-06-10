# Framework Catalog Schema

**What this covers:** Column definitions, category list, data rules, and UX structure for `01-framework-catalog.html`.
**When to read:** Before adding a row, adding a column, or changing the HTML structure.

**Paired file:** `01-framework-catalog.html` (built from this schema).
**Data verified:** 2026-05-26.

---

## Categories — 27 total

### Frontend Web — cats 1–8

| # | Category |
|---|---|
| 1 | Frontend — SSR / Hybrid |
| 2 | Frontend — CSR / SPA |
| 3 | Frontend — SSG |
| 4 | Frontend — Islands Architecture |
| 5 | Frontend — Resumability |
| 6 | Frontend — Edge Rendering |
| 7 | Frontend — Streaming SSR |
| 8 | Frontend — Micro-frontends |

### Frontend Mobile — cats 9–13

| # | Category |
|---|---|
| 9 | Mobile — Cross-platform JS |
| 10 | Mobile — Cross-platform non-JS |
| 11 | Mobile — Native iOS |
| 12 | Mobile — Native Android |
| 13 | Mobile — PWA |

### Backend — cats 14–27

| # | Category |
|---|---|
| 14 | Backend — Node.js / Deno / Bun |
| 15 | Backend — Python |
| 16 | Backend — Go |
| 17 | Backend — Java |
| 18 | Backend — Kotlin |
| 19 | Backend — .NET / C# |
| 20 | Backend — Rust |
| 21 | Backend — Elixir |
| 22 | Backend — Ruby |
| 23 | Backend — PHP |
| 24 | Backend — Swift |
| 25 | Backend — Scala |
| 26 | Backend — Clojure |
| 27 | Backend — C++ |

---

## Column Structure — 22 per category

Each category has exactly 22 columns: 18 shared + 4 category-specific.

### Shared columns — positions 1–19 (all 27 categories)

| Pos | Column | What it captures |
|---|---|---|
| 1 | Name | Framework / runtime name — linked to official site |
| 2 | Version | Current stable version — linked to GitHub releases page |
| 3 | Language | Primary language(s) |
| 4 | License | MIT / Apache / BSL / Commercial |
| 5 | Maintained by | Company / CNCF / community |
| 6 | Maturity | Production / Beta / Legacy badge |
| 7 | Concurrency | How parallel work is handled |
| 8 | Memory | GC / manual / borrow checker / ARC |
| 9 | **Perf** | TTFB ms (frontend) / fps (mobile) / p99 ms (backend) |
| 10 | **Throughput / Bundle** | gzip kb (frontend/mobile) / req/s at TechEmpower R22 (backend) |
| 11 | Security posture | Known risks + security model |
| 12 | Scaling | Vertical / horizontal / both |
| 13 | Ecosystem | Package count or community signal |
| 14 | Package managers | All valid package managers for this entry |
| 15 | Build tool | Bundler, compiler, or build system |
| 16 | Registry | Artifact source (npmjs.com / crates.io / etc.) |
| 17 | When to use | Specific condition — no vague statements |
| 18 | When NOT to use | Specific condition — names the alternative |
| 19 | Tradeoff | vs closest real alternative — one line |

**Column 9 + 10 are an adjacent pair.**

Column 9 = how fast the first response arrives.
Column 10 = how much data travels after that first response.

The two must be read together to understand user-perceived speed.

### Frontend Web category-specific — positions 20–22 (cats 1–8)

| Pos | Column | What it captures |
|---|---|---|
| 20 | Rendering modes | SSR / CSR / SSG / ISR / Islands / Edge / Streaming |
| 21 | Hydration | Full / Partial / Resumable / None |
| 22 | Runtime target | Browser / Node / Edge — where the output runs |

### Mobile category-specific — positions 20–22

**Cats 9–12 (native and cross-platform non-PWA):**

| Pos | Column | What it captures |
|---|---|---|
| 20 | Rendering modes | Native / JS bridge / compiled / web view |
| 21 | State init | How app state is initialized before first frame |
| 22 | Runtime target | iOS / Android / both |

**Cat 13 (PWA) — uses Hydration, not State init:**

| Pos | Column | What it captures |
|---|---|---|
| 20 | Rendering modes | Depends on base framework used |
| 21 | Hydration | Base framework's hydration model |
| 22 | Runtime target | Browser + Service Worker |

Why: cats 9–12 have no DOM hydration concept — state is initialized once at native app launch, not after server HTML is painted.

PWA (cat 13) wraps a web framework. That base framework has a hydration model. "State init" would be inaccurate there.

### Backend category-specific — positions 20–22 (cats 14–27)

| Pos | Column | What it captures |
|---|---|---|
| 20 | Cold start | ms to first request — critical for serverless and containers |
| 21 | Container size | Typical Alpine image size in MB |
| 22 | Thread model | Single-thread / multi-thread / async / actor |

---

## Performance metric rules

### Frontend (cols 9 + 10)

Col 9 — Perf:
- Metric: TTFB ms (SSR/SSG) or TTI ms (CSR)
- TTFB = ms from request to first HTML byte, at p99
- TTI = ms until page is interactive, at p99
- Source: web.dev/articles/ttfb

Col 10 — Bundle size:
- Metric: gzipped JS on first load, in kb
- Every 100 kb extra ≈ +1s TTI on 4G mid-range device
- Source: bundlephobia.com

### Mobile (cols 9 + 10)

Col 9 — Perf:
- Metric: fps at 60Hz scroll or animation
- 60 fps = smooth. Below 50 fps = visible jank.

Col 10 — Bundle:
- App install size in MB or OTA update size in kb

### Backend (cols 9 + 10)

Col 9 — Perf:
- Metric: p99 latency in ms under sustained load
- p99 = worst 1-in-100 user's response time

Col 10 — Throughput:
- Metric: req/s at TechEmpower R22 JSON test
- Source: techempower.com/benchmarks/#section=data-r22&hw=ph&test=json
- If a framework is not in R22: state the source explicitly

---

## Data rules

Every row must follow these rules.
A row that breaks a rule is incomplete — do not merge it.

**Version:**
Link to the GitHub releases page.
Format: `<a href="github.com/.../releases">X.Y.Z</a>`.

**When to use / When NOT to use:**
Both must name a specific condition.
"When NOT to use" must name the alternative framework.

**Tradeoff:**
Always vs the closest real alternative.
Format: `vs [Name]: [what you gain], [what you give up]`.

**Perf / Throughput:**
Must state the source.
No invented numbers.
If no benchmark exists: state "no public benchmark".

**Maturity badge:**
Production = battle-tested at scale, API stable.
Beta = API may break between releases.
Legacy = security patches only, no new features.

---

## Rows added after initial build

### Elysia (cat 14 — Backend Node.js / Deno / Bun)

Added: 2026-05-26.

| Field | Value |
|---|---|
| Name | Elysia |
| Version | 1.2 |
| Language | TypeScript |
| License | MIT |
| Maintained by | SaltyAom / Community |
| Maturity | Production |
| Concurrency | Single-thread async — Bun runtime only |
| Memory | GC — JavaScriptCore (Bun). Near-zero heap |
| Perf (p99) | ~1ms |
| Throughput | ~120k req/s (TechEmpower R22 JSON — Bun) |
| Security posture | End-to-end type safety via Eden treaty |
| Scaling | Horizontal |
| Ecosystem | 30k+ GitHub stars |
| Package manager | bun |
| Build tool | Bun (no bundler needed) |
| Registry | npmjs.com / jsr.io |
| When to use | Maximum Bun throughput, end-to-end TypeScript type safety |
| When NOT | Non-Bun runtime required → Hono |
| Tradeoff | vs Hono: Bun-only, higher throughput, end-to-end type safety |
| Cold start | ~50ms |
| Container size | ~100 MB (oven-sh/bun:alpine) |
| Thread model | Single-thread async (Bun only — not Node/Deno compatible) |

---

## Version history — updated 2026-05-26

All versions below were verified against live GitHub releases pages.

| Framework | Category | Previous | Updated | Release page |
|---|---|---|---|---|
| Solid.js | Cat 2 — CSR/SPA | 1.9 | 2.0 | github.com/solidjs/solid/releases |
| Ktor | Cat 18 — Kotlin | 3.0.x | 3.5.0 | github.com/ktorio/ktor/releases |
| Quarkus | Cat 17 — Java | 3.x | 3.35.4 | github.com/quarkusio/quarkus/releases |
| Micronaut | Cat 17 — Java | 4.7 | 5.0.0 | github.com/micronaut-projects/micronaut-core/releases |
| Vapor | Cat 24 — Swift | 4.x | 4.121.4 | github.com/vapor/vapor/releases |
| Drogon | Cat 27 — C++ | 1.9.x | 1.9.13 | github.com/drogonframework/drogon/releases |
| Crow | Cat 27 — C++ | 1.2.x | 1.3.2 | github.com/CrowCpp/Crow/releases |

**Micronaut note:** Version jumped from 4.7 to 5.0.0 — major release.

---

## Educational content structure

The HTML has three section legends — one per section group.
Each legend follows the same pattern.

**Pattern:**

```
<div class="section-legend">
  Always-visible content (section overview, col 9 + 10 definitions)
  <details> (collapsed by default)
    <summary>Column definitions — [key concepts]</summary>
    Expanded educational content
  </details>
</div>
```

**Three section legends:**

| Legend | Covers | Always visible |
|---|---|---|
| Frontend Web (before cat 1) | Perf (TTFB/TTI), Bundle size, col 9+10 pair | Col 9 + 10 definitions |
| Mobile (before cat 9) | fps, State init, native rendering | Col 9 + 10 definitions |
| Backend (before cat 14) | p99 ms, TechEmpower R22, thread models | Col 9 + 10 definitions |

**Arrow behavior:**

Collapsed: `▶` before summary label.
Expanded: `▼` before summary label.
Implemented via CSS `::before` pseudo-element — no JavaScript.

---

## Tooltip columns — 14 with title attributes

Columns with a `title` attribute show a blue dotted underline.
CSS rule: `th[title]{cursor:help;border-bottom:2px dotted #3b82f6;color:inherit}`.

The 14 tooltip columns (applies across all categories where present):

| Column | Tooltip explains |
|---|---|
| License | MIT / Apache / BSD-3 conditions |
| Maintained by | Corporate-backed vs community implications |
| Maturity | What Production / Beta / Legacy means |
| Concurrency | Event loop / goroutines / thread-per-request |
| Memory | GC pause models — V8 / ARC / borrow checker |
| Perf | TTFB / TTI / p99 definition + source |
| Bundle size | 100kb extra = +1s TTI rule |
| Security posture | "No built-in auth" clarification |
| Scaling | Horizontal vs vertical ceiling |
| Ecosystem | Downloads and stars as proxy signals |
| Build tool | Webpack / Vite / Turbopack / esbuild tradeoffs |
| Tradeoff | Format requirement: vs real alternative only |
| Rendering modes | SSR / CSR / SSG / ISR / Edge / Streaming |
| Hydration | Full / Partial / Resumable cost model |

---

## UX and accessibility additions

### Skip link

Present: `<a href="#main-content" class="skip-link">Skip to content</a>`.
Hidden at -48px by default. Appears on keyboard focus (Tab key).
Target: `<main id="main-content">`.

### Back to top

Present in nav: link text "Back to top", scrolls to page top.
Styled with `.nav-top` class.

### Dark mode

Implemented via `@media(prefers-color-scheme:dark)`.
Overrides CSS variables: `--bg`, `--bg2`, `--text`, `--text-dim`, `--text-head`, `--border`, `--blue`.
Section legend, badge, and legacy colors all have dark variants.

### Print CSS

Implemented via `@media print`.
Hides: `.skip-link`, `nav`.
Flattens section-legend background for print.
Sets `color-adjust: exact` so badge colors survive printing.

---

## HTML file stats — as of 2026-05-26

| Metric | Value |
|---|---|
| Categories | 27 |
| Total `<tr>` rows | 101 (includes header rows) |
| Data rows | 74 (73 original + Elysia) |
| Columns per category | 22 |
| Tooltip columns | 14 |
| Section legends | 3 |
| Details/summary blocks | 3 |
| Dark mode | ✅ |
| Print CSS | ✅ |
| Skip link | ✅ |
| Back to top | ✅ |
| Font used | Inter (system fallback), JetBrains Mono removed |
