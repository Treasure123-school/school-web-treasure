/**
 * Production Database Seeder
 * Seeds the Neon PostgreSQL database with roles and test user accounts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema.pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

const BCRYPT_ROUNDS = 12;

// Role definitions
const ROLES = [
  { id: 0, name: "Super Admin", permissions: JSON.stringify(["*"]) },
  { id: 1, name: "Admin", permissions: JSON.stringify(["manage_users", "manage_classes", "manage_exams", "view_reports"]) },
  { id: 2, name: "Teacher", permissions: JSON.stringify(["create_exams", "grade_students", "manage_attendance", "view_class_reports"]) },
  { id: 3, name: "Student", permissions: JSON.stringify(["take_exams", "view_grades", "view_resources"]) },
  { id: 4, name: "Parent", permissions: JSON.stringify(["view_child_grades", "view_child_attendance", "contact_teachers"]) },
];

// Test user accounts
const TEST_USERS = [
  {
    username: "superadmin",
    email: "superadmin@treasurehome.com",
    password: "SuperAdmin@123",
    firstName: "Super",
    lastName: "Admin",
    roleId: 1, // References role with id=1 (Super Admin in serial)
    roleName: "Super Admin"
  },
  {
    username: "admin",
    email: "admin@treasurehome.com",
    password: "Admin@123",
    firstName: "Admin",
    lastName: "User",
    roleId: 2,
    roleName: "Admin"
  },
  {
    username: "teacher",
    email: "teacher@treasurehome.com",
    password: "Teacher@123",
    firstName: "Teacher",
    lastName: "User",
    roleId: 3,
    roleName: "Teacher"
  },
  {
    username: "student",
    email: "student@treasurehome.com",
    password: "Student@123",
    firstName: "Student",
    lastName: "User",
    roleId: 4,
    roleName: "Student"
  },
  {
    username: "parent",
    email: "parent@treasurehome.com",
    password: "Parent@123",
    firstName: "Parent",
    lastName: "User",
    roleId: 5,
    roleName: "Parent"
  },
];

async function seedRoles() {
  console.log("\n📋 Seeding roles...");
  
  for (const role of ROLES) {
    const existing = await db.select().from(schema.roles).where(eq(schema.roles.name, role.name));
    
    if (existing.length === 0) {
      await db.insert(schema.roles).values({
        name: role.name,
        permissions: role.permissions,
      });
      console.log(`  ✅ Created role: ${role.name}`);
    } else {
      console.log(`  ℹ️  Role already exists: ${role.name}`);
    }
  }
}

async function seedTestUsers() {
  console.log("\n👥 Seeding test user accounts...");
  
  // Get role IDs from database
  const rolesFromDb = await db.select().from(schema.roles);
  const roleMap = new Map(rolesFromDb.map(r => [r.name, r.id]));
  
  for (const user of TEST_USERS) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.username, user.username));
    
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      const userId = crypto.randomUUID();
      const roleId = roleMap.get(user.roleName);
      
      if (!roleId) {
        console.log(`  ⚠️  Role not found for ${user.roleName}, skipping ${user.username}`);
        continue;
      }
      
      await db.insert(schema.users).values({
        id: userId,
        username: user.username,
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId,
        mustChangePassword: false,
        isActive: true,
        status: "active",
        profileCompleted: true,
        profileCompletionPercentage: 100,
      });
      
      // Create role-specific profile
      if (user.roleName === "Super Admin") {
        await db.insert(schema.superAdminProfiles).values({
          userId,
          accessLevel: "full",
        });
      } else if (user.roleName === "Admin") {
        await db.insert(schema.adminProfiles).values({
          userId,
          department: "Administration",
        });
      } else if (user.roleName === "Teacher") {
        await db.insert(schema.teacherProfiles).values({
          userId,
          verified: true,
        });
      } else if (user.roleName === "Parent") {
        await db.insert(schema.parentProfiles).values({
          userId,
        });
      }
      // Students need a class to be assigned, so we'll handle that separately
      
      console.log(`  ✅ Created ${user.roleName}: ${user.username}`);
    } else {
      console.log(`  ℹ️  User already exists: ${user.username}`);
    }
  }
}

async function seedAcademicTerms() {
  console.log("\n📅 Seeding academic terms...");
  
  const currentYear = new Date().getFullYear();
  const terms = [
    { name: "First Term", year: String(currentYear), startDate: `${currentYear}-01-10`, endDate: `${currentYear}-04-15`, isCurrent: false },
    { name: "Second Term", year: String(currentYear), startDate: `${currentYear}-05-01`, endDate: `${currentYear}-08-15`, isCurrent: false },
    { name: "Third Term", year: String(currentYear), startDate: `${currentYear}-09-01`, endDate: `${currentYear}-12-15`, isCurrent: true },
  ];
  
  for (const term of terms) {
    const existing = await db.select().from(schema.academicTerms)
      .where(eq(schema.academicTerms.name, term.name));
    
    if (existing.length === 0) {
      await db.insert(schema.academicTerms).values(term);
      console.log(`  ✅ Created term: ${term.name} ${term.year}`);
    } else {
      console.log(`  ℹ️  Term already exists: ${term.name}`);
    }
  }
}

async function seedSystemSettings() {
  console.log("\n⚙️  Seeding system settings...");
  
  const existing = await db.select().from(schema.systemSettings);
  
  if (existing.length === 0) {
    await db.insert(schema.systemSettings).values({
      schoolName: "Treasure-Home School",
      schoolMotto: "Honesty and Success",
      schoolEmail: "info@treasurehome.com",
      schoolPhone: "+234 XXX XXX XXXX",
      schoolAddress: "Seriki-Soyinka, Ifo, Ogun State, Nigeria",
      enableEmailNotifications: true,
      enableExamsModule: true,
      enableAttendanceModule: true,
      enableResultsModule: true,
      themeColor: "blue",
    });
    console.log("  ✅ Created system settings");
  } else {
    console.log("  ℹ️  System settings already exist");
  }
}

async function seedClasses() {
  console.log("\n🏫 Seeding classes...");
  
  const classData = [
    { name: "Playgroup", level: "Early Years" },
    { name: "Nursery 1", level: "Early Years" },
    { name: "Nursery 2", level: "Early Years" },
    { name: "Primary 1", level: "Primary" },
    { name: "Primary 2", level: "Primary" },
    { name: "Primary 3", level: "Primary" },
    { name: "Primary 4", level: "Primary" },
    { name: "Primary 5", level: "Primary" },
    { name: "Primary 6", level: "Primary" },
    { name: "JSS 1", level: "Junior Secondary" },
    { name: "JSS 2", level: "Junior Secondary" },
    { name: "JSS 3", level: "Junior Secondary" },
    { name: "SSS 1", level: "Senior Secondary" },
    { name: "SSS 2", level: "Senior Secondary" },
    { name: "SSS 3", level: "Senior Secondary" },
  ];
  
  for (const cls of classData) {
    const existing = await db.select().from(schema.classes).where(eq(schema.classes.name, cls.name));
    
    if (existing.length === 0) {
      await db.insert(schema.classes).values({
        name: cls.name,
        level: cls.level,
        capacity: 30,
        isActive: true,
      });
      console.log(`  ✅ Created class: ${cls.name}`);
    } else {
      console.log(`  ℹ️  Class already exists: ${cls.name}`);
    }
  }
}

async function seedSubjects() {
  console.log("\n📚 Seeding subjects...");
  
  const subjects = [
    { name: "English Language", code: "ENG" },
    { name: "Mathematics", code: "MTH" },
    { name: "Basic Science", code: "BSC" },
    { name: "Social Studies", code: "SST" },
    { name: "Civic Education", code: "CVE" },
    { name: "Computer Studies", code: "CMP" },
    { name: "Physical Education", code: "PHE" },
    { name: "Fine Arts", code: "ART" },
    { name: "Music", code: "MUS" },
    { name: "Yoruba", code: "YOR" },
    { name: "French", code: "FRN" },
    { name: "Agriculture", code: "AGR" },
    { name: "Home Economics", code: "HEC" },
    { name: "Religious Studies", code: "REL" },
  ];
  
  for (const subject of subjects) {
    const existing = await db.select().from(schema.subjects).where(eq(schema.subjects.code, subject.code));
    
    if (existing.length === 0) {
      await db.insert(schema.subjects).values({
        name: subject.name,
        code: subject.code,
      });
      console.log(`  ✅ Created subject: ${subject.name}`);
    } else {
      console.log(`  ℹ️  Subject already exists: ${subject.name}`);
    }
  }
}

async function main() {
  console.log("🚀 Starting Production Database Seeding...");
  console.log("📊 Database: Neon PostgreSQL");
  console.log("==========================================");
  
  try {
    await seedRoles();
    await seedAcademicTerms();
    await seedSystemSettings();
    await seedClasses();
    await seedSubjects();
    await seedTestUsers();
    
    console.log("\n==========================================");
    console.log("✅ Production database seeding completed!");
    console.log("\n📝 TEST ACCOUNT CREDENTIALS:");
    console.log("┌─────────────────────────────────────────────────────┐");
    console.log("│         LOGIN CREDENTIALS FOR ALL 5 ROLES           │");
    console.log("├─────────────────────────────────────────────────────┤");
    TEST_USERS.forEach(user => {
      console.log(`│ ${user.roleName.padEnd(12)} │ ${user.username.padEnd(12)} │ ${user.password.padEnd(15)} │`);
    });
    console.log("└─────────────────────────────────────────────────────┘");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();
