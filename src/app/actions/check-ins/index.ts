"use server";

import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCheckIns } from "@/db/queries/check-ins";
import { getClinicHealthInsurances } from "@/db/queries/health-insurances";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { getPatientsByClinic } from "@/db/queries/patients";
import { getActiveServiceTypes } from "@/db/queries/service-types";
import { checkInSchema } from "@/validations/check-ins";
import { createCheckInService } from "@/services/check-ins";

export type CheckInDialogDataPayload = {
    patients: { id: string; name: string }[];
    serviceTypes: { id: string; name: string; workflow: string }[];
    healthInsurances: { id: string; name: string }[];
    doctors: { id: string; name: string | null }[];
};

function getFirstError(error: z.ZodError) {
    const flattened = z.flattenError(error);
    return Object.values(flattened.fieldErrors).flat().find(Boolean);
}

export async function getCheckInDialogDataAction(): Promise<
    { success: true; data: CheckInDialogDataPayload } | { success: false; error: string }
> {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    const allowed = await can("checkins", "can_read");
    if (!allowed) {
        return { success: false, error: "Sem permissão para check-ins" };
    }

    try {
        const [patients, serviceTypes, healthInsurances, doctors] = await Promise.all([
            getPatientsByClinic(clinicId),
            getActiveServiceTypes(clinicId),
            getClinicHealthInsurances(clinicId),
            getDoctorsSimple(clinicId, { relationshipTypes: ["linked"] }),
        ]);

        return {
            success: true,
            data: {
                patients: patients.map((item) => ({ id: item.id, name: item.name })),
                serviceTypes: serviceTypes.map((item) => ({
                    id: item.id,
                    name: item.name,
                    workflow: item.workflow,
                })),
                healthInsurances: healthInsurances.map((item) => ({
                    id: item.id,
                    name: item.name,
                })),
                doctors: doctors.map((d) => ({ id: d.id, name: d.name })),
            },
        };
    } catch {
        return { success: false, error: "Erro ao carregar dados do check-in" };
    }
}

export async function getCheckInsAction() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        return { success: false, error: "Clínica não encontrada" };
    }

    try {
        const data = await getCheckIns(clinicId);
        return { success: true, data };
    } catch {
        return { success: false, error: "Erro ao carregar check-ins" };
    }
}

export async function createCheckInAction(data: unknown) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    const clinicUserId = session?.user?.clinicUserId;

    if (!clinicId || !clinicUserId) {
        return { success: false, error: "Usuário da clínica não encontrado" };
    }

    const parsed = checkInSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) || "Dados inválidos" };
    }

    const result = await createCheckInService(clinicId, clinicUserId, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath("/checkins");
    revalidatePath("/dashboard");
    revalidatePath("/schedule");
    revalidatePath(`/medical-records/${parsed.data.patientId}`);
    if ("surgeryId" in result) {
        return { success: true, id: result.id, surgeryId: result.surgeryId };
    }
    return { success: true, id: result.id, consultationId: result.consultationId };
}
