import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/basil-cooking-planner/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Basil — Family Cooking Planner',
        short_name: 'Basil',
        description: 'Basil — family cooking planner, generator rodzinnego jadłospisu',
        lang: 'pl',
        theme_color: '#191512',
        background_color: '#191512',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ttf,woff2}'],
        // prl-hero.png (1.9MB) was previously precached unintentionally — hero.png had
        // an ignore entry but its PRL counterpart didn't. The new landing images are
        // small enough (<150KB each) that they don't need excluding.
        globIgnores: ['**/prl-hero.png'],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
})
