import { db } from "@/db";
import { inviteLinks } from "@/db/schema";
import type { GenerateInviteInput } from "@/lib/validations/invite";

export async function generateInviteCode(
    data: GenerateInviteInput
): Promise<{ success: true; code: string } | { success: false; error: string }> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
        await db.insert(inviteLinks).values({
            clinicId: data.clinicId || null,
            role: data.role,
            code,
        });
        return { success: true, code };
    } catch {
        return { success: false, error: "Failed to generate invite" };
    }
}
