import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/trafikverket': {
        target: 'https://api.trafikinfo.trafikverket.se/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trafikverket/, ''),
      },
    },
  },
  base: '/forsenat/',
})
