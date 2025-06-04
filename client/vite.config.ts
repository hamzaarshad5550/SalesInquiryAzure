import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable build optimization
    minify: 'esbuild',
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'query-vendor': ['@tanstack/react-query'],
          'date-vendor': ['date-fns'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
    // Disable source maps in production for faster builds
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096,
  },
  // Optimize development server
  server: {
    hmr: true,
    watch: {
      usePolling: false,
    },
  },
  // Optimize TypeScript
  esbuild: {
    target: 'es2020',
    treeShaking: true,
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
}); 