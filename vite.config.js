import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: 
      fs.existsSync(path.resolve(__dirname, '../server.key')) && 
      fs.existsSync(path.resolve(__dirname, '../cert.pem'))
        ? {
            key: fs.readFileSync(path.resolve(__dirname, '../server.key')),
            cert: fs.readFileSync(path.resolve(__dirname, '../cert.pem')),
          }
        : undefined,
    proxy: {
      '/api': {
        target: 'https://api-water-monitoring.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },

  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

