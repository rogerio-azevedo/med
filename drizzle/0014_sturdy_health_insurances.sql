CREATE TABLE "health_insurances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50),
	"ans_code" varchar(30),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinic_health_insurances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"health_insurance_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_health_insurances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"health_insurance_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_health_insurances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"health_insurance_id" uuid NOT NULL,
	"card_number" varchar(100),
	"plan_name" varchar(150),
	"plan_code" varchar(50),
	"holder_name" varchar(255),
	"holder_cpf" varchar(14),
	"valid_until" date,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinic_health_insurances" ADD CONSTRAINT "clinic_health_insurances_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "clinic_health_insurances" ADD CONSTRAINT "clinic_health_insurances_health_insurance_id_health_insurances_id_fk" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurances"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "doctor_health_insurances" ADD CONSTRAINT "doctor_health_insurances_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "doctor_health_insurances" ADD CONSTRAINT "doctor_health_insurances_health_insurance_id_health_insurances_id_fk" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurances"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "patient_health_insurances" ADD CONSTRAINT "patient_health_insurances_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "patient_health_insurances" ADD CONSTRAINT "patient_health_insurances_health_insurance_id_health_insurances_id_fk" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurances"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "clinic_health_insurance_unique" ON "clinic_health_insurances" USING btree ("clinic_id","health_insurance_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_health_insurance_unique" ON "doctor_health_insurances" USING btree ("doctor_id","health_insurance_id");
--> statement-breakpoint
CREATE INDEX "patient_health_insurances_patient_idx" ON "patient_health_insurances" USING btree ("patient_id");
