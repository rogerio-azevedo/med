import { ALL_FEATURES, type FeatureSlug } from "./features";

/**
 * Mapa rota (prefixo) → feature para enforcement de permissões.
 * Ao adicionar nova área em `src/app/(dashboard)/`, cadastre a feature e seus
 * `routePaths` em `features.ts`.
 */
export const ROUTE_PERMISSIONS = Object.fromEntries(
    ALL_FEATURES.flatMap((feature) =>
        (feature.routePaths ?? []).map((path) => [path, feature.slug] as const),
    ),
) as Record<string, FeatureSlug>;
