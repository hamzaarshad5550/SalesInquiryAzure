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
      }
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
    ],
    exclude: [
      // Exclude Firebase packages to prevent resolution issues
      "firebase",
      "firebase/auth",
      "firebase/app",
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
