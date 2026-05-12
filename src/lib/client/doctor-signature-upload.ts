import imageCompression from "browser-image-compression";

export type DoctorSignatureUploadOptions = {
    maxWidthOrHeight?: number;
    maxSizeMB?: number;
};

/**
 * Comprime e envia assinatura para R2 + confirma em `doctors.signature_url`.
 * Mesmo fluxo usado na página Conta e no diálogo de emissão.
 */
export async function uploadDoctorSignatureFile(
    file: File,
    opts?: DoctorSignatureUploadOptions
): Promise<void> {
    const compressed = await imageCompression(file, {
        maxWidthOrHeight: opts?.maxWidthOrHeight ?? 1600,
        maxSizeMB: opts?.maxSizeMB ?? 2,
        fileType: "image/png",
    });
    const presignRes = await fetch("/api/doctor-signature/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fileName: compressed.name || "assinatura.png",
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
    const confirmRes = await fetch("/api/doctor-signature/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remoteKey, sizeBytes: compressed.size }),
    });
    if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Falha ao confirmar");
    }
}

export async function uploadDoctorSignaturePngBlob(
    blob: Blob,
    opts?: DoctorSignatureUploadOptions
): Promise<void> {
    const file = new File([blob], "assinatura.png", { type: blob.type || "image/png" });
    await uploadDoctorSignatureFile(file, opts);
}
