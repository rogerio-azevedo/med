-- Run manually AFTER assigning or removing orphan procedures (clinic_id IS NULL).
-- Do not add to drizzle/meta/_journal until you are ready to apply in all environments.

DELETE FROM "procedures" WHERE "clinic_id" IS NULL;

ALTER TABLE "procedures" ALTER COLUMN "clinic_id" SET NOT NULL;
