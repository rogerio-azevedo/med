CREATE TABLE "patient_doctors" (
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinic_patients" DROP CONSTRAINT "clinic_patients_responsible_doctor_id_doctors_id_fk";
--> statement-breakpoint
ALTER TABLE "patient_doctors" ADD CONSTRAINT "patient_doctors_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_doctors" ADD CONSTRAINT "patient_doctors_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_patients" DROP COLUMN "responsible_doctor_id";