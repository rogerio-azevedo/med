"use server";

import { signIn } from "@/auth";
import { db } from "@/db";
import { users, inviteLinks, clinicUsers, doctors, clinicDoctors, patients, clinicPatients, clinics, addresses } from "@/db/schema";
import { AuthError } from "next-auth";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Senha obrigatória"),
});

export async function login(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData);
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Campos inválidos" };
    }

    const { email, password } = parsed.data;

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Credenciais inválidas." };
                default:
                    return { error: "Algo deu errado." };
            }
        }
        throw error;
    }
}

const registerSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    invite: z.string().optional(),
    // Doctor fields
    crm: z.string().optional(),
    crmState: z.string().optional(),
    // Patient fields
    cpf: z.string().optional(),
    birthDate: z.string().optional(),
    sex: z.enum(["M", "F", "other"]).optional(),
    phone: z.string().optional(),
    // Address fields
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
});

export async function getInvite(code: string) {
    if (!code) return null;

    // Fetch invite with clinic info
    const invite = await db.query.inviteLinks.findFirst({
        where: eq(inviteLinks.code, code),
        with: {
            clinic: true
        }
    });

    if (!invite) return null;

    return {
        ...invite,
        clinicName: invite.clinic?.name
    };
}

export async function register(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData);
    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Dados inválidos", details: parsed.error.flatten() };
    }

    const {
        name,
        email,
        password,
        invite,
        crm,
        crmState,
        cpf,
        birthDate,
        sex,
        phone,
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state
    } = parsed.data;

    // Verificar se usuário já existe
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        return { error: "Email já cadastrado." };
    }

    // Validate invite if provided
    let inviteData = null;
    let userRole = "user"; // Default role

    if (invite) {
        const foundInvite = await db.query.inviteLinks.findFirst({
            where: eq(inviteLinks.code, invite),
        });

        if (!foundInvite || !foundInvite.isActive) {
            return { error: "Código de convite inválido ou expirado." };
        }
        inviteData = foundInvite;
        userRole = inviteData.role; // role from invite (doctor/patient)
    }

    const hasedPassword = await bcrypt.hash(password, 10);

    // For neon-http which doesn't support transactions, we perform sequential inserts.
    // Order: user -> (doctor/patient) -> address
    try {
        const [newUser] = await db.insert(users).values({
            id: crypto.randomUUID(),
            name,
            email,
            password: hasedPassword,
            role: userRole,
        }).returning();

        let profileId: string | undefined;
        let entityType: "doctor" | "patient" | undefined;

        if (inviteData && inviteData.role && inviteData.clinicId) {
            if (inviteData.role === 'doctor') {
                entityType = "doctor";
                // Add to clinic staff
                await db.insert(clinicUsers).values({
                    userId: newUser.id,
                    clinicId: inviteData.clinicId,
                    role: 'doctor',
                });

                // Create entry in 'doctors' table
                const [newDoctor] = await db.insert(doctors).values({
                    userId: newUser.id,
                    crm: crm || null,
                    crmState: crmState || null,
                }).returning();
                profileId = newDoctor.id;

                // Link to clinicDoctors
                await db.insert(clinicDoctors).values({
                    doctorId: newDoctor.id,
                    clinicId: inviteData.clinicId,
                });

            } else if (inviteData.role === 'patient') {
                entityType = "patient";
                // Create entry in 'patients' table
                const [newPatient] = await db.insert(patients).values({
                    userId: newUser.id,
                    name,
                    email,
                    cpf: cpf?.replace(/\D/g, '') || null,
                    birthDate: birthDate || null,
                    sex: sex || null,
                    phone: phone?.replace(/\D/g, '') || null,
                }).returning();
                profileId = newPatient.id;

                // Link to clinicPatients
                await db.insert(clinicPatients).values({
                    patientId: newPatient.id,
                    clinicId: inviteData.clinicId,
                });
            } else if (inviteData.role === 'admin') {
                // Link to clinicUsers as admin
                await db.insert(clinicUsers).values({
                    userId: newUser.id,
                    clinicId: inviteData.clinicId,
                    role: 'admin',
                });
            }

            // Save address if present
            if (profileId && entityType && (zipCode || street || city)) {
                await db.insert(addresses).values({
                    entityType,
                    entityId: profileId,
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

            // Increment invite usage
            await db.update(inviteLinks)
                .set({ usedCount: (inviteData.usedCount || 0) + 1 })
                .where(eq(inviteLinks.id, inviteData.id));
        }

        return { success: true };
    } catch (err: any) {
        console.error("Error during registration:", err);
        if (err.code === '23505') { // Postgres Unique Violation
            if (err.detail?.includes('cpf')) return { error: "Este CPF já está cadastrado." };
            if (err.detail?.includes('email')) return { error: "Este email já está cadastrado." };
        }
        return { error: "Erro ao processar o cadastro. Verifique os dados e tente novamente." };
    }
}
