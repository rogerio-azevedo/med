ALTER TABLE "consultation_soap" ALTER COLUMN "subjective" TYPE text USING "subjective"::text;--> statement-breakpoint
ALTER TABLE "consultation_soap" ALTER COLUMN "objective" TYPE text USING "objective"::text;--> statement-breakpoint
ALTER TABLE "consultation_soap" ALTER COLUMN "assessment" TYPE text USING "assessment"::text;--> statement-breakpoint
ALTER TABLE "consultation_soap" ALTER COLUMN "diagnosis_free_text" TYPE text USING "diagnosis_free_text"::text;--> statement-breakpoint
ALTER TABLE "consultation_soap" ALTER COLUMN "plan" TYPE text USING "plan"::text;
