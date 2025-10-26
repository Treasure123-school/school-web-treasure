CREATE TABLE "super_admin_profiles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"department" varchar(100),
	"access_level" varchar(50) DEFAULT 'full',
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" text,
	"last_password_change" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "super_admin_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"school_name" varchar(200),
	"school_motto" text,
	"school_logo" text,
	"school_email" varchar(255),
	"school_phone" varchar(50),
	"school_address" text,
	"maintenance_mode" boolean DEFAULT false,
	"maintenance_mode_message" text,
	"enable_sms_notifications" boolean DEFAULT false,
	"enable_email_notifications" boolean DEFAULT true,
	"enable_exams_module" boolean DEFAULT true,
	"enable_attendance_module" boolean DEFAULT true,
	"enable_results_module" boolean DEFAULT true,
	"theme_color" varchar(50) DEFAULT 'blue',
	"favicon" text,
	"username_student_prefix" varchar(20) DEFAULT 'THS-STU',
	"username_parent_prefix" varchar(20) DEFAULT 'THS-PAR',
	"username_teacher_prefix" varchar(20) DEFAULT 'THS-TCH',
	"username_admin_prefix" varchar(20) DEFAULT 'THS-ADM',
	"temp_password_format" varchar(50) DEFAULT 'THS@{year}#{random4}',
	"hide_admin_accounts_from_admins" boolean DEFAULT true,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP INDEX "counters_class_year_idx";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "entity_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "counters" ALTER COLUMN "class_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "counters" ALTER COLUMN "year" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "counters" ADD COLUMN "role_code" varchar(10);--> statement-breakpoint
ALTER TABLE "teacher_class_assignments" ADD COLUMN "assigned_by" uuid;--> statement-breakpoint
ALTER TABLE "super_admin_profiles" ADD CONSTRAINT "super_admin_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_class_assignments" ADD CONSTRAINT "teacher_class_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "counters_role_code_idx" ON "counters" USING btree ("role_code");