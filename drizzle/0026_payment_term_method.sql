CREATE TYPE "public"."payment_method" AS ENUM('pix', 'credit_card', 'debit_card', 'boleto', 'cash');--> statement-breakpoint
ALTER TABLE "payment_terms" ADD COLUMN "payment_method" "payment_method" DEFAULT 'pix' NOT NULL;
