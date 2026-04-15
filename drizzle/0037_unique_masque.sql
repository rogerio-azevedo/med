ALTER TABLE "service_types" ADD COLUMN "slug" varchar(60);--> statement-breakpoint
CREATE UNIQUE INDEX "service_types_clinic_slug_unique" ON "service_types" USING btree ("clinic_id","slug");