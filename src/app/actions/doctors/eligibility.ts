"use server";

import { auth } from "@/auth";
import { checkDoctorEligibility as queryCheckDoctorEligibility } from "@/db/queries/doctors/eligibility";

export async function checkDoctorEligibilityAction(crm: string, crmState: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized");
    }

    if (!crm || !crmState) {
        return { success: false, error: "CRM e Estado (UF) são obrigatórios" };
    }

    try {
        const result = await queryCheckDoctorEligibility(crm, crmState, clinicId);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error checking doctor eligibility:", error);
        return { success: false, error: "Erro ao verificar médico" };
    }
}
