import { defineConfig } from "drizzle-kit";

// Database configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

// Use PostgreSQL in production with DATABASE_URL, SQLite otherwise
const usePostgres = !!(databaseUrl && isProduction);

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
