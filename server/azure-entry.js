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
  const serverPath = resolve(process.cwd(), 'dist', 'index.js');
  console.log('Loading server from:', serverPath);
  
  // Import the server module
  import(serverPath)
    .then(() => {
      console.log('Server module loaded successfully');
    })
    .catch(err => {
      console.error('Failed to load server module:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Error starting server:', err);
  process.exit(1);
}


