// catalog.ts — Framework/tool catalog, tier definitions, and dropdown optgroup mapping.
// Extracted from v1 index.html: CATALOG (line 8182), CATALOG_TIERS (line 8309),
// CATALOG_TO_OPTGROUP (line 13565).

// ─── Types ────────────────────────────────────────────────────────────────────

export type CatalogLang =
  | 'JS' | 'TS' | 'Node' | 'Bun' | 'Deno'
  | 'Python' | 'Go' | 'Java' | 'Kotlin'
  | '.NET' | 'Rust' | 'Ruby' | 'PHP'
  | 'Elixir' | 'Erlang' | 'Scala' | 'Clojure' | 'Haskell'
  | 'Swift' | 'Crystal' | 'Dart';

export type CatalogShape =
  | 'spa' | 'ssg' | 'fullstack' | 'backend' | 'mobile';

export type CatalogTier = 'production' | 'beta' | 'coming-soon';

export interface CatalogItem {
  id: string;
  label: string;
  lang: CatalogLang;
  shape: CatalogShape;
  tier: CatalogTier;
  /** ID of the recommended substitute when this item is 'coming-soon'. null when production. */
  sister: string | null;
  note: string;
}

export interface CatalogTierDef {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  tip: string;
}

export interface CatalogOptGroup {
  /** ID of the <select> element this item belongs to. */
  select: 'sel-frontend' | 'sel-backend';
  /** <optgroup> label string. */
  group: string;
}

// ─── CATALOG ──────────────────────────────────────────────────────────────────

export const CATALOG: CatalogItem[] = [
  // ── Frontend / Full-stack / SSG / Mobile — JS-class ──
  { id: 'react-vite',    label: 'React + Vite',                      lang: 'JS',      shape: 'spa',       tier: 'production',  sister: null,             note: 'CSR SPA. Static hosting.' },
  { id: 'vue-vite',      label: 'Vue 3 + Vite',                      lang: 'JS',      shape: 'spa',       tier: 'production',  sister: null,             note: 'CSR SPA. Static hosting.' },
  { id: 'angular',       label: 'Angular 18',                        lang: 'JS',      shape: 'spa',       tier: 'production',  sister: null,             note: 'CSR SPA with optional SSR.' },
  { id: 'svelte',        label: 'SvelteKit',                         lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'SSR + adapter ecosystem.' },
  { id: 'solid',         label: 'SolidStart',                        lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'Fine-grained reactivity + SSR.' },
  { id: 'solid-vite',    label: 'Solid + Vite',                      lang: 'JS',      shape: 'spa',       tier: 'production',  sister: null,             note: 'CSR-only Solid.' },
  { id: 'preact-vite',   label: 'Preact + Vite',                     lang: 'JS',      shape: 'spa',       tier: 'production',  sister: null,             note: 'Lightweight React alternative.' },
  { id: 'lit',           label: 'Lit (Web Components)',              lang: 'JS',      shape: 'spa',       tier: 'production',  sister: null,             note: 'Native Web Components.' },
  { id: 'qwik-csr',      label: 'Qwik (CSR)',                        lang: 'JS',      shape: 'spa',       tier: 'coming-soon', sister: 'react-vite',     note: 'Client-only Qwik mode.' },
  { id: 'nextjs',        label: 'Next.js 15',                        lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'React full-stack. Turbopack + App Router.' },
  { id: 'remix',         label: 'Remix 2',                           lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'React Router 7 SSR.' },
  { id: 'nuxt',          label: 'Nuxt 3',                            lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'Vue full-stack with Nitro engine.' },
  { id: 'qwik',          label: 'Qwik City',                         lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'Resumable SSR — zero JS hydration.' },
  { id: 'tanstack',      label: 'TanStack Start',                    lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'Type-safe router + server functions.' },
  { id: 'astro',         label: 'Astro 4 (SSR)',                     lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'Islands architecture with adapters.' },
  { id: 'redwood',       label: 'RedwoodJS',                         lang: 'JS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'React + Prisma + GraphQL bundle.' },
  { id: 'blitz',         label: 'Blitz.js',                          lang: 'JS',      shape: 'fullstack', tier: 'coming-soon', sister: 'nextjs',         note: 'Next.js + Prisma + tRPC.' },
  { id: 't3',            label: 'T3 (create-t3-app)',                lang: 'JS',      shape: 'fullstack', tier: 'coming-soon', sister: 'nextjs',         note: 'Next + tRPC + Prisma + Tailwind scaffold.' },
  { id: 'wasp',          label: 'Wasp',                              lang: 'JS',      shape: 'fullstack', tier: 'coming-soon', sister: 'nextjs',         note: 'React + Node + Prisma via DSL.' },
  { id: 'fresh',         label: 'Fresh (Deno)',                      lang: 'TS',      shape: 'fullstack', tier: 'production',  sister: null,             note: 'Deno runtime, islands.' },
  { id: 'astro-ssg',     label: 'Astro 4 (static)',                  lang: 'JS',      shape: 'ssg',       tier: 'production',  sister: null,             note: 'Pure SSG build mode.' },
  { id: 'gatsby',        label: 'Gatsby 5',                          lang: 'JS',      shape: 'ssg',       tier: 'production',  sister: null,             note: 'React SSG with GraphQL data layer.' },
  { id: 'eleventy',      label: 'Eleventy (11ty)',                   lang: 'JS',      shape: 'ssg',       tier: 'coming-soon', sister: 'astro-ssg',      note: 'Zero-config SSG.' },
  { id: 'vitepress',     label: 'VitePress',                         lang: 'JS',      shape: 'ssg',       tier: 'coming-soon', sister: 'astro-ssg',      note: 'Vue-based docs SSG.' },
  { id: 'docusaurus',    label: 'Docusaurus',                        lang: 'JS',      shape: 'ssg',       tier: 'coming-soon', sister: 'astro-ssg',      note: 'Meta docs SSG with versioning.' },
  { id: 'htmx',          label: 'HTMX',                              lang: 'JS',      shape: 'fullstack', tier: 'coming-soon', sister: 'rails',          note: 'Server-rendered HTML + ajax attributes.' },
  { id: 'alpine',        label: 'Alpine.js',                         lang: 'JS',      shape: 'fullstack', tier: 'coming-soon', sister: 'rails',          note: 'Tiny JS sprinkle on server HTML.' },
  { id: 'mobile-expo',   label: 'Expo (managed)',                    lang: 'JS',      shape: 'mobile',    tier: 'production',  sister: null,             note: 'Managed React Native.' },
  { id: 'mobile',        label: 'React Native (bare)',               lang: 'JS',      shape: 'mobile',    tier: 'production',  sister: null,             note: 'Bare workflow React Native.' },
  { id: 'flutter',       label: 'Flutter',                           lang: 'Dart',    shape: 'mobile',    tier: 'coming-soon', sister: 'mobile-expo',    note: 'Google Dart + Skia/Impeller.' },
  { id: 'ionic',         label: 'Ionic + Capacitor',                 lang: 'JS',      shape: 'mobile',    tier: 'coming-soon', sister: 'mobile-expo',    note: 'Hybrid web-tech mobile.' },

  // ── Backend — Node / Bun / Deno ──
  { id: 'nodejs-express', label: 'Express (Node)',                   lang: 'Node',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Most common Node server.' },
  { id: 'nodejs-fastify', label: 'Fastify (Node)',                   lang: 'Node',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Schema-first, fast.' },
  { id: 'nodejs-nest',    label: 'NestJS (Node)',                    lang: 'Node',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Angular-style modules.' },
  { id: 'nodejs-hono',    label: 'Hono (Node/Bun/Deno)',             lang: 'Node',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Lightweight, multi-runtime.' },
  { id: 'nodejs-koa',     label: 'Koa (Node)',                       lang: 'Node',    shape: 'backend',   tier: 'production',  sister: null,             note: 'TJ Holowaychuk middleware framework.' },
  { id: 'nodejs-adonis',  label: 'AdonisJS',                         lang: 'Node',    shape: 'backend',   tier: 'coming-soon', sister: 'nodejs-nest',    note: 'Rails-style Node MVC.' },
  { id: 'bun-elysia',     label: 'Elysia (Bun)',                     lang: 'Bun',     shape: 'backend',   tier: 'production',  sister: null,             note: 'Bun-native high-perf framework.' },
  { id: 'deno-fresh-api', label: 'Fresh API (Deno)',                 lang: 'Deno',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Deno serverless functions.' },

  // ── Backend — Python ──
  { id: 'python-fastapi',   label: 'FastAPI',                        lang: 'Python',  shape: 'backend',   tier: 'production',  sister: null,             note: 'Async, OpenAPI built-in.' },
  { id: 'python-django',    label: 'Django REST',                    lang: 'Python',  shape: 'backend',   tier: 'production',  sister: null,             note: 'Batteries-included.' },
  { id: 'python-flask',     label: 'Flask',                          lang: 'Python',  shape: 'backend',   tier: 'production',  sister: null,             note: 'Microframework.' },
  { id: 'python-litestar',  label: 'Litestar',                       lang: 'Python',  shape: 'backend',   tier: 'production',  sister: null,             note: 'Type-driven, msgspec.' },
  { id: 'python-starlette', label: 'Starlette',                      lang: 'Python',  shape: 'backend',   tier: 'production',  sister: null,             note: 'ASGI base under FastAPI.' },
  { id: 'python-reflex',    label: 'Reflex (Python full-stack)',      lang: 'Python',  shape: 'fullstack', tier: 'coming-soon', sister: 'python-django',  note: 'Full UI in Python.' },

  // ── Backend — Go ──
  { id: 'go-gin',      label: 'Go + gin',                            lang: 'Go',      shape: 'backend',   tier: 'production',  sister: null,             note: 'Most popular Go router.' },
  { id: 'go-echo',     label: 'Go + echo',                           lang: 'Go',      shape: 'backend',   tier: 'production',  sister: null,             note: 'Performant middleware-friendly.' },
  { id: 'go-chi',      label: 'Go + chi',                            lang: 'Go',      shape: 'backend',   tier: 'production',  sister: null,             note: 'Idiomatic, stdlib-compatible.' },
  { id: 'go-fiber',    label: 'Go + fiber',                          lang: 'Go',      shape: 'backend',   tier: 'production',  sister: null,             note: 'Express-inspired, fasthttp.' },
  { id: 'go-stdlib',   label: 'Go stdlib net/http',                  lang: 'Go',      shape: 'backend',   tier: 'production',  sister: null,             note: 'Zero-deps stdlib.' },
  { id: 'go-buffalo',  label: 'Buffalo (full-stack)',                 lang: 'Go',      shape: 'fullstack', tier: 'coming-soon', sister: 'go-gin',         note: 'Rails-style Go full-stack.' },

  // ── Backend — Java / Kotlin ──
  { id: 'java-spring',    label: 'Spring Boot 3',                    lang: 'Java',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Industry standard JVM.' },
  { id: 'java-quarkus',   label: 'Quarkus',                          lang: 'Java',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Cloud-native + GraalVM-native.' },
  { id: 'java-micronaut', label: 'Micronaut',                        lang: 'Java',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Compile-time DI.' },
  { id: 'java-helidon',   label: 'Helidon',                          lang: 'Java',    shape: 'backend',   tier: 'coming-soon', sister: 'java-quarkus',   note: 'Oracle reactive microframework.' },
  { id: 'java-javalin',   label: 'Javalin',                          lang: 'Java',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Lightweight Kotlin-friendly.' },
  { id: 'kotlin-ktor',    label: 'Ktor (Kotlin)',                    lang: 'Kotlin',  shape: 'backend',   tier: 'production',  sister: null,             note: 'JetBrains async coroutines.' },
  { id: 'java-thymeleaf', label: 'Spring + Thymeleaf (full-stack)',  lang: 'Java',    shape: 'fullstack', tier: 'coming-soon', sister: 'java-spring',    note: 'Server-rendered Java HTML.' },
  { id: 'java-vaadin',    label: 'Vaadin (full-stack)',              lang: 'Java',    shape: 'fullstack', tier: 'coming-soon', sister: 'java-spring',    note: 'Server-driven UI components.' },

  // ── Backend — .NET ──
  { id: 'dotnet-webapi',   label: 'ASP.NET Web API',                 lang: '.NET',    shape: 'backend',   tier: 'production',  sister: null,               note: 'Controller-style API.' },
  { id: 'dotnet-minimal',  label: 'ASP.NET Minimal API',             lang: '.NET',    shape: 'backend',   tier: 'production',  sister: null,               note: 'Top-level statements, fast.' },
  { id: 'dotnet-carter',   label: 'Carter',                          lang: '.NET',    shape: 'backend',   tier: 'coming-soon', sister: 'dotnet-minimal',   note: 'Minimal API conventions package.' },
  { id: 'dotnet-fastend',  label: 'FastEndpoints',                   lang: '.NET',    shape: 'backend',   tier: 'coming-soon', sister: 'dotnet-webapi',    note: 'REPR-pattern .NET framework.' },
  { id: 'dotnet-mvc',      label: 'ASP.NET Core MVC (full-stack)',   lang: '.NET',    shape: 'fullstack', tier: 'coming-soon', sister: 'dotnet-webapi',    note: 'Razor server pages.' },
  { id: 'dotnet-blazor',   label: 'Blazor Server',                   lang: '.NET',    shape: 'fullstack', tier: 'coming-soon', sister: 'dotnet-webapi',    note: 'Server-side C# UI via SignalR.' },
  { id: 'dotnet-blazorwa', label: 'Blazor WebAssembly',              lang: '.NET',    shape: 'fullstack', tier: 'coming-soon', sister: 'dotnet-webapi',    note: 'Client C# via WASM.' },

  // ── Backend — Rust ──
  { id: 'rust-axum',   label: 'Axum',                                lang: 'Rust',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Tokio-stack, tower middleware.' },
  { id: 'rust-actix',  label: 'Actix-web',                           lang: 'Rust',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Mature actor-based.' },
  { id: 'rust-rocket', label: 'Rocket',                              lang: 'Rust',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Macro-driven routing.' },
  { id: 'rust-warp',   label: 'Warp',                                lang: 'Rust',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Filter-based composition.' },
  { id: 'rust-tide',   label: 'Tide',                                lang: 'Rust',    shape: 'backend',   tier: 'coming-soon', sister: 'rust-axum',      note: 'Minimal async-std framework.' },
  { id: 'rust-poem',   label: 'Poem',                                lang: 'Rust',    shape: 'backend',   tier: 'coming-soon', sister: 'rust-axum',      note: 'Macro-light tokio framework.' },
  { id: 'rust-leptos', label: 'Leptos (full-stack)',                  lang: 'Rust',    shape: 'fullstack', tier: 'coming-soon', sister: 'rust-axum',      note: 'Fine-grained Rust UI + SSR.' },
  { id: 'rust-loco',   label: 'Loco.rs (full-stack)',                 lang: 'Rust',    shape: 'fullstack', tier: 'coming-soon', sister: 'rust-axum',      note: 'Rails-style Rust full-stack.' },

  // ── Backend — Ruby ──
  { id: 'ruby-rails',   label: 'Rails 7 (full-stack)',               lang: 'Ruby',    shape: 'fullstack', tier: 'production',  sister: null,             note: 'Industry standard Ruby.' },
  { id: 'ruby-sinatra', label: 'Sinatra',                            lang: 'Ruby',    shape: 'backend',   tier: 'production',  sister: null,             note: 'Microframework.' },
  { id: 'ruby-hanami',  label: 'Hanami',                             lang: 'Ruby',    shape: 'fullstack', tier: 'coming-soon', sister: 'ruby-rails',     note: 'Modern alternative to Rails.' },
  { id: 'ruby-grape',   label: 'Grape',                              lang: 'Ruby',    shape: 'backend',   tier: 'coming-soon', sister: 'ruby-sinatra',   note: 'REST DSL on Rack.' },

  // ── Backend — PHP ──
  { id: 'php-laravel',     label: 'Laravel 11 (full-stack)',         lang: 'PHP',     shape: 'fullstack', tier: 'production',  sister: null,             note: 'Most-used PHP framework.' },
  { id: 'php-symfony',     label: 'Symfony 7',                       lang: 'PHP',     shape: 'backend',   tier: 'production',  sister: null,             note: 'Enterprise PHP.' },
  { id: 'php-slim',        label: 'Slim 4',                          lang: 'PHP',     shape: 'backend',   tier: 'production',  sister: null,             note: 'Microframework.' },
  { id: 'php-codeigniter', label: 'CodeIgniter',                     lang: 'PHP',     shape: 'fullstack', tier: 'coming-soon', sister: 'php-laravel',    note: 'Lightweight PHP full-stack.' },
  { id: 'php-cakephp',     label: 'CakePHP',                         lang: 'PHP',     shape: 'fullstack', tier: 'coming-soon', sister: 'php-laravel',    note: 'Convention-over-config PHP.' },
  { id: 'php-hyperf',      label: 'Hyperf',                          lang: 'PHP',     shape: 'backend',   tier: 'coming-soon', sister: 'php-symfony',    note: 'Coroutine PHP framework.' },

  // ── Backend — Elixir / Erlang ──
  { id: 'elixir-phoenix', label: 'Phoenix (API)',                    lang: 'Elixir',  shape: 'backend',   tier: 'production',  sister: null,               note: 'BEAM concurrency, OTP supervision.' },
  { id: 'elixir-live',    label: 'Phoenix LiveView (full-stack)',    lang: 'Elixir',  shape: 'fullstack', tier: 'production',  sister: null,               note: 'Real-time server-rendered UI.' },
  { id: 'elixir-plug',    label: 'Plug',                             lang: 'Elixir',  shape: 'backend',   tier: 'coming-soon', sister: 'elixir-phoenix',   note: 'Composable Elixir HTTP base.' },
  { id: 'erlang-cowboy',  label: 'Cowboy (Erlang)',                  lang: 'Erlang',  shape: 'backend',   tier: 'coming-soon', sister: 'elixir-phoenix',   note: 'Erlang HTTP server.' },

  // ── Backend — Scala / Clojure / Haskell ──
  { id: 'scala-play',       label: 'Play (Scala · full-stack)',      lang: 'Scala',   shape: 'fullstack', tier: 'coming-soon', sister: 'java-spring',    note: 'Akka-based JVM full-stack.' },
  { id: 'scala-http4s',     label: 'http4s (Scala)',                 lang: 'Scala',   shape: 'backend',   tier: 'coming-soon', sister: 'java-spring',    note: 'Functional cats-effect HTTP.' },
  { id: 'scala-akka',       label: 'Akka HTTP (Scala)',              lang: 'Scala',   shape: 'backend',   tier: 'coming-soon', sister: 'java-spring',    note: 'Actor-based HTTP.' },
  { id: 'scala-zio',        label: 'ZIO HTTP (Scala)',               lang: 'Scala',   shape: 'backend',   tier: 'coming-soon', sister: 'java-spring',    note: 'ZIO effect-system HTTP.' },
  { id: 'clojure-ring',     label: 'Ring (Clojure)',                 lang: 'Clojure', shape: 'backend',   tier: 'coming-soon', sister: 'java-spring',    note: 'Idiomatic Clojure HTTP.' },
  { id: 'clojure-pedestal', label: 'Pedestal (Clojure)',             lang: 'Clojure', shape: 'backend',   tier: 'coming-soon', sister: 'java-spring',    note: 'Cognitect framework.' },
  { id: 'clojure-luminus',  label: 'Luminus (Clojure · full-stack)', lang: 'Clojure', shape: 'fullstack', tier: 'coming-soon', sister: 'java-spring',    note: 'Batteries-included Clojure.' },
  { id: 'haskell-servant',  label: 'Servant (Haskell)',              lang: 'Haskell', shape: 'backend',   tier: 'coming-soon', sister: 'java-spring',    note: 'Type-level API spec.' },
  { id: 'haskell-yesod',    label: 'Yesod (Haskell · full-stack)',   lang: 'Haskell', shape: 'fullstack', tier: 'coming-soon', sister: 'java-spring',    note: 'Type-safe Haskell full-stack.' },

  // ── Backend — Swift / Crystal ──
  { id: 'swift-vapor',   label: 'Vapor (Swift)',                     lang: 'Swift',   shape: 'backend',   tier: 'production',  sister: null,             note: 'Swift server framework.' },
  { id: 'swift-humming', label: 'Hummingbird (Swift)',               lang: 'Swift',   shape: 'backend',   tier: 'coming-soon', sister: 'go-gin',         note: 'Lightweight Swift HTTP.' },
  { id: 'crystal-lucky', label: 'Lucky (Crystal)',                   lang: 'Crystal', shape: 'fullstack', tier: 'coming-soon', sister: 'ruby-rails',     note: 'Ruby-like compiled Crystal.' },
  { id: 'crystal-kemal', label: 'Kemal (Crystal)',                   lang: 'Crystal', shape: 'backend',   tier: 'coming-soon', sister: 'go-gin',         note: 'Sinatra-like Crystal.' },
];

// ─── CATALOG_TIERS ────────────────────────────────────────────────────────────

export const CATALOG_TIERS: Record<CatalogTier, CatalogTierDef> = {
  'production':  { label: 'Production', emoji: '✅', color: '#1a7f37', bg: '#dafbe1', tip: 'Full Dockerfile + workflow + knowledge content. Copy-paste safe.' },
  'beta':        { label: 'Beta',       emoji: '🟡', color: '#92400e', bg: '#fff8c5', tip: 'Full code shipped, knowledge fields still under review.' },
  'coming-soon': { label: 'Coming soon',emoji: '⏳', color: '#57606a', bg: '#eef0f3', tip: 'Listed for transparency. Code not ready. Pick the sister framework for now.' },
};

// ─── CATALOG_TO_OPTGROUP ──────────────────────────────────────────────────────
// Only items that need to be slotted into a non-default optgroup are listed here.
// Items not present use the primary dropdown group derived from their lang/shape.

export const CATALOG_TO_OPTGROUP: Record<string, CatalogOptGroup> = {
  // Frontend dropdown overrides
  'preact-vite':     { select: 'sel-frontend', group: 'React — CSR / SPA' },
  'lit':             { select: 'sel-frontend', group: 'Web Components' },
  'qwik-csr':        { select: 'sel-frontend', group: 'Qwik' },
  'redwood':         { select: 'sel-frontend', group: 'React — SSR / Hybrid' },
  'blitz':           { select: 'sel-frontend', group: 'React — SSR / Hybrid' },
  't3':              { select: 'sel-frontend', group: 'React — SSR / Hybrid' },
  'wasp':            { select: 'sel-frontend', group: 'React — SSR / Hybrid' },
  'fresh':           { select: 'sel-frontend', group: 'Deno frontends' },
  'eleventy':        { select: 'sel-frontend', group: 'Meta / Islands' },
  'vitepress':       { select: 'sel-frontend', group: 'Meta / Islands' },
  'docusaurus':      { select: 'sel-frontend', group: 'Meta / Islands' },
  'htmx':            { select: 'sel-frontend', group: 'Server-rendered HTML' },
  'alpine':          { select: 'sel-frontend', group: 'Server-rendered HTML' },
  'flutter':         { select: 'sel-frontend', group: 'Mobile (no container)' },
  'ionic':           { select: 'sel-frontend', group: 'Mobile (no container)' },
  // Backend dropdown overrides
  'nodejs-adonis':   { select: 'sel-backend',  group: 'Node.js' },
  'bun-elysia':      { select: 'sel-backend',  group: 'Bun runtime' },
  'deno-fresh-api':  { select: 'sel-backend',  group: 'Deno runtime' },
  'python-starlette':{ select: 'sel-backend',  group: 'Python' },
  'python-reflex':   { select: 'sel-backend',  group: 'Python' },
  'go-buffalo':      { select: 'sel-backend',  group: 'Go' },
  'java-helidon':    { select: 'sel-backend',  group: 'Java' },
  'java-javalin':    { select: 'sel-backend',  group: 'Java' },
  'java-thymeleaf':  { select: 'sel-backend',  group: 'Java' },
  'java-vaadin':     { select: 'sel-backend',  group: 'Java' },
  'dotnet-carter':   { select: 'sel-backend',  group: '.NET' },
  'dotnet-fastend':  { select: 'sel-backend',  group: '.NET' },
  'dotnet-mvc':      { select: 'sel-backend',  group: '.NET' },
  'dotnet-blazor':   { select: 'sel-backend',  group: '.NET' },
  'dotnet-blazorwa': { select: 'sel-backend',  group: '.NET' },
  'rust-tide':       { select: 'sel-backend',  group: 'Rust' },
  'rust-poem':       { select: 'sel-backend',  group: 'Rust' },
  'rust-leptos':     { select: 'sel-backend',  group: 'Rust' },
  'rust-loco':       { select: 'sel-backend',  group: 'Rust' },
  'ruby-hanami':     { select: 'sel-backend',  group: 'Ruby' },
  'ruby-grape':      { select: 'sel-backend',  group: 'Ruby' },
  'php-codeigniter': { select: 'sel-backend',  group: 'PHP' },
  'php-cakephp':     { select: 'sel-backend',  group: 'PHP' },
  'php-hyperf':      { select: 'sel-backend',  group: 'PHP' },
  'elixir-live':     { select: 'sel-backend',  group: 'Elixir' },
  'elixir-plug':     { select: 'sel-backend',  group: 'Elixir' },
  'erlang-cowboy':   { select: 'sel-backend',  group: 'Erlang' },
  'scala-play':      { select: 'sel-backend',  group: 'Scala' },
  'scala-http4s':    { select: 'sel-backend',  group: 'Scala' },
  'scala-akka':      { select: 'sel-backend',  group: 'Scala' },
  'scala-zio':       { select: 'sel-backend',  group: 'Scala' },
  'clojure-ring':    { select: 'sel-backend',  group: 'Clojure' },
  'clojure-pedestal':{ select: 'sel-backend',  group: 'Clojure' },
  'clojure-luminus': { select: 'sel-backend',  group: 'Clojure' },
  'haskell-servant': { select: 'sel-backend',  group: 'Haskell' },
  'haskell-yesod':   { select: 'sel-backend',  group: 'Haskell' },
  'swift-vapor':     { select: 'sel-backend',  group: 'Swift' },
  'swift-humming':   { select: 'sel-backend',  group: 'Swift' },
  'crystal-lucky':   { select: 'sel-backend',  group: 'Crystal' },
  'crystal-kemal':   { select: 'sel-backend',  group: 'Crystal' },
};
