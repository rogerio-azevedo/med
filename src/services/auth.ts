import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
    users,
    inviteLinks,
    clinicUsers,
    doctors,
    clinicDoctors,
    patients,
    clinicPatients,
    addresses,
    patientDoctors,
    doctorSpecialties,
} from "@/db/schema";
import { geocodeAddress } from "@/lib/geocode";
import type { RegisterInput } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

export async function registerUser(
    data: RegisterInput
): Promise<{ success: true } | { success: false; error: string }> {
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
        state,
        latitude,
        longitude,
        specialtyIds,
    } = data;

    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        return { success: false, error: "Email já cadastrado." };
    }

    let inviteData: { id: string; role: string; clinicId: string | null; doctorId: string | null; usedCount: number } | null = null;
    let userRole = "user";

    if (invite) {
        const foundInvite = await db.query.inviteLinks.findFirst({
            where: eq(inviteLinks.code, invite),
        });

        if (!foundInvite || !foundInvite.isActive) {
            return { success: false, error: "Código de convite inválido ou expirado." };
        }
        inviteData = {
            id: foundInvite.id,
            role: foundInvite.role,
            clinicId: foundInvite.clinicId,
            doctorId: foundInvite.doctorId,
            usedCount: foundInvite.usedCount ?? 0,
        };
        userRole = inviteData.role;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [newUser] = await db
            .insert(users)
            .values({
                id: crypto.randomUUID(),
                name,
                email,
                password: hashedPassword,
                role: userRole,
            })
            .returning();

        let profileId: string | undefined;
        let entityType: "doctor" | "patient" | undefined;

        if (inviteData) {
            if (inviteData.role === "doctor") {
                entityType = "doctor";

                if (inviteData.clinicId) {
                    await db.insert(clinicUsers).values({
                        userId: newUser.id,
                        clinicId: inviteData.clinicId,
                        role: "doctor",
                    });
                }

                const [newDoctor] = await db
                    .insert(doctors)
                    .values({
                        userId: newUser.id,
                        crm: crm || null,
                        crmState: crmState || null,
                        phone: phone?.replace(/\D/g, "") || null,
                    })
                    .returning();
                profileId = newDoctor.id;

                if (inviteData.clinicId) {
                    await db.insert(clinicDoctors).values({
                        doctorId: newDoctor.id,
                        clinicId: inviteData.clinicId,
                    });
                }

                if (specialtyIds && specialtyIds.length > 0) {
                    await db.insert(doctorSpecialties).values(
                        specialtyIds.map((id) => ({
                            doctorId: newDoctor.id,
                            specialtyId: id,
                        }))
                    );
                }

                const doctorInviteCode = crypto
                    .randomUUID()
                    .replace(/-/g, "")
                    .substring(0, 12)
                    .toUpperCase();
                await db.insert(inviteLinks).values({
                    clinicId: inviteData.clinicId || null,
                    doctorId: newDoctor.id,
                    role: "patient",
                    code: doctorInviteCode,
                });
            } else if (inviteData.role === "patient") {
                entityType = "patient";

                const [newPatient] = await db
                    .insert(patients)
                    .values({
                        userId: newUser.id,
                        name,
                        email,
                        cpf: cpf?.replace(/\D/g, "") || null,
                        birthDate: birthDate || null,
                        sex: sex || null,
                        phone: phone?.replace(/\D/g, "") || null,
                    })
                    .returning();
                profileId = newPatient.id;

                if (inviteData.clinicId) {
                    await db.insert(clinicPatients).values({
                        patientId: newPatient.id,
                        clinicId: inviteData.clinicId,
                    });
                }

                if (inviteData.doctorId) {
                    await db.insert(patientDoctors).values({
                        patientId: newPatient.id,
                        doctorId: inviteData.doctorId,
                    });
                }
            } else if (inviteData.role === "admin") {
                if (inviteData.clinicId) {
                    await db.insert(clinicUsers).values({
                        userId: newUser.id,
                        clinicId: inviteData.clinicId,
                        role: "admin",
                    });
                }
            }

            if (profileId && entityType && (zipCode || street || city)) {
                let lat = latitude ?? null;
                let lng = longitude ?? null;

                if (!lat || !lng) {
                    const coords = await geocodeAddress({
                        street,
                        number,
                        neighborhood,
                        city,
                        state,
                        zipCode,
                    });
                    if (coords) {
                        lat = coords.lat;
                        lng = coords.lng;
                    }
                }

                await db.insert(addresses).values({
                    entityType,
                    entityId: profileId,
                    zipCode: zipCode?.replace(/\D/g, "") || null,
                    street: street || null,
                    number: number || null,
                    complement: complement || null,
                    neighborhood: neighborhood || null,
                    city: city || null,
                    state: state || null,
                    latitude: lat,
                    longitude: lng,
                    isPrimary: true,
                });
            }

            await db
                .update(inviteLinks)
                .set({ usedCount: inviteData.usedCount + 1 })
                .where(eq(inviteLinks.id, inviteData.id));
        }

        return { success: true };
    } catch (err: unknown) {
        const error = err as { code?: string; detail?: string };
        if (error.code === "23505") {
            if (error.detail?.includes("cpf")) {
                return { success: false, error: "Este CPF já está cadastrado." };
            }
            if (error.detail?.includes("email")) {
                return { success: false, error: "Este email já está cadastrado." };
            }
        }
        return {
            success: false,
            error: "Erro ao processar o cadastro. Verifique os dados e tente novamente.",
        };
    }
}
