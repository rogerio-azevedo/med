import { db } from "@/db";
import {
    doctors,
    clinicDoctors,
    users,
    doctorSpecialties,
    specialties,
    doctorPracticeAreas,
    practiceAreas,
    doctorHealthInsurances,
    healthInsurances,
    addresses,
    inviteLinks,
} from "@/db/schema";
import { eq, and, asc, isNull, or } from "drizzle-orm";

type DoctorListItem = {
    id: string;
    crm: string | null;
    crmState: string | null;
    phone: string | null;
    relationshipType: "linked" | "partner" | null;
    isAssociated: boolean;
    name: string | null;
    email: string | null;
    observations: string | null;
    inviteCode: string | null;
    address: {
        id: string | null;
        zipCode: string | null;
        street: string | null;
        number: string | null;
        complement: string | null;
        neighborhood: string | null;
        city: string | null;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
    } | null;
    specialties: { id: string; name: string }[];
    practiceAreas: { id: string; name: string }[];
    healthInsurances: { id: string; name: string }[];
};

export async function getDoctorsByClinic(clinicId: string) {
    const rawResults = await db
        .select({
            id: doctors.id,
            crm: doctors.crm,
            crmState: doctors.crmState,
            phone: doctors.phone,
            relationshipType: clinicDoctors.relationshipType,
            isAssociated: clinicDoctors.id,
            name: users.name,
            email: users.email,
            observations: doctors.observations,
            specialtyId: specialties.id,
            specialtyName: specialties.name,
            practiceAreaId: practiceAreas.id,
            practiceAreaName: practiceAreas.name,
            healthInsuranceId: healthInsurances.id,
            healthInsuranceName: healthInsurances.name,
            inviteCode: inviteLinks.code,
            address: {
                id: addresses.id,
                zipCode: addresses.zipCode,
                street: addresses.street,
                number: addresses.number,
                complement: addresses.complement,
                neighborhood: addresses.neighborhood,
                city: addresses.city,
                state: addresses.state,
                latitude: addresses.latitude,
                longitude: addresses.longitude,
            }
        })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .leftJoin(
            clinicDoctors,
            and(
                eq(clinicDoctors.doctorId, doctors.id),
                eq(clinicDoctors.clinicId, clinicId)
            )
        )
        .leftJoin(doctorSpecialties, eq(doctorSpecialties.doctorId, doctors.id))
        .leftJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
        .leftJoin(doctorPracticeAreas, eq(doctorPracticeAreas.doctorId, doctors.id))
        .leftJoin(practiceAreas, eq(doctorPracticeAreas.practiceAreaId, practiceAreas.id))
        .leftJoin(
            doctorHealthInsurances,
            and(
                eq(doctorHealthInsurances.doctorId, doctors.id),
                eq(doctorHealthInsurances.isActive, true)
            )
        )
        .leftJoin(
            healthInsurances,
            and(
                eq(doctorHealthInsurances.healthInsuranceId, healthInsurances.id),
                eq(healthInsurances.isActive, true)
            )
        )
        .leftJoin(
            addresses,
            and(
                eq(addresses.entityId, doctors.id),
                eq(addresses.entityType, "doctor")
            )
        )
        .leftJoin(
            inviteLinks,
            and(
                eq(inviteLinks.doctorId, doctors.id),
                eq(inviteLinks.clinicId, clinicId),
                eq(inviteLinks.role, "patient"),
                eq(inviteLinks.isActive, true)
            )
        )
        .where(
            and(
                eq(users.role, "doctor"),
                or(eq(clinicDoctors.isActive, true), isNull(clinicDoctors.id))
            )
        )
        .orderBy(asc(users.name));

    const doctorsMap = new Map<string, DoctorListItem>();

    for (const row of rawResults) {
        if (!doctorsMap.has(row.id)) {
            const hasAddress = row.address && row.address.id !== null;
            doctorsMap.set(row.id, {
                id: row.id,
                crm: row.crm,
                crmState: row.crmState,
                phone: row.phone,
                relationshipType: row.relationshipType ?? null,
                isAssociated: !!row.isAssociated,
                name: row.name,
                email: row.email,
                observations: row.observations,
                inviteCode: row.inviteCode,
                address: hasAddress ? row.address : null,
                specialties: [],
                practiceAreas: [],
                healthInsurances: [],
            });
        } else {
            const doctor = doctorsMap.get(row.id);
            if (doctor && row.inviteCode && !doctor.inviteCode) {
                doctor.inviteCode = row.inviteCode;
            }
        }

        if (row.specialtyId && row.specialtyName) {
            const doctor = doctorsMap.get(row.id);
            if (doctor && !doctor.specialties.some((s) => s.id === row.specialtyId)) {
                doctor.specialties.push({
                    id: row.specialtyId,
                    name: row.specialtyName,
                });
            }
        }

        if (row.practiceAreaId && row.practiceAreaName) {
            const doctor = doctorsMap.get(row.id);
            if (doctor && !doctor.practiceAreas.some((p) => p.id === row.practiceAreaId)) {
                doctor.practiceAreas.push({
                    id: row.practiceAreaId,
                    name: row.practiceAreaName,
                });
            }
        }

        if (row.healthInsuranceId && row.healthInsuranceName) {
            const doctor = doctorsMap.get(row.id);
            if (doctor && !doctor.healthInsurances.some((item) => item.id === row.healthInsuranceId)) {
                doctor.healthInsurances.push({
                    id: row.healthInsuranceId,
                    name: row.healthInsuranceName,
                });
            }
        }
    }

    return Array.from(doctorsMap.values()).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" })
    );
}

export async function deleteDoctor(doctorId: string, clinicId: string) {
    // Soft delete: set isActive to false for the clinic association
    await db
        .update(clinicDoctors)
        .set({ isActive: false })
        .where(
            and(
                eq(clinicDoctors.doctorId, doctorId),
                eq(clinicDoctors.clinicId, clinicId)
            )
        );

    return { success: true };
}

export async function getDoctorsSimple(clinicId: string) {
    const result = await db
        .select({
            id: doctors.id,
            name: users.name,
            relationshipType: clinicDoctors.relationshipType,
        })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .innerJoin(clinicDoctors, eq(clinicDoctors.doctorId, doctors.id))
        .where(
            and(
                eq(clinicDoctors.clinicId, clinicId),
                eq(clinicDoctors.isActive, true)
            )
        )

    return result.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" })
    );
}

export async function getDoctorDetails(doctorId: string, clinicId: string) {
    const rawResults = await db
        .select({
            id: doctors.id,
            crm: doctors.crm,
            crmState: doctors.crmState,
            phone: doctors.phone,
            relationshipType: clinicDoctors.relationshipType,
            observations: doctors.observations,
            name: users.name,
            email: users.email,
            specialtyId: specialties.id,
            specialtyName: specialties.name,
            practiceAreaId: practiceAreas.id,
            practiceAreaName: practiceAreas.name,
            healthInsuranceId: healthInsurances.id,
            healthInsuranceName: healthInsurances.name,
            address: {
                id: addresses.id,
                zipCode: addresses.zipCode,
                street: addresses.street,
                number: addresses.number,
                complement: addresses.complement,
                neighborhood: addresses.neighborhood,
                city: addresses.city,
                state: addresses.state,
                latitude: addresses.latitude,
                longitude: addresses.longitude,
            }
        })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .innerJoin(clinicDoctors, eq(clinicDoctors.doctorId, doctors.id))
        .leftJoin(doctorSpecialties, eq(doctorSpecialties.doctorId, doctors.id))
        .leftJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
        .leftJoin(doctorPracticeAreas, eq(doctorPracticeAreas.doctorId, doctors.id))
        .leftJoin(practiceAreas, eq(doctorPracticeAreas.practiceAreaId, practiceAreas.id))
        .leftJoin(
            doctorHealthInsurances,
            and(
                eq(doctorHealthInsurances.doctorId, doctors.id),
                eq(doctorHealthInsurances.isActive, true)
            )
        )
        .leftJoin(
            healthInsurances,
            and(
                eq(doctorHealthInsurances.healthInsuranceId, healthInsurances.id),
                eq(healthInsurances.isActive, true)
            )
        )
        .leftJoin(
            addresses,
            and(
                eq(addresses.entityId, doctors.id),
                eq(addresses.entityType, "doctor")
            )
        )
        .where(
            and(
                eq(doctors.id, doctorId),
                eq(clinicDoctors.clinicId, clinicId),
                eq(clinicDoctors.isActive, true)
            )
        );

    if (rawResults.length === 0) return null;

    const doctorData = {
        id: rawResults[0].id,
        name: rawResults[0].name,
        email: rawResults[0].email,
        phone: rawResults[0].phone,
        crm: rawResults[0].crm,
        crmState: rawResults[0].crmState,
        relationshipType: rawResults[0].relationshipType,
        observations: rawResults[0].observations,
        address: rawResults[0].address?.id ? rawResults[0].address : null,
        specialties: [] as { id: string; name: string }[],
        practiceAreas: [] as { id: string; name: string }[],
        healthInsurances: [] as { id: string; name: string }[],
    };

    const addedSpecialties = new Set<string>();
    const addedPracticeAreas = new Set<string>();
    const addedHealthInsurances = new Set<string>();

    for (const row of rawResults) {
        if (row.specialtyId && row.specialtyName && !addedSpecialties.has(row.specialtyId)) {
            doctorData.specialties.push({ id: row.specialtyId, name: row.specialtyName });
            addedSpecialties.add(row.specialtyId);
        }
        if (row.practiceAreaId && row.practiceAreaName && !addedPracticeAreas.has(row.practiceAreaId)) {
            doctorData.practiceAreas.push({ id: row.practiceAreaId, name: row.practiceAreaName });
            addedPracticeAreas.add(row.practiceAreaId);
        }
        if (row.healthInsuranceId && row.healthInsuranceName && !addedHealthInsurances.has(row.healthInsuranceId)) {
            doctorData.healthInsurances.push({ id: row.healthInsuranceId, name: row.healthInsuranceName });
            addedHealthInsurances.add(row.healthInsuranceId);
        }
    }

    return doctorData;
}
