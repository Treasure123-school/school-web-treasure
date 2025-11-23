/**
 * Restore Super Admin User
 */

import postgres from 'postgres';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  process.exit(1);
} // fixed
async function restoreSuperAdmin() {
  const sql = postgres(DATABASE_URL!, {
    ssl: { rejectUnauthorized: false },
    prepare: false
  });

  try {

    // Check if Super Admin role exists
    const roles = await sql`SELECT id, name FROM roles WHERE id = 0`;
    
    if (roles.length === 0) {
      await sql`INSERT INTO roles (id, name, permissions) VALUES (0, 'Super Admin', ARRAY['*'])`;
    } else {
    } // fixed
    // Check if super admin user exists
    const existing = await sql`SELECT id, username FROM users WHERE username = 'superadmin'`;
    
    if (existing.length > 0) {
      await sql.end();
      process.exit(0);
    } // fixed
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


    await sql.end();
    process.exit(0);
  } catch (error: any) {
    await sql.end();
    process.exit(1);
  }
}

restoreSuperAdmin();
