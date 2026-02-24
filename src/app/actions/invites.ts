"use server";

import { auth } from "@/auth";
import { generateInviteCode } from "@/services/invites";
import { generateInviteSchema } from "@/lib/validations/invite";
import { revalidatePath } from "next/cache";

export async function generateInvite(formData: FormData) {
    const session = await auth();

    if (session?.user?.role !== "super_admin" && session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const clinicId = formData.get("clinicId") as string | null;
    const role = formData.get("role") as "admin" | "doctor" | "patient";

    if (role === "admin" && session?.user?.role !== "super_admin") {
        throw new Error("Only super admins can generate admin invites");
    }

    if (!clinicId && session?.user?.role !== "super_admin") {
        throw new Error("Only super admins can generate global invites");
    }

    if (!clinicId && role !== "doctor") {
        throw new Error("Global invites are currently only supported for doctors");
    }

    const validated = generateInviteSchema.safeParse({
        clinicId: clinicId || undefined,
        role,
    });

    if (!validated.success) {
        return { error: "Invalid data" };
    }

    const result = await generateInviteCode(validated.data);

    if (!result.success) {
        return { error: result.error };
    }

    if (clinicId) {
        revalidatePath(`/admin/clinics/${clinicId}`);
    } else {
        revalidatePath(`/admin/doctors`);
    }
    return { success: true, code: result.code };
}
