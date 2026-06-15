import { defineConfig } from 'astro/config'

// Static output: Astro renders to HTML/CSS/JS at build. The static server
// serves it and proxies API calls to the BFF (Tier C).
export default defineConfig({
  output: 'static',
  // C-1: only PUBLIC_-prefixed env reaches the client.
  vite: { envPrefix: 'PUBLIC_' },
})
