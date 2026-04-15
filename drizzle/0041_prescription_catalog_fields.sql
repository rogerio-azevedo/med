ALTER TABLE "prescriptions" ADD COLUMN "medication_id" uuid;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "pharmaceutical_form" varchar(100);--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "quantity" varchar(100);--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "end_date" date;
