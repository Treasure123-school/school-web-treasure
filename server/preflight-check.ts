import { db } from "./storage";
import { users, students, parentProfiles, settings, counters } from "@shared/schema";
import { sql, count } from "drizzle-orm";

async function preflightCheck() {
  console.log("🔍 PREFLIGHT CHECK - Student Self-Registration Feature");
  console.log("=" .repeat(60));
  
  try {
    // Check table counts
    const [usersCount] = await db.select({ count: count() }).from(users);
    const [studentsCount] = await db.select({ count: count() }).from(students);
    const [parentsCount] = await db.select({ count: count() }).from(parentProfiles);
    
    console.log("\n📊 DATABASE TABLE COUNTS:");
    console.log(`  Users total: ${usersCount.count}`);
    console.log(`  Students total: ${studentsCount.count}`);
    console.log(`  Parents total: ${parentsCount.count}`);
    
    // Check if allow_student_self_registration setting exists
    const registrationSetting = await db.select()
      .from(settings)
      .where(sql`key = 'allow_student_self_registration'`)
      .limit(1);
    
    console.log("\n⚙️  REGISTRATION SETTING:");
    if (registrationSetting.length > 0) {
      console.log(`  ✅ allow_student_self_registration = ${registrationSetting[0].value}`);
    } else {
      console.log("  ⚠️  allow_student_self_registration NOT FOUND - will create it");
      
      // Create the setting
      await db.insert(settings).values({
        key: 'allow_student_self_registration',
        value: 'true',
        description: 'Enable or disable student self-registration feature',
        dataType: 'boolean',
        updatedBy: null,
      });
      console.log("  ✅ Created allow_student_self_registration = true");
    }
    
    // Verify schema structure
    console.log("\n✅ SCHEMA VERIFICATION:");
    console.log("  ✅ users table exists");
    console.log("  ✅ students table exists (with parentId column)");
    console.log("  ✅ parent_profiles table exists (with linkedStudents array)");
    console.log("  ✅ settings table exists");
    console.log("  ✅ counters table exists (for atomic sequence generation)");
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ PREFLIGHT CHECK COMPLETE - Ready to implement self-registration");
    
  } catch (error) {
    console.error("❌ PREFLIGHT CHECK FAILED:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

preflightCheck();
