import { auth } from "@/auth";
import { db } from "@/db";
import { clinicUserPermissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ALL_FEATURES, type FeatureSlug, type PermissionAction } from "./features";
import { ROUTE_PERMISSIONS } from "./route-permissions";

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

function readableFeatureSlugsFromPermissionRows(
    rows: { featureSlug: string; actions: string[] }[],
    clinicRole: string | null | undefined,
): Set<FeatureSlug> {
    const bySlug = new Map<string, string[]>();
    for (const r of rows) {
        bySlug.set(r.featureSlug, r.actions);
    }

    const readable = new Set<FeatureSlug>();
    for (const f of ALL_FEATURES) {
        const slug = f.slug;
        const actions = bySlug.get(slug);
        if (clinicRole === "admin") {
            if (!actions) {
                readable.add(slug);
            } else if (actions.includes("can_read")) {
                readable.add(slug);
            }
        } else if (actions?.includes("can_read")) {
            readable.add(slug);
        }
    }
    return readable;
}

/**
 * Paths permitidos no menu lateral. `null` = não filtrar (paciente, super admin).
 */
export async function getSidebarNavAccess(): Promise<{
    mainPaths: string[] | null;
    adminClinicPaths: string[] | null;
}> {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        return { mainPaths: null, adminClinicPaths: null };
    }

    if (user.role === "super_admin" || user.role === "patient") {
        return { mainPaths: null, adminClinicPaths: null };
    }

    if (!user.clinicId || !user.clinicUserId) {
        return { mainPaths: ["/dashboard"], adminClinicPaths: [] };
    }

    const rows = await db.query.clinicUserPermissions.findMany({
        where: eq(clinicUserPermissions.clinicUserId, user.clinicUserId),
    });

    const readableSlugs = readableFeatureSlugsFromPermissionRows(rows, user.clinicRole);

    const mainPaths = new Set<string>(["/dashboard"]);
    for (const [path, slug] of Object.entries(ROUTE_PERMISSIONS)) {
        if (readableSlugs.has(slug)) {
            mainPaths.add(path);
        }
    }

    let adminClinicPaths: string[] | null = null;
    if (user.clinicRole === "admin") {
        adminClinicPaths = [];
        if (readableSlugs.has("clinic-settings")) {
            adminClinicPaths.push("/conta");
        }
        if (readableSlugs.has("users")) {
            adminClinicPaths.push("/conta/usuarios", "/conta/permissoes");
        }
    }

    return {
        mainPaths: [...mainPaths],
        adminClinicPaths,
    };
}
