import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Client invariant suite for the web-astro app (Astro static site).
// Each test maps to one client invariant by C-id. These are cheap, runner-free
// checks (node --test): no browser, no full build required.

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(appDir, 'src')
const distDir = join(appDir, 'dist')

function readAll(dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      out.push(...readAll(full))
    } else {
      out.push([full, readFileSync(full, 'utf8')])
    }
  }
  return out
}

// Patterns that look like real secrets / third-party credentials. If any of
// these appear in client-shipped code, a secret has leaked into the bundle.
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{16,}/, // OpenAI / Anthropic-style secret keys
  /AKIA[0-9A-Z]{16}/, // AWS access key id
  /AIza[0-9A-Za-z\-_]{20,}/, // Google API key
  /xox[baprs]-[0-9A-Za-z-]{10,}/, // Slack token
  /ghp_[0-9A-Za-z]{20,}/, // GitHub personal token
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, // private key block
  /JWT_SECRET/, // server JWT signing secret must never reach the client
  /[A-Za-z0-9_]*(SECRET|PASSWORD|PRIVATE_KEY)[A-Za-z0-9_]*\s*[:=]\s*['"][^'"]+['"]/,
]

test('C-1: astro config enforces PUBLIC_ env prefix — only PUBLIC_ env can reach the bundle', () => {
  const astroConfig = readFileSync(join(appDir, 'astro.config.mjs'), 'utf8')
  assert.match(
    astroConfig,
    /envPrefix\s*:\s*['"]PUBLIC_['"]/,
    'astro.config.mjs must set vite.envPrefix: "PUBLIC_" so only PUBLIC_-prefixed env is exposed',
  )
})

test('C-1: every import.meta.env reference in src uses a PUBLIC_-prefixed name', () => {
  const refs = []
  for (const [path, content] of readAll(srcDir)) {
    const re = /import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g
    let m
    while ((m = re.exec(content)) !== null) refs.push([path, m[1]])
  }
  for (const [path, name] of refs) {
    assert.ok(
      name.startsWith('PUBLIC_'),
      `${path} reads import.meta.env.${name} — non-PUBLIC env must not reach the client`,
    )
  }
})

test('C-1: built bundle (if present) contains no secret-shaped string', () => {
  const files = readAll(distDir)
  if (files.length === 0) {
    // No build artifact in this checkout — config-level check above is authoritative.
    return
  }
  for (const [path, content] of files) {
    for (const pat of SECRET_PATTERNS) {
      assert.ok(!pat.test(content), `secret-shaped value matching ${pat} found in built file ${path}`)
    }
  }
})

test('C-3: client source embeds no third-party API key or token', () => {
  for (const [path, content] of readAll(srcDir)) {
    for (const pat of SECRET_PATTERNS) {
      assert.ok(!pat.test(content), `third-party credential matching ${pat} found in ${path}`)
    }
  }
})

test('C-6: the static server sets CSP and security headers on served HTML', () => {
  const server = readFileSync(join(appDir, 'server.mjs'), 'utf8')
  assert.match(server, /Content-Security-Policy/, 'server.mjs must set a Content-Security-Policy header')
  assert.match(server, /X-Content-Type-Options/, 'server.mjs must set X-Content-Type-Options')
  assert.match(server, /X-Frame-Options/, 'server.mjs must set X-Frame-Options')
  assert.match(server, /default-src 'self'/, "CSP must lock default-src to 'self'")
  assert.match(server, /object-src 'none'/, "CSP must set object-src 'none'")
})

test('C-3/graceful-failure: the page fetches only its own origin and handles BFF failure', () => {
  // Astro is static HTML — there is no React error boundary (C-7 N/A here).
  // The client-side equivalent: the inline fetch targets a same-origin path and
  // has a .catch that surfaces a visible state instead of failing silently.
  const page = readFileSync(join(srcDir, 'pages', 'index.astro'), 'utf8')
  assert.match(page, /fetch\(\s*['"]\/compliance['"]\s*\)/, 'page must fetch its own same-origin BFF path')
  assert.match(page, /\.catch\(/, 'the BFF fetch must have a .catch so failure is not silently swallowed')
})
