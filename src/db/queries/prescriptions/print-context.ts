import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clinics, doctors } from "@/db/schema";
import { getConsultationDetailsWithDoctor } from "@/db/queries/consultations";
import { getPatientById } from "@/db/queries/patients";

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
    patientName: string;
    doctorName: string | null;
    doctorCrmLine: string | null;
    consultationDate: Date;
    items: PrescriptionPrintItem[];
};

export async function getPrescriptionPrintContext(
    consultationId: string,
    patientId: string,
    clinicId: string
): Promise<PrescriptionPrintContext | null> {
    const consultation = await getConsultationDetailsWithDoctor(consultationId, clinicId);
    if (!consultation || consultation.patientId !== patientId) return null;
    const rx = consultation.prescriptions;
    if (!rx?.length) return null;

    const [patient, clinicRow, doctorRow] = await Promise.all([
        getPatientById(patientId, clinicId),
        db.query.clinics.findFirst({
            where: eq(clinics.id, clinicId),
            columns: { name: true },
        }),
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

    const items: PrescriptionPrintItem[] = rx.map((p) => ({
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

    return {
        clinicName: clinicRow?.name?.trim() || "Clínica",
        patientName: patient.name,
        doctorName: consultation.doctor?.user?.name ?? null,
        doctorCrmLine,
        consultationDate: consultation.startTime,
        items,
    };
}
