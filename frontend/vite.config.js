import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Custom plugin to serve root images folder at /images during dev
function serveRootImages() {
  let config
  return {
    name: 'serve-root-images',
    configResolved(cfg) {
      config = cfg
    },
    configureServer(server) {
      return () => {
        server.middlewares.use('/images', (req, res, next) => {
          const imagePath = resolve(__dirname, '..', 'images', req.url === '/' ? '' : req.url.replace(/\?.*/, ''))
          if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
            const ext = imagePath.split('.').pop().toLowerCase()
            const mimeTypes = {
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'png': 'image/png',
              'svg': 'image/svg+xml',
              'gif': 'image/gif',
              'webp': 'image/webp'
            }
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
            res.end(fs.readFileSync(imagePath))
          } else {
            next()
          }
        })
      }
    }
  }
}

export default defineConfig({
  // GitHub Pages base path: set via VITE_BASE environment variable
  // For user/org sites (username.github.io): use "/"
  // For project sites (user.github.io/repo-name): use "/repo-name/"
  base: process.env.VITE_BASE || '/',
  
  plugins: [react(), serveRootImages()],
  
  server: {
    port: 5173,
    open: true,
    host: true,
    strictPort: false,
    middlewareMode: false
  },
  
  resolve: {
    alias: {
      '@images': resolve(__dirname, '..', 'images')
    }
  },
  
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})

