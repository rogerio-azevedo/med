import { z } from "zod";

export const healthInsuranceLogoPresignBodySchema = z.object({
    healthInsuranceId: z.string().uuid(),
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
});

export const healthInsuranceLogoConfirmBodySchema = z.object({
    healthInsuranceId: z.string().uuid(),
    remoteKey: z.string().min(1).max(500),
    sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
});
