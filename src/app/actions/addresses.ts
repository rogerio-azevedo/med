"use server";

import { auth } from "@/auth";
import { z } from "zod";
import { upsertAddress } from "@/services/addresses";
import { addressSchema } from "@/lib/validations/address";
import { revalidatePath } from "next/cache";

export async function upsertAddressAction(formData: FormData) {
    const session = await auth();

    if (!session?.user?.clinicId) {
        throw new Error("Não autorizado");
    }

    const data = Object.fromEntries(formData);
    const parsed = addressSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: z.flattenError(parsed.error) };
    }

    const result = await upsertAddress(parsed.data);

    if (!result.success) {
        return { error: result.error };
    }

    revalidatePath("/admin/clinics");
    revalidatePath("/doctors");
    revalidatePath("/maps");
    return { success: true };
}
