// This is a simple startup script for Azure
console.log('Starting application via startup.js...');

// Import the main entry point
import('./azure-entry.js')
  .then(() => {
    console.log('Application started successfully');
  })
  .catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
