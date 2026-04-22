"use server";

import { auth } from "@/auth";
import { upsertPermission } from "@/services/permissions";
import { revalidatePath } from "next/cache";
import type { FeatureSlug, PermissionAction } from "@/lib/features";

export async function updateUserFeaturePermission(
    clinicUserId: string,
    featureSlug: FeatureSlug,
    actions: PermissionAction[]
) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Não autenticado." };
    }

    if (session.user.clinicRole !== "admin" && session.user.role !== "super_admin") {
        return { error: "Sem permissão. Apenas o administrador da clínica pode alterar permissões." };
    }

    // Não permitir que o admin remova o próprio acesso à tela de configurações/usuários
    if (session.user.clinicUserId === clinicUserId && (featureSlug === "users" || featureSlug === "clinic-settings")) {
        return { error: "Você não pode alterar suas próprias permissões de administração." };
    }

    try {
        await upsertPermission(clinicUserId, featureSlug, actions);
        revalidatePath("/conta/permissoes");
        return { success: true };
    } catch (e) {
        return { error: "Erro ao atualizar permissões do usuário." };
    }
}
