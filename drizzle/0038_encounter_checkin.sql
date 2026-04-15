ALTER TABLE "consultations" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
DROP TYPE IF EXISTS "consultation_type";--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "doctor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "check_in_id" uuid;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "consultation_id" uuid;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_check_in_id_check_ins_id_fk" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
DROP TABLE IF EXISTS "medical_records";--> statement-breakpoint
DROP TABLE IF EXISTS "service_records";--> statement-breakpoint
DROP TYPE IF EXISTS "service_record_type";
