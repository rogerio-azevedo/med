CREATE TYPE "public"."patient_origin_type" AS ENUM('instagram', 'google', 'facebook', 'friends_family', 'medical_referral');--> statement-breakpoint
CREATE TABLE "patient_origins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"origin_type" "patient_origin_type" NOT NULL,
	"referring_doctor_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_origins" ADD CONSTRAINT "patient_origins_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_origins" ADD CONSTRAINT "patient_origins_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_origins" ADD CONSTRAINT "patient_origins_referring_doctor_id_doctors_id_fk" FOREIGN KEY ("referring_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;