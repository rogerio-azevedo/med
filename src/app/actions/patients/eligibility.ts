"use server";

import { auth } from "@/auth";
import { checkPatientEligibility as queryCheckPatientEligibility } from "@/db/queries/patients/eligibility";

export async function checkPatientEligibilityAction(cpf: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized");
    }

    if (!cpf) {
        return { success: false, error: "CPF é obrigatório" };
    }

    try {
        const result = await queryCheckPatientEligibility(cpf, clinicId);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error checking patient eligibility:", error);
        return { success: false, error: "Erro ao verificar paciente" };
    }
}
