import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Checking for missing dependencies...');

// Read package.json from backup project
const backupPackageJsonPath = 'D:/Work/Python/backup for sales/SalesInquiryAzure/package.json';
const currentPackageJsonPath = path.resolve(__dirname, 'package.json');

try {
  const backupPackageJson = JSON.parse(fs.readFileSync(backupPackageJsonPath, 'utf8'));
  const currentPackageJson = JSON.parse(fs.readFileSync(currentPackageJsonPath, 'utf8'));
  
  // Check dependencies
  const missingDeps = [];
  const missingDevDeps = [];
  
  if (backupPackageJson.dependencies) {
    for (const [dep, version] of Object.entries(backupPackageJson.dependencies)) {
      if (!currentPackageJson.dependencies || !currentPackageJson.dependencies[dep]) {
        missingDeps.push(`${dep}@${version}`);
      }
    }
  }
  
  if (backupPackageJson.devDependencies) {
    for (const [dep, version] of Object.entries(backupPackageJson.devDependencies)) {
      if (!currentPackageJson.devDependencies || !currentPackageJson.devDependencies[dep]) {
        missingDevDeps.push(`${dep}@${version}`);
      }
    }
  }
  
  // Install missing dependencies
  if (missingDeps.length > 0) {
    console.log('Installing missing dependencies:', missingDeps.join(', '));
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  } else {
    console.log('No missing dependencies found.');
  }
  
  // Install missing dev dependencies
  if (missingDevDeps.length > 0) {
    console.log('Installing missing dev dependencies:', missingDevDeps.join(', '));
    execSync(`npm install --save-dev ${missingDevDeps.join(' ')}`, { stdio: 'inherit' });
  } else {
    console.log('No missing dev dependencies found.');
  }
  
  console.log('All dependencies have been installed!');
} catch (error) {
  console.error('Error checking or installing dependencies:', error);
  process.exit(1);
}