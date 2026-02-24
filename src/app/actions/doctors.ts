"use server";

import { auth } from "@/auth";
import { deleteDoctor, createDoctor, updateDoctor } from "@/services/doctors";
import { z } from "zod";
import { createDoctorSchema, updateDoctorSchema } from "@/lib/validations/doctor";
import { revalidatePath } from "next/cache";

export async function createDoctorAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const specialtyIdsRaw = formData.getAll("specialtyIds");
    const practiceAreaIdsRaw = formData.getAll("practiceAreaIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw,
        practiceAreaIds: practiceAreaIdsRaw,
    };

    const parsed = createDoctorSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await createDoctor(parsed.data, clinicId);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/doctors");
    return { success: true };
}

export async function deleteDoctorAction(doctorId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const result = await deleteDoctor(doctorId, clinicId);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    revalidatePath("/doctors");
    return { success: true };
}

export async function updateDoctorAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const specialtyIdsRaw = formData.getAll("specialtyIds");
    const practiceAreaIdsRaw = formData.getAll("practiceAreaIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw,
        practiceAreaIds: practiceAreaIdsRaw,
    };

    const parsed = updateDoctorSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await updateDoctor(parsed.data, clinicId);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/doctors");
    return { success: true };
}
