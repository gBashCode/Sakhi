import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sakhi AI',
        short_name: 'Sakhi',
        theme_color: '#DC2626',
        icons: [{src: 'icon-192.png', sizes: '192x192', type: 'image/png'}]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'] }
    })
  ],
})
