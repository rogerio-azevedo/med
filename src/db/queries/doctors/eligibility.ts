import { db } from "@/db";
import { users, doctors, clinicDoctors } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type DoctorEligibilityResult =
    | { status: "new" }
    | { status: "active"; doctorId: string }
    | { status: "inactive"; doctorId: string; doctor: unknown }
    | { status: "global"; doctorId: string; doctor: unknown };

export async function checkDoctorEligibility(crm: string, crmState: string, clinicId: string): Promise<DoctorEligibilityResult> {
    const cleanedCrm = crm.replace(/\D/g, "");

    // Find the doctor globally
    const globalDoctors = await db
        .select({
            doctor: doctors,
            user: users
        })
        .from(doctors)
        .innerJoin(users, eq(doctors.userId, users.id))
        .where(
            and(
                eq(doctors.crm, cleanedCrm),
                eq(doctors.crmState, crmState)
            )
        )
        .limit(1);

    if (globalDoctors.length === 0) {
        return { status: "new" };
    }

    const doc = globalDoctors[0];

    // Check association
    const associations = await db
        .select()
        .from(clinicDoctors)
        .where(
            and(
                eq(clinicDoctors.doctorId, doc.doctor.id),
                eq(clinicDoctors.clinicId, clinicId)
            )
        )
        .limit(1);

    if (associations.length === 0) {
        return { status: "global", doctorId: doc.doctor.id, doctor: { ...doc.doctor, name: doc.user.name, email: doc.user.email } };
    }

    const association = associations[0];
    if (association.isActive) {
        return { status: "active", doctorId: doc.doctor.id };
    } else {
        return { status: "inactive", doctorId: doc.doctor.id, doctor: { ...doc.doctor, name: doc.user.name, email: doc.user.email } };
    }
}
