import {
    pgTable,
    uuid,
    text,
    timestamp,
    pgEnum,
    date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { clinics } from "./clinics";
import { patients } from "./patients";
import { products } from "./products";
import { proposals } from "./proposals";

export const patientPlanStatusEnum = pgEnum("patient_plan_status", [
    "active",
    "completed",
    "cancelled",
]);

export const patientPlans = pgTable("patient_plans", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id),
    proposalId: uuid("proposal_id").references(() => proposals.id, {
        onDelete: "set null",
    }),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id),
    status: patientPlanStatusEnum("status").default("active").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const patientPlansRelations = relations(patientPlans, ({ one }) => ({
    clinic: one(clinics, {
        fields: [patientPlans.clinicId],
        references: [clinics.id],
    }),
    patient: one(patients, {
        fields: [patientPlans.patientId],
        references: [patients.id],
    }),
    proposal: one(proposals, {
        fields: [patientPlans.proposalId],
        references: [proposals.id],
    }),
    product: one(products, {
        fields: [patientPlans.productId],
        references: [products.id],
    }),
}));
