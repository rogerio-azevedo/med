import { db } from "@/db";
import { icd10Codes } from "@/db/schema";
import { ilike, or, sql } from "drizzle-orm";

/**
 * Busca códigos CID-10 por termo (código ou descrição)
 */
export async function searchIcd10(term: string, limit = 50) {
    if (!term || term.length < 2) return [];

    return db
        .select()
        .from(icd10Codes)
        .where(
            or(
                ilike(icd10Codes.code, `%${term}%`),
                ilike(icd10Codes.description, `%${term}%`)
            )
        )
        .limit(limit)
        .orderBy(icd10Codes.code);
}

/**
 * Obtém um CID específico por código
 */
export async function getIcd10ByCode(code: string) {
    const results = await db
        .select()
        .from(icd10Codes)
        .where(sql`${icd10Codes.code} = ${code}`)
        .limit(1);
    
    return results[0] || null;
}
