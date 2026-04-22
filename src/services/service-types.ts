import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { clinics, serviceTypes } from "@/db/schema";
import type { ServiceTypeInput } from "@/validations/service-types";

const defaultServiceTypes = [
    { name: "Consulta" },
    { name: "Exame" },
    { name: "Cirurgia" },
    { name: "Outro" },
] as const;

export async function seedDefaultServiceTypesForClinic(clinicId: string) {
    await db
        .insert(serviceTypes)
        .values(
            defaultServiceTypes.map((item) => ({
                clinicId,
                name: item.name,
                description: null,
            }))
        )
        .onConflictDoNothing({
            target: [serviceTypes.clinicId, serviceTypes.name],
        });
}

export async function backfillDefaultServiceTypesForAllClinics() {
    const existingClinics = await db.select({ id: clinics.id }).from(clinics);

    for (const clinic of existingClinics) {
        await seedDefaultServiceTypesForClinic(clinic.id);
    }
}

export async function createServiceTypeService(
    clinicId: string,
    data: ServiceTypeInput
): Promise<{ success: true } | { success: false; error: string }> {
    const trimmedName = data.name.trim();

    const existing = await db.query.serviceTypes.findFirst({
        where: and(eq(serviceTypes.clinicId, clinicId), eq(serviceTypes.name, trimmedName)),
    });

    if (existing) {
        return { success: false, error: "Já existe um tipo de atendimento com este nome." };
    }

    await db.insert(serviceTypes).values({
        clinicId,
        name: trimmedName,
        description: data.description?.trim() || null,
        workflow: data.workflow,
        timelineIconKey: data.timelineIconKey ?? null,
        timelineColorHex: data.timelineColorHex ?? null,
    });

    return { success: true };
}

export async function updateServiceTypeService(
    clinicId: string,
    id: string,
    data: ServiceTypeInput
): Promise<{ success: true } | { success: false; error: string }> {
    const trimmedName = data.name.trim();

    const existing = await db.query.serviceTypes.findFirst({
        where: and(
            eq(serviceTypes.clinicId, clinicId),
            eq(serviceTypes.name, trimmedName),
            ne(serviceTypes.id, id)
        ),
    });

    if (existing) {
        return { success: false, error: "Já existe um tipo de atendimento com este nome." };
    }

    const updated = await db
        .update(serviceTypes)
        .set({
            name: trimmedName,
            description: data.description?.trim() || null,
            workflow: data.workflow,
            timelineIconKey: data.timelineIconKey ?? null,
            timelineColorHex: data.timelineColorHex ?? null,
            updatedAt: new Date(),
        })
        .where(and(eq(serviceTypes.id, id), eq(serviceTypes.clinicId, clinicId)))
        .returning({ id: serviceTypes.id });

    if (!updated.length) {
        return { success: false, error: "Tipo de atendimento não encontrado." };
    }

    return { success: true };
}

export async function deleteServiceTypeService(
    clinicId: string,
    id: string
): Promise<{ success: true } | { success: false; error: string }> {
    const updated = await db
        .update(serviceTypes)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(and(eq(serviceTypes.id, id), eq(serviceTypes.clinicId, clinicId)))
        .returning({ id: serviceTypes.id });

    if (!updated.length) {
        return { success: false, error: "Tipo de atendimento não encontrado." };
    }

    return { success: true };
}
