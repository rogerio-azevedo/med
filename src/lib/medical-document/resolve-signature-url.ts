import { createPresignedGetUrl } from "@/infra/storage/presign";

function isAbsoluteHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value.trim());
}

/**
 * Valor em `doctors.signature_url`: URL pública ou chave de objeto no R2.
 */
export async function resolveDoctorSignatureUrlForPrint(
    signatureUrl: string | null | undefined
): Promise<string | null> {
    const v = signatureUrl?.trim();
    if (!v) return null;
    if (isAbsoluteHttpUrl(v)) return v;
    try {
        return await createPresignedGetUrl(v);
    } catch {
        return null;
    }
}
