import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { serviceTypes } from "@/db/schema";

export async function getServiceTypes(clinicId: string) {
    return db
        .select()
        .from(serviceTypes)
        .where(eq(serviceTypes.clinicId, clinicId))
        .orderBy(asc(serviceTypes.name));
}

export async function getActiveServiceTypes(clinicId: string) {
    return db
        .select()
        .from(serviceTypes)
        .where(and(eq(serviceTypes.clinicId, clinicId), eq(serviceTypes.isActive, true)))
        .orderBy(asc(serviceTypes.name));
}

export async function getServiceTypeById(id: string, clinicId: string) {
    return db.query.serviceTypes.findFirst({
        where: and(eq(serviceTypes.id, id), eq(serviceTypes.clinicId, clinicId)),
    });
}
