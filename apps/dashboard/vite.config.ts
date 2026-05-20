import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.API_PROXY_URL ?? 'http://localhost:3000',
      '/auth': process.env.API_PROXY_URL ?? 'http://localhost:3000',
      '/ws': {
        target: process.env.WS_PROXY_URL ?? 'ws://localhost:3000',
        ws: true,
      },
    },
  },
})
