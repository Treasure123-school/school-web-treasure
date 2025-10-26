import { db } from "./storage";
import { systemSettings } from "../shared/schema";
import { sql } from "drizzle-orm";

export async function seedSystemSettings() {
  try {
    // First, ensure the system_settings table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id BIGSERIAL PRIMARY KEY,
        school_name VARCHAR(200),
        school_motto TEXT,
        school_logo TEXT,
        school_email VARCHAR(255),
        school_phone VARCHAR(20),
        school_address TEXT,
        maintenance_mode BOOLEAN DEFAULT FALSE,
        maintenance_mode_message TEXT,
        enable_sms_notifications BOOLEAN DEFAULT FALSE,
        enable_email_notifications BOOLEAN DEFAULT TRUE,
        enable_exams_module BOOLEAN DEFAULT TRUE,
        enable_attendance_module BOOLEAN DEFAULT TRUE,
        enable_results_module BOOLEAN DEFAULT TRUE,
        theme_color VARCHAR(7) DEFAULT '#3B82F6',
        favicon TEXT,
        username_student_prefix VARCHAR(20) DEFAULT 'THS-STU-',
        username_parent_prefix VARCHAR(20) DEFAULT 'THS-PAR-',
        username_teacher_prefix VARCHAR(20) DEFAULT 'THS-TCH-',
        username_admin_prefix VARCHAR(20) DEFAULT 'THS-ADM-',
        temp_password_format VARCHAR(50) DEFAULT 'Welcome{YEAR}!',
        hide_admin_accounts_from_admins BOOLEAN DEFAULT TRUE,
        updated_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Check if settings already exist
    const existingSettings = await db.select().from(systemSettings).limit(1);

    if (existingSettings.length === 0) {
      // Create default system settings
      await db.insert(systemSettings).values({
        schoolName: "Treasure-Home School",
        schoolMotto: "Honesty and Success",
        schoolEmail: "info@treasurehomeschool.edu.ng",
        schoolPhone: "+234-XXX-XXX-XXXX",
        schoolAddress: "Lagos, Nigeria",
        maintenanceMode: false,
        enableSmsNotifications: false,
        enableEmailNotifications: true,
        enableExamsModule: true,
        enableAttendanceModule: true,
        enableResultsModule: true,
        themeColor: "#3B82F6",
        usernameStudentPrefix: "THS-STU-",
        usernameParentPrefix: "THS-PAR-",
        usernameTeacherPrefix: "THS-TCH-",
        usernameAdminPrefix: "THS-ADM-",
        tempPasswordFormat: "Welcome{YEAR}!",
        hideAdminAccountsFromAdmins: true,
      });

      console.log("✅ Default system settings created");
    } else {
      console.log("ℹ️  System settings already exist");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // If it's just a "table already exists" error, that's fine
    if (errorMessage.includes("already exists") || errorMessage.includes("42P07")) {
      console.log("ℹ️  System settings table already exists");
    } else {
      console.error(`⚠️  System settings seeding error: ${errorMessage}`);
      throw error;
    }
  }
}
