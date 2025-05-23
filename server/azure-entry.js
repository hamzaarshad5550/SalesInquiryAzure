// This file serves as an entry point for Azure App Service
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Set up global __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log environment information
console.log('Starting server in Azure environment');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 8080);

// Check if we're running in Azure
const isAzure = process.env.WEBSITE_SITE_NAME !== undefined;
console.log('Running in Azure:', isAzure);

// Log directory contents for debugging
try {
  console.log('Current directory:', process.cwd());
  console.log('Files in current directory:', fs.readdirSync(process.cwd()));
  console.log('Files in dist directory:', fs.readdirSync(resolve(process.cwd(), 'dist')));
} catch (err) {
  console.error('Error listing files:', err);
}

// Import and start the main server
try {
  // In Azure, the index.js file is in the dist directory
  const serverPath = './dist/index.js';
  console.log('Loading server from:', serverPath);
  
  // Import the server module
  import(serverPath)
    .then(() => {
      console.log('Server module loaded successfully');
    })
    .catch(err => {
      console.error('Failed to load server module:', err);
      
      // Fallback to serving static files if server fails to load
      console.log('Attempting to serve static files only...');
      import('express').then(({ default: express }) => {
        const app = express();
        const port = process.env.PORT || 8080;
        
        // Serve static files from the public directory
        app.use(express.static(resolve(process.cwd(), 'dist', 'public')));
        
        // Serve index.html for all routes (SPA fallback)
        app.get('*', (req, res) => {
          res.sendFile(resolve(process.cwd(), 'dist', 'public', 'index.html'));
        });
        
        app.listen(port, () => {
          console.log(`Fallback static server running on port ${port}`);
        });
      }).catch(fallbackErr => {
        console.error('Failed to start fallback server:', fallbackErr);
        process.exit(1);
      });
    });
} catch (err) {
  console.error('Error starting server:', err);
  process.exit(1);
}



