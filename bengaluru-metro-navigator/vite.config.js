import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/blr-metro/' : '/'

  return {
    base,
    plugins: [
      react({ fastRefresh: true }),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: {
          enabled: true,
          type: 'module'
        },
        // Include public assets in the precache
        includeAssets: [
          'favicon.svg',
          'tinywow_Namma_Metro_Logo_87426246.svg',
          'data/stations.json',
          'data/attractions.json',
          'data/fares.json'
        ],
        workbox: {
          // Precache build output (exclude large map images — fetched at runtime)
          globPatterns: [
            '**/*.{js,css,html,svg,ico}',
            'data/*.json'
          ],
          globIgnores: ['metro-map.png', 'metro-map.png.jpg'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          // Runtime caching for Google Fonts
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        },
        manifest: {
          name: 'Namma Metro Navigator',
          short_name: 'Metro Nav',
          description: 'Navigate Bengaluru Metro - Route Planner, Attractions & Station Guide',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#F8F9FA',
          theme_color: '#8B008B',
          orientation: 'portrait-primary',
          categories: ['travel', 'navigation', 'utilities'],
          icons: [
            {
              src: 'tinywow_Namma_Metro_Logo_87426246.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Plan Journey',
              short_name: 'Journey',
              url: base,
              description: 'Plan your metro journey'
            },
            {
              name: 'Metro Map',
              short_name: 'Map',
              url: base + 'map',
              description: 'View full metro map'
            },
            {
              name: 'Find Attractions',
              short_name: 'Explore',
              url: base + 'attractions',
              description: 'Discover nearby attractions'
            }
          ]
        }
      })
    ],
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router': ['react-router-dom'],
            'utils': ['fuse.js', 'zustand'],
            'icons': ['lucide-react']
          },
          assetFileNames: (assetInfo) => {
            if (/\.(png|jpe?g|svg|gif|webp|avif)$/i.test(assetInfo.name)) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return 'assets/fonts/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },
      cssCodeSplit: true,
      target: 'es2015',
      cssMinify: true
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
      exclude: []
    }
  }
})