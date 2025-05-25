const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking for Tailwind CSS installation...');

let tailwindInstalled = false;
try {
  require.resolve('tailwindcss');
  tailwindInstalled = true;
  console.log('Tailwind CSS is already installed.');
} catch (error) {
  console.log('Tailwind CSS is not installed. Installing now...');
}

if (!tailwindInstalled) {
  try {
    execSync('npm install -D tailwindcss postcss autoprefixer', { stdio: 'inherit' });
    console.log('Tailwind CSS installed successfully.');
    
    // Initialize Tailwind if config doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'tailwind.config.js')) && 
        !fs.existsSync(path.join(__dirname, 'tailwind.config.ts'))) {
      console.log('Initializing Tailwind CSS...');
      execSync('npx tailwindcss init -p', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Failed to install Tailwind CSS:', error);
    process.exit(1);
  }
}

console.log('Tailwind CSS setup complete.');