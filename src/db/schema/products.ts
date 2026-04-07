import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    integer,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { clinics } from "./clinics";

export const productTypeEnum = pgEnum("product_type", [
    "plan_package",
    "surgery",
    "exam",
    "consultation",
    "other",
]);

export const products = pgTable("products", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    type: productTypeEnum("type").default("plan_package").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    costPrice: integer("cost_price").default(0).notNull(), // Centavos
    sellingPrice: integer("selling_price").default(0).notNull(), // Centavos
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
    clinic: one(clinics, {
        fields: [products.clinicId],
        references: [clinics.id],
    }),
}));
