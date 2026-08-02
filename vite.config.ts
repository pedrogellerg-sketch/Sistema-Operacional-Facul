import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * O caminho onde o app é servido.
 *
 * GitHub Pages publica em `/<nome-do-repo>/`, então o workflow passa
 * `BASE_PATH`. Vercel, Netlify e o dev server servem na raiz e não precisam
 * de nada. Manter isso configurável evita ter dois builds diferentes.
 */
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Precisa do caminho completo: em subdiretório, 'index.html' sozinho
        // faz o service worker devolver 404 em links diretos.
        navigateFallback: `${base}index.html`,
      },
      manifest: {
        name: 'Sistema Fernando',
        short_name: 'Sistema F',
        description:
          'Seu sistema operacional pessoal: estudo, treino, alimentação e rotina em execução.',
        lang: 'pt-BR',
        theme_color: '#0A0B0D',
        background_color: '#0A0B0D',
        display: 'standalone',
        orientation: 'portrait',
        // `scope` define o que conta como "dentro do app" quando instalado.
        start_url: base,
        scope: base,
        categories: ['education', 'productivity', 'health'],
        icons: [
          // Relativos de propósito: o plugin prefixa com a base.
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
