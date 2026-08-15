import { defineConfig } from 'vite'
import postcss from './postcss.config.js'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    host: '0.0.0.0',
    hmr: {
      port: 24678,
    },
    fs: {
      strict: false,
    },
  },
  define: {
    'process.env': {},
  },
  css: {
    postcss,
  },
  resolve: {
    alias: [
      {
        find: /^~.+/,
        replacement: (val) => val.replace(/^~/, ""),
      },
      {
        find: '@',
        replacement: '/src',
      },
    ],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      external: [],
      preserveEntrySignatures: 'strict',
    }
  },
  plugins: [
    react()
  ]
});
