"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { clinics, clinicUsers } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createClinicSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres").optional(),
});

export async function createClinic(formData: FormData) {
    const session = await auth();

    if (session?.user?.role !== "super_admin") {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const rawSlug = formData.get("slug") as string;

    // Simple slug generation if not provided
    const slug = rawSlug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const validated = createClinicSchema.safeParse({ name, slug });

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const [newClinic] = await db.insert(clinics).values({
            name: validated.data.name,
            slug: validated.data.slug,
        }).returning();

        // Admin should probably be linked to the clinic? 
        // For now, super_admin can see all.
        // But let's create a linkage just in case if we want them to act as admin of this clinic.
        // Waiting for clarification or just proceeding with basic creation.
        // The prompt says: "Eu como superAdmin cadastro a clinica... Ao clicar em uma clinica por exemplo, ela vai abrir um dashboard dessa clinica."

        revalidatePath("/admin/clinics");
    } catch (error) {
        console.error("Failed to create clinic:", error);
        return { error: "Failed to create clinic. Slug might be taken." };
    }

    redirect("/admin/clinics");
}
