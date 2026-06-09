import { defineConfig } from 'vite'
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
  server: {
    port: 5173,
    host: '0.0.0.0',
    https: {
      // Read the certificate and key files from your directory
      key: fs.readFileSync(path.resolve(__dirname, '../cert/localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../cert/localhost+2.pem')),
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
