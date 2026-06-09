import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import mkcert from 'vite-plugin-mkcert'

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
    proxy: {
      '/api/': {
        target: 'https://127.0.0.1:7010',
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
