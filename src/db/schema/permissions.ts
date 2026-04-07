import { pgTable, uuid, varchar, text, timestamp, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { clinicUsers } from "./clinics";

// Catálogo de features (módulos/telas do sistema)
export const features = pgTable("features", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Permissões granulares por usuário da clínica por feature
export const clinicUserPermissions = pgTable(
    "clinic_user_permissions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        clinicUserId: uuid("clinic_user_id")
            .notNull()
            .references(() => clinicUsers.id, { onDelete: "cascade" }),
        featureSlug: varchar("feature_slug", { length: 100 }).notNull(),
        actions: text("actions").array().notNull().default(sql`'{}'`),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => ({
        uniqueClinicUserFeature: unique("unique_clinic_user_feature").on(
            t.clinicUserId,
            t.featureSlug,
        ),
    }),
);

// Relations
export const clinicUsersPermissionsRelation = relations(clinicUsers, ({ many }) => ({
    permissions: many(clinicUserPermissions),
}));

export const featuresRelations = relations(features, ({ many }) => ({
    permissions: many(clinicUserPermissions),
}));

export const clinicUserPermissionsRelations = relations(clinicUserPermissions, ({ one }) => ({
    clinicUser: one(clinicUsers, {
        fields: [clinicUserPermissions.clinicUserId],
        references: [clinicUsers.id],
    }),
}));
