import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import fs from 'fs'
import path from 'path'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), // Standard React fast refresh
    babel({
      presets: [reactCompilerPreset()] // Handles the React Compiler automatically
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lang App',
        id: "/",
        start_url: "/",
        short_name: 'LangAppFSexp',
        description: 'Enjoy Lang App in a dedicated fullscreen experience',
        theme_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    legacy({
      targets: ['chrome >= 80', 'android >= 10'],
      // This will automatically include the replaceAll polyfill among others
    })
  ],
  test: {
    // This line tells Vitest to simulate a browser environment for all tests
    environment: 'jsdom', 
    globals: true, // Optional: allows you to use describe, it, expect without importing them
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 8000,
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    https: {
      // Read the certificate and key files from your directory
      key: fs.readFileSync(path.resolve(__dirname, '../../local_certs/localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../local_certs/localhost+2.pem')),
    },
    proxy: {
      '/api/': {
        target: 'https://localhost:7010',
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
