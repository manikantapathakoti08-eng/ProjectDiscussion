import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'https://localhost:8443',
        secure: false, // Bypass SSL validation for backend self-signed cert
        changeOrigin: true,
      },
      '/api': {
        target: 'https://localhost:8443',
        secure: false,
        changeOrigin: true,
      },
      '/ws-chat': {
        target: 'wss://localhost:8443',
        ws: true,
        secure: false,
        changeOrigin: true,
      },
      '/swagger-ui': {
        target: 'https://localhost:8443',
        secure: false,
        changeOrigin: true,
      },
      '/api-docs': {
        target: 'https://localhost:8443',
        secure: false,
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://localhost:8443',
        secure: false,
        changeOrigin: true,
      }
    },
  },
});
