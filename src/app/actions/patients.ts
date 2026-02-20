"use server"

import { auth } from "@/auth";
import { deletePatient as deletePatientQuery } from "@/db/queries/patients";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { patients, clinicPatients, addresses } from "@/db/schema";
import { z } from "zod";

const createPatientSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    cpf: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    sex: z.enum(["M", "F", "other"]).optional(),
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
});

export async function createPatientAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const data = Object.fromEntries(formData);
    const parsed = createPatientSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const {
        name,
        cpf,
        email,
        phone,
        birthDate,
        sex,
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state
    } = parsed.data;

    try {
        const [newPatient] = await db.insert(patients).values({
            name,
            email: email || null,
            cpf: cpf?.replace(/\D/g, '') || null,
            birthDate: birthDate || null,
            sex: sex || null,
            phone: phone?.replace(/\D/g, '') || null,
        }).returning();

        await db.insert(clinicPatients).values({
            patientId: newPatient.id,
            clinicId,
        });

        if (zipCode || street || city) {
            await db.insert(addresses).values({
                entityType: "patient",
                entityId: newPatient.id,
                zipCode: zipCode?.replace(/\D/g, '') || null,
                street: street || null,
                number: number || null,
                complement: complement || null,
                neighborhood: neighborhood || null,
                city: city || null,
                state: state || null,
                isPrimary: true,
            });
        }

        revalidatePath("/patients");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create patient:", error);
        if (error.code === '23505') {
            if (error.detail?.includes('cpf')) return { error: "Este CPF já está cadastrado." };
        }
        return { error: "Erro ao criar paciente." };
    }
}

export async function deletePatientAction(patientId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    try {
        await deletePatientQuery(patientId, clinicId);
        revalidatePath("/patients");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete patient:", error);
        return { success: false, error: "Failed to delete patient" };
    }
}
