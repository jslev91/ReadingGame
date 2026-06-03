import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

function renamePhonicsHtml() {
  return {
    name: 'rename-phonics-html',
    apply: 'build',
    closeBundle() {
      const src = path.resolve('dist/phonics.html')
      const dest = path.resolve('dist/index.html')
      if (fs.existsSync(src)) fs.renameSync(src, dest)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    renamePhonicsHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Jimmy Phonics',
        short_name: 'Jimmy',
        description: 'Phonics learning app for 5–6 year olds',
        theme_color: '#facc15',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  appType: 'spa',
  server: {
    open: '/phonics.html',
  },
  build: {
    rollupOptions: {
      input: { app: 'phonics.html' },
    },
  },
})
