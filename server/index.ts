import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./storage";
import { seedAcademicTerms } from "./seed-terms";


const app = express();

// CORS configuration for Vercel frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.NODE_ENV === 'development' 
    ? ['http://localhost:5173', 'http://localhost:5000', /\.vercel\.app$/]
    : /\.vercel\.app$/,
  credentials: true,
  optionsSuccessStatus: 200
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

      log(logLine);
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
  // Apply database migrations at startup
  try {
    log("Applying database migrations...");
    await migrate(db, { migrationsFolder: "./migrations" });
    log("✅ Database migrations completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Check if this is a benign idempotency case (migrations already applied)
    const errorCode = (error as any)?.cause?.code;
    const isIdempotencyError = errorMessage.includes('already exists') ||
                              (errorMessage.includes('relation') && errorMessage.includes('already exists')) ||
                              errorMessage.includes('duplicate key') ||
                              errorMessage.includes('nothing to migrate') ||
                              errorMessage.includes('PostgresError: relation') ||
                              errorCode === '42P07' || // relation already exists
                              errorCode === '42710'; // type already exists

    if (isIdempotencyError) {
      log(`ℹ️ Migrations already applied: ${errorMessage}`);
    } else {
      // This is a real migration error - log it prominently but still continue
      console.error(`🚨 MIGRATION ERROR: ${errorMessage}`);
      console.error(error);
      log(`⚠️ Migration failed: ${errorMessage}`);

      // In production, we might want to fail fast on real migration errors
      if (process.env.NODE_ENV === 'production') {
        console.error('Production migration failure detected. Review required.');
        // Uncomment the next line if you want to fail fast in production:
        // process.exit(1);
      }
    }
  }

  // Seed academic terms if they don't exist
  try {
    log("Seeding academic terms if needed...");
    await seedAcademicTerms();
    log("✅ Academic terms seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`🚨 ACADEMIC TERMS SEEDING ERROR: ${errorMessage}`);
    console.error(error);
    log(`⚠️ Academic terms seeding failed: ${errorMessage}`);
  }

  // Initialize student self-registration setting if not exists
  // Note: This is optional - registration will work even if settings table doesn't exist
  try {
    const { storage } = await import("./storage");
    const existingSetting = await storage.getSetting('allow_student_self_registration');
    if (!existingSetting) {
      await storage.createSetting({
        key: 'allow_student_self_registration',
        value: 'true',
        description: 'Allow students to self-register with automatic parent account creation',
        dataType: 'boolean'
      });
      log("✅ Student self-registration setting initialized");
    } else {
      log("ℹ️ Student self-registration setting already exists");
    }
  } catch (error) {
    // Settings table might not exist yet - that's okay, registration will work anyway
    log(`ℹ️ Registration setting initialization skipped (table may not exist): ${error instanceof Error ? error.message : error}`);
  }


  // IMMEDIATE SECURITY BLOCK: Block dangerous maintenance routes
  app.all(["/api/update-demo-users", "/api/test-update"], (req, res) => {
    log(`🚨 BLOCKED dangerous route: ${req.method} ${req.path}`);
    res.status(410).json({ message: "Gone - Route disabled for security" });
  });

  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`ERROR: ${req.method} ${req.path} - ${err.message}`);
    console.error(err.stack);

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
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
    log(`serving on port ${port}`);
  });
})();