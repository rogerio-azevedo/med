import { relations } from "drizzle-orm";
import {
    boolean,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { clinics } from "./clinics";

export const scoreItems = pgTable(
    "score_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        clinicId: uuid("clinic_id")
            .notNull()
            .references(() => clinics.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 120 }).notNull(),
        description: text("description"),
        score: integer("score").notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        clinicNameUnique: uniqueIndex("score_items_clinic_name_unique").on(
            table.clinicId,
            table.name
        ),
    })
);

export const scoreItemsRelations = relations(scoreItems, ({ one }) => ({
    clinic: one(clinics, {
        fields: [scoreItems.clinicId],
        references: [clinics.id],
    }),
}));
