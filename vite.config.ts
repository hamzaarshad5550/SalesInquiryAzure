import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@db": path.resolve(import.meta.dirname, "db"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  optimizeDeps: {
    include: [
      "@radix-ui/react-popover",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-toast",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-slot",
      "@radix-ui/react-aspect-ratio",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-separator",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-progress",
      "@radix-ui/react-collapsible",
    ],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [],
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  }
});
