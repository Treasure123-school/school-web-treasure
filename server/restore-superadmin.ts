/**
 * Restore Super Admin User
 */

import postgres from 'postgres';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function restoreSuperAdmin() {
  const sql = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false
  });

  try {
    console.log('🔐 Restoring Super Admin...\n');

    // Check if Super Admin role exists
    const roles = await sql`SELECT id, name FROM roles WHERE id = 0`;
    
    if (roles.length === 0) {
      console.log('Creating Super Admin role...');
      await sql`INSERT INTO roles (id, name, permissions) VALUES (0, 'Super Admin', ARRAY['*'])`;
      console.log('✅ Super Admin role created');
    } else {
      console.log('✅ Super Admin role exists');
    }

    // Check if super admin user exists
    const existing = await sql`SELECT id, username FROM users WHERE username = 'superadmin'`;
    
    if (existing.length > 0) {
      console.log('✅ Super Admin user already exists');
      await sql.end();
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash('Temp@123', 12);

    // Create super admin user
    await sql`
      INSERT INTO users (
        username,
        email,
        password_hash,
        role_id,
        first_name,
        last_name,
        status,
        is_active,
        must_change_password
      ) VALUES (
        'superadmin',
        'superadmin@treasurehome.com',
        ${passwordHash},
        0,
        'Super',
        'Admin',
        'active',
        true,
        true
      )
    `;

    console.log('✅ Super Admin user created');
    console.log('\nLogin credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: Temp@123');
    console.log('   (You will be prompted to change this on first login)');

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

restoreSuperAdmin();
