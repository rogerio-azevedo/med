"use server";

import { auth } from "@/auth";
import { getPatientById as getPatientByIdQuery } from "@/db/queries/patients";
import { createPatient, updatePatient, deletePatient } from "@/services/patients";
import { z } from "zod";
import { createPatientSchema, updatePatientSchema } from "@/lib/validations/patient";
import { revalidatePath } from "next/cache";

export async function createPatientAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const responsibleDoctorIdsRaw = formData.getAll("responsibleDoctorIds");
    const data = {
        ...Object.fromEntries(formData),
        responsibleDoctorIds: responsibleDoctorIdsRaw.filter(Boolean),
    };

    const parsed = createPatientSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await createPatient(parsed.data, clinicId);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/patients");
    return { success: true };
}

export async function deletePatientAction(patientId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const result = await deletePatient(patientId, clinicId);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    revalidatePath("/patients");
    return { success: true };
}

export async function updatePatientAction(patientId: string, formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const responsibleDoctorIdsRaw = formData.getAll("responsibleDoctorIds");
    const data = {
        ...Object.fromEntries(formData),
        responsibleDoctorIds: responsibleDoctorIdsRaw.filter(
            (id) => id !== "null" && id !== ""
        ),
    };

    const parsed = updatePatientSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await updatePatient(patientId, parsed.data, clinicId);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/dashboard");
    revalidatePath("/patients");
    return { success: true };
}

export async function getPatientAction(patientId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    try {
        const patient = await getPatientByIdQuery(patientId, clinicId);
        return { success: true, patient };
    } catch (error) {
        console.error("Failed to get patient:", error);
        return { success: false, error: "Failed to get patient" };
    }
}
