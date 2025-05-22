import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Enhanced memory management
// This helps prevent memory leaks and excessive memory usage
if (process.env.NODE_ENV === 'production') {
  // Force garbage collection when memory usage gets high
  try {
    // Log initial memory usage
    const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024)} MB`;
    const memoryData = process.memoryUsage();
    
    console.log('Memory usage at startup:');
    console.log(`RSS: ${formatMemoryUsage(memoryData.rss)} | Total: ${formatMemoryUsage(memoryData.heapTotal)} | Used: ${formatMemoryUsage(memoryData.heapUsed)}`);
    
    // Set up periodic memory monitoring and cleanup
    const memoryMonitor = setInterval(() => {
      const memoryData = process.memoryUsage();
      
      // Log memory usage periodically
      console.log('Current memory usage:');
      console.log(`RSS: ${formatMemoryUsage(memoryData.rss)} | Total: ${formatMemoryUsage(memoryData.heapTotal)} | Used: ${formatMemoryUsage(memoryData.heapUsed)}`);
      
      // Calculate memory usage percentage
      const memoryUsagePercent = (memoryData.heapUsed / memoryData.heapTotal) * 100;
      
      // If memory usage is above 85%, try to free memory
      if (memoryUsagePercent > 85) {
        console.log(`High memory usage detected: ${memoryUsagePercent.toFixed(2)}%`);
        
        // Try to force garbage collection if available
        if (global.gc) {
          console.log('Forcing garbage collection');
          global.gc();
          
          // Log memory after garbage collection
          const afterGCMemory = process.memoryUsage();
          console.log('Memory after garbage collection:');
          console.log(`RSS: ${formatMemoryUsage(afterGCMemory.rss)} | Total: ${formatMemoryUsage(afterGCMemory.heapTotal)} | Used: ${formatMemoryUsage(afterGCMemory.heapUsed)}`);
        } else {
          console.log('Garbage collection not exposed. Run with --expose-gc flag to enable manual garbage collection.');
        }
      }
    }, 30000); // Check every 30 seconds
    
    // Clean up the interval on process exit
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, clearing memory monitor');
      clearInterval(memoryMonitor);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, clearing memory monitor');
      clearInterval(memoryMonitor);
    });
    
  } catch (e) {
    console.error('Error setting up memory monitoring:', e);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add route debugging middleware
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.path}`);
  next();
});

// Add a specific middleware to catch path-to-regexp errors before they happen
app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    next();
  } catch (err: any) {
    if (err && err.message && err.message.includes('path-to-regexp')) {
      console.error('PATH-TO-REGEXP ERROR CAUGHT IN MIDDLEWARE:');
      console.error(`Error message: ${err.message}`);
      console.error(`Route path: ${req.path}`);
      return res.status(500).json({ error: 'Route configuration error' });
    }
    next(err);
  }
});

// Regular middleware should come before routes
// Move the error handling middleware after routes are registered

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("Starting server initialization...");
  try {
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");

    // Add this before registering routes to prevent path-to-regexp errors
    app.use((req, res, next) => {
      // Skip Vite's special URLs that contain colons but aren't route parameters
      if (req.url.startsWith('/@') || req.url.includes('node_modules/.vite')) {
        return next();
      }
      
      // Check if the URL has a malformed parameter (colon without a name)
      if (req.url.includes(':') && !req.url.match(/\/:[a-zA-Z0-9_]+/)) {
        console.error(`MALFORMED URL PARAMETER DETECTED: ${req.url}`);
        return res.status(400).json({ error: 'Invalid URL format - missing parameter name' });
      }
      next();
    });

    // Add this after routes are registered to catch any path-to-regexp errors
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err && err.message && err.message.includes('path-to-regexp')) {
        console.error('PATH-TO-REGEXP ERROR DETECTED:');
        console.error(`Error message: ${err.message}`);
        console.error(`Route path: ${req.path}`);
        console.error(`Stack trace: ${err.stack}`);
        return res.status(500).json({ error: 'Route configuration error' });
      }
      next(err);
    });

    app.use(function globalErrorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
      console.error("Express error handler caught:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Server initialization failed:", error);
  }
})();
