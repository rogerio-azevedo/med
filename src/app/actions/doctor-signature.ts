"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { doctors } from "@/db/schema/doctors";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function clearDoctorSignatureAction(): Promise<{ success: true } | { error: string }> {
    const session = await auth();
    if (!session?.user?.id || !session.user.doctorId) {
        return { error: "Não autorizado." };
    }

    await db.update(doctors).set({ signatureUrl: null }).where(eq(doctors.id, session.user.doctorId));
    revalidatePath("/conta");
    return { success: true };
}
