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

    // Initialize database connection with conditional SSL (match server/storage.ts)
    const pg = postgres(process.env.DATABASE_URL, {
      ssl: (process.env.DATABASE_URL?.includes('supabase.com') ? 'require' : false) as 'require' | false,
      prepare: false,
    });
    const db = drizzle(pg, { schema });

    // 1. Check and create all required roles
    const existingRoles = await db.select().from(schema.roles);
    
    const requiredRoles = [
      { id: 0, name: 'Super Admin', permissions: ['*'] },
      { id: 1, name: 'Admin', permissions: ['manage_users', 'manage_classes', 'manage_students', 'manage_teachers', 'manage_exams', 'view_reports', 'manage_announcements', 'manage_gallery', 'manage_content'] },
      { id: 2, name: 'Teacher', permissions: ['view_students', 'manage_attendance', 'manage_exams', 'grade_exams', 'view_classes', 'manage_resources'] },
      { id: 3, name: 'Student', permissions: ['view_exams', 'take_exams', 'view_results', 'view_resources', 'view_announcements'] },
      { id: 4, name: 'Parent', permissions: ['view_students', 'view_results', 'view_attendance', 'view_announcements'] },
    ];

    let superAdminRole;
    for (const roleData of requiredRoles) {
      const existingRole = existingRoles.find(r => r.name === roleData.name);
      if (!existingRole) {
        console.log(`Creating ${roleData.name} role...`);
        const [newRole] = await db.insert(schema.roles).values(roleData).returning();
        if (roleData.name === 'Super Admin') {
          superAdminRole = newRole;
        }
        console.log(`✅ ${roleData.name} role created`);
      } else {
        if (roleData.name === 'Super Admin') {
          superAdminRole = existingRole;
        }
        console.log(`✅ ${roleData.name} role already exists`);
      }
    }

    if (!superAdminRole) {
      superAdminRole = existingRoles.find(r => r.name === 'Super Admin')!;
    }

    // 2. Check if superadmin user exists
    const existingSuperAdmin = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, 'superadmin'))
      .limit(1);

    if (existingSuperAdmin.length === 0) {
      console.log('Creating default Super Admin user...');
      
      // Hash the default password only when creating new user
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
      console.log('   ⚠️  IMPORTANT: Default password has been set. Please login and change it immediately!');
      console.log('   ⚠️  Check your secure documentation or contact the system administrator for the initial password.');
    } else {
      console.log('✅ Super Admin user already exists');
    }

    // 3. Initialize system settings if not exists (optional - skip if table doesn't exist)
    try {
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
    } catch (settingsError) {
      // Silently skip if system_settings table doesn't exist - it's optional
      console.log('ℹ️  System settings table not found - skipping (optional feature)');
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
