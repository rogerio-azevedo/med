CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"service_type_id" uuid NOT NULL,
	"health_insurance_id" uuid,
	"score_item_id" uuid NOT NULL,
	"created_by_clinic_user_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_health_insurance_id_health_insurances_id_fk" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurances"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_score_item_id_score_items_id_fk" FOREIGN KEY ("score_item_id") REFERENCES "public"."score_items"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_created_by_clinic_user_id_clinic_users_id_fk" FOREIGN KEY ("created_by_clinic_user_id") REFERENCES "public"."clinic_users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "service_types_clinic_name_unique" ON "service_types" USING btree ("clinic_id","name");
--> statement-breakpoint
INSERT INTO "service_types" ("clinic_id", "name", "description")
SELECT
	"clinics"."id",
	"defaults"."name",
	NULL
FROM "clinics"
CROSS JOIN (
	VALUES
		('Consulta'),
		('Exame'),
		('Cirurgia'),
		('Outro')
) AS "defaults"("name")
ON CONFLICT ("clinic_id", "name") DO NOTHING;
