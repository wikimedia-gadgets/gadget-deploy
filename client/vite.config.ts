import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SERVER_PORT = process.env.SERVER_PORT || '3001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '3000'),
    proxy: {
      '/initiate': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
      },
      '/stream': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist'
  }
})
