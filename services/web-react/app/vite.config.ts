import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// C-1: only PUBLIC_-prefixed env reaches the client bundle. No secret ships.
export default defineConfig({
  plugins: [react()],
  envPrefix: 'PUBLIC_',
  build: { outDir: 'dist' },
})
