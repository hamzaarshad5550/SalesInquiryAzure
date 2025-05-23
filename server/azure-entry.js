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
  
  // Check if dist directory exists
  const distPath = resolve(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('Files in dist directory:', fs.readdirSync(distPath));
  } else {
    console.log('dist directory not found');
  }
  
  // Check if server directory exists
  const serverPath = resolve(process.cwd(), 'server');
  if (fs.existsSync(serverPath)) {
    console.log('Files in server directory:', fs.readdirSync(serverPath));
  } else {
    console.log('server directory not found');
  }
} catch (err) {
  console.error('Error listing files:', err);
}

// Import and start the main server
try {
  // Try multiple possible locations for the server module
  const possiblePaths = [
    './dist/index.js',           // Standard build output
    './server/index.js',         // Direct server file
    './index.js',                // Root index file
    './server/dist/index.js'     // Server dist folder
  ];
  
  let serverPath = null;
  
  // Find the first path that exists
  for (const path of possiblePaths) {
    const fullPath = resolve(process.cwd(), path);
    if (fs.existsSync(fullPath)) {
      serverPath = path;
      console.log('Found server module at:', fullPath);
      break;
    }
  }
  
  if (!serverPath) {
    throw new Error('Could not find server module in any expected location');
  }
  
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
        
        // Try multiple possible locations for static files
        const possiblePublicDirs = [
          resolve(process.cwd(), 'dist', 'public'),
          resolve(process.cwd(), 'public'),
          resolve(process.cwd(), 'dist'),
          process.cwd()
        ];
        
        let publicDir = null;
        
        // Find the first directory that exists and contains index.html
        for (const dir of possiblePublicDirs) {
          if (fs.existsSync(dir) && fs.existsSync(resolve(dir, 'index.html'))) {
            publicDir = dir;
            console.log('Found static files at:', publicDir);
            break;
          }
        }
        
        if (!publicDir) {
          console.error('Could not find static files in any expected location');
          publicDir = process.cwd(); // Fallback to current directory
        }
        
        // Serve static files from the public directory
        app.use(express.static(publicDir));
        
        // Serve index.html for all routes (SPA fallback)
        app.get('*', (req, res) => {
          res.sendFile(resolve(publicDir, 'index.html'));
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




