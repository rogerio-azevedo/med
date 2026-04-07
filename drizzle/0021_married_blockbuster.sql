CREATE TYPE "public"."procedure_type" AS ENUM('exam', 'consultation', 'surgery');--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "type" "procedure_type" NOT NULL;