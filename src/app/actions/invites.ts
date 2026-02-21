"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { inviteLinks } from "@/db/schema";
import { inviteRoleEnum } from "@/db/schema/invite-links";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const generateInviteSchema = z.object({
    clinicId: z.string().uuid().optional(),
    role: z.enum(["admin", "doctor", "patient"]),
});


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

    const validated = generateInviteSchema.safeParse({ clinicId: clinicId || undefined, role });

    if (!validated.success) {
        return { error: "Invalid data" };
    }

    // Generate a simple code (could be better)
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
        await db.insert(inviteLinks).values({
            clinicId: validated.data.clinicId || null,
            role: validated.data.role,
            code,
        });

        if (clinicId) {
            revalidatePath(`/admin/clinics/${clinicId}`);
        } else {
            revalidatePath(`/admin/doctors`);
        }
        return { success: true, code };
    } catch (error) {
        console.error("Failed to generate invite:", error);
        return { error: "Failed to generate invite" };
    }
}
