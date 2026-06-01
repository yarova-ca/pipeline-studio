import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vite PWA Plugin',
        short_name: '13-vite-pwa',
        start_url: '/',
      },
    })
  ]
})
