import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    text,
    pgEnum,
    doublePrecision,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

// Enums
export const roleEnum = pgEnum("role", ["admin", "doctor", "receptionist", "nurse", "patient"]);
export const entityTypeEnum = pgEnum("entity_type", ["clinic", "doctor", "patient", "hospital"]);

// 1. Clinics (Tenants)
export const clinics = pgTable("clinics", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).unique(), // Para URL futura
    cnpj: varchar("cnpj", { length: 18 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    /** URL pública da logo da clínica (ex.: CDN ou storage). */
    logoUrl: varchar("logo_url", { length: 500 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Clinic Users (Vinculo User <-> Clinic)
export const clinicUsers = pgTable("clinic_users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    userId: text("user_id") // NextAuth usa text para ID
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hospitals = pgTable("hospitals", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Addresses (Polimórfico)
export const addresses = pgTable("addresses", {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(), // ID da entidade relacionada
    label: varchar("label", { length: 50 }),
    zipCode: varchar("zip_code", { length: 9 }),
    street: varchar("street", { length: 255 }),
    number: varchar("number", { length: 20 }),
    complement: varchar("complement", { length: 100 }),
    neighborhood: varchar("neighborhood", { length: 100 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    country: varchar("country", { length: 2 }).default("BR"),
    isPrimary: boolean("is_primary").default(false),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
