import { db } from "@/db";
import { inviteLinks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
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
            doctorRelationshipType:
                data.role === "doctor" ? data.doctorRelationshipType ?? "linked" : null,
        });
        return { success: true, code };
    } catch {
        return { success: false, error: "Failed to generate invite" };
    }
}

export async function ensureDoctorPatientInviteCode(clinicId: string, doctorId: string) {
    const existingInvite = await db.query.inviteLinks.findFirst({
        where: and(
            eq(inviteLinks.clinicId, clinicId),
            eq(inviteLinks.doctorId, doctorId),
            eq(inviteLinks.role, "patient"),
            eq(inviteLinks.isActive, true)
        ),
    });

    if (existingInvite) {
        return existingInvite.code;
    }

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    await db.insert(inviteLinks).values({
        clinicId,
        doctorId,
        role: "patient",
        code,
    });

    return code;
}
