import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite'; // <-- 1. DODAJ OVAJ IMPORT

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- 2. DODAJ OVU FUNKCIJU ODMAH OVDE
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'Phrases Detective',
        short_name: 'PhrasesDet',
        description: 'Detektivska igra pogađanja engleskih idioma u dvoje',
        theme_color: '#3b82f6', 
        background_color: '#f8fafc', 
        display: 'standalone', 
        orientation: 'portrait', 
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});