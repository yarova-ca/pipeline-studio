// Full framework catalog — every frontend, backend, and runtime the studio knows about.
// Tier: production = full Dockerfile + workflow. coming-soon = listed only.
// shape: fullstack | spa | ssg | backend | mobile | library

export interface CatalogEntry {
  id: string;
  label: string;
  lang: string;
  shape: string;
  tier: 'production' | 'beta' | 'coming-soon';
  sister: string | null;
  note: string;
}

export const CATALOG: CatalogEntry[] = [
  // ── Frontend / Full-stack / SSG / Mobile — JS-class ──
  { id: 'react-vite',   label: 'React + Vite',             lang: 'JS',    shape: 'spa',       tier: 'production',  sister: null,           note: 'CSR SPA. Static hosting.' },
  { id: 'vue-vite',     label: 'Vue 3 + Vite',             lang: 'JS',    shape: 'spa',       tier: 'production',  sister: null,           note: 'CSR SPA. Great for dashboards.' },
  { id: 'angular',      label: 'Angular 18',               lang: 'JS',    shape: 'spa',       tier: 'production',  sister: null,           note: 'CSR SPA with optional SSR.' },
  { id: 'svelte',       label: 'SvelteKit',                lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'SSR + adapter ecosystem.' },
  { id: 'solid',        label: 'SolidStart',               lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'Fine-grained reactivity + SSR.' },
  { id: 'solid-vite',   label: 'Solid + Vite',             lang: 'JS',    shape: 'spa',       tier: 'production',  sister: null,           note: 'CSR-only Solid.' },
  { id: 'preact-vite',  label: 'Preact + Vite',            lang: 'JS',    shape: 'spa',       tier: 'production',  sister: null,           note: 'Lightweight React alternative.' },
  { id: 'lit',          label: 'Lit (Web Components)',     lang: 'JS',    shape: 'spa',       tier: 'production',  sister: null,           note: 'Native Web Components.' },
  { id: 'nextjs',       label: 'Next.js 15',               lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'React full-stack. Turbopack + App Router.' },
  { id: 'remix',        label: 'Remix 2',                  lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'React Router 7 SSR.' },
  { id: 'nuxt',         label: 'Nuxt 3',                   lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'Vue full-stack with Nitro engine.' },
  { id: 'qwik',         label: 'Qwik City',                lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'Resumable SSR — zero JS hydration.' },
  { id: 'tanstack',     label: 'TanStack Start',           lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'Type-safe router + server functions.' },
  { id: 'astro',        label: 'Astro 4 (SSR)',            lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'Islands architecture with adapters.' },
  { id: 'redwood',      label: 'RedwoodJS',                lang: 'JS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'React + Prisma + GraphQL bundle.' },
  { id: 'fresh',        label: 'Fresh (Deno)',             lang: 'TS',    shape: 'fullstack', tier: 'production',  sister: null,           note: 'Deno runtime, islands.' },
  { id: 'astro-ssg',   label: 'Astro 4 (static)',          lang: 'JS',    shape: 'ssg',       tier: 'production',  sister: null,           note: 'Pure SSG build mode.' },
  { id: 'gatsby',       label: 'Gatsby 5',                 lang: 'JS',    shape: 'ssg',       tier: 'production',  sister: null,           note: 'React SSG with GraphQL data layer.' },
  { id: 'blitz',        label: 'Blitz.js',                 lang: 'JS',    shape: 'fullstack', tier: 'coming-soon', sister: 'nextjs',       note: 'Next.js + Prisma + tRPC.' },
  { id: 't3',           label: 'T3 (create-t3-app)',       lang: 'JS',    shape: 'fullstack', tier: 'coming-soon', sister: 'nextjs',       note: 'Next + tRPC + Prisma + Tailwind scaffold.' },
  { id: 'wasp',         label: 'Wasp',                     lang: 'JS',    shape: 'fullstack', tier: 'coming-soon', sister: 'nextjs',       note: 'React + Node + Prisma via DSL.' },
  { id: 'eleventy',     label: 'Eleventy (11ty)',          lang: 'JS',    shape: 'ssg',       tier: 'coming-soon', sister: 'astro-ssg',    note: 'Zero-config SSG.' },
  { id: 'vitepress',    label: 'VitePress',                lang: 'JS',    shape: 'ssg',       tier: 'coming-soon', sister: 'astro-ssg',    note: 'Vue-based docs SSG.' },
  { id: 'docusaurus',   label: 'Docusaurus',               lang: 'JS',    shape: 'ssg',       tier: 'coming-soon', sister: 'astro-ssg',    note: 'Meta docs SSG with versioning.' },
  { id: 'htmx',         label: 'HTMX',                     lang: 'JS',    shape: 'fullstack', tier: 'coming-soon', sister: 'ruby-rails',   note: 'Server-rendered HTML + ajax attributes.' },
  { id: 'mobile-expo',  label: 'Expo (managed)',           lang: 'JS',    shape: 'mobile',    tier: 'production',  sister: null,           note: 'Managed React Native.' },
  { id: 'mobile',       label: 'React Native (bare)',      lang: 'JS',    shape: 'mobile',    tier: 'production',  sister: null,           note: 'Bare workflow React Native.' },
  { id: 'flutter',      label: 'Flutter',                  lang: 'Dart',  shape: 'mobile',    tier: 'coming-soon', sister: 'mobile-expo',  note: 'Google Dart + Skia/Impeller.' },
  { id: 'ionic',        label: 'Ionic + Capacitor',        lang: 'JS',    shape: 'mobile',    tier: 'coming-soon', sister: 'mobile-expo',  note: 'Hybrid web-tech mobile.' },

  // ── Backend — Node / Bun / Deno ──
  { id: 'nodejs-express',  label: 'Express (Node)',         lang: 'Node',  shape: 'backend',   tier: 'production',  sister: null,           note: 'Most common Node server.' },
  { id: 'nodejs-fastify',  label: 'Fastify (Node)',         lang: 'Node',  shape: 'backend',   tier: 'production',  sister: null,           note: 'Schema-first, fast.' },
  { id: 'nodejs-nest',     label: 'NestJS (Node)',          lang: 'Node',  shape: 'backend',   tier: 'production',  sister: null,           note: 'Angular-style modules.' },
  { id: 'nodejs-hono',     label: 'Hono (Node/Bun/Deno)',  lang: 'Node',  shape: 'backend',   tier: 'production',  sister: null,           note: 'Lightweight, multi-runtime.' },
  { id: 'nodejs-koa',      label: 'Koa (Node)',             lang: 'Node',  shape: 'backend',   tier: 'production',  sister: null,           note: 'TJ Holowaychuk middleware framework.' },
  { id: 'bun-elysia',      label: 'Elysia (Bun)',           lang: 'Bun',   shape: 'backend',   tier: 'production',  sister: null,           note: 'Bun-native high-perf framework.' },

  // ── Backend — Python ──
  { id: 'python-fastapi',  label: 'FastAPI',                lang: 'Python', shape: 'backend',  tier: 'production',  sister: null,           note: 'Async, OpenAPI built-in.' },
  { id: 'python-django',   label: 'Django REST',            lang: 'Python', shape: 'backend',  tier: 'production',  sister: null,           note: 'Batteries-included.' },
  { id: 'python-flask',    label: 'Flask',                  lang: 'Python', shape: 'backend',  tier: 'production',  sister: null,           note: 'Microframework.' },
  { id: 'python-litestar', label: 'Litestar',               lang: 'Python', shape: 'backend',  tier: 'production',  sister: null,           note: 'Type-driven, msgspec.' },
  { id: 'python-starlette',label: 'Starlette',              lang: 'Python', shape: 'backend',  tier: 'production',  sister: null,           note: 'ASGI base under FastAPI.' },

  // ── Backend — Go ──
  { id: 'go-gin',    label: 'Go + gin',           lang: 'Go',    shape: 'backend',   tier: 'production',  sister: null,  note: 'Most popular Go router.' },
  { id: 'go-echo',   label: 'Go + echo',          lang: 'Go',    shape: 'backend',   tier: 'production',  sister: null,  note: 'Performant middleware-friendly.' },
  { id: 'go-chi',    label: 'Go + chi',           lang: 'Go',    shape: 'backend',   tier: 'production',  sister: null,  note: 'Idiomatic, stdlib-compatible.' },
  { id: 'go-fiber',  label: 'Go + fiber',         lang: 'Go',    shape: 'backend',   tier: 'production',  sister: null,  note: 'Express-inspired, fasthttp.' },
  { id: 'go-stdlib', label: 'Go stdlib net/http', lang: 'Go',    shape: 'backend',   tier: 'production',  sister: null,  note: 'Zero-deps stdlib.' },

  // ── Backend — Java / Kotlin ──
  { id: 'java-spring',    label: 'Spring Boot 3',         lang: 'Java',   shape: 'backend',   tier: 'production',  sister: null,              note: 'Industry standard JVM.' },
  { id: 'java-quarkus',   label: 'Quarkus',               lang: 'Java',   shape: 'backend',   tier: 'production',  sister: null,              note: 'Cloud-native + GraalVM-native.' },
  { id: 'java-micronaut', label: 'Micronaut',             lang: 'Java',   shape: 'backend',   tier: 'production',  sister: null,              note: 'Compile-time DI.' },
  { id: 'java-javalin',   label: 'Javalin',               lang: 'Java',   shape: 'backend',   tier: 'production',  sister: null,              note: 'Lightweight Kotlin-friendly.' },
  { id: 'kotlin-ktor',    label: 'Ktor (Kotlin)',         lang: 'Kotlin', shape: 'backend',   tier: 'production',  sister: null,              note: 'JetBrains async coroutines.' },
  { id: 'java-helidon',   label: 'Helidon',               lang: 'Java',   shape: 'backend',   tier: 'coming-soon', sister: 'java-quarkus',    note: 'Oracle reactive microframework.' },

  // ── Backend — .NET ──
  { id: 'dotnet-webapi',  label: 'ASP.NET Web API',        lang: '.NET',  shape: 'backend',   tier: 'production',  sister: null,              note: 'Controller-style API.' },
  { id: 'dotnet-minimal', label: 'ASP.NET Minimal API',    lang: '.NET',  shape: 'backend',   tier: 'production',  sister: null,              note: 'Top-level statements, fast.' },
  { id: 'dotnet-carter',  label: 'Carter',                  lang: '.NET',  shape: 'backend',   tier: 'coming-soon', sister: 'dotnet-minimal',  note: 'Minimal API conventions package.' },

  // ── Backend — Rust ──
  { id: 'rust-axum',   label: 'Axum',      lang: 'Rust', shape: 'backend',   tier: 'production',  sister: null,       note: 'Tokio-stack, tower middleware.' },
  { id: 'rust-actix',  label: 'Actix-web', lang: 'Rust', shape: 'backend',   tier: 'production',  sister: null,       note: 'Mature actor-based.' },
  { id: 'rust-rocket', label: 'Rocket',    lang: 'Rust', shape: 'backend',   tier: 'production',  sister: null,       note: 'Macro-driven routing.' },
  { id: 'rust-warp',   label: 'Warp',      lang: 'Rust', shape: 'backend',   tier: 'production',  sister: null,       note: 'Filter-based composition.' },
  { id: 'rust-poem',   label: 'Poem',      lang: 'Rust', shape: 'backend',   tier: 'coming-soon', sister: 'rust-axum', note: 'Macro-light tokio framework.' },
  { id: 'rust-leptos', label: 'Leptos (full-stack)', lang: 'Rust', shape: 'fullstack', tier: 'coming-soon', sister: 'rust-axum', note: 'Fine-grained Rust UI + SSR.' },

  // ── Backend — Ruby ──
  { id: 'ruby-rails',   label: 'Rails 7 (full-stack)', lang: 'Ruby', shape: 'fullstack', tier: 'production',  sister: null,          note: 'Industry standard Ruby.' },
  { id: 'ruby-sinatra', label: 'Sinatra',               lang: 'Ruby', shape: 'backend',   tier: 'production',  sister: null,          note: 'Microframework.' },
  { id: 'ruby-hanami',  label: 'Hanami',                lang: 'Ruby', shape: 'fullstack', tier: 'coming-soon', sister: 'ruby-rails',  note: 'Modern alternative to Rails.' },

  // ── Backend — PHP ──
  { id: 'php-laravel',  label: 'Laravel 11 (full-stack)', lang: 'PHP', shape: 'fullstack', tier: 'production',  sister: null,           note: 'Most-used PHP framework.' },
  { id: 'php-symfony',  label: 'Symfony 7',               lang: 'PHP', shape: 'backend',   tier: 'production',  sister: null,           note: 'Enterprise PHP.' },
  { id: 'php-slim',     label: 'Slim 4',                  lang: 'PHP', shape: 'backend',   tier: 'production',  sister: null,           note: 'Microframework.' },

  // ── Backend — Elixir ──
  { id: 'elixir-phoenix', label: 'Phoenix (API)',              lang: 'Elixir', shape: 'backend',   tier: 'production', sister: null, note: 'BEAM concurrency, OTP supervision.' },
  { id: 'elixir-live',    label: 'Phoenix LiveView (full-stack)', lang: 'Elixir', shape: 'fullstack', tier: 'production', sister: null, note: 'Real-time server-rendered UI.' },

  // ── Backend — Swift ──
  { id: 'swift-vapor',   label: 'Vapor (Swift)',   lang: 'Swift', shape: 'backend', tier: 'production',  sister: null,       note: 'Swift server framework.' },
];

export const CATALOG_TIERS: Record<string, { label: string; color: string; bg: string; tip: string }> = {
  'production': { label: 'Production', color: '#1a7f37', bg: '#dafbe1', tip: 'Full Dockerfile + workflow + knowledge content. Copy-paste safe.' },
  'beta':       { label: 'Beta',       color: '#9a6700', bg: '#fff8c5', tip: 'Full code; knowledge fields under review.' },
  'coming-soon':{ label: 'Coming soon', color: '#57606a', bg: '#f6f8fa', tip: 'Listed only. Pick a sister framework with the closest recipe.' },
};

export const CATALOG_SHAPES: Record<string, { label: string; icon: string }> = {
  fullstack: { label: 'Full-stack',   icon: '🏗️' },
  spa:       { label: 'SPA / CSR',    icon: '🌐' },
  ssg:       { label: 'Static site',  icon: '📄' },
  backend:   { label: 'Backend API',  icon: '⚙️' },
  mobile:    { label: 'Mobile',       icon: '📱' },
  library:   { label: 'Library',      icon: '📚' },
};

export function catalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find(c => c.id === id);
}

export function catalogTierPill(id: string): string {
  const e = catalogEntry(id);
  if (!e) return '';
  const t = CATALOG_TIERS[e.tier];
  return `<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;border:1px solid ${t.color}30;background:${t.bg};color:${t.color}">${t.label}</span>`;
}
