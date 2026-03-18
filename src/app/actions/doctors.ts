"use server";

import { auth } from "@/auth";
import { deleteDoctor, createDoctor, updateDoctor } from "@/services/doctors";
import { z } from "zod";
import {
    createDoctorSchema,
    updateDoctorSchema,
    type UpdateDoctorInput,
} from "@/lib/validations/doctor";
import { revalidatePath } from "next/cache";
import { adminSetDoctorPasswordSchema } from "@/lib/validations/auth";
import { adminSetDoctorPassword } from "@/services/auth";

export async function createDoctorAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const intent = formData.get("intent") as "create" | "reactivate" | "import" | null || "create";
    const globalId = formData.get("globalId") as string | null;

    const specialtyIdsRaw = formData.getAll("specialtyIds");
    const practiceAreaIdsRaw = formData.getAll("practiceAreaIds");
    const healthInsuranceIdsRaw = formData.getAll("healthInsuranceIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw,
        practiceAreaIds: practiceAreaIdsRaw,
        healthInsuranceIds: healthInsuranceIdsRaw,
    };

    // se for import/reactivate, senha não é necessária no data payload de create (vazios permitidos)
    const createDoctorPayload: Record<string, FormDataEntryValue | FormDataEntryValue[]> = { ...data };

    if (intent !== "create") {
        delete createDoctorPayload.password;
    }

    const parsed = createDoctorSchema.safeParse(createDoctorPayload);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    if (intent === "create" && !parsed.data.password) {
        return { error: "Senha é obrigatória para novo cadastro." };
    }

    if (intent === "reactivate" && globalId) {
        const updatePayload: UpdateDoctorInput = { ...parsed.data, id: globalId };
        const result = await updateDoctor(updatePayload, clinicId);
        if (result.success) {
            const { db } = await import("@/db");
            const { clinicDoctors } = await import("@/db/schema/medical");
            const { eq, and } = await import("drizzle-orm");
            await db.update(clinicDoctors).set({ isActive: true }).where(
                and(
                    eq(clinicDoctors.doctorId, globalId),
                    eq(clinicDoctors.clinicId, clinicId)
                )
            );
            revalidatePath("/doctors");
            return { success: true };
        }
        return { error: result.error };
    }

    if (intent === "import" && globalId) {
        // Update global details
        const updatePayload: UpdateDoctorInput = { ...parsed.data, id: globalId };
        const result = await updateDoctor(updatePayload, clinicId);
        if (result.success) {
            const { db } = await import("@/db");
            const { clinicDoctors } = await import("@/db/schema/medical");
            await db.insert(clinicDoctors).values({
                doctorId: globalId,
                clinicId: clinicId,
            });
            revalidatePath("/doctors");
            return { success: true };
        }
        return { error: result.error };
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
    const healthInsuranceIdsRaw = formData.getAll("healthInsuranceIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw,
        practiceAreaIds: practiceAreaIdsRaw,
        healthInsuranceIds: healthInsuranceIdsRaw,
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

export async function setDoctorPasswordAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId || session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const parsed = adminSetDoctorPasswordSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await adminSetDoctorPassword(parsed.data, clinicId);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/doctors");
    return { success: true };
}
