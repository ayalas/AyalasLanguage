import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/admin/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    // This line tells Vitest to simulate a browser environment for all tests
    environment: 'jsdom', 
    globals: true, // Optional: allows you to use describe, it, expect without importing them
    setupFiles: ['./vitest.setup.ts'],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    https: {
      // Read the certificate and key files from your directory
      key: fs.readFileSync(path.resolve(__dirname, '../../cert/localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../cert/localhost+2.pem')),
    },
    proxy: {
      '/admin/api/': {
        target: 'https://localhost:7010',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    sourcemap: true,
    outDir: './admin'
  }
})
