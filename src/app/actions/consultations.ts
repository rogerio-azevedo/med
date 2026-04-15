"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
    startConsultation,
    finishConsultation,
    claimConsultation,
} from "@/services/consultations";
import { consultationSchema, consultationSoapSchema, vitalSignsSchema } from "@/lib/validations/medical-records";
import { upsertConsultationSoapQuery, upsertVitalSignsQuery } from "@/db/queries/consultations";

function revalidateConsultationPaths(patientId: string) {
    revalidatePath(`/medical-records/${patientId}`);
    revalidatePath("/dashboard");
    revalidatePath("/schedule");
}

export async function startConsultationAction(data: Record<string, unknown>) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    const patientDoctorId = (session.user as { doctorId?: string }).doctorId || (data.doctorId as string | undefined);

    if (!patientDoctorId) {
        return { success: false, error: "Apenas médicos podem iniciar um atendimento." };
    }

    const validated = consultationSchema.parse({
        ...data,
        clinicId: session.user.clinicId,
        doctorId: patientDoctorId,
    });

    const result = await startConsultation({
        patientId: validated.patientId,
        doctorId: validated.doctorId,
        clinicId: validated.clinicId,
        appointmentId: validated.appointmentId,
        serviceTypeId: validated.serviceTypeId,
        healthInsuranceId: validated.healthInsuranceId,
        checkInId: validated.checkInId,
    });

    if (result.success) {
        revalidateConsultationPaths(validated.patientId);
    }

    return result;
}

export async function claimConsultationAction(consultationId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    const currentDoctorId = (session.user as { doctorId?: string }).doctorId;
    if (!currentDoctorId) {
        return { success: false, error: "Apenas médicos podem assumir atendimentos da fila." };
    }

    const result = await claimConsultation(consultationId, session.user.clinicId, currentDoctorId);

    if (result.success) {
        revalidateConsultationPaths(patientId);
    }

    return result;
}

export async function saveSoapAction(consultationId: string, patientId: string, data: Record<string, unknown>) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    try {
        const { getConsultationDetails } = await import("@/db/queries/consultations");
        const consultation = await getConsultationDetails(consultationId, session.user.clinicId);

        const currentDoctorId = (session.user as { doctorId?: string }).doctorId;
        if (!consultation || !currentDoctorId || consultation.doctorId !== currentDoctorId) {
            return { success: false, error: "Apenas o médico responsável pode editar este atendimento." };
        }

        const validated = consultationSoapSchema.parse({
            ...data,
            consultationId,
        });

        await upsertConsultationSoapQuery(validated);

        revalidateConsultationPaths(patientId);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
    }
}

export async function saveVitalSignsAction(consultationId: string, patientId: string, data: Record<string, unknown>) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    try {
        const { getConsultationDetails } = await import("@/db/queries/consultations");
        const consultation = await getConsultationDetails(consultationId, session.user.clinicId);

        const currentDoctorId = (session.user as { doctorId?: string }).doctorId;
        if (!consultation || !currentDoctorId || consultation.doctorId !== currentDoctorId) {
            return { success: false, error: "Apenas o médico responsável pode editar este atendimento." };
        }

        const normalizedData = {
            consultationId,
            weight: (data.weight as string | undefined)?.trim() || null,
            height: (data.height as string | undefined)?.trim() || null,
            bloodPressure: (data.bloodPressure as string | undefined)?.trim() || null,
            heartRate: data.heartRate ? Number(data.heartRate) : null,
            respiratoryRate: data.respiratoryRate ? Number(data.respiratoryRate) : null,
            temperature: (data.temperature as string | undefined)?.trim() || null,
            oxygenSaturation: data.oxygenSaturation ? Number(data.oxygenSaturation) : null,
        };

        const validated = vitalSignsSchema.parse(normalizedData);
        await upsertVitalSignsQuery(validated);

        revalidateConsultationPaths(patientId);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
    }
}

export async function finishConsultationAction(consultationId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    const currentDoctorId = (session.user as { doctorId?: string }).doctorId;
    const { getConsultationDetails } = await import("@/db/queries/consultations");
    const consultation = await getConsultationDetails(consultationId, session.user.clinicId);

    if (!consultation || !currentDoctorId || consultation.doctorId !== currentDoctorId) {
        return { success: false, error: "Apenas o médico responsável pode finalizar este atendimento." };
    }

    const result = await finishConsultation(consultationId, session.user.clinicId);

    if (result.success) {
        revalidateConsultationPaths(patientId);
    }

    return result;
}

export async function deleteConsultationAction(consultationId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    try {
        const { getConsultationDetails, deleteConsultationQuery } = await import("@/db/queries/consultations");

        const consultation = await getConsultationDetails(consultationId, session.user.clinicId);
        const currentDoctorId = session.user.doctorId;
        const isClinicAdmin =
            session.user.clinicRole === "admin" || session.user.role === "super_admin";
        const isAssignedDoctor =
            !!currentDoctorId &&
            consultation?.doctorId != null &&
            consultation.doctorId === currentDoctorId;

        if (!consultation || (!isClinicAdmin && !isAssignedDoctor)) {
            return {
                success: false,
                error: "Apenas o médico responsável ou um administrador da clínica pode excluir este atendimento.",
            };
        }

        const result = await deleteConsultationQuery(consultationId, session.user.clinicId);

        if (result && result.length > 0) {
            revalidateConsultationPaths(patientId);
            return { success: true };
        }

        return { success: false, error: "Atendimento não encontrado ou já excluído." };
    } catch (error: unknown) {
        console.error("Error deleting consultation:", error);
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
    }
}
