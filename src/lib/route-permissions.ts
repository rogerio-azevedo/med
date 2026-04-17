import type { FeatureSlug } from "./features";

/**
 * Mapa rota (prefixo) → feature para enforcement de permissões.
 * Ao adicionar nova área em `src/app/(dashboard)/`, incluir aqui e em `features.ts`.
 */
export const ROUTE_PERMISSIONS: Record<string, FeatureSlug> = {
    "/patients": "patients",
    "/doctors": "doctors",
    "/specialties": "specialties",
    "/health-insurances": "health-insurances",
    "/practice-areas": "practice-areas",
    "/packages": "packages",
    "/hospitals": "hospitals",
    "/medications": "medications",
    "/procedures": "procedures",
    "/service-types": "service-types",
    "/payment-terms": "payment-terms",
    "/scores": "scores",
    "/schedule": "schedule",
    "/medical-records": "medical-records",
    "/tarefas": "tasks",
    "/proposals": "proposals",
    "/maps": "map",
    "/checkins": "checkins",
    "/gestao/consultas": "consultations",
    "/gestao/cirurgias": "surgeries",
    "/gestao/exames": "consultations",
    "/gestao/video-consultas": "consultations",
};
