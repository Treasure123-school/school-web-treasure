import bcrypt from 'bcrypt';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { eq } from 'drizzle-orm';

async function seedSuperAdmin() {
  try {
    console.log('🔐 Starting Super Admin seed...');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Initialize database connection
    const pg = postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
      prepare: false,
    });
    const db = drizzle(pg, { schema });

    // 1. Check if Super Admin role exists, create if not
    const existingRoles = await db.select().from(schema.roles);
    let superAdminRole = existingRoles.find(r => r.name === 'Super Admin');

    if (!superAdminRole) {
      console.log('Creating Super Admin role...');
      const [newRole] = await db.insert(schema.roles).values({
        id: 0,
        name: 'Super Admin',
        permissions: ['*'], // Full access
      }).returning();
      superAdminRole = newRole;
      console.log('✅ Super Admin role created');
    } else {
      console.log('✅ Super Admin role already exists');
    }

    // 2. Check if superadmin user exists
    const existingSuperAdmin = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, 'superadmin'))
      .limit(1);

    if (existingSuperAdmin.length === 0) {
      console.log('Creating default Super Admin user...');
      
      // Hash the default password
      const passwordHash = await bcrypt.hash('Temp@123', 12);

      // Create super admin user
      const [newSuperAdmin] = await db.insert(schema.users).values({
        username: 'superadmin',
        email: 'superadmin@treasurehome.com',
        passwordHash,
        roleId: superAdminRole.id,
        firstName: 'Super',
        lastName: 'Admin',
        status: 'active',
        isActive: true,
        mustChangePassword: true, // Force password change on first login
        profileCompleted: true,
        createdVia: 'admin',
      }).returning();

      // Create super admin profile
      await db.insert(schema.superAdminProfiles).values({
        userId: newSuperAdmin.id,
        accessLevel: 'full',
        department: 'System Administration',
      });

      console.log('✅ Default Super Admin created');
      console.log('   Username: superadmin');
      console.log('   Password: Temp@123');
      console.log('   ⚠️  Please change the password after first login!');
    } else {
      console.log('✅ Super Admin user already exists');
    }

    // 3. Initialize system settings if not exists
    const existingSettings = await db.select().from(schema.systemSettings).limit(1);
    if (existingSettings.length === 0) {
      console.log('Creating initial system settings...');
      await db.insert(schema.systemSettings).values({
        schoolName: 'Treasure-Home School',
        schoolMotto: 'HONESTY AND SUCCESS',
        enableExamsModule: true,
        enableAttendanceModule: true,
        enableResultsModule: true,
        maintenanceMode: false,
        themeColor: 'blue',
      });
      console.log('✅ System settings initialized');
    }

    console.log('🎉 Super Admin seed completed successfully!');
    await pg.end();
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSuperAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedSuperAdmin };
