import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './dist/server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Log the current working directory and file paths
console.log('Current working directory:', process.cwd());
console.log('Server file location:', __dirname);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Register API routes
try {
  await registerRoutes(app);
  console.log('Routes registered successfully');
} catch (error) {
  console.error('Error registering routes:', error);
}

// Serve index.html for all other routes
app.get('*', (req, res) => {
  console.log('Serving index.html for path:', req.path);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});