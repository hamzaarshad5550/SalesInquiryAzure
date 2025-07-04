import { execSync } from 'child_process';

console.log('Installing all missing UI and functionality dependencies...');

// List of all dependencies with specific versions
const dependencies = [
  '@radix-ui/react-toast@1.1.5',
  '@radix-ui/react-slot@1.0.2',
  '@radix-ui/react-avatar@1.0.4',
  '@radix-ui/react-scroll-area@1.0.5',
  '@radix-ui/react-dialog@1.0.5',
  '@radix-ui/react-select@1.2.2',
  '@radix-ui/react-dropdown-menu@2.0.6',
  '@radix-ui/react-tabs@1.0.4',
  '@radix-ui/react-separator@1.0.3',
  '@radix-ui/react-switch@1.0.3',
  '@radix-ui/react-alert-dialog@1.0.5',
  '@radix-ui/react-label@2.0.2',
  '@radix-ui/react-popover@1.0.7',
  '@radix-ui/react-checkbox@1.0.4',
  '@radix-ui/react-aspect-ratio@1.0.3',
  '@radix-ui/react-radio-group@1.1.3',
  '@radix-ui/react-progress@1.0.3',
  '@radix-ui/react-collapsible@1.0.3',
  'class-variance-authority@0.7.0',
  'clsx@2.0.0',
  'tailwind-merge@1.14.0'
];

// Install all dependencies
try {
  console.log('Installing dependencies:', dependencies.join(', '));
  execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
  console.log('All dependencies have been installed successfully!');
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
}

