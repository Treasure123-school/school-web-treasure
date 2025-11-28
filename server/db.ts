/**
 * Database Factory
 * 
 * This module provides a unified database interface using PostgreSQL/Neon.
 * SQLite is NOT supported on cloud platforms like Render/Vercel.
 * 
 * Environment Detection:
 * - DATABASE_URL present → PostgreSQL (Neon) - REQUIRED for all deployments
 * - No DATABASE_URL → Error in production, PostgreSQL still required
 * 
 * IMPORTANT: Uses neon-serverless driver with Pool for TRANSACTION SUPPORT.
 * The neon-http driver does NOT support transactions.
 * 
 * Exports:
 * - db: Drizzle ORM instance (for ORM queries with transaction support)
 * - getPgClient(): Returns neon() client for raw SQL tagged template queries
 * - getPgPool(): Returns Pool for lower-level operations
 */

import { drizzle as drizzlePg } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig, neon } from "@neondatabase/serverless";
import * as pgSchema from "@shared/schema.pg";
import ws from "ws";

// Enable WebSocket support for Neon serverless driver (required for transactions)
neonConfig.webSocketConstructor = ws;

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

// Database instances
let db: DatabaseInstance | null = null;
let pool: Pool | null = null;
let neonClient: NeonClient | null = null;

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

  // PostgreSQL (Neon) for all environments with Pool for transaction support
  console.log('🐘 Initializing PostgreSQL database (Neon with WebSocket)...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  try {
    // Use Pool for Drizzle ORM (supports transactions)
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzlePg(pool, { schema: pgSchema });
    
    // Also create neon client for raw SQL queries (tagged template literals)
    // Note: neon() client uses HTTP by default, but with neonConfig.webSocketConstructor set,
    // it will use WebSocket for connection. For raw queries, HTTP is acceptable since
    // they are single-statement operations (no transactions needed).
    // The Pool is what provides transaction support for Drizzle ORM.
    neonClient = neon(databaseUrl);
    
    console.log('✅ PostgreSQL database initialized (Neon with transaction support)');
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
 * Get the neon client for raw SQL queries (tagged template literals)
 * Use this for: pgClient`SELECT * FROM users WHERE id = ${id}`
 */
export function getPgClient(): NeonClient | null {
  return neonClient;
}

/**
 * Get the raw PostgreSQL pool for lower-level operations
 */
export function getPgPool(): Pool | null {
  return pool;
}

/**
 * Close database connections
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
  pool = null;
  neonClient = null;
  db = null;
}

// Export database type info for conditional logic
export const dbInfo = {
  type: 'postgresql',
  isProduction,
  connectionString: 'Neon PostgreSQL (WebSocket)'
};

// Initialize on import
const database = initializeDatabase();
export { database as db };
