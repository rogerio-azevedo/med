import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
    users,
    doctors,
    clinicDoctors,
    clinicUsers,
    doctorSpecialties,
    doctorPracticeAreas,
    addresses,
} from "@/db/schema";
import { deleteDoctor as deleteDoctorQuery } from "@/db/queries/doctors";
import { geocodeAddress } from "@/lib/geocode";
import type { CreateDoctorInput, UpdateDoctorInput } from "@/lib/validations/doctor";
import { syncDoctorHealthInsurances } from "@/services/health-insurances";
import { ensureDoctorPatientInviteCode } from "@/services/invites";
import bcrypt from "bcryptjs";

export async function createDoctor(
    data: CreateDoctorInput,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    const {
        name,
        email,
        password,
        relationshipType,
        crm,
        crmState,
        phone,
        specialtyIds,
        practiceAreaIds,
        healthInsuranceIds,
        addressZipCode,
        addressStreet,
        addressNumber,
        addressComplement,
        addressNeighborhood,
        addressCity,
        addressState,
        addressLatitude,
        addressLongitude,
    } = data;

    const existingUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
    });

    if (existingUser) {
        return { success: false, error: "Email já cadastrado." };
    }

    if (!password) {
        return { success: false, error: "Senha é obrigatória para criar um médico." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await db.insert(users).values({
        id: userId,
        name,
        email,
        password: hashedPassword,
        role: "doctor",
    });

    await db.insert(clinicUsers).values({
        userId,
        clinicId,
        role: "doctor",
    });

    const [newDoctor] = await db.insert(doctors).values({
        userId,
        crm: crm || null,
        crmState: crmState || null,
        phone: phone || null,
    }).returning();

    await db.insert(clinicDoctors).values({
        doctorId: newDoctor.id,
        clinicId,
        relationshipType,
    });
    await ensureDoctorPatientInviteCode(clinicId, newDoctor.id);

    if (specialtyIds && specialtyIds.length > 0) {
        await db.insert(doctorSpecialties).values(
            specialtyIds.map((id) => ({
                doctorId: newDoctor.id,
                specialtyId: id,
            }))
        );
    }

    if (practiceAreaIds && practiceAreaIds.length > 0) {
        await db.insert(doctorPracticeAreas).values(
            practiceAreaIds.map((id) => ({
                doctorId: newDoctor.id,
                practiceAreaId: id,
            }))
        );
    }

    await syncDoctorHealthInsurances(newDoctor.id, healthInsuranceIds ?? []);

    if (addressStreet || addressZipCode) {
        let lat = addressLatitude ?? null;
        let lng = addressLongitude ?? null;

        if (!lat || !lng) {
            const coords = await geocodeAddress({
                street: addressStreet,
                number: addressNumber,
                neighborhood: addressNeighborhood,
                city: addressCity,
                state: addressState,
                zipCode: addressZipCode,
            });
            if (coords) {
                lat = coords.lat;
                lng = coords.lng;
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

    return { success: true };
}

export async function updateDoctor(
    data: UpdateDoctorInput,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    const {
        id: doctorId,
        name,
        email,
        relationshipType,
        crm,
        crmState,
        phone,
        specialtyIds,
        practiceAreaIds,
        healthInsuranceIds,
        addressZipCode,
        addressStreet,
        addressNumber,
        addressComplement,
        addressNeighborhood,
        addressCity,
        addressState,
        addressLatitude,
        addressLongitude,
    } = data;

    const doctor = await db.query.doctors.findFirst({
        where: (d, { eq }) => eq(d.id, doctorId),
    });

    if (!doctor) {
        return { success: false, error: "Médico não encontrado." };
    }

    const userId = doctor.userId;

    await db.update(users).set({ name, email }).where(eq(users.id, userId));

    await db
        .update(clinicDoctors)
        .set({ relationshipType })
        .where(
            and(
                eq(clinicDoctors.doctorId, doctorId),
                eq(clinicDoctors.clinicId, clinicId)
            )
        );

    await db
        .update(doctors)
        .set({
            crm: crm || null,
            crmState: crmState || null,
            phone: phone || null,
        })
        .where(eq(doctors.id, doctorId));

    if (specialtyIds !== undefined) {
        await db.delete(doctorSpecialties).where(eq(doctorSpecialties.doctorId, doctorId));
        if (specialtyIds.length > 0) {
            await db.insert(doctorSpecialties).values(
                specialtyIds.map((id) => ({
                    doctorId,
                    specialtyId: id,
                }))
            );
        }
    }

    if (practiceAreaIds !== undefined) {
        await db.delete(doctorPracticeAreas).where(eq(doctorPracticeAreas.doctorId, doctorId));
        if (practiceAreaIds.length > 0) {
            await db.insert(doctorPracticeAreas).values(
                practiceAreaIds.map((id) => ({
                    doctorId,
                    practiceAreaId: id,
                }))
            );
        }
    }

    if (healthInsuranceIds !== undefined) {
        await syncDoctorHealthInsurances(doctorId, healthInsuranceIds);
    }

    if (addressStreet || addressZipCode) {
        let lat = addressLatitude ?? null;
        let lng = addressLongitude ?? null;

        if (!lat || !lng) {
            const coords = await geocodeAddress({
                street: addressStreet,
                number: addressNumber,
                neighborhood: addressNeighborhood,
                city: addressCity,
                state: addressState,
                zipCode: addressZipCode,
            });
            if (coords) {
                lat = coords.lat;
                lng = coords.lng;
            }
        }

        const existingAddress = await db.query.addresses.findFirst({
            where: (a, { and, eq }) =>
                and(eq(a.entityId, doctorId), eq(a.entityType, "doctor")),
        });

        if (existingAddress) {
            await db
                .update(addresses)
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

    return { success: true };
}

export async function deleteDoctor(
    doctorId: string,
    clinicId: string
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        await deleteDoctorQuery(doctorId, clinicId);
        return { success: true };
    } catch {
        return { success: false, error: "Erro ao excluir médico." };
    }
}
