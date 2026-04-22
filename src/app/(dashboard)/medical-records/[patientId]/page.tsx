import { getPatientById } from "@/db/queries/patients";
import {
    getPatientConsultationsTimeline,
    getPatientLatestVitals,
    getConsultationDetails,
} from "@/db/queries/consultations";
import {
    getPatientSurgeriesTimeline,
    getSurgeryByCheckInId,
    getSurgeryDetails,
} from "@/db/queries/surgeries";
import { getDoctorsSimple } from "@/db/queries/doctors";
import { getHospitals } from "@/db/queries/hospitals";
import { getProcedures } from "@/db/queries/procedures";
import { getPatientFilesTimelineSorted } from "@/db/queries/medical-records";
import { getActiveServiceTypes } from "@/db/queries/service-types";
import { getClinicHealthInsurances } from "@/db/queries/health-insurances";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import { MedicalRecordsClient } from "@/components/medical-records/MedicalRecordsClient";
import { db } from "@/db";
import { clinicUsers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSurgeryServiceType } from "@/lib/surgery-service-type";
import { enrichTimelineRowsWithServiceTypeCatalog } from "@/lib/formatters/enrich-timeline-service-type-visual";

export const dynamic = "force-dynamic";

interface MedicalRecordsPageProps {
    params: Promise<{
        patientId: string;
    }>;
    searchParams: Promise<{ openConsultation?: string; openSurgery?: string }>;
}

export default async function MedicalRecordsPage({ params, searchParams }: MedicalRecordsPageProps) {
    const { patientId } = await params;
    const { openConsultation, openSurgery } = await searchParams;
    const session = await auth();

    if (!session?.user?.clinicId) {
        return <div>Não autorizado</div>;
    }

    const allowed = await can("medical-records", "can_read");
    if (!allowed) redirect("/dashboard");

    const patient = await getPatientById(patientId, session.user.clinicId);
    if (!patient) {
        notFound();
    }

    const [consultationsRaw, surgeriesRaw, fileTimeline, serviceTypes, healthInsurances, doctors, hospitals, procedures] =
        await Promise.all([
            getPatientConsultationsTimeline(patientId, session.user.clinicId),
            getPatientSurgeriesTimeline(patientId, session.user.clinicId),
            getPatientFilesTimelineSorted(patientId, session.user.clinicId),
            getActiveServiceTypes(session.user.clinicId),
            getClinicHealthInsurances(session.user.clinicId),
            getDoctorsSimple(session.user.clinicId),
            getHospitals(session.user.clinicId),
            getProcedures(session.user.clinicId),
        ]);

    const catalogVisual = serviceTypes.map((s) => ({
        id: s.id,
        timelineIconKey: s.timelineIconKey,
        timelineColorHex: s.timelineColorHex,
    }));
    const consultations = enrichTimelineRowsWithServiceTypeCatalog(consultationsRaw, catalogVisual);
    const surgeries = enrichTimelineRowsWithServiceTypeCatalog(surgeriesRaw, catalogVisual);
    const latestVitalsRow = await getPatientLatestVitals(patientId, session.user.clinicId);
    const latestVitals = latestVitalsRow
        ? {
              weight: latestVitalsRow.weight,
              height: latestVitalsRow.height,
              bloodPressure: latestVitalsRow.bloodPressure,
              heartRate: latestVitalsRow.heartRate,
              respiratoryRate: latestVitalsRow.respiratoryRate,
              temperature: latestVitalsRow.temperature,
              oxygenSaturation: latestVitalsRow.oxygenSaturation,
          }
        : undefined;
    const docId = session.user.doctorId;

    let clinicRole = session.user.clinicRole;
    if (clinicRole === undefined && session.user.id) {
        const link = await db.query.clinicUsers.findFirst({
            where: and(
                eq(clinicUsers.userId, session.user.id),
                eq(clinicUsers.clinicId, session.user.clinicId),
                eq(clinicUsers.isActive, true),
            ),
        });
        clinicRole = link?.role;
    }

    /** Médico (vínculo em `doctors`) ou admin da clínica (`clinic_users.role`). */
    const canManagePatientFiles = !!docId || clinicRole === "admin";
    const isDoctor = !!docId;
    const canDeleteClinicalRecordsAsAdmin =
        clinicRole === "admin" || session.user.role === "super_admin";

    const serviceTypePayload = (st: { name: string | null; workflow: string | null; slug: string | null } | null) =>
        st ? { name: st.name, workflow: st.workflow, slug: st.slug } : null;

    let queuedConsultation: {
        id: string;
        status: string;
        serviceTypeId: string | null;
        healthInsuranceId: string | null;
        serviceType: { name: string | null; workflow: string | null; slug?: string | null } | null;
    } | null = null;

    let queuedSurgery: {
        id: string;
        status: string;
        serviceTypeId: string | null;
        healthInsuranceId: string | null;
        serviceType: { name: string | null; workflow: string | null; slug?: string | null } | null;
    } | null = null;

    if (openConsultation && docId && isDoctor) {
        const detail = await getConsultationDetails(openConsultation, session.user.clinicId);
        if (
            detail &&
            detail.patientId === patientId &&
            detail.status === "waiting"
        ) {
            /** Links antigos ou tipo "Cirurgia" ainda como consulta: resolve o registro em `surgeries`. */
            if (isSurgeryServiceType(detail.serviceType) && detail.checkInId) {
                const surgeryRow = await getSurgeryByCheckInId(detail.checkInId, session.user.clinicId);
                if (surgeryRow) {
                    queuedSurgery = {
                        id: surgeryRow.id,
                        status: surgeryRow.status,
                        serviceTypeId: surgeryRow.serviceTypeId,
                        healthInsuranceId: surgeryRow.healthInsuranceId,
                        serviceType: serviceTypePayload(detail.serviceType),
                    };
                }
            } else if (!isSurgeryServiceType(detail.serviceType)) {
                queuedConsultation = {
                    id: detail.id,
                    status: detail.status,
                    serviceTypeId: detail.serviceTypeId,
                    healthInsuranceId: detail.healthInsuranceId,
                    serviceType: serviceTypePayload(detail.serviceType),
                };
            }
        }
    }

    if (openSurgery && docId && isDoctor) {
        const detail = await getSurgeryDetails(openSurgery, session.user.clinicId);
        if (detail && detail.patientId === patientId && detail.status === "waiting") {
            queuedSurgery = {
                id: detail.id,
                status: detail.status,
                serviceTypeId: detail.serviceTypeId,
                healthInsuranceId: detail.healthInsuranceId,
                serviceType: serviceTypePayload(detail.serviceType),
            };
        }
    }

    return (
        <MedicalRecordsClient
            clinicId={session.user.clinicId}
            patient={patient}
            consultations={consultations}
            surgeries={surgeries}
            fileTimeline={fileTimeline}
            latestVitals={latestVitals}
            serviceTypes={
                serviceTypes as {
                    id: string;
                    name: string;
                    workflow: "consultation" | "generic" | "exam_review" | "procedure" | "surgery";
                    slug?: string | null;
                }[]
            }
            healthInsurances={healthInsurances}
            doctors={doctors.map((d) => ({ id: d.id, name: d.name }))}
            hospitals={hospitals.map((h) => ({ id: h.id, name: h.name }))}
            procedures={procedures.map((p) => ({ id: p.id, name: p.name }))}
            isDoctor={isDoctor}
            canManagePatientFiles={canManagePatientFiles}
            canDeleteClinicalRecordsAsAdmin={canDeleteClinicalRecordsAsAdmin}
            currentDoctorId={docId}
            queuedConsultation={queuedConsultation}
            queuedSurgery={queuedSurgery}
        />
    );
}
