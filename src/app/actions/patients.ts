"use server"

import { auth } from "@/auth";
import { deletePatient as deletePatientQuery, getPatientById as getPatientByIdQuery } from "@/db/queries/patients";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { patients, clinicPatients, addresses, patientDoctors } from "@/db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

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
    responsibleDoctorIds: z.array(z.string().uuid()).optional(),
});

const updatePatientSchema = createPatientSchema;

export async function createPatientAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const responsibleDoctorIdsRaw = formData.getAll("responsibleDoctorIds");
    const data = {
        ...Object.fromEntries(formData),
        responsibleDoctorIds: responsibleDoctorIdsRaw.filter(Boolean),
    };
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
        state,
        responsibleDoctorIds
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

        if (responsibleDoctorIds && responsibleDoctorIds.length > 0) {
            await db.insert(patientDoctors).values(
                responsibleDoctorIds.map(doctorId => ({
                    patientId: newPatient.id,
                    doctorId,
                }))
            );
        }

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

export async function updatePatientAction(patientId: string, formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const responsibleDoctorIdsRaw = formData.getAll("responsibleDoctorIds");
    const data = {
        ...Object.fromEntries(formData),
        responsibleDoctorIds: responsibleDoctorIdsRaw.filter(id => id !== "null" && id !== ""),
    };

    const parsed = updatePatientSchema.safeParse(data);

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
        state,
        responsibleDoctorIds
    } = parsed.data;

    try {
        await db.update(patients)
            .set({
                name,
                email: email || null,
                cpf: cpf?.replace(/\D/g, '') || null,
                birthDate: birthDate || null,
                sex: sex || null,
                phone: phone?.replace(/\D/g, '') || null,
            })
            .where(eq(patients.id, patientId));

        // Update Doctors map
        if (responsibleDoctorIds) {
            await db.delete(patientDoctors).where(eq(patientDoctors.patientId, patientId));

            if (responsibleDoctorIds.length > 0) {
                await db.insert(patientDoctors).values(
                    responsibleDoctorIds.map(doctorId => ({
                        patientId,
                        doctorId,
                    }))
                );
            }
        }

        if (zipCode || street || city) {
            const existingAddress = await db
                .select()
                .from(addresses)
                .where(and(
                    eq(addresses.entityId, patientId),
                    eq(addresses.entityType, "patient")
                ))
                .limit(1);

            if (existingAddress.length > 0) {
                await db.update(addresses)
                    .set({
                        zipCode: zipCode?.replace(/\D/g, '') || null,
                        street: street || null,
                        number: number || null,
                        complement: complement || null,
                        neighborhood: neighborhood || null,
                        city: city || null,
                        state: state || null,
                    })
                    .where(eq(addresses.id, existingAddress[0].id));
            } else {
                await db.insert(addresses).values({
                    entityType: "patient",
                    entityId: patientId,
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
        }

        revalidatePath("/dashboard");
        revalidatePath("/patients");

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update patient:", error);
        if (error.code === '23505') {
            if (error.detail?.includes('cpf')) return { error: "Este CPF já está cadastrado." };
        }
        return { error: "Erro ao atualizar paciente." };
    }
}

export async function getPatientAction(patientId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    try {
        const patient = await getPatientByIdQuery(patientId, clinicId);
        return { success: true, patient };
    } catch (error) {
        console.error("Failed to get patient:", error);
        return { success: false, error: "Failed to get patient" };
    }
}
