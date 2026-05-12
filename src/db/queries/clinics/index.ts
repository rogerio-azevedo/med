import { db } from "@/db";
import { addresses, clinics } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatClinicAddressLine } from "@/lib/formatters/clinic-address";

export type ClinicPrintInfo = {
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    address: string | null;
};

export async function getClinicById(clinicId: string): Promise<ClinicPrintInfo | null> {
    const clinic = await db.query.clinics.findFirst({
        where: eq(clinics.id, clinicId),
    });
    if (!clinic) return null;

    const rows = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.entityType, "clinic"), eq(addresses.entityId, clinicId)));

    const chosen = rows.find((r) => r.isPrimary) ?? rows[0];
    const addressLine = chosen ? formatClinicAddressLine(chosen) : null;

    return {
        name: clinic.name,
        logoUrl: clinic.logoUrl,
        websiteUrl: clinic.websiteUrl ?? null,
        address: addressLine,
    };
}
