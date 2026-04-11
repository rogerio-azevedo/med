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
    const actorUserId = session?.user?.id;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const intent = formData.get("intent") as "create" | "reactivate" | "import" | null || "create";
    const globalId = formData.get("globalId") as string | null;
    const patientHealthInsurancesRaw = formData.get("patientHealthInsurances");

    const responsibleDoctorIdsRaw = formData.getAll("responsibleDoctorIds");
    const data: Record<string, FormDataEntryValue | string[] | unknown> = {
        ...Object.fromEntries(formData),
        responsibleDoctorIds: responsibleDoctorIdsRaw.filter(Boolean),
        patientHealthInsurances: patientHealthInsurancesRaw
            ? JSON.parse(patientHealthInsurancesRaw.toString())
            : [],
    };

    if (!data.referralDoctorId || data.referralDoctorId === "null" || data.referralDoctorId === "") {
        delete data.referralDoctorId;
    }
    if (!data.referralSource || data.referralSource === "null" || data.referralSource === "") {
        delete data.referralSource;
    }
    if (!data.referralNotes || data.referralNotes === "null" || data.referralNotes === "") {
        delete data.referralNotes;
    }
    if (!data.originType || data.originType === "null" || data.originType === "") {
        delete data.originType;
    }

    const parsed = createPatientSchema.safeParse(data);

    if (!parsed.success) {
        const flattened = z.flattenError(parsed.error);
        const firstError = Object.values(flattened.fieldErrors).flat().find(Boolean);
        return { error: firstError || "Dados inválidos", details: flattened };
    }

    if (intent === "reactivate" && globalId) {
        const result = await updatePatient(globalId, parsed.data, clinicId, { actorUserId });
        // also set isActive = true
        if (result.success) {
            const { db } = await import("@/db");
            const { clinicPatients } = await import("@/db/schema/medical");
            const { eq, and } = await import("drizzle-orm");
            await db.update(clinicPatients).set({ isActive: true }).where(
                and(
                    eq(clinicPatients.patientId, globalId),
                    eq(clinicPatients.clinicId, clinicId)
                )
            );
            revalidatePath("/patients");
            return { success: true };
        }
        return { error: result.error };
    }

    if (intent === "import" && globalId) {
        // Update the patient details globally, and link them to this clinic.
        const result = await updatePatient(globalId, parsed.data, clinicId, { actorUserId });
        if (result.success) {
            const { db } = await import("@/db");
            const { clinicPatients } = await import("@/db/schema/medical");
            await db.insert(clinicPatients).values({
                patientId: globalId,
                clinicId: clinicId,
            });
            revalidatePath("/patients");
            return { success: true };
        }
        return { error: result.error };
    }

    const result = await createPatient(parsed.data, clinicId, { actorUserId });

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/patients");
    return { success: true, patientId: result.patientId };
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
    const actorUserId = session?.user?.id;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const patientHealthInsurancesRaw = formData.get("patientHealthInsurances");
    const responsibleDoctorIdsRaw = formData.getAll("responsibleDoctorIds");
    const data: Record<string, FormDataEntryValue | string[] | unknown> = {
        ...Object.fromEntries(formData),
        responsibleDoctorIds: responsibleDoctorIdsRaw.filter(
            (id) => id !== "null" && id !== ""
        ),
        patientHealthInsurances: patientHealthInsurancesRaw
            ? JSON.parse(patientHealthInsurancesRaw.toString())
            : [],
    };

    if (!data.referralDoctorId || data.referralDoctorId === "null" || data.referralDoctorId === "") {
        delete data.referralDoctorId;
    }
    if (!data.referralSource || data.referralSource === "null" || data.referralSource === "") {
        delete data.referralSource;
    }
    if (!data.referralNotes || data.referralNotes === "null" || data.referralNotes === "") {
        delete data.referralNotes;
    }
    if (!data.originType || data.originType === "null" || data.originType === "") {
        delete data.originType;
    }

    const parsed = updatePatientSchema.safeParse(data);

    if (!parsed.success) {
        const flattened = z.flattenError(parsed.error);
        const firstError = Object.values(flattened.fieldErrors).flat().find(Boolean);
        return { error: firstError || "Dados inválidos", details: flattened };
    }

    const result = await updatePatient(patientId, parsed.data, clinicId, { actorUserId });

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/dashboard");
    revalidatePath("/patients");
    revalidatePath("/doctors");
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
