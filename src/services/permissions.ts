import { db } from "@/db";
import { clinicUserPermissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { FeatureSlug, PermissionAction } from "@/lib/features";

export async function getClinicUserPermissions(clinicUserId: string) {
    const permissions = await db.query.clinicUserPermissions.findMany({
        where: eq(clinicUserPermissions.clinicUserId, clinicUserId),
    });

    return permissions;
}

export async function getAllClinicPermissions(clinicId: string) {
    const { clinicUsers } = await import("@/db/schema");

    const permissions = await db
        .select({
            id: clinicUserPermissions.id,
            clinicUserId: clinicUserPermissions.clinicUserId,
            featureSlug: clinicUserPermissions.featureSlug,
            actions: clinicUserPermissions.actions,
        })
        .from(clinicUserPermissions)
        .innerJoin(clinicUsers, eq(clinicUserPermissions.clinicUserId, clinicUsers.id))
        .where(eq(clinicUsers.clinicId, clinicId));

    return permissions;
}

export async function upsertPermission(
    clinicUserId: string,
    featureSlug: FeatureSlug,
    actions: PermissionAction[]
) {
    // If actions is empty, we still want a record with empty array, or we can just update it
    await db
        .insert(clinicUserPermissions)
        .values({
            clinicUserId,
            featureSlug,
            actions,
        })
        .onConflictDoUpdate({
            target: [clinicUserPermissions.clinicUserId, clinicUserPermissions.featureSlug],
            set: {
                actions,
                updatedAt: new Date(),
            },
        });
}
