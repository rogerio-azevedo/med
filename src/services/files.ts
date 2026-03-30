import { basename, extname } from "node:path";
import { randomUUID } from "node:crypto";
import {
    patientBelongsToClinic,
    getConsultationForPatientInClinic,
} from "@/db/queries/files";
import { assertMimeAndSize, normalizeMimeType } from "@/lib/validations/file";
import type { FileCategory } from "@/lib/validations/file";

function storageSubfolder(category: FileCategory): "exams" | "images" {
    return category === "clinical_photo" ? "images" : "exams";
}

export function buildPatientFileRemoteKey(
    clinicId: string,
    patientId: string,
    category: FileCategory,
    originalFileName: string
): string {
    const ext = extname(originalFileName).slice(0, 20).toLowerCase();
    const rawBase = basename(originalFileName, extname(originalFileName));
    const safeBase =
        rawBase.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80) || "file";
    const folder = storageSubfolder(category);
    return `${clinicId}/${patientId}/${folder}/${randomUUID()}-${safeBase}${ext}`;
}

export function assertRemoteKeyForPatient(
    remoteKey: string,
    clinicId: string,
    patientId: string
): void {
    const prefix = `${clinicId}/${patientId}/`;
    if (!remoteKey.startsWith(prefix) || remoteKey.includes("..")) {
        throw new Error("Chave de objeto inválida");
    }
}

export async function validateFileUploadContext(input: {
    clinicId: string;
    patientId: string;
    consultationId?: string | null;
    mimeType: string;
    sizeBytes: number;
    fileName: string;
}): Promise<string> {
    const mime = normalizeMimeType(input.mimeType, input.fileName);
    assertMimeAndSize(mime, input.sizeBytes);
    const ok = await patientBelongsToClinic(input.patientId, input.clinicId);
    if (!ok) {
        throw new Error("Paciente não encontrado nesta clínica");
    }
    if (input.consultationId) {
        const c = await getConsultationForPatientInClinic(
            input.consultationId,
            input.clinicId,
            input.patientId
        );
        if (!c) {
            throw new Error("Consulta não encontrada para este paciente");
        }
    }
    return mime;
}
