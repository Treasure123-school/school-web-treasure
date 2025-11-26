import { defineConfig } from "drizzle-kit";

// Database configuration based on environment
const databaseUrl = process.env.DATABASE_URL;

// Use PostgreSQL if DATABASE_URL is present, SQLite otherwise
// This matches the logic in server/db.ts
const usePostgres = !!databaseUrl;

export default defineConfig(
  usePostgres
    ? {
        // PostgreSQL (Neon) configuration for production
        out: "./migrations-pg",
        schema: "./shared/schema.pg.ts",
        dialect: "postgresql",
        dbCredentials: {
          url: databaseUrl!,
        },
        verbose: true,
      }
    : {
        // SQLite configuration for development
        out: "./migrations",
        schema: "./shared/schema.ts",
        dialect: "sqlite",
        dbCredentials: {
          url: "file:./server/data/app.db",
        },
        verbose: true,
      }
);
