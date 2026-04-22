"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { claimSurgery, saveSurgery, startSurgery } from "@/services/surgeries";
import { deleteSurgeryQuery, getSurgeryDetails } from "@/db/queries/surgeries";
import { surgerySaveSchema, startSurgeryInputSchema } from "@/validations/surgeries";

function revalidateSurgeryPaths(patientId: string) {
    revalidatePath(`/medical-records/${patientId}`);
    revalidatePath("/dashboard");
    revalidatePath("/schedule");
    revalidatePath("/checkins");
}

export async function startSurgeryAction(data: Record<string, unknown>) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    const surgeonId = (session.user as { doctorId?: string }).doctorId;
    if (!surgeonId) {
        return { success: false, error: "Apenas médicos podem registrar cirurgias." };
    }

    const parsed = startSurgeryInputSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Dados inválidos" };
    }

    const result = await startSurgery({
        patientId: parsed.data.patientId,
        clinicId: session.user.clinicId,
        surgeonId,
        serviceTypeId: parsed.data.serviceTypeId ?? null,
        healthInsuranceId: parsed.data.healthInsuranceId ? parsed.data.healthInsuranceId : null,
    });

    if (result.success) {
        revalidateSurgeryPaths(parsed.data.patientId);
    }

    return result;
}

export async function claimSurgeryAction(surgeryId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    const doctorId = (session.user as { doctorId?: string }).doctorId;
    if (!doctorId) {
        return { success: false, error: "Apenas médicos podem assumir registros da fila." };
    }

    const result = await claimSurgery(surgeryId, session.user.clinicId, doctorId);

    if (result.success) {
        revalidateSurgeryPaths(patientId);
    }

    return result;
}

export async function saveSurgeryAction(patientId: string, data: Record<string, unknown>) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    const parsed = surgerySaveSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const editorDoctorId = (session.user as { doctorId?: string }).doctorId ?? null;

    const result = await saveSurgery(session.user.clinicId, parsed.data, editorDoctorId);

    if (result.success) {
        revalidateSurgeryPaths(patientId);
    }

    return result;
}

export async function getSurgeryDetailsAction(surgeryId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    const row = await getSurgeryDetails(surgeryId, session.user.clinicId);
    if (!row) {
        return { success: false, error: "Cirurgia não encontrada" };
    }

    return { success: true, data: row };
}

export async function deleteSurgeryAction(surgeryId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.clinicId) return { success: false, error: "Não autorizado" };

    try {
        const surgery = await getSurgeryDetails(surgeryId, session.user.clinicId);
        if (!surgery || surgery.patientId !== patientId) {
            return { success: false, error: "Cirurgia não encontrada." };
        }

        const doctorId = session.user.doctorId;
        const isClinicAdmin =
            session.user.clinicRole === "admin" || session.user.role === "super_admin";
        const isSurgeon =
            !!doctorId && surgery.surgeonId != null && surgery.surgeonId === doctorId;

        if (!isClinicAdmin && !isSurgeon) {
            return {
                success: false,
                error: "Apenas o cirurgião responsável ou um administrador da clínica pode excluir este registro.",
            };
        }

        const result = await deleteSurgeryQuery(surgeryId, session.user.clinicId);
        if (result && result.length > 0) {
            revalidateSurgeryPaths(patientId);
            return { success: true };
        }

        return { success: false, error: "Cirurgia não encontrada ou já excluída." };
    } catch (error: unknown) {
        console.error("Error deleting surgery:", error);
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
    }
}
