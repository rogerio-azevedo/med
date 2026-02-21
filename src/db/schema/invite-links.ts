import { relations } from "drizzle-orm";
import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    integer,
    pgEnum,
    boolean,
} from "drizzle-orm/pg-core";
import { clinics } from "./clinics";
import { doctors } from "./medical";

export const inviteRoleEnum = pgEnum("invite_role", ["admin", "doctor", "patient"]);


export const inviteLinks = pgTable("invite_links", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    clinicId: uuid("clinic_id")
        .references(() => clinics.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
        .references(() => doctors.id, { onDelete: "cascade" }),
    role: inviteRoleEnum("role").notNull(),
    expiresAt: timestamp("expires_at"),
    usedCount: integer("used_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inviteLinksRelations = relations(inviteLinks, ({ one }) => ({
    clinic: one(clinics, {
        fields: [inviteLinks.clinicId],
        references: [clinics.id],
    }),
    doctor: one(doctors, {
        fields: [inviteLinks.doctorId],
        references: [doctors.id],
    }),
}));
