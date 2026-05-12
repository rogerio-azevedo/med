import { and, eq } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { db } from "@/db";
import { clinics, addresses } from "@/db/schema/clinics";
import { doctors, doctorSpecialties, doctorPracticeAreas } from "@/db/schema/doctors";
import { users } from "@/db/schema/auth";
import { specialties, practiceAreas } from "@/db/schema/specialties";
import {
    formatClinicAddressFooterLines,
    getClinicIssueCityFromAddress,
} from "@/lib/formatters/clinic-address";
import { DOCUMENT_DEFAULT_ISSUE_CITY, DOCUMENT_ISSUED_TIMEZONE } from "@/lib/constants/document-print";
import { resolveDoctorSignatureUrlForPrint } from "@/lib/medical-document/resolve-signature-url";
import type { MedicalDocumentPrintClinic, MedicalDocumentPrintDoctor } from "@/lib/medical-document/print-layout-types";

function capitalizeMonthInPortugueseDate(formatted: string): string {
    return formatted.replace(
        /(\d{2}\s+de\s+)([a-záàâãéêíóôõúç]+)(\s+de\s+)/i,
        (_, prefix: string, month: string, suffix: string) =>
            `${prefix}${month.charAt(0).toUpperCase()}${month.slice(1).toLowerCase()}${suffix}`
    );
}

function formatCrmLineForMedicalDocument(crm: string | null | undefined, crmState: string | null | undefined) {
    const n = crm?.trim();
    const st = crmState?.trim()?.toUpperCase();
    if (n && st) return `CRM ${n}/${st}`;
    if (n) return `CRM ${n}`;
    if (st) return `CRM/${st}`;
    return null;
}

export type DocumentModalPreviewShell = {
    clinic: MedicalDocumentPrintClinic;
    doctor: MedicalDocumentPrintDoctor | null;
    sampleIssuedAtLine: string;
    sampleSignatureImageUrl: string | null;
};

export async function getDocumentTemplateModalPreviewShell(
    clinicId: string,
    userId: string,
    doctorId?: string | null
): Promise<DocumentModalPreviewShell> {
    const [clinicRow, addressRows] = await Promise.all([
        db.query.clinics.findFirst({
            where: eq(clinics.id, clinicId),
        }),
        db
            .select()
            .from(addresses)
            .where(and(eq(addresses.entityType, "clinic"), eq(addresses.entityId, clinicId))),
    ]);

    const chosenAddr = addressRows.find((r) => r.isPrimary) ?? addressRows[0];
    const footerAddressLines = formatClinicAddressFooterLines(chosenAddr ?? null);
    const issueCity =
        getClinicIssueCityFromAddress(chosenAddr ?? null) ?? DOCUMENT_DEFAULT_ISSUE_CITY;

    const now = new Date();
    const zonedDatePart = formatInTimeZone(
        now,
        DOCUMENT_ISSUED_TIMEZONE,
        "dd 'de' MMMM 'de' yyyy HH:mm",
        { locale: ptBR }
    );
    const sampleIssuedAtLine = `${issueCity}, ${capitalizeMonthInPortugueseDate(zonedDatePart)}`;

    const clinic: MedicalDocumentPrintClinic = {
        name: clinicRow?.name?.trim() || "Clínica",
        logoUrl: clinicRow?.logoUrl?.trim() || null,
        phone: clinicRow?.phone?.trim() || null,
        websiteUrl: clinicRow?.websiteUrl?.trim() || null,
        footerAddressLines,
    };

    let doctorBlock: MedicalDocumentPrintDoctor | null = null;
    let sampleSignatureImageUrl: string | null = null;

    if (doctorId) {
        const doctorRow = await db.query.doctors.findFirst({
            where: eq(doctors.id, doctorId),
            columns: { id: true, crm: true, crmState: true, signatureUrl: true },
        });
        if (doctorRow) {
            const [userRow, specNames, areaNames] = await Promise.all([
                db.query.users.findFirst({
                    where: eq(users.id, userId),
                    columns: { name: true },
                }),
                db
                    .select({ name: specialties.name })
                    .from(doctorSpecialties)
                    .innerJoin(specialties, eq(doctorSpecialties.specialtyId, specialties.id))
                    .where(eq(doctorSpecialties.doctorId, doctorRow.id))
                    .limit(2),
                db
                    .select({ name: practiceAreas.name })
                    .from(doctorPracticeAreas)
                    .innerJoin(practiceAreas, eq(doctorPracticeAreas.practiceAreaId, practiceAreas.id))
                    .where(eq(doctorPracticeAreas.doctorId, doctorRow.id))
                    .limit(2),
            ]);
            const specialtyParts = [
                ...specNames.map((r) => r.name?.trim()).filter(Boolean),
                ...areaNames.map((r) => r.name?.trim()).filter(Boolean),
            ] as string[];
            const specialtyLine = specialtyParts.length > 0 ? specialtyParts.join("/") : null;
            sampleSignatureImageUrl = await resolveDoctorSignatureUrlForPrint(doctorRow.signatureUrl);
            doctorBlock = {
                displayName: userRow?.name?.trim() || "Profissional",
                specialtyLine,
                crmLine: formatCrmLineForMedicalDocument(doctorRow.crm, doctorRow.crmState),
            };
        }
    } else {
        const userOnly = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true },
        });
        if (userOnly?.name) {
            doctorBlock = {
                displayName: userOnly.name.trim(),
                specialtyLine: null,
                crmLine: null,
            };
        }
    }

    return {
        clinic,
        doctor: doctorBlock,
        sampleIssuedAtLine,
        sampleSignatureImageUrl,
    };
}
