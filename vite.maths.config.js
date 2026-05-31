import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

function renameMathsHtml() {
  return {
    name: 'rename-maths-html',
    apply: 'build',
    closeBundle() {
      const src = path.resolve('dist-maths/maths.html')
      const dest = path.resolve('dist-maths/index.html')
      if (fs.existsSync(src)) fs.renameSync(src, dest)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Jimmy Maths',
        short_name: 'Jimmy Maths',
        description: 'Maths learning with Jimmy the giraffe',
        theme_color: '#4EA8DE',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
    renameMathsHtml(),
  ],
  build: {
    outDir: 'dist-maths',
    rollupOptions: {
      input: { app: 'maths.html' },
    },
  },
})
