import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Workbox',
        short_name: '13-workbox',
        start_url: '/',
      },
    })
  ]
})
