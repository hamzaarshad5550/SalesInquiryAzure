import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Fixing circular dependency issue...');

// Read package.json
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  y
  // Check if the package has a dependency on itself
  if (packageJson.dependencies && packageJson.dependencies['sales-inquiry-app']) {
    console.log('Found circular dependency. Removing self-reference...');
    
    // Remove the self-reference
    delete packageJson.dependencies['sales-inquiry-app'];
    
    // Write the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json to remove circular dependency');
    
    // Clean install to fix node_modules
    console.log('Cleaning node_modules...');
    try {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    } catch (error) {
      console.log('Could not remove node_modules with rm, trying with rimraf...');
      execSync('npx rimraf node_modules', { stdio: 'inherit' });
    }
    
    console.log('Reinstalling dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('Circular dependency fixed!');
  } else {
    console.log('No circular dependency found in package.json');
  }
} catch (error) {
  console.error('Error fixing circular dependency:', error);
}