import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { clinics, clinicUsers, users } from "@/db/schema";
import type { CreateClinicInput, UpdateClinicInput } from "@/validations/clinic";
import { seedDefaultScoreItemsForClinic } from "@/services/score-items";
import { seedDefaultServiceTypesForClinic } from "@/services/service-types";

export async function createClinic(
    data: CreateClinicInput
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const [createdClinic] = await db
            .insert(clinics)
            .values({
                name: data.name,
                slug: data.slug,
            })
            .returning({ id: clinics.id });

        await seedDefaultScoreItemsForClinic(createdClinic.id);
        await seedDefaultServiceTypesForClinic(createdClinic.id);
        return { success: true };
    } catch {
        return { success: false, error: "Failed to create clinic. Slug might be taken." };
    }
}

function normalizeWebsiteUrlForStorage(raw: string | undefined): string | null {
    const t = raw?.trim();
    if (!t) return null;
    if (/^https?:\/\//i.test(t)) return t;
    if (/^www\./i.test(t)) return `https://${t}`;
    if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/.*)?$/i.test(t)) return `https://${t}`;
    return t;
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
                websiteUrl: normalizeWebsiteUrlForStorage(data.websiteUrl),
                proposalGeneralNotes: data.proposalGeneralNotes?.trim()
                    ? data.proposalGeneralNotes.trim()
                    : null,
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

export async function getClinicUsers(clinicId: string) {
    const members = await db
        .select({
            id: clinicUsers.id,
            clinicId: clinicUsers.clinicId,
            role: clinicUsers.role,
            isActive: clinicUsers.isActive,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
                image: users.image,
            }
        })
        .from(clinicUsers)
        .innerJoin(users, eq(clinicUsers.userId, users.id))
        .where(eq(clinicUsers.clinicId, clinicId))
        .orderBy(desc(clinicUsers.createdAt));

    return members;
}
