"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { updatePatientPlanStatus } from "@/db/queries/patient-plans";
import { updatePatientPlanStatusSchema } from "@/validations/patient-plans";
import { can } from "@/lib/permissions";

export async function updatePatientPlanStatusAction(id: string, status: string) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    const allowed = await can("patient-plans", "can_update");
    if (!allowed) {
        return { success: false, error: "Sem permissão" };
    }

    const validated = updatePatientPlanStatusSchema.safeParse({ id, status });
    if (!validated.success) {
        return { success: false, error: "Dados inválidos" };
    }

    try {
        const row = await updatePatientPlanStatus(
            validated.data.id,
            session.user.clinicId,
            validated.data.status
        );
        if (!row) {
            return { success: false, error: "Plano não encontrado" };
        }
        revalidatePath("/patient-plans");
        return { success: true, data: row };
    } catch (e) {
        console.error("updatePatientPlanStatusAction", e);
        return { success: false, error: "Erro ao atualizar plano" };
    }
}
