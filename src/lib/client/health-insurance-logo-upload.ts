import imageCompression from "browser-image-compression";

export type HealthInsuranceLogoUploadOptions = {
    maxWidthOrHeight?: number;
    maxSizeMB?: number;
};

/**
 * Compressão opcional + upload R2 + confirma em `health_insurances.logo_url`.
 */
export async function uploadHealthInsuranceLogoFile(
    healthInsuranceId: string,
    file: File,
    opts?: HealthInsuranceLogoUploadOptions
): Promise<void> {
    const compressed = await imageCompression(file, {
        maxWidthOrHeight: opts?.maxWidthOrHeight ?? 1200,
        maxSizeMB: opts?.maxSizeMB ?? 2,
        fileType: "image/png",
    });
    const presignRes = await fetch("/api/health-insurance-logo/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            healthInsuranceId,
            fileName: compressed.name || "logo.png",
            mimeType: compressed.type || "image/png",
            sizeBytes: compressed.size,
        }),
    });
    if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Falha ao preparar upload");
    }
    const { presignedUrl, remoteKey, contentType } = (await presignRes.json()) as {
        presignedUrl: string;
        remoteKey: string;
        contentType: string;
    };
    const putRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: compressed,
    });
    if (!putRes.ok) {
        throw new Error("Falha no envio do arquivo");
    }
    const confirmRes = await fetch("/api/health-insurance-logo/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ healthInsuranceId, remoteKey, sizeBytes: compressed.size }),
    });
    if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Falha ao confirmar");
    }
}
