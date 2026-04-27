import { db } from "@/db";
import { clinicHealthInsurances, consultations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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

/**
 * Inicia atendimento pelo médico (fluxo direto no prontuário).
 */
export async function startConsultation(data: {
    patientId: string;
    doctorId: string;
    clinicId: string;
    appointmentId?: string | null;
    serviceTypeId?: string | null;
    healthInsuranceId?: string | null;
    checkInId?: string | null;
    parentConsultationId?: string | null;
}) {
    const ins = await assertHealthInsuranceForClinic(data.clinicId, data.healthInsuranceId);
    if (!ins.ok) {
        return { success: false, error: ins.error };
    }

    if (data.parentConsultationId) {
        const parent = await db.query.consultations.findFirst({
            where: and(eq(consultations.id, data.parentConsultationId), eq(consultations.clinicId, data.clinicId)),
            columns: { id: true, patientId: true, status: true },
        });
        if (!parent) {
            return { success: false, error: "Consulta de origem não encontrada." };
        }
        if (parent.patientId !== data.patientId) {
            return { success: false, error: "Paciente incompatível com a consulta de origem." };
        }
        if (parent.status !== "finished") {
            return { success: false, error: "Apenas consultas finalizadas podem ter retorno." };
        }
        const existingChild = await db.query.consultations.findFirst({
            where: eq(consultations.parentConsultationId, data.parentConsultationId),
            columns: { id: true },
        });
        if (existingChild) {
            return { success: false, error: "Já existe um retorno registrado para esta consulta." };
        }
    }

    try {
        const [newConsultation] = await db
            .insert(consultations)
            .values({
                patientId: data.patientId,
                doctorId: data.doctorId,
                clinicId: data.clinicId,
                appointmentId: data.appointmentId ?? null,
                serviceTypeId: data.serviceTypeId ?? null,
                healthInsuranceId: data.healthInsuranceId ?? null,
                checkInId: data.checkInId ?? null,
                parentConsultationId: data.parentConsultationId ?? null,
                status: "in_progress",
                startTime: new Date(),
            })
            .returning();

        return { success: true, data: newConsultation };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error starting consultation:", error);
        return { success: false, error: message };
    }
}

/**
 * Pré-atendimento na recepção: cria encontro aguardando médico.
 */
export async function createWaitingConsultationForCheckIn(data: {
    patientId: string;
    clinicId: string;
    checkInId: string;
    serviceTypeId: string;
    healthInsuranceId: string | null;
    doctorId: string;
}) {
    const ins = await assertHealthInsuranceForClinic(data.clinicId, data.healthInsuranceId);
    if (!ins.ok) {
        return { success: false, error: ins.error };
    }

    try {
        const [row] = await db
            .insert(consultations)
            .values({
                patientId: data.patientId,
                clinicId: data.clinicId,
                doctorId: data.doctorId,
                serviceTypeId: data.serviceTypeId,
                healthInsuranceId: data.healthInsuranceId,
                status: "waiting",
                startTime: new Date(),
                checkInId: data.checkInId,
            })
            .returning();

        return { success: true, data: row };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error creating waiting consultation:", error);
        return { success: false, error: message };
    }
}

export async function claimConsultation(consultationId: string, clinicId: string, doctorId: string) {
    const existing = await db.query.consultations.findFirst({
        where: and(eq(consultations.id, consultationId), eq(consultations.clinicId, clinicId)),
    });

    if (!existing) {
        return { success: false, error: "Atendimento não encontrado." };
    }

    if (existing.status === "finished" || existing.status === "cancelled") {
        return { success: true, data: existing };
    }

    if (existing.doctorId && existing.doctorId !== doctorId) {
        return { success: false, error: "Este atendimento já foi assumido por outro médico." };
    }

    if (!existing.doctorId || existing.status === "waiting") {
        const [updated] = await db
            .update(consultations)
            .set({ doctorId, status: "in_progress" })
            .where(and(eq(consultations.id, consultationId), eq(consultations.clinicId, clinicId)))
            .returning();

        return { success: true, data: updated };
    }

    if (existing.doctorId === doctorId) {
        return { success: true, data: existing };
    }

    return { success: false, error: "Não é possível assumir este atendimento." };
}

export async function finishConsultation(consultationId: string, clinicId: string) {
    try {
        const current = await db.query.consultations.findFirst({
            where: and(eq(consultations.id, consultationId), eq(consultations.clinicId, clinicId)),
        });

        if (!current) {
            return { success: false, error: "Atendimento não encontrado." };
        }

        if (current.status === "finished") {
            return { success: true, data: current };
        }

        const [updated] = await db
            .update(consultations)
            .set({
                status: "finished",
                endTime: new Date(),
            })
            .where(and(eq(consultations.id, consultationId), eq(consultations.clinicId, clinicId)))
            .returning();

        return { success: true, data: updated };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
    }
}
