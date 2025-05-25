
  import { build } from 'vite';
  import react from '@vitejs/plugin-react';
  import path from 'path';
  import { fileURLToPath } from 'url';
  
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  
  async function buildApp() {
    try {
      console.log('Starting Vite build process...');
      console.log('Current directory:', process.cwd());
      console.log('Build directory:', __dirname);
      
      await build({
        configFile: false,
        root: path.resolve(__dirname, 'client'),
        plugins: [react()],
        resolve: {
          alias: {
            "@db": path.resolve(__dirname, "db"),
            "@": path.resolve(__dirname, "client", "src"),
            "@shared": path.resolve(__dirname, "shared"),
            "@assets": path.resolve(__dirname, "attached_assets"),
          },
        },
        build: {
          outDir: path.resolve(__dirname, "dist/public"),
          emptyOutDir: true,
          sourcemap: false,
        },
        logLevel: 'info' // Set to 'info' for more detailed logs
      });
      console.log('Build completed successfully');
    } catch (error) {
      console.error('Build failed with detailed error:');
      console.error(error);
      process.exit(1);
    }
  }
  
  buildApp();
  
