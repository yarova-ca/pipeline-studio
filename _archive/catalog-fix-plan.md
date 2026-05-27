# Framework Catalog — Fix Plan (Final)
**What this covers:** Every fix needed to bring design-docs.html from 3/10 to 10/10.
**When to read:** Before approving work to begin. After work completes, run the verification checklist.
**File being fixed:** `design-docs.html` at repo root.
**Target:** All data accurate as of 2026-05-26.

---

## Current state: 3/10

| Dimension | Now | Target |
|---|---|---|
| Structure — one table per category | 9/10 | 10/10 |
| Column order — perf cols adjacent | 0/10 | 10/10 |
| Column completeness — 22 cols per row | 8/10 | 10/10 |
| Version accuracy | 4/10 | 10/10 |
| Data uniqueness — no copy-paste cols | 2/10 | 10/10 |
| Perf data accuracy + sourced | 2/10 | 10/10 |
| Schema consistency — headers match | 1/10 | 10/10 |
| Educational content — tooltips + legends | 0/10 | 10/10 |
| **Overall** | **3/10** | **10/10** |

---

## What the final HTML looks like to a reader

A reader opens design-docs.html in a browser.
No server. No build step. Single file.

**They see:**

Left sidebar: links to all 27 categories grouped as Frontend / Mobile / Backend.

Top of Frontend section: a legend block explaining cols 9 + 10 together.

Top of Mobile section: a legend block explaining cols 9 + 10 together.

Top of Backend section: a legend block explaining cols 9 + 10 together.

Each legend has a `<details>` block they can click to expand.

The expanded block explains: Concurrency models, GC/memory models, Rendering modes, Hydration types.

Each category: one table, 22 columns, scrollable horizontally.

Each column header: hover shows a tooltip with the column definition + source link.

Each performance number in a cell: followed by a source link in parentheses.

Each version number in a cell: a hyperlink to that framework's GitHub releases page.

Each framework name in a cell: a hyperlink to the framework's official website.

Data verified date: shown below each category heading.

---

## Fix 1 — Column content and order (CRITICAL)

**Problem A — same data in two columns (backend only):**

Col 9 header: `Perf (p99 req/s)` — shows req/s.
Col 19 header: `Throughput (req/s p99)` — shows the same req/s.
Same number. Different column name. Zero extra information.

**Problem B — two related columns are 10 cols apart:**

Frontend: col 9 = Perf (TTFB/TTI). Col 21 = Bundle size.
Backend: col 9 = Perf (req/s). Col 19 = Throughput (req/s).
Between them: 9 unrelated columns.
A reader cannot read two columns together if they are not adjacent.

**Fix A — redefine each column to carry a different metric:**

| Col | Frontend | Mobile | Backend |
|---|---|---|---|
| 9 | Perf — TTFB or TTI (ms) | Perf — sustained fps | Perf — p99 latency (ms) |
| 10 | Bundle size (gzip, kb) | Bundle size (app binary, MB) | Throughput — peak req/s |

Why these pairs:

Frontend: TTFB tells how fast the server responds. Bundle size tells how fast the browser becomes interactive.
A fast TTFB + large bundle = page appears, then freezes for 3–5s while JS loads.
A fast TTFB + small bundle = fast all the way through. Both needed together.

Backend: p99 latency tells what the worst 1-in-100 users experience. Peak req/s tells how many users the server handles.
High throughput + high latency = handles volume but users wait.
Low throughput + low latency = fast responses but cannot scale to traffic.
Both needed together.

Mobile: frame rate tells UI smoothness. Bundle size tells install time and storage impact.
High fps + large bundle = smooth but slow to download.
Low fps + small bundle = fast install, poor UX.

**Fix B — move col 10 to be immediately after col 9:**

**Final column order — all three category types:**

| Col | Frontend (cat 1–8) | Mobile (cat 9–13) | Backend (cat 14–27) |
|---|---|---|---|
| 1 | Name | Name | Name |
| 2 | Version | Version | Version |
| 3 | Language | Language | Language |
| 4 | License | License | License |
| 5 | Maintained by | Maintained by | Maintained by |
| 6 | Maturity | Maturity | Maturity |
| 7 | Concurrency | Concurrency | Concurrency |
| 8 | Memory | Memory | Memory |
| **9** | **Perf — TTFB/TTI** | **Perf — frame rate** | **Perf — p99 latency** |
| **10** | **Bundle size (gzip)** | **Bundle size** | **Throughput — peak req/s** |
| 11 | Security posture | Security posture | Security posture |
| 12 | Scaling | Scaling | Scaling |
| 13 | Ecosystem | Ecosystem | Ecosystem |
| 14 | Pkg mgr | Pkg mgr | Pkg mgr |
| 15 | Build tool | Build tool | Build tool |
| 16 | Registry | Registry | Registry |
| 17 | When to use | When to use | When to use |
| 18 | When NOT | When NOT | When NOT |
| 19 | Tradeoff | Tradeoff | Tradeoff |
| 20 | Rendering modes | Rendering / State init | Cold start |
| 21 | Hydration | State init | Container size (Alpine) |
| 22 | Runtime target | Runtime target | Thread model |

**Fix C — source link in every performance cell:**

Every perf number must carry its source inline.
Format in the cell: `~8ms p99 (TechEmpower R22 JSON)`
Where TechEmpower R22 JSON is a hyperlink to techempower.com/benchmarks/#section=data-r22&hw=ph&test=json

No number in the HTML without a source. A number without a source is an opinion.

---

## Fix 2 — Perf column header name inconsistent (CRITICAL)

**Problem:**

5 different header names exist for the same shared column (col 9) across 27 categories.

| Header name in use | Categories |
|---|---|
| `Perf (p99 TTFB)` | Cat 1, 6 |
| `Perf (TTFB)` | Cat 3, 4, 7 |
| `Perf (TTI)` | Cat 2, 5 |
| `Perf` | Cat 9–13 mobile |
| `Perf (p99 req/s)` | Cat 14–27 backend |

A reader comparing Cat 1 TTFB with Cat 14 req/s cannot tell these are different metrics.

**Fix:**

One header name for col 9 across all 27 categories: `Perf`.

The metric type goes inside the cell value, not the header.

| Category type | Cell value format |
|---|---|
| SSR / Edge / Streaming | `TTFB p99: ~Xms (source link)` |
| CSR / Resumability | `TTI p99: ~Xs on 4G mid-range (source link)` |
| SSG | `TTFB: <10ms CDN static (source link)` |
| Mobile native / cross-platform | `~Xfps sustained (source link)` |
| Backend | `p99 latency: ~Xms at 256 conn (TechEmpower R22 JSON link)` |

The column header tooltip explains that each category uses the metric most relevant to that category type.

---

## Fix 3 — Outdated versions (HIGH)

**Problem:**

Multiple frameworks have versions that were outdated before this file was written.
As of 2026-05-26, more have released newer stable versions.

**Fix — verify and update every framework listed below:**

| Framework | Version in file | Where to verify |
|---|---|---|
| Astro | 4.16 | astro.build/blog |
| Angular / Angular SSR | 18 | angular.io/guide/releases |
| Qwik | 1.9 | qwik.dev/docs/releases |
| Rails | 7.2 | rubyonrails.org |
| React Native | 0.75 | reactnative.dev/blog |
| Django | 5.1 | djangoproject.com/download |
| Spring Boot | 3.3 | spring.io/projects/spring-boot#learn |
| Laravel | 11 | laravel.com/docs |
| Expo | 51 | expo.dev/changelog |
| Kotlin Multiplatform | 2.0 | kotlinlang.org/docs/releases.html |
| Deno | 2.1 | deno.com/blog |
| Flutter | 3.24 | flutter.dev/docs/release/release-notes |
| Next.js | 15 | nextjs.org/blog |
| Nuxt | 3.13 | nuxt.com/blog |
| SvelteKit | 2.7 | kit.svelte.dev/docs/changelog |
| Ktor | 3.0 | ktor.io/changelog |
| Quarkus | 3.16 | quarkus.io/blog |
| Micronaut | 4.6 | micronaut.io/blog |
| Solid.js | 1.9 | github.com/solidjs/solid/releases |
| Fastify | 5.1 | github.com/fastify/fastify/releases |
| Hono | 4.6 | github.com/honojs/hono/releases |

**Rule for all frameworks not listed above:**
Check the GitHub releases page before skipping.
Update if a newer stable version exists as of 2026-05-26.
Do NOT use beta, RC, or pre-release versions.

**In the HTML — every version number is a hyperlink:**
Format: `<a href="github.com/[owner]/[repo]/releases/tag/v[version]">15</a>`
Why: a reader can click the version to verify it is current.

---

## Fix 4 — TechEmpower numbers not qualified by test type (MEDIUM)

**Problem:**

TechEmpower R22 has 6 test types.
ASP.NET Core results per test type:

| Test type | ASP.NET Core R22 result |
|---|---|
| Plaintext | ~7M req/s |
| JSON serialization | ~500k req/s |
| Single DB query | ~200k req/s |
| Fortune (HTML + DB) | ~120k req/s |
| Multi-query | ~50k req/s |
| Updates | ~30k req/s |

The file currently mixes test types without labelling them.
Comparing Express 30k vs ASP.NET 500k is only valid if both used the same test.

**Fix:**

All TechEmpower numbers use the JSON serialization test as the standard.

Why JSON: it is the most representative of a real API response.
Why not plaintext: plaintext bypasses serialization — unrealistic for real apps.

Every TechEmpower cell value format:
`~Xk req/s (TechEmpower R22 — JSON test)`
Where "TechEmpower R22 — JSON test" is a hyperlink.

Frameworks not in TechEmpower R22 state:
`~Xk req/s (wrk benchmark, 4-core, warm)`

---

## Fix 5 — Concurrency column is copy-paste (MEDIUM)

**Problem:**

15 JS/TS frameworks all say `Single-thread async (V8 event loop)`.
This describes the Node.js runtime — not the framework's concurrency model.
Next.js App Router, Remix, and SvelteKit handle concurrent requests differently despite running on the same runtime.

**Fix — show framework-level concurrency pattern:**

| Framework | Corrected value |
|---|---|
| Next.js App Router | Concurrent rendering via React Suspense + parallel RSC data fetch |
| Remix | Sequential loader per route — defer() for non-blocking secondary data |
| SvelteKit | Sequential load() per route — ReadableStream for streaming |
| React (CSR) | Single render cycle — Concurrent Mode via useTransition / Suspense |
| Angular / Angular SSR | Zone.js change detection — Signals (v16+) for fine-grained updates |
| Svelte / SvelteKit | Compiler-based reactivity — no virtual DOM, no diffing |
| Express | Single-thread event loop — middleware chain sequential per request |
| Fastify | Single-thread event loop — schema-validated async hook pipeline |
| NestJS | DI-scoped async handlers — request pipeline via guards + interceptors |
| Hono | Multi-runtime async — same handler runs on Node / Deno / Bun / CF Workers |
| Deno | Single-thread async + Workers API for true parallelism |
| Gin / Echo / Chi | Goroutine per request — M:N scheduler across all CPU cores |
| Fiber | Goroutine per request — fasthttp (bypasses net/http, not goroutine-per-request) |
| Spring MVC | Thread-per-request — thread pool default 200, blocked on I/O |
| Spring WebFlux | Reactor event loop — non-blocking reactive streams (Project Reactor) |
| Quarkus | Vert.x reactive event loop + worker thread pool for blocking ops |
| Ktor | Coroutine per request — Netty event loop underneath |
| Phoenix | Actor model — one BEAM process per connection, millions concurrent |
| Axum / Actix-web | Tokio async executor — multi-thread, work-stealing scheduler |
| ASP.NET Core | Async/await on Kestrel thread pool — I/O threads managed by CLR |
| Rails / Sinatra | Thread-per-request — GIL (Global Interpreter Lock) limits CPU parallelism |
| Laravel / Symfony / Slim | Process-per-request (PHP-FPM) — no shared memory between requests |
| Play Framework | Akka actor system + Netty event loop |
| http4s | Cats Effect fiber scheduler — purely functional green threads |
| Ring / Pedestal | Thread pool (Jetty) or async (http-kit) |
| Vapor / Hummingbird | Swift structured concurrency + SwiftNIO event loop |
| Drogon | Coroutines + multi-thread event loop (libuv-style) |
| Crow | Multi-thread async (Boost.Asio thread pool) |

---

## Fix 6 — Memory column is copy-paste (MEDIUM)

**Problem:**

~15 JS/TS frameworks all say `GC — V8`.
This describes the runtime GC — not what the framework itself allocates.

**Fix — show GC model + what the framework allocates:**

| Framework | Corrected value |
|---|---|
| Next.js SSR | GC — V8. RSC payload + per-request state in server heap |
| Remix SSR | GC — V8. Loader state per request — released after response |
| React (CSR) | GC — V8. Virtual DOM fiber tree in browser heap |
| Svelte (CSR) | GC — V8. No virtual DOM — compiled signals, lower heap use |
| Solid.js | GC — V8. Fine-grained reactive graph — no virtual DOM |
| Angular | GC — V8. Zone.js patch tree + component tree in heap |
| Express | GC — V8. Minimal — middleware chain, no framework heap overhead |
| Fastify | GC — V8. Schema cache (~5MB at boot). Request objects pooled |
| NestJS | GC — V8. DI container + module graph held at boot (~30MB) |
| Hono | GC — V8. Near-zero heap — no class instantiation |
| Deno | GC — V8. Permissions state + module cache |
| FastAPI | GC — CPython refcount + cycle collector. Pydantic model cache at boot |
| Django | GC — CPython. ORM + settings + URL resolver held in heap at boot |
| Flask | GC — CPython. Near-zero overhead — explicit per-request context |
| Go (Gin/Echo/Fiber/Chi) | GC — Go tri-color concurrent. Static binary — ~10MB RSS per 1k goroutines |
| Spring Boot MVC | GC — JVM G1GC. IoC container ~200MB heap at boot |
| Spring WebFlux | GC — JVM ZGC. Netty byte buffers pooled. ~180MB heap at boot |
| Quarkus (native) | No GC — GraalVM native image. Zero heap startup |
| Micronaut (native) | No GC — GraalVM native image. Compile-time DI, no reflection heap |
| Ktor | GC — JVM G1GC. Coroutine context objects per request |
| Phoenix | GC — BEAM per-process. Each BEAM process has isolated heap — no stop-the-world |
| Rails / Sinatra | GC — MRI generational. Per-request object allocation reset via GC |
| Laravel | GC — PHP refcount + cycle. Per-request memory fully reset by FPM |
| Axum | Borrow checker — no GC. Zero heap allocation overhead. ~5MB RSS idle |
| Actix-web | Borrow checker — no GC. Actix actor heap per actor instance |
| Vapor / Hummingbird | ARC (Automatic Reference Counting). No GC pauses. ~80MB RSS idle |
| Play / http4s | GC — JVM G1GC. Akka actor heap (Play) / Cats Effect fiber stack (http4s) |
| Drogon / Crow | Manual — smart pointers (shared_ptr / unique_ptr). No GC |

---

## Fix 7 — Mobile Hydration column semantically wrong (MEDIUM)

**Problem:**

Hydration (reattaching JavaScript to server-rendered HTML) is a web concept.
Native iOS, Android, Flutter, and React Native apps have no HTML.
Showing `N/A` in a column called "Hydration" misleads the reader.

The reader sees "Hydration: N/A" and infers hydration is a concept that just does not apply here.
The correct reading: hydration is a concept that does not exist in this context at all.
These are different meanings. Wrong column name causes the wrong interpretation.

**Fix — rename the column per category type:**

| Category | Column 21 name | What to show |
|---|---|---|
| Cat 9 — Cross-platform JS | `State init` | How app state is initialized at launch |
| Cat 10 — Cross-platform non-JS | `State init` | How platform state initializes before first frame |
| Cat 11 — Native iOS | `State init` | How UIKit / SwiftUI state initializes in App struct |
| Cat 12 — Native Android | `State init` | How Compose state initializes in Activity.onCreate() |
| Cat 13 — PWA | `Hydration` | Keep. PWA is a web technology — hydration applies |

**Example values after fix:**

| Framework | State init value |
|---|---|
| React Native | Redux / Zustand / Jotai initialized in App.tsx before first render |
| Expo | Same as React Native + Expo managed state via expo-modules |
| Flutter | WidgetsFlutterBinding.ensureInitialized() before runApp() |
| .NET MAUI | App.xaml.cs OnStart() — dependency injection container |
| Swift / SwiftUI | @StateObject + @AppStorage initialized at App struct launch |
| Kotlin + Compose | ViewModel + StateFlow initialized in Activity.onCreate() |

---

## Fix 8 — Frontend TTFB numbers have no cited source (LOW)

**Problem:**

TTFB values (80ms, 60ms, 50ms, 90ms) have no source.
They vary by: server hardware, geographic location, cold vs warm instance, app complexity.
A raw number without context is misleading — it implies precision that does not exist.

**Fix — replace raw numbers with relative format:**

Format: `warm origin: ~Xms / edge: ~Xms (web.dev/articles/ttfb definition)`

When the framework's own documentation states a benchmark: link directly to it.
When no official benchmark exists: state `no published benchmark — measured warm on [hardware class]`.

---

## Fix 9 — No data freshness indicator (LOW)

**Problem:**

Version numbers become stale the moment they are written.
No field tells the reader when the data was last verified.
A reader in 2027 sees "Astro 5.0" and cannot tell if that is current or 18 months old.

**Fix — add data verified date per category:**

Below each category `<h2>` heading, add:
`Data verified: 2026-05-26 · Check releases before adopting`

---

## Educational content plan — all columns

**Three visibility mechanisms — all work without JavaScript:**

| Mechanism | Triggered by | Best for |
|---|---|---|
| `title` on `<th>` | Hover over column header | 1–2 line definition |
| Section legend (always visible) | No interaction — always shown | "Read cols 9+10 together" insight |
| `<details>` under legend | Click to expand | Multi-line concept explanation tables |

**All 22 columns — decision per column:**

| Col | Column | Tooltip | Legend | Source link |
|---|---|---|---|---|
| 1 | Name | ❌ | ❌ | Official website — linked from name |
| 2 | Version | ❌ | ❌ | GitHub releases — linked from version number |
| 3 | Language | ❌ | ❌ | ❌ |
| 4 | License | ✅ | ❌ | choosealicense.com/licenses/[name] |
| 5 | Maintained by | ✅ | ❌ | ❌ |
| 6 | Maturity | ✅ | ❌ | ❌ |
| 7 | Concurrency | ✅ | ✅ `<details>` | ❌ |
| 8 | Memory | ✅ | ✅ `<details>` | ❌ |
| 9 | Perf | ✅ | ✅ always visible | web.dev/articles/ttfb · TechEmpower R22 |
| 10 | Bundle size / Throughput | ✅ | ✅ always visible | bundlephobia.com · TechEmpower R22 |
| 11 | Security posture | ✅ | ❌ | ❌ |
| 12 | Scaling | ✅ | ❌ | ❌ |
| 13 | Ecosystem | ✅ | ❌ | npmtrends.com · github.com |
| 14 | Pkg mgr | ❌ | ❌ | ❌ |
| 15 | Build tool | ✅ | ❌ | ❌ |
| 16 | Registry | ❌ | ❌ | ❌ |
| 17 | When to use | ❌ | ❌ | ❌ |
| 18 | When NOT | ❌ | ❌ | ❌ |
| 19 | Tradeoff | ✅ | ❌ | ❌ |
| 20 | Rendering / Cold start / State init | ✅ | ✅ `<details>` | web.dev/articles/rendering-on-the-web |
| 21 | Hydration / Container size / State init | ✅ | ✅ `<details>` | web.dev/articles/rendering-on-the-web#rehydration |
| 22 | Runtime target / Thread model | ✅ | ❌ | ❌ |

**What each tooltip must contain:**

| Col | Tooltip content |
|---|---|
| 4 License | MIT: use commercially, no conditions. Apache 2.0: use commercially, preserve notices. BSD-3: same as MIT + name restriction. Proprietary: vendor controls terms. |
| 5 Maintained by | Corporate-backed = faster security patches, roadmap driven by company needs. Community = slower patches, roadmap driven by contributor interest. |
| 6 Maturity | Production = battle-tested at scale, API stable. Beta = API may break between releases. Legacy = security patches only, no new features. |
| 7 Concurrency | How the framework handles multiple requests at once. Event loop = one thread, non-blocking. Goroutines = lightweight threads on multiple cores. Thread-per-request = one OS thread per request. Actor model = isolated processes, no shared memory. |
| 8 Memory | GC model controls when memory is freed. V8 = pauses briefly to collect. Go tri-color = concurrent, low pause. JVM G1/ZGC = configurable, low pause at cost of CPU. ARC = deterministic, no pause. BEAM = per-process, no global pause. Borrow checker = no GC, freed at compile time. |
| 9 Perf | Frontend: TTFB (Time to First Byte) = ms from request to first HTML byte received. TTI (Time to Interactive) = ms until user can interact. Both measured at p99. Backend: p99 latency = worst 1-in-100 request time in ms. Mobile: sustained fps = frames per second under normal UI load. |
| 10 Bundle size / Throughput | Frontend/Mobile: gzipped JS delivered on first load. Every 100kb extra ≈ +1s TTI on 4G mid-range. Source: bundlephobia.com. Backend: peak req/s under sustained load. Source: TechEmpower R22 JSON serialization test. |
| 11 Security posture | "No built-in auth" = auth is explicit — not absent. Means you choose your auth library. "Built-in auth" = framework ships an auth system — not always the right one for your needs. |
| 12 Scaling | Horizontal = add more servers behind a load balancer. Vertical = move to a bigger server. Horizontal scales to unlimited load. Vertical hits a hardware ceiling. |
| 13 Ecosystem | npm weekly downloads = proxy for library availability and hiring pool size. GitHub stars = proxy for community momentum. Neither is a quality signal — a popular bad library still has high downloads. |
| 15 Build tool | Webpack = mature, slow, most plugins. Vite = fast (esbuild), HMR. Turbopack = Rust-based, Webpack successor. esbuild = fastest raw speed, fewer plugins. Rollup = best tree-shaking for libraries. |
| 19 Tradeoff | Always stated vs the closest real alternative. A tradeoff against a hypothetical is not useful. "vs X: faster, smaller ecosystem" means: choose this over X when speed matters more than plugin breadth. |
| 20 Rendering modes / Cold start / State init | Frontend: SSR = server renders each request. CSR = browser renders from JS. SSG = pre-built at compile time. ISR = SSG with background revalidation. Backend Cold start = time from container boot to first request served — critical for serverless. |
| 21 Hydration / Container size / State init | Frontend hydration: Full = entire page hydrated. Partial = only interactive islands. Resumable = server state resumed, not re-executed — zero hydration cost. Backend: Alpine container size = compressed image size for container registry. |
| 22 Runtime target / Thread model | Frontend/Mobile: where the app runs (Node.js, Edge V8 Isolate, browser, iOS, Android). Backend Thread model: how CPU cores are used — single-thread event loop uses 1 core, goroutines / Tokio use all cores. |

**Section legend content — what each section's always-visible block says:**

Frontend legend:
```
Cols 9 + 10 read together:
Perf (col 9): TTFB or TTI in ms — how fast the server responds and the browser becomes ready.
Bundle size (col 10): compressed JS delivered on first load — controls how long the browser takes to become interactive after first byte arrives.
Fast TTFB + large bundle = page appears, then freezes 3–5s while JS loads.
Fast TTFB + small bundle = fast all the way through.
Click ▶ to understand all column definitions.
```

Mobile legend:
```
Cols 9 + 10 read together:
Perf (col 9): sustained frame rate in fps — below 60fps users see dropped frames (jank).
Bundle size (col 10): compressed app binary — controls download time and on-device storage.
High fps + large bundle = smooth UX, slow install.
Low fps + small bundle = fast install, poor UX.
Click ▶ to understand all column definitions.
```

Backend legend:
```
Cols 9 + 10 read together:
Perf (col 9): p99 latency in ms — the worst 1-in-100 user's wait time. This is what users feel under real load.
Throughput (col 10): peak req/s — how many users the server handles before response times degrade. Source: TechEmpower R22 JSON serialization test.
High throughput + high latency = handles volume but users wait.
Low throughput + low latency = fast but cannot scale to traffic.
Neither number alone tells the full story.
Click ▶ to understand all column definitions.
```

**`<details>` block content — Concurrency models:**

```
Event loop (Node.js, Deno, Bun):
  One thread handles all requests. Non-blocking I/O. CPU-bound work blocks all requests.
  Use when: I/O-heavy workloads (DB calls, API calls).
  Do not use when: CPU-heavy processing (image resize, ML inference) on the same process.

Goroutines (Go):
  Lightweight threads — millions fit in memory. Runtime scheduler uses all CPU cores.
  Use when: mixed I/O + CPU workloads, high concurrency.

Thread-per-request (Java Spring MVC, Ruby, PHP FPM):
  One OS thread per request. Blocked on I/O = thread idle but still allocated.
  Use when: team familiar with thread-based model, existing codebase.

Actor model (Elixir / Phoenix BEAM):
  One isolated process per connection. No shared memory. Process crash does not affect others.
  Use when: massive concurrent connections (chat, IoT, real-time).

Async/await thread pool (ASP.NET Kestrel, Swift NIO):
  Thread pool — async I/O does not block threads. Same pattern as event loop but multi-threaded.
  Use when: .NET or Swift team, high throughput, CPU + I/O mixed.
```

**`<details>` block content — GC / Memory models:**

```
V8 GC (Node.js, Deno, Bun, browser JS):
  Stop-the-world pauses: 1–10ms per collection. Acceptable for most web apps.
  Problem when: real-time systems where any pause causes jank.

Go tri-color concurrent GC:
  Runs concurrently with app. Pause: <1ms. Predictable at scale.
  Problem when: very high allocation rate — GC pressure increases.

JVM G1GC (Spring, Quarkus JVM, Scala):
  Tunable heap regions. Pause: 5–50ms (configurable). Standard enterprise choice.

JVM ZGC (Spring WebFlux, high-throughput JVM):
  Sub-1ms pause. Higher CPU cost than G1GC.
  Use when: latency is critical, CPU budget is available.

ARC — Automatic Reference Counting (Swift, Objective-C):
  Deterministic. No pause — memory freed immediately when last reference drops.
  Problem when: retain cycles — must break manually.

BEAM per-process GC (Elixir / Phoenix):
  Each process has its own isolated heap. No global GC pause.
  Process termination = instant memory release. Best GC model for long-running concurrency.

Rust borrow checker (Axum, Actix-web):
  No GC at all. Compiler proves memory safety at compile time.
  Zero runtime overhead. Zero pause. Cannot compile memory-unsafe code.
```

**`<details>` block content — Rendering modes:**

```
SSR (Server-Side Rendering):
  Server renders full HTML per request. Browser receives ready HTML.
  TTFB: 50–200ms. TTI: fast after TTFB. Good for SEO.

CSR (Client-Side Rendering):
  Server sends empty HTML + JS bundle. Browser renders everything.
  TTFB: fast (static file). TTI: slow until JS loads and executes.

SSG (Static Site Generation):
  All pages built at compile time. Served as static files from CDN.
  TTFB: <10ms. TTI: near-instant. Cannot personalize per user.

ISR (Incremental Static Regeneration):
  SSG pages regenerated in the background at set intervals.
  Stale content possible within the revalidation window.

Edge Rendering:
  SSR executed at CDN edge nodes worldwide.
  TTFB: 20–60ms global instead of 80–200ms origin.
  Constraint: no Node.js APIs — V8 Isolate only.

Streaming SSR:
  HTML sent in chunks as generated. Browser renders above-fold before page completes.
  First chunk TTFB: 30–50ms. Full page: depends on slowest data source.
```

**`<details>` block content — Hydration types:**

```
Full hydration:
  Browser re-executes all component JS to attach event listeners.
  Cost: proportional to app size. Large apps: 3–8s hydration on mobile.

Partial hydration (Islands architecture — Astro, Fresh):
  Only interactive "island" components hydrate. Static HTML areas stay inert.
  Cost: proportional to number of interactive components only.

Resumable (Qwik):
  Server serializes component state into HTML. Browser resumes from that state.
  Does not re-execute component logic. Cost: ~0ms regardless of app size.
  Tradeoff: unfamiliar mental model — different from React / Vue patterns.
```

---

## Complete source link registry

Every URL that appears anywhere in the HTML:

| Purpose | URL |
|---|---|
| TTFB definition | web.dev/articles/ttfb |
| Rendering on the web | web.dev/articles/rendering-on-the-web |
| Hydration | web.dev/articles/rendering-on-the-web#rehydration |
| TechEmpower R22 JSON | techempower.com/benchmarks/#section=data-r22&hw=ph&test=json |
| Bundle sizes | bundlephobia.com/package/[name]@[version] |
| npm download trends | npmtrends.com/[framework] |
| License meanings | choosealicense.com/licenses/[mit or apache-2.0 or bsd-3-clause] |
| Flutter perf docs | flutter.dev/docs/perf |
| React Native perf docs | reactnative.dev/docs/performance |
| Framework release pages | github.com/[owner]/[repo]/releases |
| Framework official sites | Per-framework — linked from Name cell |

---

## Implementation order

| Step | Fix | Why this order |
|---|---|---|
| 1 | Fix 2 — Consistent Perf header name | Do schema first before touching data |
| 2 | Fix 1 — Column order + content + sources | Structural change — do before content changes |
| 3 | Fix 7 — Mobile hydration → State init | Column rename — do before content fill |
| 4 | Fix 3 — Version updates | Verify all versions, update to current |
| 5 | Fix 4 — TechEmpower test type labels | Add test type to every backend perf number |
| 6 | Fix 5 — Concurrency column content | Fill correct framework-level values |
| 7 | Fix 6 — Memory column content | Fill correct GC + allocation values |
| 8 | Fix 8 — TTFB source format | Update frontend perf cells |
| 9 | Fix 9 — Data verified date | Add to every category |
| 10 | Educational content | Add tooltips + section legends + details blocks |

---

## Verification checklist — run after all steps complete

```
COLUMN ORDER
[ ] V-1.  Frontend cat 1–8: col 10 = Bundle size (gzip). Not Security posture.
[ ] V-2.  Mobile cat 9–13: col 10 = Bundle size. Not Security posture.
[ ] V-3.  Backend cat 14–27: col 10 = Throughput — peak req/s. Not Security posture.
[ ] V-4.  Mobile cat 9–12: col 21 header = State init. Not Hydration.
[ ] V-5.  Cat 13 PWA: col 21 header = Hydration. Not State init.

SCHEMA CONSISTENCY
[ ] V-6.  All 27 tables: col 9 header = Perf. No variation.
[ ] V-7.  All 27 col 9 cells: metric name stated inside cell value, not in header.

VERSIONS
[ ] V-8.  Every framework version: matches official release page as of 2026-05-26.
[ ] V-9.  Every version number in HTML: is a hyperlink to GitHub releases.
[ ] V-10. No beta or RC versions present.

PERFORMANCE DATA
[ ] V-11. Every backend Perf cell (col 9): shows p99 latency in ms, not req/s.
[ ] V-12. Every backend Throughput cell (col 10): shows peak req/s, not ms.
[ ] V-13. Col 9 and col 10 backend: different numbers. Not the same number.
[ ] V-14. Every TechEmpower number: labelled "TechEmpower R22 — JSON test".
[ ] V-15. Every number: has inline source link. No number without a source.

EDUCATIONAL CONTENT
[ ] V-16. Frontend section: legend block visible above cat 1.
[ ] V-17. Mobile section: legend block visible above cat 9.
[ ] V-18. Backend section: legend block visible above cat 14.
[ ] V-19. Each legend: has a clickable <details> block.
[ ] V-20. All 14 columns marked ✅ in education table: have title attribute on <th>.
[ ] V-21. Hover any annotated <th>: tooltip appears with definition + source.

LINKS
[ ] V-22. Every Name cell: hyperlinks to framework official site.
[ ] V-23. Every Version cell: hyperlinks to GitHub releases page.
[ ] V-24. Every TechEmpower citation: hyperlinks to techempower.com R22 JSON.
[ ] V-25. Every bundle size citation: hyperlinks to bundlephobia.com.

DATA FRESHNESS
[ ] V-26. Every category: has "Data verified: 2026-05-26" below <h2>.
```

---

## Expected score after all fixes

| Dimension | Expected score |
|---|---|
| Structure | 10/10 |
| Column order | 10/10 |
| Column completeness | 10/10 |
| Version accuracy | 10/10 |
| Data uniqueness | 9/10 |
| Perf data accuracy + sourced | 9/10 |
| Schema consistency | 10/10 |
| Educational content | 10/10 |
| **Overall** | **~9.5/10** |

The remaining 0.5 is from TTFB values that can only be exact with a live benchmark runner.
That is an infrastructure problem, not a content or design problem.
It is not fixable in a static HTML file.
