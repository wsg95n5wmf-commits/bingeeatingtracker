import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

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
        name: 'Binge Eating Tracker',
        short_name: 'Tracker',
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
