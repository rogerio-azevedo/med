import {
    boolean,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { clinics } from "./clinics";

export const appointmentIntegrationCredentials = pgTable(
    "appointment_integration_credentials",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        clinicId: uuid("clinic_id")
            .notNull()
            .references(() => clinics.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 120 }).notNull(),
        scope: varchar("scope", { length: 120 })
            .default("appointments:write")
            .notNull(),
        tokenJti: uuid("token_jti").notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        lastUsedAt: timestamp("last_used_at"),
        revokedAt: timestamp("revoked_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    }
);
