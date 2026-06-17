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
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/login': { target: 'http://localhost:8000', changeOrigin: true },
      '/logout': { target: 'http://localhost:8000', changeOrigin: true },
      '/turnos': { target: 'http://localhost:8000', changeOrigin: true },
      '/abonos': { target: 'http://localhost:8000', changeOrigin: true },
      '/qr': { target: 'http://localhost:8000', changeOrigin: true },
      '/usuarios': { target: 'http://localhost:8000', changeOrigin: true },
      '/registro': { target: 'http://localhost:8000', changeOrigin: true },
      '/secretarios': { target: 'http://localhost:8000', changeOrigin: true },
      '/profesionales': { target: 'http://localhost:8000', changeOrigin: true },
      '/recuperar-password': { target: 'http://localhost:8000', changeOrigin: true },
      '/restablecer-password': { target: 'http://localhost:8000', changeOrigin: true },
    }
  }
})