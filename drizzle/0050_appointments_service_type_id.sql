ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "service_type_id" uuid;

ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_service_type_id_service_types_id_fk";

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_service_type_id_service_types_id_fk"
  FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
