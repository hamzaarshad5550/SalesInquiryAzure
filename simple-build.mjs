import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create directories
const distDir = path.resolve(__dirname, 'dist');
const publicDir = path.resolve(distDir, 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create a simple HTML file
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Inquiry App</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    h1 { color: #333; }
    .card { background: white; border-radius: 0.5rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .btn { display: inline-block; padding: 0.5rem 1rem; background: #3b82f6; color: white; 
           border-radius: 0.25rem; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sales Inquiry App</h1>
    <div class="card">
      <p>Simple build without build tools.</p>
      <p>API Status: <span id="status">Checking...</span></p>
    </div>
  </div>
  <script>
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        document.getElementById('status').textContent = data.message || 'OK';
      })
      .catch(err => {
        document.getElementById('status').textContent = 'Error: ' + err.message;
      });
  </script>
</body>
</html>`;

fs.writeFileSync(path.resolve(publicDir, 'index.html'), htmlContent);

// Build server
console.log('Building server...');
try {
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  console.log('Server build complete');
} catch (error) {
  console.error('Server build failed:', error);
  process.exit(1);
}

console.log('Build completed successfully!');