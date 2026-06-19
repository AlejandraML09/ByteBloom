import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backend = (path) => ({
  target: 'http://localhost:8000',
  changeOrigin: true,
  bypass(req) {
    // Si es una navegación de browser (Accept incluye text/html),
    // no proxear: dejar que Vite sirva el index.html del SPA.
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return '/index.html'
    }
    // Si no, dejar que siga el proxy normal hacia el backend.
  }
})

export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: true,
    sourcemap: true
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': backend(),
      '/login': backend(),
      '/logout': backend(),
      '/turnos': backend(),
      '/abonos': backend(),
      '/qr': backend(),
      '/usuarios': backend(),
      '/registro': backend(),
      '/secretarios': backend(),
      '/secretario': backend(),
      '/profesionales': backend(),
      '/reviews': backend(),
      '/zonas': backend(),
      '/recuperar-password': backend(),
      '/restablecer-password': backend(),
    }
  }
})