CREATE TYPE "public"."exam_location" AS ENUM('in_clinic', 'external');--> statement-breakpoint
CREATE TYPE "public"."exam_status" AS ENUM('scheduled', 'in_progress', 'finished', 'cancelled');--> statement-breakpoint
CREATE TABLE "exam_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"procedure_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid,
	"clinic_id" uuid NOT NULL,
	"consultation_id" uuid,
	"exam_request_id" uuid,
	"service_type_id" uuid,
	"health_insurance_id" uuid,
	"status" "exam_status" DEFAULT 'scheduled' NOT NULL,
	"location" "exam_location" DEFAULT 'in_clinic' NOT NULL,
	"notes" text,
	"scheduled_at" timestamp,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_requests" ADD COLUMN "fulfilled_by_exam_id" uuid;--> statement-breakpoint
ALTER TABLE "exam_procedures" ADD CONSTRAINT "exam_procedures_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_procedures" ADD CONSTRAINT "exam_procedures_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_exam_request_id_exam_requests_id_fk" FOREIGN KEY ("exam_request_id") REFERENCES "public"."exam_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_health_insurance_id_health_insurances_id_fk" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_requests" ADD CONSTRAINT "exam_requests_fulfilled_by_exam_id_exams_id_fk" FOREIGN KEY ("fulfilled_by_exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;