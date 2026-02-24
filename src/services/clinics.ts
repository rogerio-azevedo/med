import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { clinics, clinicUsers } from "@/db/schema";
import type { CreateClinicInput, UpdateClinicInput } from "@/lib/validations/clinic";

export async function createClinic(
    data: CreateClinicInput
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await db.insert(clinics).values({
            name: data.name,
            slug: data.slug,
        }).returning();
        return { success: true };
    } catch {
        return { success: false, error: "Failed to create clinic. Slug might be taken." };
    }
}

export async function updateClinicInfo(
    clinicId: string,
    data: UpdateClinicInput
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await db
            .update(clinics)
            .set({
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                cnpj: data.cnpj || null,
            })
            .where(eq(clinics.id, clinicId));
        return { success: true };
    } catch {
        return { success: false, error: "Falha ao salvar. Tente novamente." };
    }
}

export async function getClinicIdForAdmin(userId: string): Promise<string | null> {
    const clinicUser = await db.query.clinicUsers.findFirst({
        where: and(
            eq(clinicUsers.userId, userId),
            eq(clinicUsers.role, "admin"),
            eq(clinicUsers.isActive, true)
        ),
    });
    return clinicUser?.clinicId ?? null;
}
