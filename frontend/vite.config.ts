import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  define: {
    global: 'window',
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'https://52.184.102.62.nip.io',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://52.184.102.62.nip.io',
        changeOrigin: true,
        secure: false,
      },
      '/ws-chat': {
        target: 'https://52.184.102.62.nip.io',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/swagger-ui': {
        target: 'https://52.184.102.62.nip.io',
        changeOrigin: true,
        secure: false,
      },
      '/api-docs': {
        target: 'https://52.184.102.62.nip.io',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://52.184.102.62.nip.io',
        changeOrigin: true,
        secure: false,
      }
    },
  },
});
