import { db } from "@/db";
import { clinicHealthInsurances, surgeries } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
    createSurgeryQuery,
    updateSurgeryQuery,
    replaceSurgeryProceduresQuery,
} from "@/db/queries/surgeries";
import type { SurgerySaveInput } from "@/lib/validations/surgeries";

async function assertHealthInsuranceForClinic(
    clinicId: string,
    healthInsuranceId: string | null | undefined
): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!healthInsuranceId) return { ok: true };
    const link = await db.query.clinicHealthInsurances.findFirst({
        where: and(
            eq(clinicHealthInsurances.clinicId, clinicId),
            eq(clinicHealthInsurances.healthInsuranceId, healthInsuranceId),
            eq(clinicHealthInsurances.isActive, true)
        ),
    });
    if (!link) {
        return { ok: false, error: "Convênio não autorizado para esta clínica." };
    }
    return { ok: true };
}

function normalizeUuid(v: string | null | undefined | ""): string | null {
    if (v == null || v === "") return null;
    return v;
}

/**
 * Pré-atendimento na recepção (check-in com tipo Cirurgia).
 */
export async function createWaitingSurgery(data: {
    patientId: string;
    clinicId: string;
    checkInId: string;
    serviceTypeId: string;
    healthInsuranceId: string | null;
    surgeonId: string;
}) {
    const ins = await assertHealthInsuranceForClinic(data.clinicId, data.healthInsuranceId);
    if (!ins.ok) {
        return { success: false, error: ins.error };
    }

    try {
        const row = await createSurgeryQuery({
            patientId: data.patientId,
            clinicId: data.clinicId,
            checkInId: data.checkInId,
            serviceTypeId: data.serviceTypeId,
            healthInsuranceId: data.healthInsuranceId,
            surgeonId: data.surgeonId,
            status: "waiting",
        });
        return { success: true, data: row };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error creating waiting surgery:", error);
        return { success: false, error: message };
    }
}

/**
 * Inicia cirurgia direto do prontuário (sem check-in).
 */
export async function startSurgery(data: {
    patientId: string;
    clinicId: string;
    surgeonId: string;
    serviceTypeId?: string | null;
    healthInsuranceId?: string | null;
}) {
    const ins = await assertHealthInsuranceForClinic(data.clinicId, data.healthInsuranceId);
    if (!ins.ok) {
        return { success: false, error: ins.error };
    }

    try {
        const row = await createSurgeryQuery({
            patientId: data.patientId,
            clinicId: data.clinicId,
            surgeonId: data.surgeonId,
            serviceTypeId: data.serviceTypeId ?? null,
            healthInsuranceId: data.healthInsuranceId ?? null,
            status: "in_progress",
        });
        return { success: true, data: row };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error starting surgery:", error);
        return { success: false, error: message };
    }
}

export async function claimSurgery(surgeryId: string, clinicId: string, doctorId: string) {
    const existing = await db.query.surgeries.findFirst({
        where: and(eq(surgeries.id, surgeryId), eq(surgeries.clinicId, clinicId)),
    });

    if (!existing) {
        return { success: false, error: "Cirurgia não encontrada." };
    }

    if (existing.status === "finished" || existing.status === "cancelled") {
        return { success: true, data: existing };
    }

    if (existing.surgeonId && existing.surgeonId !== doctorId) {
        return { success: false, error: "Este registro já está atribuído a outro médico." };
    }

    if (existing.status === "waiting") {
        const [updated] = await db
            .update(surgeries)
            .set({
                status: "in_progress",
                surgeonId: existing.surgeonId ?? doctorId,
                updatedAt: new Date(),
            })
            .where(and(eq(surgeries.id, surgeryId), eq(surgeries.clinicId, clinicId)))
            .returning();

        return { success: true, data: updated };
    }

    if (existing.surgeonId === doctorId) {
        return { success: true, data: existing };
    }

    return { success: false, error: "Não é possível abrir este registro." };
}

export async function saveSurgery(
    clinicId: string,
    input: SurgerySaveInput,
    editorDoctorId: string | null
): Promise<{ success: true } | { success: false; error: string }> {
    const ins = await assertHealthInsuranceForClinic(clinicId, normalizeUuid(input.healthInsuranceId));
    if (!ins.ok) {
        return { success: false, error: ins.error };
    }

    const existing = await db.query.surgeries.findFirst({
        where: and(eq(surgeries.id, input.surgeryId), eq(surgeries.clinicId, clinicId)),
    });

    if (!existing) {
        return { success: false, error: "Cirurgia não encontrada." };
    }

    if (editorDoctorId && existing.surgeonId && existing.surgeonId !== editorDoctorId) {
        return { success: false, error: "Apenas o cirurgião responsável pode editar este registro." };
    }

    let surgeryDate: Date | null = null;
    if (input.surgeryDate && String(input.surgeryDate).trim() !== "") {
        const s = String(input.surgeryDate).trim().slice(0, 10);
        surgeryDate = new Date(`${s}T12:00:00.000Z`);
    }

    const surgeryDateValue = surgeryDate ? surgeryDate.toISOString().slice(0, 10) : null;

    await updateSurgeryQuery(input.surgeryId, clinicId, {
        surgeryDate: surgeryDateValue,
        status: input.status,
        healthInsuranceId: normalizeUuid(input.healthInsuranceId),
        hospitalId: normalizeUuid(input.hospitalId),
        surgeonId: normalizeUuid(input.surgeonId),
        firstAuxId: normalizeUuid(input.firstAuxId),
        secondAuxId: normalizeUuid(input.secondAuxId),
        thirdAuxId: normalizeUuid(input.thirdAuxId),
        anesthetistId: normalizeUuid(input.anesthetistId),
        instrumentistId: normalizeUuid(input.instrumentistId),
        repasseHospital: input.repasseHospital,
        repasseAnesthesia: input.repasseAnesthesia,
        repassePathology: input.repassePathology,
        repasseDoctor: input.repasseDoctor,
        repasseInstrumentist: input.repasseInstrumentist,
        repasseMedicalAux: input.repasseMedicalAux,
        usesMonitor: input.usesMonitor,
        cancerDiagnosis: input.cancerDiagnosis,
        observations: input.observations?.trim() ? input.observations.trim() : null,
    });

    await replaceSurgeryProceduresQuery(input.surgeryId, input.procedureIds);

    return { success: true };
}
