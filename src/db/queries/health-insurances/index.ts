import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
    clinicHealthInsurances,
    doctorHealthInsurances,
    healthInsurances,
    patientHealthInsurances,
} from "@/db/schema";

export async function getHealthInsurances() {
    return db
        .select()
        .from(healthInsurances)
        .orderBy(asc(healthInsurances.name));
}

export async function getActiveHealthInsurances() {
    return db
        .select()
        .from(healthInsurances)
        .where(eq(healthInsurances.isActive, true))
        .orderBy(asc(healthInsurances.name));
}

export async function createHealthInsurance(data: {
    name: string;
    code?: string;
    ansCode?: string;
    notes?: string;
}) {
    const [created] = await db
        .insert(healthInsurances)
        .values({
            name: data.name,
            code: data.code || null,
            ansCode: data.ansCode || null,
            notes: data.notes || null,
        })
        .returning();

    return created;
}

export async function updateHealthInsurance(
    id: string,
    data: {
        name: string;
        code?: string;
        ansCode?: string;
        notes?: string;
    }
) {
    const [updated] = await db
        .update(healthInsurances)
        .set({
            name: data.name,
            code: data.code || null,
            ansCode: data.ansCode || null,
            notes: data.notes || null,
            updatedAt: new Date(),
        })
        .where(eq(healthInsurances.id, id))
        .returning();

    return updated;
}

export async function deactivateHealthInsurance(id: string) {
    const [updated] = await db
        .update(healthInsurances)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(healthInsurances.id, id))
        .returning();

    return updated;
}

export async function getClinicHealthInsuranceIds(clinicId: string) {
    const rows = await db
        .select({
            healthInsuranceId: clinicHealthInsurances.healthInsuranceId,
        })
        .from(clinicHealthInsurances)
        .where(
            and(
                eq(clinicHealthInsurances.clinicId, clinicId),
                eq(clinicHealthInsurances.isActive, true)
            )
        );

    return rows.map((row) => row.healthInsuranceId);
}

export async function getClinicHealthInsurances(clinicId: string) {
    return db
        .select({
            id: healthInsurances.id,
            name: healthInsurances.name,
            code: healthInsurances.code,
            ansCode: healthInsurances.ansCode,
            notes: healthInsurances.notes,
            isActive: clinicHealthInsurances.isActive,
        })
        .from(clinicHealthInsurances)
        .innerJoin(
            healthInsurances,
            eq(clinicHealthInsurances.healthInsuranceId, healthInsurances.id)
        )
        .where(
            and(
                eq(clinicHealthInsurances.clinicId, clinicId),
                eq(clinicHealthInsurances.isActive, true)
            )
        )
        .orderBy(asc(healthInsurances.name));
}

export async function getDoctorHealthInsuranceIds(doctorId: string) {
    const rows = await db
        .select({
            healthInsuranceId: doctorHealthInsurances.healthInsuranceId,
        })
        .from(doctorHealthInsurances)
        .where(
            and(
                eq(doctorHealthInsurances.doctorId, doctorId),
                eq(doctorHealthInsurances.isActive, true)
            )
        );

    return rows.map((row) => row.healthInsuranceId);
}

export async function getPatientHealthInsurances(patientId: string) {
    const rows = await db
        .select({
            id: patientHealthInsurances.id,
            healthInsuranceId: patientHealthInsurances.healthInsuranceId,
            name: healthInsurances.name,
            code: healthInsurances.code,
            cardNumber: patientHealthInsurances.cardNumber,
            planName: patientHealthInsurances.planName,
            planCode: patientHealthInsurances.planCode,
            holderName: patientHealthInsurances.holderName,
            holderCpf: patientHealthInsurances.holderCpf,
            validUntil: patientHealthInsurances.validUntil,
            isPrimary: patientHealthInsurances.isPrimary,
            isActive: patientHealthInsurances.isActive,
        })
        .from(patientHealthInsurances)
        .innerJoin(
            healthInsurances,
            eq(patientHealthInsurances.healthInsuranceId, healthInsurances.id)
        )
        .where(
            and(
                eq(patientHealthInsurances.patientId, patientId),
                eq(patientHealthInsurances.isActive, true)
            )
        )
        .orderBy(asc(healthInsurances.name));

    return rows.map((row) => ({
        ...row,
        cardNumber: row.cardNumber ?? "",
        planName: row.planName ?? "",
        planCode: row.planCode ?? "",
        holderName: row.holderName ?? "",
        holderCpf: row.holderCpf ?? "",
        validUntil: row.validUntil
            ? new Date(row.validUntil).toISOString().split("T")[0]
            : "",
    }));
}
