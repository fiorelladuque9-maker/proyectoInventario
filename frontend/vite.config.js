import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El puerto 5173 debe coincidir con CORS_ALLOWED_ORIGINS del backend.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
