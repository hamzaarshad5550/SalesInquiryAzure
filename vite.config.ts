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
      "date-fns",
      
      // Utility
      "class-variance-authority",
      "clsx",
      "tailwind-merge"
    ],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  }
});
