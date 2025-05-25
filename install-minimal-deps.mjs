import { execSync } from 'child_process';

console.log('Installing minimal set of UI dependencies...');

// Install only the essential packages
try {
  // First clean npm cache to free up space
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('Cleaned npm cache');
  
  // Install shadcn/ui which includes most of what you need
  execSync('npm install @shadcn/ui class-variance-authority clsx tailwind-merge', { stdio: 'inherit' });
  console.log('Installed core UI packages');
  
  // Install only the most essential Radix UI components
  const essentialRadixPackages = [
    '@radix-ui/react-slot',
    '@radix-ui/react-dialog',
    '@radix-ui/react-label'
  ];
  
  execSync(`npm install ${essentialRadixPackages.join(' ')}`, { stdio: 'inherit' });
  console.log('Installed essential Radix UI packages');
  
} catch (error) {
  console.error('Error during installation:', error.message);
}