import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { medications, prescriptions } from "@/db/schema";

export type PrescriptionInsert = {
    consultationId: string;
    patientId: string;
    clinicId: string;
    medicationId?: string | null;
    medicineName: string;
    dosage?: string | null;
    pharmaceuticalForm?: string | null;
    frequency?: string | null;
    duration?: string | null;
    quantity?: string | null;
    route?:
        | "oral"
        | "iv"
        | "im"
        | "sc"
        | "topical"
        | "inhaled"
        | "ophthalmic"
        | "otic"
        | "rectal"
        | "vaginal"
        | "other";
    instructions?: string | null;
    isContinuous: boolean;
    startDate?: string | null;
    endDate?: string | null;
};

function emptyToNull(s: string | null | undefined) {
    const t = s?.trim();
    return t ? t : null;
}

export async function insertPrescription(data: PrescriptionInsert) {
    const [row] = await db
        .insert(prescriptions)
        .values({
            consultationId: data.consultationId,
            patientId: data.patientId,
            clinicId: data.clinicId,
            medicationId: data.medicationId ?? null,
            medicineName: data.medicineName.trim(),
            dosage: emptyToNull(data.dosage),
            pharmaceuticalForm: emptyToNull(data.pharmaceuticalForm),
            frequency: emptyToNull(data.frequency),
            duration: emptyToNull(data.duration),
            quantity: emptyToNull(data.quantity),
            route: data.route ?? "oral",
            instructions: emptyToNull(data.instructions),
            isContinuous: data.isContinuous,
            isActive: true,
            startDate: emptyToNull(data.startDate),
            endDate: emptyToNull(data.endDate),
        })
        .returning();

    return row;
}

export async function getPrescriptionsByConsultation(consultationId: string, clinicId: string) {
    return db
        .select()
        .from(prescriptions)
        .where(and(eq(prescriptions.consultationId, consultationId), eq(prescriptions.clinicId, clinicId)))
        .orderBy(desc(prescriptions.createdAt));
}

export type PrescriptionUpdate = {
    medicationId?: string | null;
    medicineName: string;
    dosage?: string | null;
    pharmaceuticalForm?: string | null;
    frequency?: string | null;
    duration?: string | null;
    quantity?: string | null;
    route?:
        | "oral"
        | "iv"
        | "im"
        | "sc"
        | "topical"
        | "inhaled"
        | "ophthalmic"
        | "otic"
        | "rectal"
        | "vaginal"
        | "other";
    instructions?: string | null;
    isContinuous: boolean;
    startDate?: string | null;
    endDate?: string | null;
};

export async function updatePrescription(
    id: string,
    consultationId: string,
    clinicId: string,
    data: PrescriptionUpdate
) {
    const [row] = await db
        .update(prescriptions)
        .set({
            medicationId: data.medicationId ?? null,
            medicineName: data.medicineName.trim(),
            dosage: emptyToNull(data.dosage),
            pharmaceuticalForm: emptyToNull(data.pharmaceuticalForm),
            frequency: emptyToNull(data.frequency),
            duration: emptyToNull(data.duration),
            quantity: emptyToNull(data.quantity),
            route: data.route ?? "oral",
            instructions: emptyToNull(data.instructions),
            isContinuous: data.isContinuous,
            startDate: emptyToNull(data.startDate),
            endDate: emptyToNull(data.endDate),
        })
        .where(
            and(
                eq(prescriptions.id, id),
                eq(prescriptions.consultationId, consultationId),
                eq(prescriptions.clinicId, clinicId)
            )
        )
        .returning();

    return row ?? null;
}

export async function deletePrescription(id: string, clinicId: string) {
    const [deleted] = await db
        .delete(prescriptions)
        .where(and(eq(prescriptions.id, id), eq(prescriptions.clinicId, clinicId)))
        .returning({ id: prescriptions.id });

    return deleted ?? null;
}

export async function searchMedicationsForPrescription(query: string, limit = 20) {
    const q = query.trim();
    if (q.length < 2) return [];

    const pattern = `%${q}%`;

    return db
        .select({
            id: medications.id,
            name: medications.name,
            activeIngredient: medications.activeIngredient,
            concentration: medications.concentration,
            pharmaceuticalForm: medications.pharmaceuticalForm,
            route: medications.route,
        })
        .from(medications)
        .where(
            and(
                eq(medications.status, "active"),
                or(
                    ilike(medications.name, pattern),
                    ilike(medications.activeIngredient, pattern),
                    ilike(medications.searchText, pattern),
                    ilike(medications.brandName, pattern)
                )
            )
        )
        .orderBy(asc(medications.name))
        .limit(limit);
}
