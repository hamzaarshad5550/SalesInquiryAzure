const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking for Tailwind CSS installation...');

// Delete old config files if they exist
const oldPostcssConfig = path.join(__dirname, 'postcss.config.js');
if (fs.existsSync(oldPostcssConfig)) {
  fs.unlinkSync(oldPostcssConfig);
  console.log('Removed old postcss.config.js file');
}

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
    
    // Create proper PostCSS config file
    fs.writeFileSync(
      path.join(__dirname, 'postcss.config.cjs'),
      `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
};`
    );
    
    // Create a minimal Tailwind config
    fs.writeFileSync(
      path.join(__dirname, 'tailwind.config.cjs'),
      `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};`
    );
    
    console.log('Created PostCSS and Tailwind config files');
  } catch (error) {
    console.error('Failed to install Tailwind CSS:', error);
    process.exit(1);
  }
}

console.log('Tailwind CSS setup complete.');