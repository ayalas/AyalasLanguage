import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import mkcert from 'vite-plugin-mkcert'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), // Standard React fast refresh
    babel({
      presets: [reactCompilerPreset()] // Handles the React Compiler automatically
    }),
    mkcert()
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
      key: fs.readFileSync(path.resolve(__dirname, '../cert/private.key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../cert/public.key.pem')),
    },
    proxy: {
      '/api/': {
        target: 'https://langapp.xyz:7010',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    sourcemap: true,
    outDir: './dist'
  }
})
