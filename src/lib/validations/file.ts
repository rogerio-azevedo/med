import { z } from "zod";

export const fileCategorySchema = z.enum([
    "lab_exam",
    "imaging",
    "clinical_photo",
    "report",
    "other",
]);

/** Categorias em que a timeline e o prontuário devem usar a data do exame, não a do upload. */
export const FILE_CATEGORIES_REQUIRING_REFERENCE_DATE = [
    "lab_exam",
    "imaging",
    "clinical_photo",
    "report",
] as const;

export type FileCategoryRequiringReferenceDate =
    (typeof FILE_CATEGORIES_REQUIRING_REFERENCE_DATE)[number];

export function categoryRequiresReferenceDate(category: string): boolean {
    return (FILE_CATEGORIES_REQUIRING_REFERENCE_DATE as readonly string[]).includes(category);
}

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidReferenceDateString(v: string | null | undefined): boolean {
    if (v == null || String(v).trim() === "") return false;
    const s = String(v).trim().slice(0, 10);
    return dateOnlyRegex.test(s);
}

export const ALLOWED_MIME_TO_MAX_BYTES: Record<string, number> = {
    "application/pdf": 50 * 1024 * 1024,
    "image/jpeg": 10 * 1024 * 1024,
    "image/png": 10 * 1024 * 1024,
    "image/webp": 10 * 1024 * 1024,
    "application/dicom": 100 * 1024 * 1024,
};

const ALLOWED_MIMES = new Set(Object.keys(ALLOWED_MIME_TO_MAX_BYTES));

export function normalizeMimeType(mimeType: string, fileName: string): string {
    const lower = fileName.toLowerCase();
    if (mimeType && mimeType !== "application/octet-stream") {
        return mimeType;
    }
    if (lower.endsWith(".dcm")) {
        return "application/dicom";
    }
    return mimeType;
}

export function assertMimeAndSize(mimeType: string, sizeBytes: number): void {
    if (!ALLOWED_MIMES.has(mimeType)) {
        throw new Error(`Tipo de arquivo não permitido: ${mimeType}`);
    }
    const max = ALLOWED_MIME_TO_MAX_BYTES[mimeType]!;
    if (sizeBytes > max) {
        throw new Error(`Arquivo excede o tamanho máximo permitido para este tipo`);
    }
}

export const filePresignBodySchema = z.object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    sizeBytes: z.number().int().positive(),
    category: fileCategorySchema,
    patientId: z.string().uuid(),
    consultationId: z.string().uuid().optional().nullable(),
});

export const fileMetadataBodySchema = z
    .object({
        remoteKey: z.string().min(1),
        fileName: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(100),
        sizeBytes: z.number().int().positive(),
        category: fileCategorySchema,
        patientId: z.string().uuid(),
        consultationId: z.string().uuid().optional().nullable(),
        title: z.string().min(1).max(255),
        referenceDate: z.string().optional().nullable(),
        notes: z.string().max(5000).optional().nullable(),
    })
    .superRefine((data, ctx) => {
        if (!categoryRequiresReferenceDate(data.category)) return;
        if (!isValidReferenceDateString(data.referenceDate)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Informe a data de referência do exame (quando o exame ou documento foi produzido), não apenas a data do upload.",
                path: ["referenceDate"],
            });
        }
    });

export type FilePresignBody = z.infer<typeof filePresignBodySchema>;
export type FileMetadataBody = z.infer<typeof fileMetadataBodySchema>;
export type FileCategory = z.infer<typeof fileCategorySchema>;
