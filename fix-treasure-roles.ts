import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema";
import { eq } from "drizzle-orm";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false }
});
const db = drizzle(sql, { schema });

async function fixTreasureUserRoles() {
  try {
    console.log('🔍 DIAGNOSING ROLE ID ISSUES...\n');
    
    // 1. Check what roles exist in database
    console.log('📋 Current roles in database:');
    const roles = await db.select().from(schema.roles).orderBy(schema.roles.id);
    roles.forEach(role => {
      console.log(`   ID: ${role.id} → Name: "${role.name}"`);
    });
    
    if (roles.length === 0) {
      console.error('❌ ERROR: No roles found in database!');
      return;
    }
    
    // 2. Check current treasure user role assignments
    console.log('\n👥 Current treasure user role assignments:');
    const treasureEmails = ['admin@treasure.com', 'teacher@treasure.com', 'parent@treasure.com', 'student@treasure.com'];
    
    for (const email of treasureEmails) {
      const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (user.length > 0) {
        const userRole = roles.find(r => r.id === user[0].roleId);
        console.log(`   ${email} → roleId: ${user[0].roleId} (${userRole?.name || 'UNKNOWN ROLE'})`);
      } else {
        console.log(`   ${email} → NOT FOUND`);
      }
    }
    
    // 3. Create role mapping for correct assignments
    const roleMap: Record<string, number> = {};
    roles.forEach(role => {
      roleMap[role.name] = role.id;
    });
    
    console.log('\n🔧 FIXING ROLE ASSIGNMENTS...');
    
    // 4. Fix each user's role assignment
    const correctAssignments = [
      { email: 'admin@treasure.com', roleId: roleMap['Admin'], roleName: 'Admin' },
      { email: 'teacher@treasure.com', roleId: roleMap['Teacher'], roleName: 'Teacher' },
      { email: 'parent@treasure.com', roleId: roleMap['Parent'], roleName: 'Parent' },
      { email: 'student@treasure.com', roleId: roleMap['Student'], roleName: 'Student' },
    ];
    
    for (const assignment of correctAssignments) {
      if (!assignment.roleId) {
        console.error(`❌ ERROR: Role "${assignment.roleName}" not found in database!`);
        continue;
      }
      
      try {
        const result = await db.update(schema.users)
          .set({ roleId: assignment.roleId })
          .where(eq(schema.users.email, assignment.email))
          .returning();
          
        if (result.length > 0) {
          console.log(`   ✅ Fixed ${assignment.email} → roleId: ${assignment.roleId} (${assignment.roleName})`);
        } else {
          console.log(`   ⚠️  User ${assignment.email} not found - skipping`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to update ${assignment.email}:`, error);
      }
    }
    
    // 5. Verify the fixes
    console.log('\n✨ VERIFICATION - Updated treasure user roles:');
    for (const email of treasureEmails) {
      const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (user.length > 0) {
        const userRole = roles.find(r => r.id === user[0].roleId);
        const fullName = `${user[0].firstName} ${user[0].lastName}`;
        console.log(`   ${email} → ${fullName} (roleId: ${user[0].roleId}, role: ${userRole?.name})`);
      }
    }
    
    console.log('\n🎉 ROLE FIX COMPLETED!');
    console.log('\n⚠️  IMPORTANT: Users need to log out and log back in for role changes to take effect!');
    console.log('   (JWT tokens cache the old roleId and need to be refreshed)');
    
  } catch (error) {
    console.error('❌ Error fixing treasure user roles:', error);
  } finally {
    await sql.end();
    console.log('\nDatabase connection closed.');
  }
}

fixTreasureUserRoles();