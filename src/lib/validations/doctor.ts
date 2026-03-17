import { z } from "zod";

export const createDoctorSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    phone: z.string().optional(),
    specialtyIds: z.array(z.string().uuid()).optional(),
    practiceAreaIds: z.array(z.string().uuid()).optional(),
    healthInsuranceIds: z.array(z.string().uuid()).optional(),
    addressZipCode: z.string().optional(),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressLatitude: z.coerce.number().optional(),
    addressLongitude: z.coerce.number().optional(),
});

export const updateDoctorSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.email("Email inválido"),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    phone: z.string().optional(),
    specialtyIds: z.array(z.string().uuid()).optional(),
    practiceAreaIds: z.array(z.string().uuid()).optional(),
    healthInsuranceIds: z.array(z.string().uuid()).optional(),
    addressZipCode: z.string().optional(),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressLatitude: z.coerce.number().optional(),
    addressLongitude: z.coerce.number().optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
