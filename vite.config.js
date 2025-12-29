import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../cert.pem')),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/labs': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
});

