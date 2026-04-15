import { eq } from "drizzle-orm";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { createCheckInQuery, getCheckInDependencies } from "@/db/queries/check-ins";
import { createWaitingConsultationForCheckIn } from "@/services/consultations";
import { createWaitingSurgery } from "@/services/surgeries";
import type { CheckInInput } from "@/lib/validations/check-ins";

export async function createCheckInService(
    clinicId: string,
    clinicUserId: string,
    data: CheckInInput
): Promise<
    | { success: true; id: string; consultationId: string }
    | { success: true; id: string; surgeryId: string }
    | { success: false; error: string }
> {
    const normalizedHealthInsuranceId = data.healthInsuranceId || null;
    const normalizedNotes = data.notes?.trim() || null;

    const dependencies = await getCheckInDependencies(clinicId, {
        patientId: data.patientId,
        serviceTypeId: data.serviceTypeId,
        doctorId: data.doctorId,
        healthInsuranceId: normalizedHealthInsuranceId,
        createdByClinicUserId: clinicUserId,
    });

    if (!dependencies.patientLink) {
        return { success: false, error: "Paciente não encontrado para esta clínica." };
    }

    if (!dependencies.serviceType) {
        return { success: false, error: "Tipo de atendimento inválido ou inativo." };
    }

    if (!dependencies.clinicDoctor) {
        return {
            success: false,
            error: "Selecione um médico vinculado à clínica (médicos parceiros não entram na fila pelo check-in).",
        };
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
        doctorId: data.doctorId,
        createdByClinicUserId: clinicUserId,
        notes: normalizedNotes,
    });

    const workflow = dependencies.serviceType?.workflow ?? "generic";

    if (workflow === "surgery") {
        const encounter = await createWaitingSurgery({
            patientId: data.patientId,
            clinicId,
            checkInId: created.id,
            serviceTypeId: data.serviceTypeId,
            healthInsuranceId: normalizedHealthInsuranceId,
            surgeonId: data.doctorId,
        });

        if (!encounter.success || !encounter.data) {
            return { success: false, error: encounter.error || "Erro ao criar cirurgia na fila." };
        }

        await db
            .update(checkIns)
            .set({ surgeryId: encounter.data.id })
            .where(eq(checkIns.id, created.id));

        return { success: true, id: created.id, surgeryId: encounter.data.id };
    }

    const encounter = await createWaitingConsultationForCheckIn({
        patientId: data.patientId,
        clinicId,
        checkInId: created.id,
        serviceTypeId: data.serviceTypeId,
        healthInsuranceId: normalizedHealthInsuranceId,
        doctorId: data.doctorId,
    });

    if (!encounter.success || !encounter.data) {
        return { success: false, error: encounter.error || "Erro ao criar atendimento na fila." };
    }

    await db
        .update(checkIns)
        .set({ consultationId: encounter.data.id })
        .where(eq(checkIns.id, created.id));

    return { success: true, id: created.id, consultationId: encounter.data.id };
}
