import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

async function pushSchema() {
  console.log("🔗 Connecting to database...");
  
  const pg = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
  });
  
  const db = drizzle(pg, { schema });
  
  console.log("✅ Connected to database");
  console.log("📊 Pushing schema changes...");
  
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Schema pushed successfully");
  } catch (error: any) {
    if (error.message?.includes("no migration files")) {
      console.log("ℹ️  No migration files found - schema is already in sync");
    } else {
      console.error("❌ Migration error:", error);
      throw error;
    }
  } finally {
    await pg.end();
    console.log("🔌 Database connection closed");
  }
}

pushSchema().catch(console.error);
