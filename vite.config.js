import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
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
          headers: {
            'X-Proxy-Secret': env.PROXY_SECRET
          }
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Performance optimizations
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-chakra': ['@chakra-ui/react', '@chakra-ui/icons', '@emotion/react', '@emotion/styled'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-charts': ['chart.js', 'react-chartjs-2'],
            'vendor-maps': ['leaflet', 'react-leaflet'],
            'vendor-motion': ['framer-motion'],
          },
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 800,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', '@chakra-ui/react', '@tanstack/react-query'],
    },
  };
});
