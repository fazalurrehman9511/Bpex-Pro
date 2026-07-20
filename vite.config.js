import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { bpexchProxyPlugin } from './vite-plugin-bpexch-proxy.js'

/** Serve .apk with Android package MIME so phones install instead of treating as unknown file. */
function apkMimePlugin() {
  const setApkHeaders = (req, res, next) => {
    if (req.url?.split('?')[0].endsWith('.apk')) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive')
      res.setHeader('Content-Disposition', 'attachment; filename="flowexch.apk"')
    }
    next()
  }
  return {
    name: 'apk-mime',
    configureServer(server) {
      server.middlewares.use(setApkHeaders)
    },
    configurePreviewServer(server) {
      server.middlewares.use(setApkHeaders)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      apkMimePlugin(),
      bpexchProxyPlugin({
        brandName: env.VITE_EMBED_BRAND_NAME || 'BPEXCH',
        syncSecret: env.BPEXCH_SYNC_SECRET || env.VITE_BPEXCH_SYNC_SECRET || '',
        apiBaseUrl: env.API_BASE_URL || 'http://localhost:3001',
      }),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: [
          'favicon.ico',
          'favicon.svg',
          'favicon-16x16.png',
          'favicon-32x32.png',
          'apple-touch-icon.png',
          'icon.svg',
          'icon.png',
          'icon-48x48.png',
          'icon-72x72.png',
          'icon-96x96.png',
          'icon-144x144.png',
          'icon-192x192.png',
          'icon-256x256.png',
          'icon-384x384.png',
          'icon-512x512.png',
        ],
        manifest: {
          name: 'BpxPro — Betting Exchange',
          short_name: 'BpxPro',
          description: "Pakistan's trusted betting exchange. Cricket, Casino & Sports.",
          theme_color: '#0a4d2e',
          background_color: '#0a4d2e',
          display: 'standalone',
          orientation: 'portrait',
          id: 'https://bpexpro.com/',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icon-48x48.png', sizes: '48x48', type: 'image/png', purpose: 'any' },
            { src: '/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
            { src: '/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
            { src: '/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
            { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-256x256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
            { src: '/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
            { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
          navigateFallbackDenylist: [
            /^\/bpexch/,
            /^\/api/,
            /^\/uploads/,
            /^\/app/,
            /^\/admin/,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/[^/]+\/bpexch\/.*/i,
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
