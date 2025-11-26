/**
 * Database Factory
 * 
 * This module provides a unified database interface using PostgreSQL/Neon.
 * SQLite is NOT supported on cloud platforms like Render/Vercel.
 * 
 * Environment Detection:
 * - DATABASE_URL present → PostgreSQL (Neon) - REQUIRED for all deployments
 * - No DATABASE_URL → Error in production, PostgreSQL still required
 */

import { drizzle as drizzlePg } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as pgSchema from "@shared/schema.pg";

// Database instance types
type PgDb = ReturnType<typeof drizzlePg>;
type DatabaseInstance = PgDb;
type NeonClient = ReturnType<typeof neon>;

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

// Always use PostgreSQL - SQLite is not supported on cloud platforms
export const isPostgres = true;
export const isSqlite = false;

// Database instance
let db: DatabaseInstance | null = null;
let pgClient: NeonClient | null = null;

/**
 * Get the appropriate schema (always PostgreSQL)
 */
export function getSchema() {
  return pgSchema;
}

/**
 * Initialize and return the database instance
 */
export function initializeDatabase(): DatabaseInstance {
  if (db) {
    return db;
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is required for PostgreSQL connection');
    console.error('   Please set DATABASE_URL environment variable with your Neon PostgreSQL connection string');
    throw new Error('DATABASE_URL environment variable is required. SQLite is not supported on cloud platforms.');
  }

  // PostgreSQL (Neon) for all environments
  console.log('🐘 Initializing PostgreSQL database (Neon)...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  try {
    pgClient = neon(databaseUrl);
    db = drizzlePg(pgClient, { schema: pgSchema });
    console.log('✅ PostgreSQL database initialized (Neon)');
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL database:', error);
    throw new Error(`PostgreSQL initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return db;
}

/**
 * Get the database instance (initializes if needed)
 */
export function getDatabase(): DatabaseInstance {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Get the raw SQLite connection (deprecated - always returns null)
 */
export function getSqliteConnection(): null {
  return null;
}

/**
 * Get the raw PostgreSQL client
 */
export function getPgClient(): NeonClient | null {
  return pgClient;
}

/**
 * Close database connections
 */
export function closeDatabase(): void {
  pgClient = null;
  db = null;
}

// Export database type info for conditional logic
export const dbInfo = {
  type: 'postgresql',
  isProduction,
  connectionString: 'Neon PostgreSQL'
};

// Initialize on import
const database = initializeDatabase();
export { database as db };
