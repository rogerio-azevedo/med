import {
    boolean,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { clinics } from "./clinics";

export const paymentMethodEnum = pgEnum("payment_method", [
    "pix",
    "credit_card",
    "debit_card",
    "boleto",
    "cash",
]);

export const paymentTerms = pgTable("payment_terms", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentTermsRelations = relations(paymentTerms, ({ one }) => ({
    clinic: one(clinics, {
        fields: [paymentTerms.clinicId],
        references: [clinics.id],
    }),
}));
