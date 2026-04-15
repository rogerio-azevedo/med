CREATE TYPE "public"."surgery_status" AS ENUM('scheduled', 'waiting', 'in_progress', 'finished', 'cancelled');--> statement-breakpoint
CREATE TABLE "surgeries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"check_in_id" uuid,
	"service_type_id" uuid,
	"health_insurance_id" uuid,
	"hospital_id" uuid,
	"surgeon_id" uuid,
	"first_aux_id" uuid,
	"second_aux_id" uuid,
	"third_aux_id" uuid,
	"anesthetist_id" uuid,
	"instrumentist_id" uuid,
	"surgery_date" date,
	"status" "surgery_status" DEFAULT 'scheduled' NOT NULL,
	"repasse_hospital" boolean DEFAULT false NOT NULL,
	"repasse_anesthesia" boolean DEFAULT false NOT NULL,
	"repasse_pathology" boolean DEFAULT false NOT NULL,
	"repasse_doctor" boolean DEFAULT false NOT NULL,
	"repasse_instrumentist" boolean DEFAULT false NOT NULL,
	"repasse_medical_aux" boolean DEFAULT false NOT NULL,
	"uses_monitor" boolean DEFAULT false NOT NULL,
	"cancer_diagnosis" boolean DEFAULT false NOT NULL,
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_health_insurance_id_health_insurances_id_fk" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_surgeon_id_doctors_id_fk" FOREIGN KEY ("surgeon_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_first_aux_id_doctors_id_fk" FOREIGN KEY ("first_aux_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_second_aux_id_doctors_id_fk" FOREIGN KEY ("second_aux_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_third_aux_id_doctors_id_fk" FOREIGN KEY ("third_aux_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_anesthetist_id_doctors_id_fk" FOREIGN KEY ("anesthetist_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_instrumentist_id_doctors_id_fk" FOREIGN KEY ("instrumentist_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "surgery_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surgery_id" uuid NOT NULL,
	"procedure_id" uuid NOT NULL
);--> statement-breakpoint
ALTER TABLE "surgery_procedures" ADD CONSTRAINT "surgery_procedures_surgery_id_surgeries_id_fk" FOREIGN KEY ("surgery_id") REFERENCES "public"."surgeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgery_procedures" ADD CONSTRAINT "surgery_procedures_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_files" ADD COLUMN "surgery_id" uuid;--> statement-breakpoint
ALTER TABLE "patient_files" ADD CONSTRAINT "patient_files_surgery_id_surgeries_id_fk" FOREIGN KEY ("surgery_id") REFERENCES "public"."surgeries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "surgery_id" uuid;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_surgery_id_surgeries_id_fk" FOREIGN KEY ("surgery_id") REFERENCES "public"."surgeries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_check_in_id_check_ins_id_fk" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE set null ON UPDATE no action;
