import postgres from 'postgres';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function resetPassword() {
  const sql = postgres(DATABASE_URL, {
    ssl: DATABASE_URL.includes('supabase.com') ? { rejectUnauthorized: false } : false,
    prepare: false
  });

  try {
    console.log('🔐 Resetting Super Admin password...\n');

    const passwordHash = await bcrypt.hash('Temp@123', 12);

    await sql`
      UPDATE users 
      SET 
        password_hash = ${passwordHash},
        must_change_password = true
      WHERE username = 'superadmin'
    `;

    console.log('✅ Password reset successfully!');
    console.log('\nLogin credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: Temp@123');
    console.log('   (You will be prompted to change this on first login)\n');

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

resetPassword();
