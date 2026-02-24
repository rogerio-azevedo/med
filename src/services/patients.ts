import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { patients, clinicPatients, addresses, patientDoctors } from "@/db/schema";
import { deletePatient as deletePatientQuery } from "@/db/queries/patients";
import type { CreatePatientInput, UpdatePatientInput } from "@/lib/validations/patient";

export async function createPatient(
    data: CreatePatientInput,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
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
        responsibleDoctorIds,
    } = data;

    try {
        const [newPatient] = await db
            .insert(patients)
            .values({
                name,
                email: email || null,
                cpf: cpf?.replace(/\D/g, "") || null,
                birthDate: birthDate || null,
                sex: sex || null,
                phone: phone?.replace(/\D/g, "") || null,
            })
            .returning();

        await db.insert(clinicPatients).values({
            patientId: newPatient.id,
            clinicId,
        });

        if (responsibleDoctorIds && responsibleDoctorIds.length > 0) {
            await db.insert(patientDoctors).values(
                responsibleDoctorIds.map((doctorId) => ({
                    patientId: newPatient.id,
                    doctorId,
                }))
            );
        }

        if (zipCode || street || city) {
            await db.insert(addresses).values({
                entityType: "patient",
                entityId: newPatient.id,
                zipCode: zipCode?.replace(/\D/g, "") || null,
                street: street || null,
                number: number || null,
                complement: complement || null,
                neighborhood: neighborhood || null,
                city: city || null,
                state: state || null,
                isPrimary: true,
            });
        }

        return { success: true };
    } catch (err: unknown) {
        const error = err as { code?: string; detail?: string };
        if (error.code === "23505" && error.detail?.includes("cpf")) {
            return { success: false, error: "Este CPF já está cadastrado." };
        }
        return { success: false, error: "Erro ao criar paciente." };
    }
}

export async function updatePatient(
    patientId: string,
    data: UpdatePatientInput,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
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
        responsibleDoctorIds,
    } = data;

    try {
        await db
            .update(patients)
            .set({
                name,
                email: email || null,
                cpf: cpf?.replace(/\D/g, "") || null,
                birthDate: birthDate || null,
                sex: sex || null,
                phone: phone?.replace(/\D/g, "") || null,
            })
            .where(eq(patients.id, patientId));

        if (responsibleDoctorIds !== undefined) {
            await db.delete(patientDoctors).where(eq(patientDoctors.patientId, patientId));
            if (responsibleDoctorIds.length > 0) {
                await db.insert(patientDoctors).values(
                    responsibleDoctorIds.map((doctorId) => ({
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
                .where(
                    and(
                        eq(addresses.entityId, patientId),
                        eq(addresses.entityType, "patient")
                    )
                )
                .limit(1);

            if (existingAddress.length > 0) {
                await db
                    .update(addresses)
                    .set({
                        zipCode: zipCode?.replace(/\D/g, "") || null,
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
                    zipCode: zipCode?.replace(/\D/g, "") || null,
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

        return { success: true };
    } catch (err: unknown) {
        const error = err as { code?: string; detail?: string };
        if (error.code === "23505" && error.detail?.includes("cpf")) {
            return { success: false, error: "Este CPF já está cadastrado." };
        }
        return { success: false, error: "Erro ao atualizar paciente." };
    }
}

export async function deletePatient(
    patientId: string,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await deletePatientQuery(patientId, clinicId);
        return { success: true };
    } catch {
        return { success: false, error: "Failed to delete patient" };
    }
}
