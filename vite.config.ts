import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@db": path.resolve(__dirname, "./db"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "client/src/main.tsx")
      },
      external: [
        'react-icons',
        'react-icons/si',
        'gapi-script'
      ]
    },
    emptyOutDir: true,
    sourcemap: false,
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
      
      // Firebase
      "firebase",
      "firebase/app",
      "firebase/auth",

      // CSV Parsing
      "papaparse",

      // Google API
      "gapi-script"
    ],
    exclude: [
      "@babel/preset-typescript",
      "lightningcss",
      "esbuild"
    ]
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    },
    strictPort: true,
    host: true,
  }
});
