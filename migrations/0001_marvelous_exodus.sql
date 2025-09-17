CREATE TABLE "contact_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"subject" varchar(200),
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"responded_at" timestamp,
	"responded_by" uuid,
	"response" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "emergency_contact" varchar(20);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "medical_info" text;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;