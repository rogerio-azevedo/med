/**
 * URL absoluta para a página pública de verificação da receita (QR Code).
 * Preferir `NEXT_PUBLIC_APP_URL`; em dev, pode-se passar `requestOrigin` (host da requisição).
 */
export function buildPrescriptionVerificationUrl(consultationId: string): string {
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    if (!base) {
        return "";
    }
    return `${base}/verificar/${consultationId}`;
}

export function resolvePrescriptionVerificationUrl(
    consultationId: string,
    requestOrigin: string | null | undefined
): string {
    const fromEnv = buildPrescriptionVerificationUrl(consultationId);
    if (fromEnv) return fromEnv;
    const base = (requestOrigin ?? "").replace(/\/$/, "");
    if (base) return `${base}/verificar/${consultationId}`;
    return "";
}
