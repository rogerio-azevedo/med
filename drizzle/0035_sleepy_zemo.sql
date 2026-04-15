ALTER TABLE "consultations" ADD COLUMN "service_type_id" uuid;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "health_insurance_id" uuid;--> statement-breakpoint
ALTER TABLE "service_types" ADD COLUMN "workflow" varchar(30) DEFAULT 'generic' NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_health_insurance_id_health_insurances_id_fk" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurances"("id") ON DELETE set null ON UPDATE no action;