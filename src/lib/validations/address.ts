import { z } from "zod";

export const addressSchema = z.object({
    entityType: z.enum(["clinic", "doctor"]),
    entityId: z.uuid(),
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
