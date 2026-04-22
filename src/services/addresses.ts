import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { geocodeAddress } from "@/lib/geocode";
import type { AddressInput } from "@/validations/address";

export async function upsertAddress(
    data: AddressInput
): Promise<{ success: true } | { success: false; error: string }> {
    let latitude = data.latitude ?? null;
    let longitude = data.longitude ?? null;

    if (!latitude || !longitude) {
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
    }

    try {
        const existing = await db.query.addresses.findFirst({
            where: and(
                eq(addresses.entityId, data.entityId),
                eq(addresses.entityType, data.entityType)
            ),
        });

        if (existing) {
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
                .where(eq(addresses.id, existing.id));
        } else {
            await db.insert(addresses).values({
                entityId: data.entityId,
                entityType: data.entityType,
                zipCode: data.zipCode || null,
                street: data.street || null,
                number: data.number || null,
                complement: data.complement || null,
                neighborhood: data.neighborhood || null,
                city: data.city || null,
                state: data.state || null,
                latitude,
                longitude,
            });
        }
        return { success: true };
    } catch {
        return { success: false, error: "Erro ao salvar endereço." };
    }
}
