"use server";

import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { deleteDoctor as deleteDoctorQuery } from "@/db/queries/doctors";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, doctors, clinicDoctors, clinicUsers, doctorSpecialties, doctorPracticeAreas } from "@/db/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createDoctorSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    specialtyIds: z.array(z.string().uuid()).optional(),
    practiceAreaIds: z.array(z.string().uuid()).optional(),
});

export async function createDoctorAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const specialtyIdsRaw = formData.getAll("specialtyIds");
    const practiceAreaIdsRaw = formData.getAll("practiceAreaIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw,
        practiceAreaIds: practiceAreaIdsRaw,
    };

    const parsed = createDoctorSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const { name, email, password, crm, crmState, specialtyIds, practiceAreaIds } = parsed.data;

    try {
        // Check if user exists
        const existingUser = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, email),
        });

        if (existingUser) {
            return { error: "Email já cadastrado." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        // 1. Create User
        await db.insert(users).values({
            id: userId,
            name,
            email,
            password: hashedPassword,
            role: "doctor",
        });

        // 2. Link to clinic staff
        await db.insert(clinicUsers).values({
            userId,
            clinicId,
            role: 'doctor',
        });

        // 3. Create Doctor Profile
        const [newDoctor] = await db.insert(doctors).values({
            userId,
            crm: crm || null,
            crmState: crmState || null,
        }).returning();

        // 4. Link to clinicDoctors
        await db.insert(clinicDoctors).values({
            doctorId: newDoctor.id,
            clinicId,
        });

        // 5. Link to specialties if provided
        if (specialtyIds && specialtyIds.length > 0) {
            await db.insert(doctorSpecialties).values(
                specialtyIds.map(id => ({
                    doctorId: newDoctor.id,
                    specialtyId: id,
                }))
            );
        }

        // 6. Link to practice areas if provided
        if (practiceAreaIds && practiceAreaIds.length > 0) {
            await db.insert(doctorPracticeAreas).values(
                practiceAreaIds.map(id => ({
                    doctorId: newDoctor.id,
                    practiceAreaId: id,
                }))
            );
        }

        revalidatePath("/doctors");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create doctor:", error);
        return { error: "Erro ao criar médico." };
    }
}

export async function deleteDoctorAction(doctorId: string) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    try {
        await deleteDoctorQuery(doctorId, clinicId);
        revalidatePath("/doctors");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete doctor:", error);
        return { success: false, error: "Erro ao excluir médico." };
    }
}
const updateDoctorSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    specialtyIds: z.array(z.string().uuid()).optional(),
    practiceAreaIds: z.array(z.string().uuid()).optional(),
});

export async function updateDoctorAction(formData: FormData) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        throw new Error("Unauthorized: No clinic association found.");
    }

    const specialtyIdsRaw = formData.getAll("specialtyIds");
    const practiceAreaIdsRaw = formData.getAll("practiceAreaIds");
    const data = {
        ...Object.fromEntries(formData),
        specialtyIds: specialtyIdsRaw,
        practiceAreaIds: practiceAreaIdsRaw,
    };

    const parsed = updateDoctorSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const { id: doctorId, name, email, crm, crmState, specialtyIds, practiceAreaIds } = parsed.data;

    try {
        // 1. Get doctor to find userId
        const doctor = await db.query.doctors.findFirst({
            where: (doctors, { eq }) => eq(doctors.id, doctorId),
        });

        if (!doctor) {
            return { error: "Médico não encontrado." };
        }

        const userId = doctor.userId;

        // 2. Update User
        await db.update(users)
            .set({ name, email })
            .where(eq(users.id, userId));

        // 3. Update Doctor Profile
        await db.update(doctors)
            .set({
                crm: crm || null,
                crmState: crmState || null,
            })
            .where(eq(doctors.id, doctorId));

        // 4. Update Specialties
        if (specialtyIds) {
            // Delete existing and insert new
            await db.delete(doctorSpecialties).where(eq(doctorSpecialties.doctorId, doctorId));

            if (specialtyIds.length > 0) {
                await db.insert(doctorSpecialties).values(
                    specialtyIds.map(id => ({
                        doctorId,
                        specialtyId: id,
                    }))
                );
            }
        }

        // 5. Update Practice Areas
        if (practiceAreaIds) {
            // Delete existing and insert new
            await db.delete(doctorPracticeAreas).where(eq(doctorPracticeAreas.doctorId, doctorId));

            if (practiceAreaIds.length > 0) {
                await db.insert(doctorPracticeAreas).values(
                    practiceAreaIds.map(id => ({
                        doctorId,
                        practiceAreaId: id,
                    }))
                );
            }
        }

        revalidatePath("/doctors");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update doctor:", error);
        return { error: "Erro ao atualizar médico." };
    }
}
