CREATE TYPE "public"."exam_care_type" AS ENUM('elective', 'urgent_emergency');--> statement-breakpoint
ALTER TABLE "health_insurances" ADD COLUMN "logo_url" varchar(800);--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "cbo_code" varchar(10);--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "care_type" "exam_care_type";--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "clinical_indication" text;