"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { clinics, clinicUsers } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const createClinicSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres").optional(),
});

const updateClinicSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    cnpj: z.string().optional(),
});

export async function createClinic(formData: FormData) {
    const session = await auth();

    if (session?.user?.role !== "super_admin") {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const rawSlug = formData.get("slug") as string;

    // Simple slug generation if not provided
    const slug = rawSlug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const validated = createClinicSchema.safeParse({ name, slug });

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        await db.insert(clinics).values({
            name: validated.data.name,
            slug: validated.data.slug,
        }).returning();

        revalidatePath("/admin/clinics");
    } catch (error) {
        console.error("Failed to create clinic:", error);
        return { error: "Failed to create clinic. Slug might be taken." };
    }

    redirect("/admin/clinics");
}

export async function updateClinicInfoAction(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Não autenticado." };
    }

    // Only admins can update clinic info
    if (session.user.role !== "admin") {
        return { error: "Sem permissão. Apenas administradores podem editar a clínica." };
    }

    // Find the clinic this admin belongs to
    const clinicUser = await db.query.clinicUsers.findFirst({
        where: and(
            eq(clinicUsers.userId, session.user.id),
            eq(clinicUsers.role, "admin"),
            eq(clinicUsers.isActive, true),
        ),
    });

    if (!clinicUser) {
        return { error: "Nenhuma clínica associada a este usuário." };
    }

    const raw = {
        name: formData.get("name") as string,
        email: (formData.get("email") as string) || "",
        phone: (formData.get("phone") as string) || "",
        cnpj: (formData.get("cnpj") as string) || "",
    };

    const validated = updateClinicSchema.safeParse(raw);

    if (!validated.success) {
        const errors = validated.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0];
        return { error: firstError ?? "Dados inválidos." };
    }

    try {
        await db
            .update(clinics)
            .set({
                name: validated.data.name,
                email: validated.data.email || null,
                phone: validated.data.phone || null,
                cnpj: validated.data.cnpj || null,
            })
            .where(eq(clinics.id, clinicUser.clinicId));

        revalidatePath("/conta");
        return { success: true };
    } catch (error) {
        console.error("Failed to update clinic:", error);
        return { error: "Falha ao salvar. Tente novamente." };
    }
}
