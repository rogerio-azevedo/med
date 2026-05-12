import { z } from "zod";

export const doctorSignaturePresignBodySchema = z.object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export const doctorSignatureConfirmBodySchema = z.object({
    remoteKey: z.string().min(1).max(500),
    sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});
