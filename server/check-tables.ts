import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

async function checkTables() {
  const pg = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
  });
  
  try {
    const result = await pg`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log("📊 Existing tables in database:");
    result.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
    
    const tableNames = result.map((r: any) => r.table_name);
    
    // Check for required tables
    const requiredTables = ['users', 'students', 'parent_profiles', 'settings', 'counters'];
    console.log("\n🔍 Required tables check:");
    requiredTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - MISSING`);
      }
    });
    
  } catch (error) {
    console.error("Error checking tables:", error);
  } finally {
    await pg.end();
    process.exit(0);
  }
}

checkTables();
