import postgres from "postgres";
import { readFileSync } from "fs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

async function runMigration() {
  const pg = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
  });
  
  try {
    console.log("📊 Running migration: 0016_add_settings_and_counters.sql");
    
    const migrationSQL = readFileSync('migrations/0016_add_settings_and_counters.sql', 'utf-8');
    
    await pg.unsafe(migrationSQL);
    
    console.log("✅ Migration completed successfully");
    
    // Verify tables were created
    const result = await pg`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('settings', 'counters')
      ORDER BY table_name
    `;
    
    console.log("\n✅ Verified tables:");
    result.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pg.end();
    process.exit(0);
  }
}

runMigration();
