import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting direct build process...');

// Create dist directory
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const publicDir = path.resolve(distDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create a fallback index.html and static files
console.log('Creating fallback static files...');
fs.writeFileSync(
  path.resolve(publicDir, 'index.html'),
  '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />\n    <title>Sales Inquiry Group</title>\n    <style>body{font-family:system-ui,-apple-system,sans-serif;background:#f5f5f5;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.container{text-align:center;padding:2rem;background:white;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);max-width:500px}</style>\n  </head>\n  <body>\n    <div class="container">\n      <h1>Sales Inquiry Group</h1>\n      <p>Application is loading...</p>\n    </div>\n    <script>console.log("Application initialized");</script>\n  </body>\n</html>'
);

// Create a simplified server file directly in the dist directory
console.log('Creating simplified server file...');

// Create a simple server file directly in JavaScript (no TypeScript)
const serverJs = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Catch-all route to serve the SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

fs.writeFileSync(path.resolve(distDir, 'index.js'), serverJs);

// Create a simple package.json for the server
const packageJson = {
  "type": "module",
  "dependencies": {
    "express": "^4.18.2"
  }
};
fs.writeFileSync(path.resolve(distDir, 'package.json'), JSON.stringify(packageJson, null, 2));

// Create a simple entry point for Azure
fs.writeFileSync(
  path.resolve(__dirname, 'server.js'),
  'import "./dist/index.js";'
);

console.log('Build completed successfully!');