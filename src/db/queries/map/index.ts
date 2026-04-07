import { db } from "@/db";
import { and, eq, isNotNull, inArray } from "drizzle-orm";
import {
    addresses,
    clinics,
    doctors,
    hospitals,
    users,
    doctorSpecialties,
    specialties
} from "@/db/schema";

export async function getClinicsWithAddress(clinicId: string) {
    const results = await db
        .select({
            id: clinics.id,
            name: clinics.name,
            phone: clinics.phone,
            email: clinics.email,
            address: {
                id: addresses.id,
                street: addresses.street,
                number: addresses.number,
                neighborhood: addresses.neighborhood,
                city: addresses.city,
                state: addresses.state,
                zipCode: addresses.zipCode,
                latitude: addresses.latitude,
                longitude: addresses.longitude,
            }
        })
        .from(clinics)
        .leftJoin(addresses, and(eq(addresses.entityId, clinics.id), eq(addresses.entityType, "clinic")))
        .where(
            and(
                eq(clinics.id, clinicId),
                isNotNull(addresses.latitude),
                isNotNull(addresses.longitude)
            )
        );

    return results;
}

export async function getDoctorsWithAddress(clinicId: string) {
    // Primeiro busca os médicos associados à clínica com endereços
    // Notar que a associação médico <-> clínica está em clinicDoctors
    // Mas para simplificar focamos apenas nos médicos que tem endereço.
    // E garantir o isolamento da clinica usando clinicDoctors:
    const { clinicDoctors } = await import("@/db/schema");

    const doctorsRaw = await db
        .select({
            id: doctors.id,
            name: users.name,
            crm: doctors.crm,
            crmState: doctors.crmState,
            address: {
                id: addresses.id,
                street: addresses.street,
                number: addresses.number,
                neighborhood: addresses.neighborhood,
                city: addresses.city,
                state: addresses.state,
                zipCode: addresses.zipCode,
                latitude: addresses.latitude,
                longitude: addresses.longitude,
            }
        })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .innerJoin(clinicDoctors, eq(clinicDoctors.doctorId, doctors.id))
        .innerJoin(
            addresses,
            and(
                eq(addresses.entityId, doctors.id),
                eq(addresses.entityType, "doctor"),
                isNotNull(addresses.latitude),
                isNotNull(addresses.longitude)
            )
        )
        .where(eq(clinicDoctors.clinicId, clinicId));

    // Agora buscar as especialidades de cada médico retornado
    if (doctorsRaw.length === 0) return [];

    const doctorIds = doctorsRaw.map(d => d.id);

    // Busca especialidades
    const specialtiesRaw = await db
        .select({
            doctorId: doctorSpecialties.doctorId,
            specialty: {
                id: specialties.id,
                name: specialties.name,
            }
        })
        .from(doctorSpecialties)
        .innerJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
        .where(inArray(doctorSpecialties.doctorId, doctorIds));

    // Agrupa especialidades por médico
    const specialtiesByDoctorId = specialtiesRaw.reduce<Record<string, { specialty: { id: string; name: string } }[]>>((acc, curr) => {
        if (!acc[curr.doctorId]) {
            acc[curr.doctorId] = [];
        }
        acc[curr.doctorId].push({ specialty: curr.specialty });
        return acc;
    }, {});

    return doctorsRaw.map(doctor => ({
        ...doctor,
        specialties: specialtiesByDoctorId[doctor.id] || [],
    }));
}

export async function getHospitalsWithAddressForMap(clinicId: string) {
    return db
        .select({
            id: hospitals.id,
            name: hospitals.name,
            description: hospitals.description,
            address: {
                id: addresses.id,
                street: addresses.street,
                number: addresses.number,
                neighborhood: addresses.neighborhood,
                city: addresses.city,
                state: addresses.state,
                zipCode: addresses.zipCode,
                latitude: addresses.latitude,
                longitude: addresses.longitude,
            }
        })
        .from(hospitals)
        .innerJoin(
            addresses,
            and(
                eq(addresses.entityId, hospitals.id),
                eq(addresses.entityType, "hospital"),
                isNotNull(addresses.latitude),
                isNotNull(addresses.longitude)
            )
        )
        .where(and(eq(hospitals.clinicId, clinicId), eq(hospitals.isActive, true)));
}
