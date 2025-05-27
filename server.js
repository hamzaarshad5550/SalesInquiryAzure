import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './server/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Log startup information
console.log('Starting server in environment:', process.env.NODE_ENV);
console.log('Server directory:', __dirname);

// Parse JSON bodies
app.use(express.json());

// Register API routes
await registerRoutes(app);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});