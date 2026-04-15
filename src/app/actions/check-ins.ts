"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCheckIns } from "@/db/queries/check-ins";
import { checkInSchema } from "@/lib/validations/check-ins";
import { createCheckInService } from "@/services/check-ins";

function getFirstError(error: z.ZodError) {
    const flattened = z.flattenError(error);
    return Object.values(flattened.fieldErrors).flat().find(Boolean);
}

export async function getCheckInsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getCheckIns(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar check-ins" };
    }
}

export async function createCheckInAction(data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    const clinicUserId = session?.user?.clinicUserId;

    if (!clinicId || !clinicUserId) {
        return { success: false, error: "Usuário da clínica não encontrado" };
    }

    const parsed = checkInSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) || "Dados inválidos" };
    }

    const result = await createCheckInService(clinicId, clinicUserId, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath("/checkins");
    revalidatePath("/dashboard");
    revalidatePath("/schedule");
    revalidatePath(`/medical-records/${parsed.data.patientId}`);
    return { success: true, id: result.id, consultationId: result.consultationId };
}
