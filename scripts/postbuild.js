import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
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
exec(`xcopy /E /I /Y "${distDir}\\*" "${publicDir}"`, (error) => {
  if (error) {
    console.error(`Error copying dist files: ${error}`);
    process.exit(1);
  }
  console.log('Dist files copied successfully');

  // Copy files from server to public/server
  const publicServerDir = path.join(publicDir, 'server');
  if (!fs.existsSync(publicServerDir)) {
    fs.mkdirSync(publicServerDir, { recursive: true });
  }
  exec(`xcopy /E /I /Y "${serverDir}\\*" "${publicServerDir}"`, (error) => {
    if (error) {
      console.error(`Error copying server files: ${error}`);
      process.exit(1);
    }
    console.log('Server files copied successfully');

    // Copy web.config to public
    fs.copyFile(webConfigPath, path.join(publicDir, 'web.config'), (error) => {
      if (error) {
        console.error(`Error copying web.config: ${error}`);
        process.exit(1);
      }
      console.log('web.config copied successfully');
    });
  });
}); 