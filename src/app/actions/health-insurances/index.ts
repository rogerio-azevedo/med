"use server";

import { auth } from "@/auth";
import {
    getActiveHealthInsurances,
    getClinicHealthInsurances,
    getHealthInsurances,
} from "@/db/queries/health-insurances";
import {
    healthInsuranceSchema,
    healthInsuranceLinkSchema,
} from "@/validations/health-insurance";
import {
    createHealthInsuranceService,
    deleteHealthInsuranceService,
    healthInsuranceIsLinked,
    syncClinicHealthInsurances,
    updateHealthInsuranceService,
} from "@/services/health-insurances";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getHealthInsurancesAction() {
    try {
        const data = await getHealthInsurances();
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar convênios" };
    }
}

export async function getActiveHealthInsurancesAction() {
    try {
        const data = await getActiveHealthInsurances();
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar convênios" };
    }
}

export async function getCurrentClinicHealthInsurancesAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getClinicHealthInsurances(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar convênios da clínica" };
    }
}

export async function createHealthInsuranceAction(data: unknown) {
    const parsed = healthInsuranceSchema.safeParse(data);

    if (!parsed.success) {
        const flattened = z.flattenError(parsed.error);
        const firstError = Object.values(flattened.fieldErrors).flat().find(Boolean);
        return { success: false, error: firstError || "Dados inválidos" };
    }

    const result = await createHealthInsuranceService(parsed.data);

    if (!result.success) {
        return result;
    }

    revalidatePath("/health-insurances");
    return { success: true };
}

export async function updateHealthInsuranceAction(id: string, data: unknown) {
    const parsed = healthInsuranceSchema.safeParse(data);

    if (!parsed.success) {
        const flattened = z.flattenError(parsed.error);
        const firstError = Object.values(flattened.fieldErrors).flat().find(Boolean);
        return { success: false, error: firstError || "Dados inválidos" };
    }

    const result = await updateHealthInsuranceService(id, parsed.data);

    if (!result.success) {
        return result;
    }

    revalidatePath("/health-insurances");
    return { success: true };
}

export async function deleteHealthInsuranceAction(id: string) {
    try {
        const isLinked = await healthInsuranceIsLinked(id);
        const result = await deleteHealthInsuranceService(id);

        if (!result.success) {
            return result;
        }

        revalidatePath("/health-insurances");
        return {
            success: true,
            message: isLinked
                ? "Convênio inativado porque já possui vínculos."
                : "Convênio removido com sucesso.",
        };
    } catch {
        return { success: false, error: "Erro ao remover convênio" };
    }
}

export async function updateCurrentClinicHealthInsurancesAction(data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = healthInsuranceLinkSchema.safeParse(data);

    if (!parsed.success) {
        const flattened = z.flattenError(parsed.error);
        const firstError = Object.values(flattened.fieldErrors).flat().find(Boolean);
        return { success: false, error: firstError || "Dados inválidos" };
    }

    try {
        await syncClinicHealthInsurances(clinicId, parsed.data.healthInsuranceIds);
        revalidatePath("/health-insurances");
        revalidatePath("/doctors");
        revalidatePath("/patients");
        return { success: true };
    } catch {
        return { success: false, error: "Erro ao atualizar convênios da clínica" };
    }
}
