"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveServiceTypes, getServiceTypes } from "@/db/queries/service-types";
import { serviceTypeSchema } from "@/lib/validations/service-types";
import {
    createServiceTypeService,
    deleteServiceTypeService,
    updateServiceTypeService,
} from "@/services/service-types";

function getFirstError(error: z.ZodError) {
    const flattened = z.flattenError(error);
    return Object.values(flattened.fieldErrors).flat().find(Boolean);
}

export async function getServiceTypesAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getServiceTypes(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar tipos de atendimento" };
    }
}

export async function getActiveServiceTypesAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getActiveServiceTypes(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar tipos de atendimento" };
    }
}

export async function createServiceTypeAction(data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = serviceTypeSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) || "Dados inválidos" };
    }

    const result = await createServiceTypeService(clinicId, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath("/service-types");
    revalidatePath("/checkins");
    return { success: true };
}

export async function updateServiceTypeAction(id: string, data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = serviceTypeSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) || "Dados inválidos" };
    }

    const result = await updateServiceTypeService(clinicId, id, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath("/service-types");
    revalidatePath("/checkins");
    return { success: true };
}

export async function deleteServiceTypeAction(id: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const result = await deleteServiceTypeService(clinicId, id);
    if (!result.success) {
        return result;
    }

    revalidatePath("/service-types");
    revalidatePath("/checkins");
    return {
        success: true,
        message: "Tipo de atendimento inativado com sucesso.",
    };
}
