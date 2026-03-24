import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.NODE_ENV === 'production' ? '/paganello/' : '/'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Only precache the app shell, NOT data files
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Don't wait for old SW to stop — activate immediately
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Data files: serve from cache first, update in background
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tournament-data',
              expiration: {
                maxAgeSeconds: 3600, // 1 hour in SW cache
                maxEntries: 10,
              },
            },
          },
          {
            // Google Apps Script fallback URLs
            urlPattern: /^https:\/\/script\.googleusercontent\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-fallback',
              expiration: {
                maxAgeSeconds: 3600,
                maxEntries: 5,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Paganello 2026',
        short_name: 'Paganello',
        description: 'Paganello Beach Ultimate Tournament Schedule',
        theme_color: '#009fe3',
        background_color: '#faf8f4',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  base,
})
