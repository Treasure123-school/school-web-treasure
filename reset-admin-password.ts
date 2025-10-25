
import bcrypt from 'bcrypt';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function resetSuperAdminPassword() {
  const sql = postgres(DATABASE_URL, {
    ssl: DATABASE_URL.includes('supabase.com') ? 'require' : false,
    prepare: false
  });

  try {
    console.log('🔐 Resetting Super Admin password...\n');

    // New password - change this to whatever you want
    const newPassword = 'Admin@2025';
    
    // Hash the password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update super admin password
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash},
          must_change_password = false
      WHERE username = 'superadmin'
    `;

    console.log('✅ Super Admin password reset successfully!');
    console.log('\nLogin credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: Admin@2025');
    console.log('\n⚠️  IMPORTANT: Change this password after logging in!\n');

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

resetSuperAdminPassword();
