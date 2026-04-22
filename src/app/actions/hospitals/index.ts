"use server";

import { auth } from "@/auth";
import { getHospitals } from "@/db/queries/hospitals";
import { hospitalSchema } from "@/validations/hospital";
import {
    createHospitalService,
    deleteHospitalService,
    updateHospitalService,
} from "@/services/hospitals";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function getFirstError(error: z.ZodError) {
    const flattened = z.flattenError(error);
    return Object.values(flattened.fieldErrors).flat().find(Boolean) || "Dados inválidos";
}

export async function getHospitalsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getHospitals(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar hospitais" };
    }
}

export async function createHospitalAction(data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = hospitalSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    const result = await createHospitalService(clinicId, parsed.data);

    if (!result.success) {
        return result;
    }

    revalidatePath("/hospitals");
    revalidatePath("/maps");
    return { success: true };
}

export async function updateHospitalAction(id: string, data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const parsed = hospitalSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    const result = await updateHospitalService(id, clinicId, parsed.data);

    if (!result.success) {
        return result;
    }

    revalidatePath("/hospitals");
    revalidatePath("/maps");
    return { success: true };
}

export async function deleteHospitalAction(id: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const result = await deleteHospitalService(id, clinicId);

        if (!result.success) {
            return result;
        }

        revalidatePath("/hospitals");
        revalidatePath("/maps");
        return { success: true };
    } catch {
        return { success: false, error: "Erro ao remover hospital" };
    }
}
