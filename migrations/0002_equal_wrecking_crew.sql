CREATE TYPE "public"."report_card_status" AS ENUM('draft', 'finalized', 'published');--> statement-breakpoint
CREATE TABLE "report_card_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"report_card_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"obtained_marks" integer NOT NULL,
	"percentage" integer NOT NULL,
	"grade" varchar(5),
	"teacher_remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_cards" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"class_id" integer NOT NULL,
	"term_id" integer NOT NULL,
	"average_percentage" integer,
	"overall_grade" varchar(5),
	"teacher_remarks" text,
	"status" "report_card_status" DEFAULT 'draft',
	"locked" boolean DEFAULT false,
	"generated_at" timestamp DEFAULT now(),
	"finalized_at" timestamp,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "exam_results" ALTER COLUMN "score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_results" ALTER COLUMN "recorded_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "report_card_items" ADD CONSTRAINT "report_card_items_report_card_id_report_cards_id_fk" FOREIGN KEY ("report_card_id") REFERENCES "public"."report_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_card_items" ADD CONSTRAINT "report_card_items_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE no action ON UPDATE no action;