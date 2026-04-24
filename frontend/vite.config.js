import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import boneyard from 'boneyard-js/vite'

export default defineConfig({
  plugins: [
    react(),
    boneyard(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  base: '/',
  server: {
    port: 5173,
    allowedHosts: ["rectified-makeshift-perky.ngrok-free.dev"],
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/images': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    minify: 'terser',
    target: 'esnext',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2
      },
      mangle: true
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            if (id.includes('react-quill-new') || id.includes('quill')) {
              return 'vendor-editor';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            if (id.includes('@heroicons')) {
              return 'vendor-icons';
            }
            if (id.includes('axios') || id.includes('dompurify') || id.includes('helmet')) {
              return 'vendor-utils';
            }
            return 'vendor-others';
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios']
  }
})

