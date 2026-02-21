"use server";

import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { deleteDoctor as deleteDoctorQuery } from "@/db/queries/doctors";
import { users, doctors, clinicDoctors, clinicUsers, doctorSpecialties, doctorPracticeAreas, addresses } from "@/db/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/db";

const createDoctorSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    phone: z.string().optional(),
    specialtyIds: z.array(z.string().uuid()).optional(),
    practiceAreaIds: z.array(z.string().uuid()).optional(),
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

const updateDoctorSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.email("Email inválido"),
    crm: z.string().optional(),
    crmState: z.string().optional(),
    phone: z.string().optional(),
    specialtyIds: z.array(z.string().uuid()).optional(),
    practiceAreaIds: z.array(z.string().uuid()).optional(),
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

    const {
        name, email, password, crm, crmState, phone, specialtyIds, practiceAreaIds,
        addressZipCode, addressStreet, addressNumber, addressComplement,
        addressNeighborhood, addressCity, addressState, addressLatitude, addressLongitude
    } = parsed.data;

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
            phone: phone || null,
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

        // 7. Create Address if provided
        if (addressStreet || addressZipCode) {
            let lat = addressLatitude || null;
            let lng = addressLongitude || null;

            // Se a latitude e longitude não vieram do form, tenta buscar
            if (!lat || !lng) {
                let addressQuery = "";
                if (addressStreet) addressQuery += addressStreet;
                if (addressNumber) addressQuery += `, ${addressNumber}`;
                if (addressNeighborhood) addressQuery += `, ${addressNeighborhood}`;
                if (addressCity) addressQuery += ` - ${addressCity}`;
                if (addressState) addressQuery += `, ${addressState}`;
                if (addressZipCode) addressQuery += `, ${addressZipCode}`;

                if (addressQuery) {
                    try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/geocode`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ address: addressQuery })
                        });
                        if (res.ok) {
                            const geoData = await res.json();
                            if (geoData.items && geoData.items.length > 0) {
                                lat = geoData.items[0].position.lat;
                                lng = geoData.items[0].position.lng;
                            }
                        }
                    } catch (e) {
                        console.error("Geocoding failed during doctor creation", e);
                    }
                }
            }

            await db.insert(addresses).values({
                entityId: newDoctor.id,
                entityType: "doctor",
                zipCode: addressZipCode || null,
                street: addressStreet || null,
                number: addressNumber || null,
                complement: addressComplement || null,
                neighborhood: addressNeighborhood || null,
                city: addressCity || null,
                state: addressState || null,
                latitude: lat,
                longitude: lng,
            });
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

    const {
        id: doctorId, name, email, crm, crmState, phone, specialtyIds, practiceAreaIds,
        addressZipCode, addressStreet, addressNumber, addressComplement,
        addressNeighborhood, addressCity, addressState, addressLatitude, addressLongitude
    } = parsed.data;

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
                phone: phone || null,
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

        // 6. Update Address if provided
        if (addressStreet || addressZipCode) {
            let lat = addressLatitude || null;
            let lng = addressLongitude || null;

            // Se a latitude e longitude não vieram do form, tenta buscar
            if (!lat || !lng) {
                let addressQuery = "";
                if (addressStreet) addressQuery += addressStreet;
                if (addressNumber) addressQuery += `, ${addressNumber}`;
                if (addressNeighborhood) addressQuery += `, ${addressNeighborhood}`;
                if (addressCity) addressQuery += ` - ${addressCity}`;
                if (addressState) addressQuery += `, ${addressState}`;
                if (addressZipCode) addressQuery += `, ${addressZipCode}`;

                if (addressQuery) {
                    try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/geocode`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ address: addressQuery })
                        });
                        if (res.ok) {
                            const geoData = await res.json();
                            if (geoData.items && geoData.items.length > 0) {
                                lat = geoData.items[0].position.lat;
                                lng = geoData.items[0].position.lng;
                            }
                        }
                    } catch (e) {
                        console.error("Geocoding failed during doctor update", e);
                    }
                }
            }

            const existingAddress = await db.query.addresses.findFirst({
                where: (addresses, { and, eq }) => and(
                    eq(addresses.entityId, doctorId),
                    eq(addresses.entityType, "doctor")
                )
            });

            if (existingAddress) {
                await db.update(addresses)
                    .set({
                        zipCode: addressZipCode || null,
                        street: addressStreet || null,
                        number: addressNumber || null,
                        complement: addressComplement || null,
                        neighborhood: addressNeighborhood || null,
                        city: addressCity || null,
                        state: addressState || null,
                        latitude: lat,
                        longitude: lng,
                    })
                    .where(eq(addresses.id, existingAddress.id));
            } else {
                await db.insert(addresses).values({
                    entityId: doctorId,
                    entityType: "doctor",
                    zipCode: addressZipCode || null,
                    street: addressStreet || null,
                    number: addressNumber || null,
                    complement: addressComplement || null,
                    neighborhood: addressNeighborhood || null,
                    city: addressCity || null,
                    state: addressState || null,
                    latitude: lat,
                    longitude: lng,
                    isPrimary: true,
                });
            }
        }

        revalidatePath("/doctors");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update doctor:", error);
        return { error: "Erro ao atualizar médico." };
    }
}
