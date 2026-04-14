import { relations } from "drizzle-orm";
import {
    boolean,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { clinicUsers, clinics } from "./clinics";
import { healthInsurances, patients } from "./medical";
import { scoreItems } from "./score-items";

export const serviceTypes = pgTable(
    "service_types",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        clinicId: uuid("clinic_id")
            .notNull()
            .references(() => clinics.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 120 }).notNull(),
        description: text("description"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        clinicNameUnique: uniqueIndex("service_types_clinic_name_unique").on(
            table.clinicId,
            table.name
        ),
    })
);

export const checkIns = pgTable("check_ins", {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
        .notNull()
        .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
        .notNull()
        .references(() => patients.id, { onDelete: "restrict" }),
    serviceTypeId: uuid("service_type_id")
        .notNull()
        .references(() => serviceTypes.id, { onDelete: "restrict" }),
    healthInsuranceId: uuid("health_insurance_id").references(() => healthInsurances.id, {
        onDelete: "set null",
    }),
    scoreItemId: uuid("score_item_id")
        .notNull()
        .references(() => scoreItems.id, { onDelete: "restrict" }),
    createdByClinicUserId: uuid("created_by_clinic_user_id")
        .notNull()
        .references(() => clinicUsers.id, { onDelete: "restrict" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceTypesRelations = relations(serviceTypes, ({ one, many }) => ({
    clinic: one(clinics, {
        fields: [serviceTypes.clinicId],
        references: [clinics.id],
    }),
    checkIns: many(checkIns),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
    clinic: one(clinics, {
        fields: [checkIns.clinicId],
        references: [clinics.id],
    }),
    patient: one(patients, {
        fields: [checkIns.patientId],
        references: [patients.id],
    }),
    serviceType: one(serviceTypes, {
        fields: [checkIns.serviceTypeId],
        references: [serviceTypes.id],
    }),
    healthInsurance: one(healthInsurances, {
        fields: [checkIns.healthInsuranceId],
        references: [healthInsurances.id],
    }),
    scoreItem: one(scoreItems, {
        fields: [checkIns.scoreItemId],
        references: [scoreItems.id],
    }),
    createdByClinicUser: one(clinicUsers, {
        fields: [checkIns.createdByClinicUserId],
        references: [clinicUsers.id],
    }),
}));
