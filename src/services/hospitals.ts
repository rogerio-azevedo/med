import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, hospitals } from "@/db/schema";
import { geocodeAddress } from "@/lib/geocode";
import type { HospitalInput } from "@/lib/validations/hospital";

function hasAddressData(data: HospitalInput) {
    return Boolean(data.zipCode || data.street || data.city);
}

async function resolveCoordinates(data: HospitalInput) {
    let latitude = null;
    let longitude = null;

    const coords = await geocodeAddress({
        street: data.street,
        number: data.number,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
    });

    if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
    }

    return { latitude, longitude };
}

export async function createHospitalService(
    clinicId: string,
    data: HospitalInput
): Promise<{ success: true } | { success: false; error: string }> {
    const existing = await db.query.hospitals.findFirst({
        where: (table, { and, eq }) =>
            and(eq(table.clinicId, clinicId), eq(table.name, data.name.trim()), eq(table.isActive, true)),
    });

    if (existing) {
        return { success: false, error: "Já existe um hospital com este nome nesta clínica." };
    }

    const [hospital] = await db
        .insert(hospitals)
        .values({
            clinicId,
            name: data.name.trim(),
            description: data.description?.trim() || null,
        })
        .returning();

    if (hasAddressData(data)) {
        const { latitude, longitude } = await resolveCoordinates(data);

        await db.insert(addresses).values({
            entityType: "hospital",
            entityId: hospital.id,
            zipCode: data.zipCode || null,
            street: data.street || null,
            number: data.number || null,
            complement: data.complement || null,
            neighborhood: data.neighborhood || null,
            city: data.city || null,
            state: data.state || null,
            latitude,
            longitude,
            isPrimary: true,
        });
    }

    return { success: true };
}

export async function updateHospitalService(
    hospitalId: string,
    clinicId: string,
    data: HospitalInput
): Promise<{ success: true } | { success: false; error: string }> {
    const hospital = await db.query.hospitals.findFirst({
        where: (table, { and, eq }) =>
            and(eq(table.id, hospitalId), eq(table.clinicId, clinicId), eq(table.isActive, true)),
    });

    if (!hospital) {
        return { success: false, error: "Hospital não encontrado." };
    }

    const duplicated = await db.query.hospitals.findFirst({
        where: (table, { and, eq, ne }) =>
            and(
                eq(table.clinicId, clinicId),
                eq(table.name, data.name.trim()),
                ne(table.id, hospitalId),
                eq(table.isActive, true)
            ),
    });

    if (duplicated) {
        return { success: false, error: "Já existe um hospital com este nome nesta clínica." };
    }

    await db
        .update(hospitals)
        .set({
            name: data.name.trim(),
            description: data.description?.trim() || null,
            updatedAt: new Date(),
        })
        .where(eq(hospitals.id, hospitalId));

    const existingAddress = await db.query.addresses.findFirst({
        where: and(eq(addresses.entityId, hospitalId), eq(addresses.entityType, "hospital")),
    });

    if (hasAddressData(data)) {
        const { latitude, longitude } = await resolveCoordinates(data);

        if (existingAddress) {
            await db
                .update(addresses)
                .set({
                    zipCode: data.zipCode || null,
                    street: data.street || null,
                    number: data.number || null,
                    complement: data.complement || null,
                    neighborhood: data.neighborhood || null,
                    city: data.city || null,
                    state: data.state || null,
                    latitude,
                    longitude,
                })
                .where(eq(addresses.id, existingAddress.id));
        } else {
            await db.insert(addresses).values({
                entityType: "hospital",
                entityId: hospitalId,
                zipCode: data.zipCode || null,
                street: data.street || null,
                number: data.number || null,
                complement: data.complement || null,
                neighborhood: data.neighborhood || null,
                city: data.city || null,
                state: data.state || null,
                latitude,
                longitude,
                isPrimary: true,
            });
        }
    } else if (existingAddress) {
        await db.delete(addresses).where(eq(addresses.id, existingAddress.id));
    }

    return { success: true };
}

export async function deleteHospitalService(
    hospitalId: string,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    const hospital = await db.query.hospitals.findFirst({
        where: (table, { and, eq }) =>
            and(eq(table.id, hospitalId), eq(table.clinicId, clinicId), eq(table.isActive, true)),
    });

    if (!hospital) {
        return { success: false, error: "Hospital não encontrado." };
    }

    await db
        .update(hospitals)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(hospitals.id, hospitalId));

    return { success: true };
}
