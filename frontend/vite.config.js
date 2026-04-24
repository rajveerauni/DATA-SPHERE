import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-plotly': ['plotly.js', 'react-plotly.js'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'react-select', 'react-datepicker'],
          'vendor-data': ['axios', 'zustand', '@tanstack/react-virtual'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
