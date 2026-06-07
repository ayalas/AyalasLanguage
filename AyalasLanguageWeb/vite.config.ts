import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(), // Standard React fast refresh
      babel({
        presets: [reactCompilerPreset()] // Handles the React Compiler automatically
      })
    ],
    server: {
      proxy: {
        '/api/': {
          target: 'http://localhost:5097',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      sourcemap: true,
      outDir: './dist'
    }
})
