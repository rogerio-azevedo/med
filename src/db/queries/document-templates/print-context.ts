import { and, eq } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { db } from "@/db";
import { documentTemplates, generatedDocuments } from "@/db/schema/document-templates";
import { doctors, doctorSpecialties, doctorPracticeAreas } from "@/db/schema/doctors";
import { users } from "@/db/schema/auth";
import { clinics, addresses } from "@/db/schema/clinics";
import { specialties, practiceAreas } from "@/db/schema/specialties";
import {
    formatClinicAddressFooterLines,
    getClinicIssueCityFromAddress,
} from "@/lib/formatters/clinic-address";
import { DOCUMENT_DEFAULT_ISSUE_CITY, DOCUMENT_ISSUED_TIMEZONE } from "@/lib/constants/document-print";
import { resolveDoctorSignatureUrlForPrint } from "@/lib/medical-document/resolve-signature-url";

export type GeneratedDocumentPrintContext = {
    document: {
        id: string;
        title: string;
        /** HTML do corpo para o shell de impressão: `edited_content` do médico ou `rendered_content` automático. */
        renderedContent: string;
        /** ISO (UTC); seguro para passar a Client Components. */
        generatedAt: string;
    };
    template: {
        hideTitleWhenPrinted: boolean;
    } | null;
    doctor: {
        displayName: string;
        specialtyLine: string | null;
        crmLine: string | null;
        signatureImageUrl: string | null;
    } | null;
    clinic: {
        name: string;
        logoUrl: string | null;
        phone: string | null;
        websiteUrl: string | null;
        footerAddressLines: string[];
        issueCity: string;
    };
    /** Linha completa: "Cuiabá, 08 de Maio de 2026 20:44" */
    issuedAtLine: string;
};

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

export async function getGeneratedDocumentPrintContext(
    docId: string,
    templateIdFromRoute: string,
    clinicId: string
): Promise<GeneratedDocumentPrintContext | null> {
    const document = await db.query.generatedDocuments.findFirst({
        where: and(eq(generatedDocuments.id, docId), eq(generatedDocuments.clinicId, clinicId)),
    });
    if (!document) return null;

    if (document.templateId !== templateIdFromRoute) {
        return null;
    }

    const [template, clinicRow, addressRows] = await Promise.all([
        document.templateId
            ? db.query.documentTemplates.findFirst({
                  where: and(
                      eq(documentTemplates.id, document.templateId),
                      eq(documentTemplates.clinicId, clinicId)
                  ),
              })
            : Promise.resolve(null),
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

    const generatedAt =
        document.generatedAt instanceof Date ? document.generatedAt : new Date(document.generatedAt);

    const zonedDatePart = formatInTimeZone(
        generatedAt,
        DOCUMENT_ISSUED_TIMEZONE,
        "dd 'de' MMMM 'de' yyyy HH:mm",
        { locale: ptBR }
    );
    const issuedAtLine = `${issueCity}, ${capitalizeMonthInPortugueseDate(zonedDatePart)}`;

    let doctorBlock: GeneratedDocumentPrintContext["doctor"] = null;
    const issuerUserId = document.generatedByUserId;
    if (issuerUserId) {
        const doctorRow = await db.query.doctors.findFirst({
            where: eq(doctors.userId, issuerUserId),
            columns: { id: true, crm: true, crmState: true, signatureUrl: true },
        });
        if (doctorRow) {
            const [userRow, specNames, areaNames] = await Promise.all([
                db.query.users.findFirst({
                    where: eq(users.id, issuerUserId),
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
            const signatureImageUrl = await resolveDoctorSignatureUrlForPrint(doctorRow.signatureUrl);

            doctorBlock = {
                displayName: userRow?.name?.trim() || "Profissional",
                specialtyLine,
                crmLine: formatCrmLineForMedicalDocument(doctorRow.crm, doctorRow.crmState),
                signatureImageUrl,
            };
        } else {
            const userOnly = await db.query.users.findFirst({
                where: eq(users.id, issuerUserId),
                columns: { name: true },
            });
            if (userOnly?.name) {
                doctorBlock = {
                    displayName: userOnly.name.trim(),
                    specialtyLine: null,
                    crmLine: null,
                    signatureImageUrl: null,
                };
            }
        }
    }

    const bodyHtml = document.editedContent ?? document.renderedContent;

    return {
        document: {
            id: document.id,
            title: document.title,
            renderedContent: bodyHtml,
            generatedAt: generatedAt.toISOString(),
        },
        template: template
            ? {
                  hideTitleWhenPrinted: template.hideTitleWhenPrinted,
              }
            : null,
        doctor: doctorBlock,
        clinic: {
            name: clinicRow?.name?.trim() || "Clínica",
            logoUrl: clinicRow?.logoUrl?.trim() || null,
            phone: clinicRow?.phone?.trim() || null,
            websiteUrl: clinicRow?.websiteUrl?.trim() || null,
            footerAddressLines,
            issueCity,
        },
        issuedAtLine,
    };
}
