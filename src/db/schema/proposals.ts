import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
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
