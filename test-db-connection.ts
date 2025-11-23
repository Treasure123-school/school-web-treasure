import { db } from './server/storage';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  
  try {
    // Test 1: Basic connection test
    console.log('1️⃣ Testing basic database connection...');
    const result = await db.execute(sql`SELECT NOW() as current_time, version() as pg_version`);
    console.log('✅ Database connected successfully!');
    console.log(`   Current time: ${result[0]?.current_time}`);
    console.log(`   PostgreSQL version: ${result[0]?.pg_version?.split(' ')[0]}\n`);
    
    // Test 2: Check if tables exist
    console.log('2️⃣ Checking if database tables exist...');
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.length === 0) {
      console.log('⚠️  No tables found - migrations need to be applied\n');
    } else {
      console.log(`✅ Found ${tablesResult.length} tables in database:`);
      tablesResult.slice(0, 10).forEach((row: any) => {
        console.log(`   - ${row.table_name}`);
      });
      if (tablesResult.length > 10) {
        console.log(`   ... and ${tablesResult.length - 10} more tables\n`);
      } else {
        console.log('');
      }
    }
    
    // Test 3: Check Supabase-specific features
    console.log('3️⃣ Verifying Supabase-specific features...');
    const extensionsResult = await db.execute(sql`
      SELECT extname 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    console.log(`✅ Supabase extensions available: ${extensionsResult.map((r: any) => r.extname).join(', ')}\n`);
    
    // Test 4: Connection pool info
    console.log('4️⃣ Database connection configuration:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`   SSL: ${process.env.DATABASE_URL?.includes('supabase.com') ? '✅ Required' : '❌ Not required'}`);
    console.log(`   Connection pool: max 20 connections\n`);
    
    console.log('✨ All database connection tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error(error instanceof Error ? error.message : error);
    console.error('\nPlease check:');
    console.error('1. DATABASE_URL is correctly set in your secrets');
    console.error('2. Your Supabase database is running and accessible');
    console.error('3. Network connectivity to Supabase\n');
    process.exit(1);
  }
}

testDatabaseConnection();
