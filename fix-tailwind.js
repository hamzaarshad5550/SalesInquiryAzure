const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Fixing Tailwind CSS configuration...');

// Install required Tailwind plugins
console.log('Installing Tailwind plugins...');
try {
  execSync('npm install -D tailwindcss postcss autoprefixer tailwindcss-animate @tailwindcss/typography', { stdio: 'inherit' });
} catch (error) {
  console.error('Error installing Tailwind plugins:', error.message);
}

// Create proper PostCSS config
const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;

fs.writeFileSync(path.join(__dirname, 'postcss.config.js'), postcssConfig);
console.log('Created postcss.config.js');

// Create proper Tailwind config
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};`;

fs.writeFileSync(path.join(__dirname, 'tailwind.config.js'), tailwindConfig);
console.log('Created tailwind.config.js');

// Fix index.css
const clientSrcDir = path.join(__dirname, 'client', 'src');
if (!fs.existsSync(clientSrcDir)) {
  fs.mkdirSync(clientSrcDir, { recursive: true });
}

const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222 47% 11%;
    
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    
    --primary: 246 85.5% 67.1%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 199 89.3% 48.2%;
    --secondary-foreground: 0 0% 100%;
    
    --accent: 173 79.1% 40.2%;
    --accent-foreground: 0 0% 100%;
    
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 246 85.5% 67.1%;
    
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}`;

fs.writeFileSync(path.join(clientSrcDir, 'index.css'), indexCss);
console.log('Created client/src/index.css');

// Create a simple HTML file to test
const clientDir = path.join(__dirname, 'client');
if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir, { recursive: true });
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tailwind Test</title>
  <link rel="stylesheet" href="./src/index.css">
</head>
<body>
  <div class="bg-background text-foreground p-4">
    <h1 class="text-2xl font-bold">Tailwind Test</h1>
    <p class="text-primary">This is a test of Tailwind CSS</p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(clientDir, 'index.html'), htmlContent);
console.log('Created client/index.html');

console.log('Tailwind CSS setup complete. Run "npx tailwindcss -i ./client/src/index.css -o ./client/dist/output.css" to test.');