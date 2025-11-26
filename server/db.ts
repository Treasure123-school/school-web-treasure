/**
 * Database Factory
 * 
 * This module provides a unified database interface that automatically
 * switches between SQLite (development) and PostgreSQL/Neon (production).
 * 
 * Environment Detection:
 * - NODE_ENV=development + no DATABASE_URL → SQLite
 * - DATABASE_URL present → PostgreSQL (Neon)
 */

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import Database from "better-sqlite3";
import * as sqliteSchema from "@shared/schema";
import * as pgSchema from "@shared/schema.pg";

// Database instance types
type SqliteDb = ReturnType<typeof drizzleSqlite>;
type PgDb = ReturnType<typeof drizzlePg>;
type DatabaseInstance = SqliteDb | PgDb;

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

// Determine database type
export const isPostgres = !!(databaseUrl && isProduction);
export const isSqlite = !isPostgres;

// Database instance
let db: DatabaseInstance | null = null;
let sqlite: Database.Database | null = null;

/**
 * Get the appropriate schema based on database type
 */
export function getSchema() {
  return isPostgres ? pgSchema : sqliteSchema;
}

/**
 * Initialize and return the database instance
 */
export function initializeDatabase(): DatabaseInstance {
  if (db) {
    return db;
  }

  if (isPostgres && databaseUrl) {
    // PostgreSQL (Neon) for production
    console.log('🐘 Initializing PostgreSQL database (Neon)...');
    const sql = neon(databaseUrl);
    db = drizzlePg(sql, { schema: pgSchema });
    console.log('✅ PostgreSQL database initialized (Neon)');
  } else {
    // SQLite for development
    console.log('📦 Initializing SQLite database...');
    sqlite = new Database('./server/data/app.db');
    
    // Enable foreign keys (SQLite has them disabled by default)
    sqlite.pragma('foreign_keys = ON');
    
    // Performance optimizations for SQLite
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    
    db = drizzleSqlite(sqlite, { schema: sqliteSchema });
    console.log('✅ SQLite database initialized at ./server/data/app.db');
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
 * Close database connections
 */
export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
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
