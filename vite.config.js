import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the loopback address instead of relying on Vite's `localhost` default,
    // which on IPv6-preferring machines binds [::1] only and leaves
    // http://127.0.0.1:5173 refusing connections. Loopback stays loopback --
    // do not widen this to 0.0.0.0.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
