import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // GitHub Pages base path: set via VITE_BASE environment variable
  // For user/org sites (username.github.io): use "/"
  // For project sites (user.github.io/repo-name): use "/repo-name/"
  base: process.env.VITE_BASE || '/',
  
  plugins: [react()],
  
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
    sourcemap: false
  }
})

