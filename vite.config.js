import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts')) {
            return 'charts'
          }

          if (id.includes('@supabase')) {
            return 'supabase'
          }

          if (id.includes('@tanstack')) {
            return 'query'
          }

          if (id.includes('react-router-dom')) {
            return 'router'
          }

          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'forms'
          }

          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n'
          }

          if (id.includes('@radix-ui')) {
            return 'radix'
          }

          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
