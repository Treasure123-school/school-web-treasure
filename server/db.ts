/**
 * Database Factory
 * 
 * This module provides a unified database interface that automatically
 * switches between SQLite (development) and PostgreSQL/Neon (production).
 * 
 * Environment Detection:
 * - DATABASE_URL present → PostgreSQL (Neon) - regardless of NODE_ENV
 * - No DATABASE_URL → SQLite (local development only)
 */

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import Database from "better-sqlite3";
import * as sqliteSchema from "@shared/schema";
import * as pgSchema from "@shared/schema.pg";
import * as fs from "fs";
import * as path from "path";

// Database instance types
type SqliteDb = ReturnType<typeof drizzleSqlite>;
type PgDb = ReturnType<typeof drizzlePg>;
type DatabaseInstance = SqliteDb | PgDb;
type NeonClient = ReturnType<typeof neon>;

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

// Determine database type - Use PostgreSQL if DATABASE_URL is present (regardless of NODE_ENV)
// This ensures cloud deployments like Render/Vercel always use PostgreSQL
export const isPostgres = !!databaseUrl;
export const isSqlite = !isPostgres;

// Database instance
let db: DatabaseInstance | null = null;
let sqlite: Database.Database | null = null;
let pgClient: NeonClient | null = null;

/**
 * Get the appropriate schema based on database type
 */
export function getSchema() {
  return isPostgres ? pgSchema : sqliteSchema;
}

/**
 * Ensure the SQLite data directory exists
 */
function ensureSqliteDirectory() {
  const dataDir = path.join(process.cwd(), 'server', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created SQLite data directory: ${dataDir}`);
  }
  return dataDir;
}

/**
 * Initialize and return the database instance
 */
export function initializeDatabase(): DatabaseInstance {
  if (db) {
    return db;
  }

  if (isPostgres && databaseUrl) {
    // PostgreSQL (Neon) for production and any environment with DATABASE_URL
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
  } else {
    // SQLite for local development only (when DATABASE_URL is not set)
    console.log('📦 Initializing SQLite database...');
    
    try {
      // Ensure the data directory exists
      ensureSqliteDirectory();
      
      const dbPath = './server/data/app.db';
      sqlite = new Database(dbPath);
      
      // Enable foreign keys (SQLite has them disabled by default)
      sqlite.pragma('foreign_keys = ON');
      
      // Performance optimizations for SQLite
      sqlite.pragma('journal_mode = WAL');
      sqlite.pragma('synchronous = NORMAL');
      
      db = drizzleSqlite(sqlite, { schema: sqliteSchema });
      console.log(`✅ SQLite database initialized at ${dbPath}`);
    } catch (error) {
      console.error('❌ Failed to initialize SQLite database:', error);
      throw new Error(`SQLite initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure you are in local development mode.`);
    }
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
 * Get the raw SQLite connection (only available in development)
 */
export function getSqliteConnection(): Database.Database | null {
  return sqlite;
}

/**
 * Get the raw PostgreSQL client (only available in production with DATABASE_URL)
 */
export function getPgClient(): NeonClient | null {
  return pgClient;
}

/**
 * Close database connections
 */
export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
  pgClient = null;
  db = null;
}

// Export database type info for conditional logic
export const dbInfo = {
  type: isPostgres ? 'postgresql' : 'sqlite',
  isProduction,
  connectionString: isPostgres ? 'Neon PostgreSQL' : './server/data/app.db'
};

// Initialize on import
const database = initializeDatabase();
export { database as db };
