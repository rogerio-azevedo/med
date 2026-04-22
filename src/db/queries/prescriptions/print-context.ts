import { and, eq } from "drizzle-orm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db } from "@/db";
import { addresses, clinics, doctors } from "@/db/schema";
import {
    getConsultationDetailsWithDoctor,
    getConsultationDetailsWithDoctorById,
} from "@/db/queries/consultations";
import { getPatientById } from "@/db/queries/patients";
import { formatClinicAddressLine } from "@/lib/formatters/clinic-address";
import { resolvePrescriptionVerificationUrl } from "@/lib/prescription-verification-url";

export type PrescriptionPrintItem = {
    id: string;
    medicineName: string;
    dosage: string | null;
    pharmaceuticalForm: string | null;
    frequency: string | null;
    duration: string | null;
    quantity: string | null;
    route: string | null;
    instructions: string | null;
    isContinuous: boolean;
    startDate: string | null;
    endDate: string | null;
};

export type PrescriptionPrintContext = {
    clinicName: string;
    clinicLogoUrl: string | null;
    clinicPhone: string | null;
    clinicAddress: string | null;
    patientName: string;
    patientDob: string | null;
    doctorName: string | null;
    doctorCrmLine: string | null;
    consultationDate: Date;
    verificationUrl: string;
    items: PrescriptionPrintItem[];
};

export type PrescriptionPrintContextOptions = {
    /** Origin da requisição (ex.: https://app.exemplo.com) para QR quando `NEXT_PUBLIC_APP_URL` não está definido. */
    requestOrigin?: string | null;
};

async function resolveClinicPrimaryAddress(clinicId: string): Promise<string | null> {
    const rows = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.entityType, "clinic"), eq(addresses.entityId, clinicId)));
    if (!rows.length) return null;
    const chosen = rows.find((r) => r.isPrimary) ?? rows[0];
    return formatClinicAddressLine(chosen);
}

function formatPatientDob(birthDate: unknown): string | null {
    if (birthDate == null) return null;
    try {
        const d = birthDate instanceof Date ? birthDate : new Date(String(birthDate));
        if (Number.isNaN(d.getTime())) return null;
        return format(d, "dd/MM/yyyy", { locale: ptBR });
    } catch {
        return null;
    }
}

function mapPrescriptionsToItems(
    rx: {
        id: string;
        medicineName: string;
        dosage: string | null;
        pharmaceuticalForm: string | null;
        frequency: string | null;
        duration: string | null;
        quantity: string | null;
        route: string | null;
        instructions: string | null;
        isContinuous: boolean;
        startDate: string | null;
        endDate: string | null;
    }[]
): PrescriptionPrintItem[] {
    return rx.map((p) => ({
        id: p.id,
        medicineName: p.medicineName,
        dosage: p.dosage,
        pharmaceuticalForm: p.pharmaceuticalForm,
        frequency: p.frequency,
        duration: p.duration,
        quantity: p.quantity,
        route: p.route,
        instructions: p.instructions,
        isContinuous: p.isContinuous,
        startDate: p.startDate,
        endDate: p.endDate,
    }));
}

async function buildPrescriptionPrintContext(
    consultationId: string,
    clinicId: string,
    patientId: string,
    options: PrescriptionPrintContextOptions | undefined,
    consultation: NonNullable<Awaited<ReturnType<typeof getConsultationDetailsWithDoctor>>>
): Promise<PrescriptionPrintContext | null> {
    const rx = consultation.prescriptions;
    if (!rx?.length) return null;

    const [patient, clinicRow, addressLine, doctorRow] = await Promise.all([
        getPatientById(patientId, clinicId),
        db.query.clinics.findFirst({
            where: eq(clinics.id, clinicId),
            columns: { name: true, phone: true, logoUrl: true },
        }),
        resolveClinicPrimaryAddress(clinicId),
        consultation.doctorId
            ? db.query.doctors.findFirst({
                  where: eq(doctors.id, consultation.doctorId),
                  columns: { crm: true, crmState: true },
              })
            : Promise.resolve(null),
    ]);

    if (!patient) return null;

    let doctorCrmLine: string | null = null;
    if (doctorRow?.crm?.trim()) {
        const st = doctorRow.crmState?.trim();
        doctorCrmLine = st ? `CRM ${st} ${doctorRow.crm.trim()}` : `CRM ${doctorRow.crm.trim()}`;
    }

    const items = mapPrescriptionsToItems(rx);
    const verificationUrl = resolvePrescriptionVerificationUrl(consultationId, options?.requestOrigin);

    return {
        clinicName: clinicRow?.name?.trim() || "Clínica",
        clinicLogoUrl: clinicRow?.logoUrl?.trim() || null,
        clinicPhone: clinicRow?.phone?.trim() || null,
        clinicAddress: addressLine,
        patientName: patient.name,
        patientDob: formatPatientDob(patient.birthDate),
        doctorName: consultation.doctor?.user?.name ?? null,
        doctorCrmLine,
        consultationDate: consultation.startTime,
        verificationUrl,
        items,
    };
}

export async function getPrescriptionPrintContext(
    consultationId: string,
    patientId: string,
    clinicId: string,
    options?: PrescriptionPrintContextOptions
): Promise<PrescriptionPrintContext | null> {
    const consultation = await getConsultationDetailsWithDoctor(consultationId, clinicId);
    if (!consultation || consultation.patientId !== patientId) return null;
    return buildPrescriptionPrintContext(consultationId, clinicId, patientId, options, consultation);
}

/** Dados da receita para a página pública `/verificar/[consultationId]` (sem sessão). */
export async function getPrescriptionVerificationContext(
    consultationId: string,
    options?: PrescriptionPrintContextOptions
): Promise<PrescriptionPrintContext | null> {
    const consultation = await getConsultationDetailsWithDoctorById(consultationId);
    if (!consultation) return null;
    return buildPrescriptionPrintContext(
        consultationId,
        consultation.clinicId,
        consultation.patientId,
        options,
        consultation
    );
}
