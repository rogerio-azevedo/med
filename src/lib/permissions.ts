import { auth } from "@/auth";
import { db } from "@/db";
import { clinicUserPermissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { FeatureSlug, PermissionAction } from "./features";

const ALL_PERMISSION_ACTIONS: PermissionAction[] = [
    "can_read",
    "can_create",
    "can_update",
    "can_delete",
];

/**
 * Verifica se o usuário logado tem uma action específica em uma feature.
 * Super admin: acesso irrestrito. Admin da clínica: se existir registro no banco
 * para o módulo, vale o que estiver salvo; caso contrário mantém acesso total (legado).
 */
export async function can(
    featureSlug: FeatureSlug,
    action: PermissionAction,
): Promise<boolean> {
    const session = await auth();

    if (!session?.user?.clinicId) return false;

    if (session.user.role === "super_admin") return true;

    const clinicUserId = session.user.clinicUserId;
    if (!clinicUserId) return false;

    const permission = await db.query.clinicUserPermissions.findFirst({
        where: and(
            eq(clinicUserPermissions.clinicUserId, clinicUserId),
            eq(clinicUserPermissions.featureSlug, featureSlug),
        ),
    });

    if (session.user.clinicRole === "admin") {
        if (!permission) return true;
        return permission.actions.includes(action);
    }

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

    if (session.user.role === "super_admin") {
        return [...ALL_PERMISSION_ACTIONS];
    }

    const clinicUserId = session.user.clinicUserId;
    if (!clinicUserId) return [];

    const permission = await db.query.clinicUserPermissions.findFirst({
        where: and(
            eq(clinicUserPermissions.clinicUserId, clinicUserId),
            eq(clinicUserPermissions.featureSlug, featureSlug),
        ),
    });

    if (session.user.clinicRole === "admin") {
        if (!permission) return [...ALL_PERMISSION_ACTIONS];
        return (permission.actions ?? []) as PermissionAction[];
    }

    return (permission?.actions ?? []) as PermissionAction[];
}
