// Direct build script that doesn't rely on npm scripts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting direct build process...');

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install --no-audit', { stdio: 'inherit' });
  execSync('npm install vite@4.5.0 esbuild@0.18.0 @vitejs/plugin-react@4.0.0 --no-audit', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to install dependencies:', error);
  process.exit(1);
}

// Create client directory structure if it doesn't exist
const clientDir = path.resolve(__dirname, 'client');
const clientSrcDir = path.resolve(clientDir, 'src');
if (!fs.existsSync(clientSrcDir)) {
  console.log('Creating client directory structure...');
  fs.mkdirSync(clientSrcDir, { recursive: true });
  
  // Create a minimal index.html
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sales Inquiry App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
  `;
  fs.writeFileSync(path.resolve(clientDir, 'index.html'), indexHtml);
  
  // Create a minimal main.tsx
  const mainTsx = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
  `;
  fs.writeFileSync(path.resolve(clientSrcDir, 'main.tsx'), mainTsx);
  
  // Create a minimal App.tsx
  const appTsx = `
import React from 'react';

function App() {
  return (
    <div>
      <h1>Sales Inquiry App</h1>
    </div>
  );
}

export default App;
  `;
  fs.writeFileSync(path.resolve(clientSrcDir, 'App.tsx'), appTsx);
}

// Create server directory structure if it doesn't exist
const serverDir = path.resolve(__dirname, 'server');
if (!fs.existsSync(serverDir)) {
  console.log('Creating server directory structure...');
  fs.mkdirSync(serverDir, { recursive: true });
  
  // Create a minimal index.ts
  const indexTs = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(path.resolve(__dirname, 'public')));

// All other routes should redirect to index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
  `;
  fs.writeFileSync(path.resolve(serverDir, 'index.ts'), indexTs);
}

// Create dist directory
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build frontend
console.log('Building frontend...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to build frontend:', error);
  process.exit(1);
}

// Build backend
console.log('Building backend...');
try {
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to build backend:', error);
  process.exit(1);
}

console.log('Build completed successfully!');