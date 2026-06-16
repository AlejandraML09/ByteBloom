import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: true,
    sourcemap: true
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/login': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/logout': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})