CREATE TYPE "public"."schedule_block_reason" AS ENUM('vacation', 'sick_leave', 'conference', 'personal', 'holiday', 'other');--> statement-breakpoint
CREATE TABLE "doctor_schedule_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"reason" "schedule_block_reason" NOT NULL,
	"note" text,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invite_links" ALTER COLUMN "clinic_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_schedule_blocks" ADD CONSTRAINT "doctor_schedule_blocks_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedule_blocks" ADD CONSTRAINT "doctor_schedule_blocks_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;