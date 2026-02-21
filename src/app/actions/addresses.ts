"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const addressSchema = z.object({
    entityType: z.enum(["clinic", "doctor"]),
    entityId: z.string().uuid(),
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
});

export async function upsertAddressAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        throw new Error("Não autorizado");
    }

    const data = Object.fromEntries(formData);
    const parsed = addressSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const payload = parsed.data;

    let latitude = payload.latitude || null;
    let longitude = payload.longitude || null;

    // Se a latitude e longitude não vieram do form, tenta buscar
    if (!latitude || !longitude) {
        let addressQuery = "";
        if (payload.street) addressQuery += payload.street;
        if (payload.number) addressQuery += `, ${payload.number}`;
        if (payload.neighborhood) addressQuery += `, ${payload.neighborhood}`;
        if (payload.city) addressQuery += ` - ${payload.city}`;
        if (payload.state) addressQuery += `, ${payload.state}`;
        if (payload.zipCode) addressQuery += `, ${payload.zipCode}`;

        if (addressQuery) {
            try {
                // A api/geocode agora usa o Here API que recebe ?address via query e retorna um JSON list
                const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/geocode`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: addressQuery })
                });

                if (res.ok) {
                    const geoData = await res.json();
                    if (geoData.items && geoData.items.length > 0) {
                        latitude = geoData.items[0].position.lat;
                        longitude = geoData.items[0].position.lng;
                    }
                }
            } catch (e) {
                console.error("Geocoding failed", e);
            }
        }
    }

    try {
        // Verifica se já existe endereço
        const existing = await db.query.addresses.findFirst({
            where: and(
                eq(addresses.entityId, payload.entityId),
                eq(addresses.entityType, payload.entityType)
            )
        });

        if (existing) {
            await db.update(addresses)
                .set({
                    zipCode: payload.zipCode || null,
                    street: payload.street || null,
                    number: payload.number || null,
                    complement: payload.complement || null,
                    neighborhood: payload.neighborhood || null,
                    city: payload.city || null,
                    state: payload.state || null,
                    latitude,
                    longitude,
                })
                .where(eq(addresses.id, existing.id));
        } else {
            await db.insert(addresses).values({
                entityId: payload.entityId,
                entityType: payload.entityType,
                zipCode: payload.zipCode || null,
                street: payload.street || null,
                number: payload.number || null,
                complement: payload.complement || null,
                neighborhood: payload.neighborhood || null,
                city: payload.city || null,
                state: payload.state || null,
                latitude,
                longitude,
            });
        }

        revalidatePath("/admin/clinics");
        revalidatePath("/doctors");
        revalidatePath("/maps");
        return { success: true };
    } catch (error) {
        console.error("Failed to upsert address:", error);
        return { error: "Erro ao salvar endereço." };
    }
}
