import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { addresses, hospitals } from "@/db/schema";

export async function getHospitals(clinicId: string) {
    return db
        .select({
            id: hospitals.id,
            clinicId: hospitals.clinicId,
            name: hospitals.name,
            description: hospitals.description,
            isActive: hospitals.isActive,
            createdAt: hospitals.createdAt,
            updatedAt: hospitals.updatedAt,
            address: {
                id: addresses.id,
                zipCode: addresses.zipCode,
                street: addresses.street,
                number: addresses.number,
                complement: addresses.complement,
                neighborhood: addresses.neighborhood,
                city: addresses.city,
                state: addresses.state,
                latitude: addresses.latitude,
                longitude: addresses.longitude,
            },
        })
        .from(hospitals)
        .leftJoin(
            addresses,
            and(eq(addresses.entityId, hospitals.id), eq(addresses.entityType, "hospital"))
        )
        .where(eq(hospitals.clinicId, clinicId))
        .orderBy(asc(hospitals.name));
}

export async function getHospitalsWithAddress(clinicId: string) {
    return db
        .select({
            id: hospitals.id,
            name: hospitals.name,
            description: hospitals.description,
            address: {
                id: addresses.id,
                street: addresses.street,
                number: addresses.number,
                neighborhood: addresses.neighborhood,
                city: addresses.city,
                state: addresses.state,
                zipCode: addresses.zipCode,
                latitude: addresses.latitude,
                longitude: addresses.longitude,
            },
        })
        .from(hospitals)
        .innerJoin(
            addresses,
            and(
                eq(addresses.entityId, hospitals.id),
                eq(addresses.entityType, "hospital"),
                isNotNull(addresses.latitude),
                isNotNull(addresses.longitude)
            )
        )
        .where(and(eq(hospitals.clinicId, clinicId), eq(hospitals.isActive, true)))
        .orderBy(asc(hospitals.name));
}
