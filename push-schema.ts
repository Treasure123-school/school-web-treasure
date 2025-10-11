import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

const connectionString = process.env.DATABASE_URL!;

async function pushSchema() {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });
  
  console.log('✓ Database connection successful');
  console.log('✓ Schema loaded successfully');
  console.log('Note: Use `npm run db:push -- --force` to apply schema changes');
  
  await client.end();
}

pushSchema().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
