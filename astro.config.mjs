// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Static-first build: emits plain HTML/CSS/JS in dist/.
// Output a single root index.html so the studio keeps the
// "drop the file on a static host" property.
export default defineConfig({
  output: 'static',
  outDir: './build',
  integrations: [svelte()],
  build: {
    inlineStylesheets: 'auto'   // small CSS gets inlined; big CSS stays a file
  },
  vite: {
    build: {
      target: 'es2020'
    }
  }
});
