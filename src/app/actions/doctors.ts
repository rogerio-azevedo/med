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
    if (intent !== "create") {
        delete (data as any).password;
    }

    const parsed = createDoctorSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    if (intent === "create" && !parsed.data.password) {
        return { error: "Senha é obrigatória para novo cadastro." };
    }

    if (intent === "reactivate" && globalId) {
        const result = await updateDoctor({ ...parsed.data, id: globalId } as any, clinicId);
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
        const result = await updateDoctor({ ...parsed.data, id: globalId } as any, clinicId);
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
