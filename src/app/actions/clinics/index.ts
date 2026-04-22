"use server";

import { auth } from "@/auth";
import { z } from "zod";
import {
    createClinic as createClinicService,
    updateClinicInfo,
    getClinicIdForAdmin,
} from "@/services/clinics";
import { createClinicSchema, updateClinicSchema } from "@/validations/clinic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClinic(formData: FormData) {
    const session = await auth();

    if (session?.user?.role !== "super_admin") {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const rawSlug = formData.get("slug") as string;
    const slug =
        rawSlug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const validated = createClinicSchema.safeParse({ name, slug });

    if (!validated.success) {
        return { error: z.flattenError(validated.error).fieldErrors };
    }

    const result = await createClinicService(validated.data);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/admin/clinics");
    redirect("/admin/clinics");
}

export async function updateClinicInfoAction(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Não autenticado." };
    }

    if (session.user.role !== "admin") {
        return {
            error: "Sem permissão. Apenas administradores podem editar a clínica.",
        };
    }

    const clinicId = await getClinicIdForAdmin(session.user.id);

    if (!clinicId) {
        return { error: "Nenhuma clínica associada a este usuário." };
    }

    const raw = {
        name: formData.get("name") as string,
        email: (formData.get("email") as string) || "",
        phone: (formData.get("phone") as string) || "",
        cnpj: (formData.get("cnpj") as string) || "",
        proposalGeneralNotes: (formData.get("proposalGeneralNotes") as string) ?? "",
    };

    const validated = updateClinicSchema.safeParse(raw);

    if (!validated.success) {
        const flattened = z.flattenError(validated.error);
        const firstError = Object.values(flattened.fieldErrors).flat()[0];
        return { error: firstError ?? "Dados inválidos." };
    }

    const result = await updateClinicInfo(clinicId, validated.data);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/conta");
    revalidatePath("/proposals");
    return { success: true };
}

export async function updateClinicUserRole(clinicUserId: string, newRole: "admin" | "doctor" | "receptionist" | "nurse" | "patient") {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Não autenticado." };
    }

    if (session.user.clinicRole !== "admin" && session.user.role !== "super_admin") {
        return { error: "Sem permissão. Apenas o administrador da clínica pode alterar papéis." };
    }

    // Não permitir que o usuário altere seu próprio papel para evitar que fique sem acesso
    if (session.user.clinicUserId === clinicUserId) {
        return { error: "Você não pode alterar seu próprio papel." };
    }

    const { db } = await import("@/db");
    const { clinicUsers, users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    try {
        // Obter o usuário da clínica atual
        const targetClinicUser = await db.query.clinicUsers.findFirst({
            where: eq(clinicUsers.id, clinicUserId)
        });

        if (!targetClinicUser) {
            return { error: "Usuário não encontrado na clínica." };
        }
        
        // Atualiza a role na clínica
        await db.update(clinicUsers)
            .set({ role: newRole })
            .where(eq(clinicUsers.id, clinicUserId));
            
        // Se a nova role for admin, promove também o users.role global para admin, se não for super_admin
        // Se a role anterior era admin e agora não é, rebaixa para user
        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, targetClinicUser.userId)
        });
        
        if (targetUser && targetUser.role !== "super_admin") {
            if (newRole === "admin" && targetUser.role !== "admin") {
                await db.update(users).set({ role: "admin" }).where(eq(users.id, targetUser.id));
            } else if (newRole !== "admin" && targetClinicUser.role === "admin") {
                await db.update(users).set({ role: "user" }).where(eq(users.id, targetUser.id));
            }
        }

        const { revalidatePath } = await import("next/cache");
        revalidatePath("/conta/usuarios");
        return { success: true };
    } catch (e) {
        return { error: "Erro ao atualizar papel do usuário." };
    }
}
