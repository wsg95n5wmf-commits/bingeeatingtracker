import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

const isBeta = process.env.VITE_APP_ENV === 'beta';

export default defineConfig({
  base: './',
  // Canonical dev-server port. Tool-specific launch configs derive from this.
  server: { port: 5173 },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // Offline-first: every built asset is precached, so the app runs with no network.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html',
      },
      manifest: {
        // Distinct names and ids so an installed beta never merges with the
        // installed production app on the home screen.
        name: isBeta ? 'Tracker (Beta)' : 'Binge Eating Tracker',
        short_name: isBeta ? 'Beta' : 'Tracker',
        description: 'A companion to the self-help program. Records only.',
        start_url: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf9f7',
        theme_color: '#faf9f7',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});
