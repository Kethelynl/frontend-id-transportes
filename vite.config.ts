import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-maskable-icon.png'],
      manifest: {
        name: 'ID Transportes',
        short_name: 'IDTransportes',
        description: 'Sistema de GestÃ£o de Transportes e LogÃ­stica',
        theme_color: '#007bff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // ForÃ§a a resoluÃ§Ã£o do React para um Ãºnico local (o que estÃ¡ na sua node_modules principal)
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080, // Define a porta de desenvolvimento para 8080
  },
});