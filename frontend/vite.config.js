import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    coverage: {
      reporter: ['text', 'json'],
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Any request starting with /api gets forwarded to the backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
