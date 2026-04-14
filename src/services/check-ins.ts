import { createCheckInQuery, getCheckInDependencies } from "@/db/queries/check-ins";
import type { CheckInInput } from "@/lib/validations/check-ins";

export async function createCheckInService(
    clinicId: string,
    clinicUserId: string,
    data: CheckInInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
    const normalizedHealthInsuranceId = data.healthInsuranceId || null;
    const normalizedNotes = data.notes?.trim() || null;

    const dependencies = await getCheckInDependencies(clinicId, {
        patientId: data.patientId,
        serviceTypeId: data.serviceTypeId,
        scoreItemId: data.scoreItemId,
        healthInsuranceId: normalizedHealthInsuranceId,
        createdByClinicUserId: clinicUserId,
    });

    if (!dependencies.patientLink) {
        return { success: false, error: "Paciente não encontrado para esta clínica." };
    }

    if (!dependencies.serviceType) {
        return { success: false, error: "Tipo de atendimento inválido ou inativo." };
    }

    if (!dependencies.scoreItem) {
        return { success: false, error: "Pontuação inválida ou inativa." };
    }

    if (!dependencies.clinicUser) {
        return { success: false, error: "Usuário da clínica não encontrado." };
    }

    if (normalizedHealthInsuranceId && !dependencies.clinicInsurance) {
        return { success: false, error: "Convênio inválido para esta clínica." };
    }

    const created = await createCheckInQuery({
        clinicId,
        patientId: data.patientId,
        serviceTypeId: data.serviceTypeId,
        healthInsuranceId: normalizedHealthInsuranceId,
        scoreItemId: data.scoreItemId,
        createdByClinicUserId: clinicUserId,
        notes: normalizedNotes,
    });

    return { success: true, id: created.id };
}
