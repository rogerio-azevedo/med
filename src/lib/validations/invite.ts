import { z } from "zod";

export const generateInviteSchema = z.object({
    clinicId: z.string().uuid().optional(),
    role: z.enum(["admin", "doctor", "patient"]),
    doctorRelationshipType: z.enum(["linked", "partner"]).optional(),
});

export type GenerateInviteInput = z.infer<typeof generateInviteSchema>;
