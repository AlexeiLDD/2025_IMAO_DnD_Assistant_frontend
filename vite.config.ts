import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/2025_IMAO_DnD_Assistant_frontend/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/generate_battle': {
        target: 'http://95.31.164.69:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      app: '/src/app',
      entities: '/src/entities',
      pages: '/src/pages',
      shared: '/src/shared',
    },
  },
});
