import { auth } from "@/auth";
import { db } from "@/db";
import { clinicUserPermissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { FeatureSlug, PermissionAction } from "./features";

/**
 * Verifica se o usuário logado tem uma action específica em uma feature.
 * Admins da clínica têm acesso total.
 */
export async function can(
    featureSlug: FeatureSlug,
    action: PermissionAction,
): Promise<boolean> {
    const session = await auth();

    if (!session?.user?.clinicId) return false;

    // Admin tem acesso irrestrito
    if (session.user.clinicRole === "admin") return true;

    const clinicUserId = session.user.clinicUserId;
    if (!clinicUserId) return false;

    const permission = await db.query.clinicUserPermissions.findFirst({
        where: and(
            eq(clinicUserPermissions.clinicUserId, clinicUserId),
            eq(clinicUserPermissions.featureSlug, featureSlug),
        ),
    });

    return permission?.actions.includes(action) ?? false;
}

/**
 * Retorna todas as actions permitidas para uma feature do usuário logado.
 */
export async function getPermissions(
    featureSlug: FeatureSlug,
): Promise<PermissionAction[]> {
    const session = await auth();

    if (!session?.user?.clinicId) return [];

    if (session.user.clinicRole === "admin") {
        return ["can_read", "can_create", "can_update", "can_delete"];
    }

    const clinicUserId = session.user.clinicUserId;
    if (!clinicUserId) return [];

    const permission = await db.query.clinicUserPermissions.findFirst({
        where: and(
            eq(clinicUserPermissions.clinicUserId, clinicUserId),
            eq(clinicUserPermissions.featureSlug, featureSlug),
        ),
    });

    return (permission?.actions ?? []) as PermissionAction[];
}
