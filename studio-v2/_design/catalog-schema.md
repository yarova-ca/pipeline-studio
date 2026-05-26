# Catalog Schema

## Categories — in order

### Frontend — Web

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

### Frontend — Mobile

| # | Category |
|---|---|
| 9 | Mobile — Cross-platform JS |
| 10 | Mobile — Cross-platform non-JS |
| 11 | Mobile — Native iOS |
| 12 | Mobile — Native Android |
| 13 | Mobile — PWA |

### Backend

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

## Columns

### Shared — all 27 categories

| Column | What it captures |
|---|---|
| Name | Framework / runtime name |
| Version | Current stable version |
| Language | Primary language(s) |
| License | MIT / Apache / BSL / Commercial |
| Maintained by | Company / CNCF / community |
| Maturity | Production / Beta / Experimental |
| Concurrency model | How parallel work is handled |
| Memory model | GC / manual / borrow checker / ARC |
| Performance tier | Benchmark metric + source |
| Security posture | Known risks + security model |
| Scaling model | Vertical / horizontal / both |
| Ecosystem size | Package count or community signal |
| Package managers | All valid package managers for this entry |
| Build tools / compilers | Bundler, compiler, or build system |
| Artifact registry | Where packages come from |
| When to use | Specific condition |
| When NOT to use | Specific condition |
| Primary tradeoff | vs closest alternative, one line |

### Frontend-only — categories 1–13

| Column | What it captures |
|---|---|
| Rendering modes | SSR / CSR / SSG / ISR / Islands |
| Hydration | Full / partial / none / resumable |
| Bundle size | Typical gzip kb |
| Runtime target | Browser / Node / Edge / all |

### Backend-only — categories 14–27

| Column | What it captures |
|---|---|
| Throughput | req/s at p99 — benchmark source required |
| Cold start | ms to first request |
| Container size | Typical Alpine image size |
| Thread model | Single / multi / async / actor |

---

## Example row — Next.js 15 (Category 1: Frontend SSR / Hybrid)

**Shared columns:**

| Name | Version | Language | License | Maintained by | Maturity | Concurrency | Memory | Perf (p99 TTFB) | Security | Scaling | Ecosystem | Pkg Mgr | Build tool | Registry | When to use | When NOT | Tradeoff |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Next.js | 15 | TS/JS | MIT | Vercel | Production | Single-thread async I/O | GC — V8 | 80ms edge / 120ms Node | Server exposed, no built-in auth, CSP manual | Horizontal | 6M+ weekly npm downloads | npm, pnpm, yarn, bun | Webpack / Turbopack | npmjs.com | React team, SEO, mixed content | Pure static → Astro. Mobile → Expo | vs Remix: bigger ecosystem, weaker forms |

**Frontend-only columns:**

| Rendering modes | Hydration | Bundle size | Runtime target |
|---|---|---|---|
| SSR, CSR, SSG, ISR — per-page | Full — RSC reduces client JS | ~80–120 kb gzip | Node.js / Edge (Vercel, Cloudflare) |

