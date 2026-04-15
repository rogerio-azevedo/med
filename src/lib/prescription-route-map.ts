export type PrescriptionRoute =
    | "oral"
    | "iv"
    | "im"
    | "sc"
    | "topical"
    | "inhaled"
    | "ophthalmic"
    | "otic"
    | "rectal"
    | "vaginal"
    | "other";

/** Map free-text catalog route (often Portuguese) to DB enum. */
export function mapCatalogRouteToPrescriptionRoute(route: string | null | undefined): PrescriptionRoute {
    if (!route?.trim()) return "oral";
    const r = route.toLowerCase();
    if (/intraven|endoven|\biv\b/i.test(r)) return "iv";
    if (/intramusc|\bim\b/i.test(r)) return "im";
    if (/subcut|subcut[aâ]nea|\bsc\b/i.test(r)) return "sc";
    if (/t[oó]pic|derm[aá]tic|cut[aâ]ne/i.test(r)) return "topical";
    if (/inalat|inalad|inhal/i.test(r)) return "inhaled";
    if (/oftalm|ocular/i.test(r)) return "ophthalmic";
    if (/otic|ouvido/i.test(r)) return "otic";
    if (/retal|reto/i.test(r)) return "rectal";
    if (/vagin/i.test(r)) return "vaginal";
    if (/oral|\bvo\b|bucal|gastro/i.test(r)) return "oral";
    return "other";
}

export const PRESCRIPTION_ROUTE_LABELS: Record<PrescriptionRoute, string> = {
    oral: "Via oral",
    iv: "Endovenosa (IV)",
    im: "Intramuscular (IM)",
    sc: "Subcutânea (SC)",
    topical: "Tópica",
    inhaled: "Inalatória",
    ophthalmic: "Oftálmica",
    otic: "Ótica",
    rectal: "Retal",
    vaginal: "Vaginal",
    other: "Outra",
};
