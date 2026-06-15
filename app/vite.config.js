import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Static build for Cloudflare Pages. Data (graph/knowledge/generators) ships
// from public/ — the single source files, copied at build, fetched at runtime.
export default defineConfig({
  plugins: [svelte()],
  build: { outDir: '../site-app', emptyOutDir: true },
})
