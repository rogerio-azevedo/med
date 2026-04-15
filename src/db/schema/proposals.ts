import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    integer,
    pgEnum,
    date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { clinics } from "./clinics";
import { patients } from "./medical";
import { users } from "./auth";
import { products } from "./products";
import { paymentTerms } from "./payment-terms";

export const proposalStatusEnum = pgEnum("proposal_status", [
    "draft",
    "sent",
    "won",
    "lost",
    "cancelled",
]);

export const proposals = pgTable("proposals", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    status: proposalStatusEnum("status").default("draft").notNull(),
    totalAmount: integer("total_amount").default(0).notNull(), // Centavos
    validUntil: date("valid_until"),
    notes: text("notes"),
    /** Resumo e justificativa quando a cirurgia é por liminar judicial (PDF e formulário condicionais). */
    judicialSummary: text("judicial_summary"),
    paymentTermId: uuid("payment_term_id").references(() => paymentTerms.id, {
        onDelete: "set null",
    }),
    paymentTermLabel: varchar("payment_term_label", { length: 120 }),
    
    // Traceability
    createdById: text("created_by_id")
        .notNull()
        .references(() => users.id),
    wonById: text("won_by_id").references(() => users.id),
    cancelledById: text("cancelled_by_id").references(() => users.id),
    reopenedById: text("reopened_by_id").references(() => users.id),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    wonAt: timestamp("won_at"),
    cancelledAt: timestamp("cancelled_at"),
});

export const proposalItems = pgTable("proposal_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id")
        .notNull()
        .references(() => proposals.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id), // Link to our Products entity
    description: text("description"), // Can be customized per item
    quantity: integer("quantity").default(1).notNull(),
    unitPrice: integer("unit_price").notNull(), // Cents (snapshot at the time)
    totalPrice: integer("total_price").notNull(), // Cents
});

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
    clinic: one(clinics, {
        fields: [proposals.clinicId],
        references: [clinics.id],
    }),
    patient: one(patients, {
        fields: [proposals.patientId],
        references: [patients.id],
    }),
    createdBy: one(users, {
        fields: [proposals.createdById],
        references: [users.id],
        relationName: "proposal_author",
    }),
    paymentTerm: one(paymentTerms, {
        fields: [proposals.paymentTermId],
        references: [paymentTerms.id],
    }),
    items: many(proposalItems),
}));

export const proposalItemsRelations = relations(proposalItems, ({ one }) => ({
    proposal: one(proposals, {
        fields: [proposalItems.proposalId],
        references: [proposals.id],
    }),
    product: one(products, {
        fields: [proposalItems.productId],
        references: [products.id],
    }),
}));
