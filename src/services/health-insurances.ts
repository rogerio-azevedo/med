import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
    clinicHealthInsurances,
    doctorHealthInsurances,
    healthInsurances,
    patientHealthInsurances,
} from "@/db/schema";
import type {
    HealthInsuranceInput,
    PatientHealthInsuranceInput,
} from "@/validations/health-insurance";

export async function createHealthInsuranceService(
    data: HealthInsuranceInput
): Promise<{ success: true } | { success: false; error: string }> {
    const existing = await db.query.healthInsurances.findFirst({
        where: (table, { eq }) => eq(table.name, data.name.trim()),
    });

    if (existing) {
        return { success: false, error: "Já existe um convênio com este nome." };
    }

    await db.insert(healthInsurances).values({
        name: data.name.trim(),
        code: data.code?.trim() || null,
        ansCode: data.ansCode?.trim() || null,
        notes: data.notes?.trim() || null,
    });

    return { success: true };
}

export async function updateHealthInsuranceService(
    id: string,
    data: HealthInsuranceInput
): Promise<{ success: true } | { success: false; error: string }> {
    const existing = await db.query.healthInsurances.findFirst({
        where: (table, { and, eq, ne }) =>
            and(eq(table.name, data.name.trim()), ne(table.id, id)),
    });

    if (existing) {
        return { success: false, error: "Já existe um convênio com este nome." };
    }

    await db
        .update(healthInsurances)
        .set({
            name: data.name.trim(),
            code: data.code?.trim() || null,
            ansCode: data.ansCode?.trim() || null,
            notes: data.notes?.trim() || null,
            updatedAt: new Date(),
        })
        .where(eq(healthInsurances.id, id));

    return { success: true };
}

export async function deleteHealthInsuranceService(
    id: string
): Promise<{ success: true } | { success: false; error: string }> {
    await db
        .update(healthInsurances)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(healthInsurances.id, id));

    return { success: true };
}

export async function syncClinicHealthInsurances(
    clinicId: string,
    healthInsuranceIds: string[]
) {
    const uniqueIds = Array.from(new Set(healthInsuranceIds));
    const existing = await db
        .select()
        .from(clinicHealthInsurances)
        .where(eq(clinicHealthInsurances.clinicId, clinicId));

    const existingByInsuranceId = new Map(
        existing.map((row) => [row.healthInsuranceId, row])
    );

    for (const row of existing) {
        const shouldBeActive = uniqueIds.includes(row.healthInsuranceId);
        if (row.isActive !== shouldBeActive) {
            await db
                .update(clinicHealthInsurances)
                .set({ isActive: shouldBeActive })
                .where(eq(clinicHealthInsurances.id, row.id));
        }
    }

    for (const healthInsuranceId of uniqueIds) {
        if (!existingByInsuranceId.has(healthInsuranceId)) {
            await db.insert(clinicHealthInsurances).values({
                clinicId,
                healthInsuranceId,
                isActive: true,
            });
        }
    }
}

export async function syncDoctorHealthInsurances(
    doctorId: string,
    healthInsuranceIds: string[]
) {
    const uniqueIds = Array.from(new Set(healthInsuranceIds));
    const existing = await db
        .select()
        .from(doctorHealthInsurances)
        .where(eq(doctorHealthInsurances.doctorId, doctorId));

    const existingByInsuranceId = new Map(
        existing.map((row) => [row.healthInsuranceId, row])
    );

    for (const row of existing) {
        const shouldBeActive = uniqueIds.includes(row.healthInsuranceId);
        if (row.isActive !== shouldBeActive) {
            await db
                .update(doctorHealthInsurances)
                .set({ isActive: shouldBeActive })
                .where(eq(doctorHealthInsurances.id, row.id));
        }
    }

    for (const healthInsuranceId of uniqueIds) {
        if (!existingByInsuranceId.has(healthInsuranceId)) {
            await db.insert(doctorHealthInsurances).values({
                doctorId,
                healthInsuranceId,
                isActive: true,
            });
        }
    }
}

export async function syncPatientHealthInsurances(
    patientId: string,
    items: PatientHealthInsuranceInput[] | undefined
) {
    const entries = (items ?? []).filter((item) => item.isActive !== false);
    const firstActiveId = entries[0]?.id;
    const primaryId =
        entries.find((item) => item.isPrimary)?.id ??
        (entries.length === 1 ? firstActiveId : undefined);

    const existing = await db
        .select()
        .from(patientHealthInsurances)
        .where(eq(patientHealthInsurances.patientId, patientId));

    const existingById = new Map(existing.map((row) => [row.id, row]));

    for (const row of existing) {
        await db
            .update(patientHealthInsurances)
            .set({
                isActive: false,
                isPrimary: false,
                updatedAt: new Date(),
            })
            .where(eq(patientHealthInsurances.id, row.id));
    }

    for (const item of entries) {
        const isPrimary =
            item.id ? item.id === primaryId : !primaryId && entries[0] === item;

        if (item.id && existingById.has(item.id)) {
            await db
                .update(patientHealthInsurances)
                .set({
                    healthInsuranceId: item.healthInsuranceId,
                    cardNumber: item.cardNumber || null,
                    planName: item.planName || null,
                    planCode: item.planCode || null,
                    holderName: item.holderName || null,
                    holderCpf: item.holderCpf?.replace(/\D/g, "") || null,
                    validUntil: item.validUntil || null,
                    isPrimary,
                    isActive: true,
                    updatedAt: new Date(),
                })
                .where(eq(patientHealthInsurances.id, item.id));
            continue;
        }

        await db.insert(patientHealthInsurances).values({
            patientId,
            healthInsuranceId: item.healthInsuranceId,
            cardNumber: item.cardNumber || null,
            planName: item.planName || null,
            planCode: item.planCode || null,
            holderName: item.holderName || null,
            holderCpf: item.holderCpf?.replace(/\D/g, "") || null,
            validUntil: item.validUntil || null,
            isPrimary,
            isActive: true,
        });
    }
}

export async function healthInsuranceIsLinked(id: string) {
    const [clinicLink, doctorLink, patientLink] = await Promise.all([
        db.query.clinicHealthInsurances.findFirst({
            where: (table, { and, eq }) =>
                and(
                    eq(table.healthInsuranceId, id),
                    eq(table.isActive, true)
                ),
        }),
        db.query.doctorHealthInsurances.findFirst({
            where: (table, { and, eq }) =>
                and(
                    eq(table.healthInsuranceId, id),
                    eq(table.isActive, true)
                ),
        }),
        db.query.patientHealthInsurances.findFirst({
            where: (table, { and, eq }) =>
                and(
                    eq(table.healthInsuranceId, id),
                    eq(table.isActive, true)
                ),
        }),
    ]);

    return Boolean(clinicLink || doctorLink || patientLink);
}
