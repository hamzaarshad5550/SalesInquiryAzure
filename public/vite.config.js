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
        outDir: "public",
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, "client/src/main.tsx")
            },
            external: [
                'gapi-script',
                'pg',
                'postgres',
                'drizzle-orm',
                'drizzle-zod'
            ],
            output: {
                manualChunks: {
                    'vendor': ['react', 'react-dom', '@tanstack/react-query', 'wouter'],
                    'ui': [
                        'lucide-react',
                        '@radix-ui/react-accordion',
                        '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-aspect-ratio',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-collapsible',
                        '@radix-ui/react-context-menu',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-hover-card',
                        '@radix-ui/react-label',
                        '@radix-ui/react-menubar',
                        '@radix-ui/react-navigation-menu',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-progress',
                        '@radix-ui/react-radio-group',
                        '@radix-ui/react-scroll-area',
                        '@radix-ui/react-select',
                        '@radix-ui/react-separator',
                        '@radix-ui/react-slider',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-switch',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-toast',
                        '@radix-ui/react-toggle',
                        '@radix-ui/react-toggle-group',
                        '@radix-ui/react-tooltip'
                    ]
                }
            }
        },
        emptyOutDir: true,
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        chunkSizeWarningLimit: 1000
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
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
            // Data Management
            "@tanstack/react-query",
            "@supabase/supabase-js",
            // CSV Parsing
            "papaparse",
            // Google API
            "gapi-script",
            // Database
            "pg",
            "postgres",
            "drizzle-orm",
            "drizzle-zod"
        ],
        exclude: [
            "@babel/preset-typescript",
            "lightningcss",
            "esbuild",
            "firebase",
            "firebase/app",
            "firebase/auth"
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
