"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getConsultationDetails } from "@/db/queries/consultations";
import {
    deletePrescription,
    getPrescriptionsByConsultation,
    insertPrescription,
    searchMedicationsForPrescription,
    updatePrescription,
} from "@/db/queries/prescriptions";
import { prescriptionItemPayloadSchema } from "@/validations/medical-records";

function revalidateConsultationPaths(patientId: string) {
    revalidatePath(`/medical-records/${patientId}`);
    revalidatePath("/dashboard");
    revalidatePath("/schedule");
}

export async function searchMedicationsAction(query: string) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false as const, items: [], error: "Não autorizado" };
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
        return { success: true as const, items: [] as Awaited<ReturnType<typeof searchMedicationsForPrescription>> };
    }

    try {
        const items = await searchMedicationsForPrescription(trimmed, 20);
        return { success: true as const, items };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { success: false as const, items: [], error: message };
    }
}

export async function listConsultationPrescriptionsAction(consultationId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false as const, items: [], error: "Não autorizado" };
    }

    const consultation = await getConsultationDetails(consultationId, session.user.clinicId);
    if (!consultation || consultation.patientId !== patientId) {
        return { success: false as const, items: [], error: "Atendimento não encontrado." };
    }

    const items = await getPrescriptionsByConsultation(consultationId, session.user.clinicId);
    return { success: true as const, items };
}

export async function addPrescriptionAction(
    consultationId: string,
    patientId: string,
    data: Record<string, unknown>
) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false as const, error: "Não autorizado" };
    }

    const doctorId = (session.user as { doctorId?: string }).doctorId;
    if (!doctorId) {
        return { success: false as const, error: "Apenas médicos podem prescrever." };
    }

    const consultation = await getConsultationDetails(consultationId, session.user.clinicId);
    if (!consultation || consultation.patientId !== patientId || consultation.doctorId !== doctorId) {
        return { success: false as const, error: "Você só pode prescrever no seu próprio atendimento em andamento." };
    }

    try {
        const validated = prescriptionItemPayloadSchema.parse(data);
        await insertPrescription({
            consultationId,
            patientId,
            clinicId: session.user.clinicId,
            medicationId: validated.medicationId,
            medicineName: validated.medicineName,
            dosage: validated.dosage,
            pharmaceuticalForm: validated.pharmaceuticalForm,
            frequency: validated.frequency,
            duration: validated.duration,
            quantity: validated.quantity,
            route: validated.route,
            instructions: validated.instructions,
            isContinuous: validated.isContinuous,
            startDate: validated.startDate,
            endDate: validated.endDate,
        });

        revalidateConsultationPaths(patientId);
        return { success: true as const };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { success: false as const, error: message };
    }
}

export async function updatePrescriptionAction(
    prescriptionId: string,
    consultationId: string,
    patientId: string,
    data: Record<string, unknown>
) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false as const, error: "Não autorizado" };
    }

    const doctorId = (session.user as { doctorId?: string }).doctorId;
    if (!doctorId) {
        return { success: false as const, error: "Apenas médicos podem editar prescrições." };
    }

    const consultation = await getConsultationDetails(consultationId, session.user.clinicId);
    if (!consultation || consultation.patientId !== patientId || consultation.doctorId !== doctorId) {
        return { success: false as const, error: "Você só pode editar prescrições no seu próprio atendimento em andamento." };
    }

    try {
        const validated = prescriptionItemPayloadSchema.parse(data);
        const updated = await updatePrescription(prescriptionId, consultationId, session.user.clinicId, {
            medicationId: validated.medicationId,
            medicineName: validated.medicineName,
            dosage: validated.dosage,
            pharmaceuticalForm: validated.pharmaceuticalForm,
            frequency: validated.frequency,
            duration: validated.duration,
            quantity: validated.quantity,
            route: validated.route,
            instructions: validated.instructions,
            isContinuous: validated.isContinuous,
            startDate: validated.startDate,
            endDate: validated.endDate,
        });
        if (!updated) {
            return { success: false as const, error: "Item não encontrado." };
        }

        revalidateConsultationPaths(patientId);
        return { success: true as const };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { success: false as const, error: message };
    }
}

export async function deletePrescriptionAction(prescriptionId: string, consultationId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false as const, error: "Não autorizado" };
    }

    const doctorId = (session.user as { doctorId?: string }).doctorId;
    if (!doctorId) {
        return { success: false as const, error: "Apenas médicos podem remover prescrições." };
    }

    const consultation = await getConsultationDetails(consultationId, session.user.clinicId);
    if (!consultation || consultation.patientId !== patientId || consultation.doctorId !== doctorId) {
        return { success: false as const, error: "Sem permissão para alterar este atendimento." };
    }

    const deleted = await deletePrescription(prescriptionId, session.user.clinicId);
    if (!deleted) {
        return { success: false as const, error: "Item não encontrado." };
    }

    revalidateConsultationPaths(patientId);
    return { success: true as const };
}
