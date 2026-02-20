import { db } from "@/db";
import { doctors, clinicDoctors, users, doctorSpecialties, specialties } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getDoctorsByClinic(clinicId: string) {
    const rawResults = await db
        .select({
            id: doctors.id,
            crm: doctors.crm,
            crmState: doctors.crmState,
            name: users.name,
            email: users.email,
            specialtyId: specialties.id,
            specialtyName: specialties.name,
        })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .innerJoin(clinicDoctors, eq(clinicDoctors.doctorId, doctors.id))
        .leftJoin(doctorSpecialties, eq(doctorSpecialties.doctorId, doctors.id))
        .leftJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
        .where(
            and(
                eq(clinicDoctors.clinicId, clinicId),
                eq(clinicDoctors.isActive, true)
            )
        );

    const doctorsMap = new Map<string, any>();

    for (const row of rawResults) {
        if (!doctorsMap.has(row.id)) {
            const { specialtyId, specialtyName, ...doctorData } = row;
            doctorsMap.set(row.id, {
                ...doctorData,
                specialties: [],
            });
        }

        if (row.specialtyId && row.specialtyName) {
            doctorsMap.get(row.id).specialties.push({
                id: row.specialtyId,
                name: row.specialtyName,
            });
        }
    }

    return Array.from(doctorsMap.values());
}

export async function deleteDoctor(doctorId: string, clinicId: string) {
    // In this multi-tenant setup, we "delete" the association for the clinic
    // We might want to keep the doctor record if they are in other clinics, 
    // but usually in this simple flow we just remove the link.

    await db.delete(clinicDoctors).where(
        and(
            eq(clinicDoctors.doctorId, doctorId),
            eq(clinicDoctors.clinicId, clinicId)
        )
    );

    return { success: true };
}
