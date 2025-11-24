import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { db } from "./storage";
import { seedAcademicTerms } from "./seed-terms";
import { validateEnvironment } from "./validate-env";

// Validate environment variables at startup - fail fast in production if critical vars missing
const isProduction = process.env.NODE_ENV === 'production';
validateEnvironment(isProduction);

const app = express();

// Trust proxy - CRITICAL for Render deployment (enables secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration for Vercel frontend, Replit dev, and localhost
const allowedOrigins = (process.env.NODE_ENV === 'development'
  ? [
      'http://localhost:5173',
      'http://localhost:5000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5000',
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.replit\.dev$/,
      ...(process.env.REPLIT_DEV_DOMAIN ? [`https://${process.env.REPLIT_DEV_DOMAIN}`] : []),
      ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d.trim()}`) : [])
    ]
  : [
      process.env.FRONTEND_URL,
      /^https:\/\/.*\.vercel\.app$/,  // All Vercel deployments (production + preview)
      /^https:\/\/.*\.render\.com$/,
      /^https:\/\/.*\.onrender\.com$/,
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : [])
    ].filter(Boolean)) as (string | RegExp)[];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    // Normalize origin by removing port for comparison
    const originWithoutPort = origin.replace(/:\d+$/, '');

    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        const allowedWithoutPort = allowed.replace(/:\d+$/, '');
        return origin === allowed || 
               origin === allowed.replace(/\/$/, '') ||
               originWithoutPort === allowedWithoutPort ||
               originWithoutPort === allowedWithoutPort.replace(/\/$/, '');
      }
      return allowed.test(origin) || allowed.test(originWithoutPort);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      // Log rejected origins to help debug CORS issues
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

// Enable gzip compression for all responses - MUST be first middleware
app.use(compression({
  level: 6, // Compression level (0-9, 6 is balanced for speed vs compression)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress responses with 'x-no-compression' header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other responses
    return compression.filter(req, res);
  }
}));

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ message: 'Request timeout' });
  });
  res.setTimeout(30000, () => {
    res.status(408).json({ message: 'Response timeout' });
  });
  next();
});

app.use(express.json({ limit: '10mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files as static assets
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const isProduction = process.env.NODE_ENV === 'production';
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Add cache headers for read-only API endpoints
  if (req.method === 'GET' && path.startsWith('/api/')) {
    // Public content can be cached longer
    if (path.includes('/homepage-content') || path.includes('/announcements')) {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120'); // 1-2 minutes
    }
    // User-specific data should not be cached by proxies
    else if (!path.includes('/auth')) {
      res.setHeader('Cache-Control', 'private, max-age=30'); // 30 seconds client cache
    }
  }

  // Only capture response body in development for debugging
  if (!isProduction) {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // ENHANCED: Log ALL 4xx errors to help debug (not just API)
    if (res.statusCode >= 400 && res.statusCode < 500) {
      console.log(`❌ 4xx ERROR: ${req.method} ${req.originalUrl || path} - Status ${res.statusCode} - Referer: ${req.get('referer') || 'none'}`);
    }
    
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Only log response body in development and redact sensitive fields
      if (!isProduction && capturedJsonResponse) {
        const sanitizedResponse = sanitizeLogData(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }
      
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Sanitize sensitive data from logs
function sanitizeLogData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }
  if (data && typeof data === 'object') {
    const sanitized = { ...data };

    // Redact common sensitive fields
    const sensitiveFields = ['password', 'token', 'jwt', 'secret', 'key', 'auth', 'session'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeLogData(sanitized[key]);
      }
    }

    return sanitized;
  }
  return data;
}
(async () => {
  // SQLite Note: Database schema is managed via drizzle-kit push, not migrations
  // Run `npx drizzle-kit push` to sync schema changes to your app.db file
  console.log("✅ Using SQLite database at ./app.db (schema managed via drizzle-kit push)");
  // Seed academic terms if they don't exist
  try {
    console.log("Seeding academic terms if needed...");
    await seedAcademicTerms();
    console.log("✅ Academic terms seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(`⚠️ Academic terms seeding failed: ${errorMessage}`);
  }
  // Seed system settings if they don't exist
  try {
    console.log("Seeding system settings if needed...");
    const { seedSystemSettings } = await import("./seed-system-settings");
    await seedSystemSettings();
    console.log("✅ System settings seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(`⚠️ System settings seeding failed: ${errorMessage}`);
  }
  // Seed super admin account if it doesn't exist
  try {
    console.log("Checking for super admin account...");
    const { seedSuperAdmin } = await import("./seed-superadmin");
    await seedSuperAdmin();
    console.log("✅ Super admin seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(`⚠️ Super admin seeding failed: ${errorMessage}`);
  }
  // Initialize MinIO Storage
  try {
    console.log("Initializing MinIO Storage...");
    const { minioStorage } = await import("./minio-storage");
    
    if (minioStorage.initialize()) {
      await minioStorage.ensureBucketsExist();
      console.log("✅ MinIO Storage initialized and buckets verified");
    } else {
      console.warn("⚠️  MinIO Storage initialization failed - uploads will not work");
      if (isProduction) {
        console.error("🚨 CRITICAL: MinIO Storage required in production!");
        process.exit(1);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ MinIO initialization error: ${errorMessage}`);
    if (isProduction) {
      process.exit(1);
    }
  }
  // IMMEDIATE SECURITY BLOCK: Block dangerous maintenance routes
  app.all(["/api/update-demo-users", "/api/test-update"], (req, res) => {
    console.log(`🚨 BLOCKED dangerous route: ${req.method} ${req.path}`);
    res.status(410).json({ message: "Gone - Route disabled for security" });
  });

  const server = await registerRoutes(app);

  // Initialize Socket.IO for realtime features
  try {
    console.log("Initializing Socket.IO Realtime Service...");
    const { realtimeService } = await import("./realtime-service");
    realtimeService.initialize(server);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Socket.IO initialization error: ${errorMessage}`);
  }

  // Multer error handling middleware - must come before general error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'MulterError' || err.message?.includes('Only image files') || err.message?.includes('Only document files') || err.message?.includes('Only CSV files')) {
      console.log(`MULTER ERROR: ${req.method} ${req.path} - ${err.message}`);
      
      let status = 400;
      let message = err.message;
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File size exceeds the maximum allowed limit';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        message = 'Unexpected file field';
      }
      return res.status(status).json({ message });
    }
    next(err);
  });

  // General error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.log(`ERROR: ${req.method} ${req.path} - ${err.message}`);

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // Check if running on Replit (development environment)
  const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
  
  if (app.get("env") === "development" || isReplit) {
    // Serve Vite dev server on Replit or when NODE_ENV=development
    await setupVite(app, server);
  } else if (!process.env.FRONTEND_URL) {
    // Only serve static frontend if FRONTEND_URL is not set (self-hosted mode)
    // When using Vercel for frontend, FRONTEND_URL should be set and frontend won't be served from backend
    serveStatic(app);
  }
  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`serving on port ${port}`);
  });
})();