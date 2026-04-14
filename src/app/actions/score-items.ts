"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveScoreItems, getScoreItems } from "@/db/queries/score-items";
import { scoreItemSchema } from "@/lib/validations/score-items";
import {
    createScoreItemService,
    deleteScoreItemService,
    updateScoreItemService,
} from "@/services/score-items";

function getFirstError(error: z.ZodError) {
    const flattened = z.flattenError(error);
    return Object.values(flattened.fieldErrors).flat().find(Boolean);
}

export async function getScoreItemsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getScoreItems(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar pontuações" };
    }
}

export async function getActiveScoreItemsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getActiveScoreItems(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar pontuações ativas" };
    }
}

export async function createScoreItemAction(data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = scoreItemSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) || "Dados inválidos" };
    }

    const result = await createScoreItemService(clinicId, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath("/scores");
    return { success: true };
}

export async function updateScoreItemAction(id: string, data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = scoreItemSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) || "Dados inválidos" };
    }

    const result = await updateScoreItemService(clinicId, id, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath("/scores");
    return { success: true };
}

export async function deleteScoreItemAction(id: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const result = await deleteScoreItemService(clinicId, id);
    if (!result.success) {
        return result;
    }

    revalidatePath("/scores");
    return {
        success: true,
        message: "Pontuação inativada com sucesso.",
    };
}
