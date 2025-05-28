import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');
const serverDir = path.join(__dirname, '..', 'server');
const webConfigPath = path.join(__dirname, '..', 'web.config');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy files from dist to public
fs.copySync(distDir, publicDir, { overwrite: true });
console.log('Dist files copied successfully');

// Copy files from server to public/server
const publicServerDir = path.join(publicDir, 'server');
if (!fs.existsSync(publicServerDir)) {
  fs.mkdirSync(publicServerDir, { recursive: true });
}
fs.copySync(serverDir, publicServerDir, { overwrite: true });
console.log('Server files copied successfully');

// Copy web.config to public
fs.copyFileSync(webConfigPath, path.join(publicDir, 'web.config'));
console.log('web.config copied successfully'); 