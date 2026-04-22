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
import { doctors } from "./doctors";
import { healthInsurances } from "./health-insurances";
import { patients } from "./patients";

export const serviceTypes = pgTable(
    "service_types",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        clinicId: uuid("clinic_id")
            .notNull()
            .references(() => clinics.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 120 }).notNull(),
        slug: varchar("slug", { length: 60 }),
        description: text("description"),
        workflow: varchar("workflow", { length: 30 }).notNull().default("generic"),
        /** Ícone na timeline / identidade visual (chave lucide mapeada no app). */
        timelineIconKey: varchar("timeline_icon_key", { length: 40 }),
        /** Cor #RRGGBB para ícone e badge na timeline. */
        timelineColorHex: varchar("timeline_color_hex", { length: 7 }),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        clinicNameUnique: uniqueIndex("service_types_clinic_name_unique").on(
            table.clinicId,
            table.name
        ),
        clinicSlugUnique: uniqueIndex("service_types_clinic_slug_unique").on(
            table.clinicId,
            table.slug
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
    doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "restrict" }),
    createdByClinicUserId: uuid("created_by_clinic_user_id")
        .notNull()
        .references(() => clinicUsers.id, { onDelete: "restrict" }),
    notes: text("notes"),
    /** Atendimento clínico criado na recepção (pré-atendimento). FK aplicada na migration para evitar import circular. */
    consultationId: uuid("consultation_id"),
    /** Cirurgia criada na recepção (pré-atendimento). FK aplicada na migration para evitar import circular. */
    surgeryId: uuid("surgery_id"),
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
    doctor: one(doctors, {
        fields: [checkIns.doctorId],
        references: [doctors.id],
    }),
    createdByClinicUser: one(clinicUsers, {
        fields: [checkIns.createdByClinicUserId],
        references: [clinicUsers.id],
    }),
}));
