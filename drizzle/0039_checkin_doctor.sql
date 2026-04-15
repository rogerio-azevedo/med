ALTER TABLE "check_ins" DROP CONSTRAINT IF EXISTS "check_ins_score_item_id_score_items_id_fk";--> statement-breakpoint
ALTER TABLE "check_ins" DROP COLUMN IF EXISTS "score_item_id";--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "doctor_id" uuid;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE restrict ON UPDATE no action;
