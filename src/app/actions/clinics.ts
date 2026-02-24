"use server";

import { auth } from "@/auth";
import { z } from "zod";
import {
    createClinic as createClinicService,
    updateClinicInfo,
    getClinicIdForAdmin,
} from "@/services/clinics";
import { createClinicSchema, updateClinicSchema } from "@/lib/validations/clinic";
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
    return { success: true };
}
