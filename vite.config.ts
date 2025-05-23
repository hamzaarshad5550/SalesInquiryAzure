import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      external: [
        // Radix UI components
        '@radix-ui/react-slot',
        '@radix-ui/react-popover',
        '@radix-ui/react-dialog',
        '@radix-ui/react-select',
        '@radix-ui/react-toast',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog',
        '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-label',
        '@radix-ui/react-separator',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-radio-group',
        '@radix-ui/react-progress',
        '@radix-ui/react-collapsible',
        
        // Supabase
        '@supabase/supabase-js'
      ],
    }
  },
  optimizeDeps: {
    include: [
      // Core React
      "react",
      "react-dom",
      "react/jsx-runtime",
      
      // Routing
      "wouter",
      
      // UI Components
      "lucide-react",
      "react-icons",
      "react-icons/si",
      "recharts",
      
      // Data Management
      "@tanstack/react-query",
      "@supabase/supabase-js",
      
      // Authentication
      "firebase",
      "firebase/auth",
      "firebase/app",
      "gapi-script",
      
      // Data Processing
      "papaparse",
      
      // Form Handling
      "@hookform/resolvers",
      "@hookform/resolvers/zod",
      "react-hook-form",
      "zod",
      
      // Date Handling
      "date-fns"
    ],
    exclude: [
      '@radix-ui/react-slot',
      '@radix-ui/react-popover',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-progress',
      '@radix-ui/react-collapsible'
    ]
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  }
});
