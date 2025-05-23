// ES Module compatible build preparation script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('Preparing build environment...');

// Ensure all Radix UI dependencies are installed
const radixDeps = [
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
];

// Check if Radix UI dependencies are installed
for (const dep of radixDeps) {
  try {
    const depPath = path.join(rootDir, 'node_modules', dep);
    if (!fs.existsSync(depPath)) {
      console.log(`Installing missing dependency: ${dep}`);
      execSync(`npm install ${dep}`, { stdio: 'inherit' });
    } else {
      console.log(`✓ ${dep} is installed`);
    }
  } catch (error) {
    console.error(`Error checking/installing ${dep}:`, error);
  }
}

// Ensure vite.config.ts has the correct configuration
const viteConfigPath = path.join(rootDir, 'vite.config.ts');
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// Check if rollupOptions.external includes Radix UI components
if (!viteConfig.includes('@radix-ui/react-slot')) {
  console.log('Updating vite.config.ts to include Radix UI externals...');
  
  // Replace the rollupOptions section
  viteConfig = viteConfig.replace(
    /rollupOptions:\s*{[^}]*}/,
    `rollupOptions: {
      external: [
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
      ],
    }`
  );
  
  // Update the optimizeDeps.exclude section
  if (!viteConfig.includes('exclude: [')) {
    viteConfig = viteConfig.replace(
      /optimizeDeps:\s*{[^}]*}/,
      `optimizeDeps: {
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
      }`
    );
  }
  
  fs.writeFileSync(viteConfigPath, viteConfig);
  console.log('Updated vite.config.ts successfully');
}

console.log('Build preparation complete!');