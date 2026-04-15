import { getPatientById } from "@/db/queries/patients";
import {
    getPatientConsultationsTimeline,
    getPatientLatestVitals,
    getConsultationDetails,
} from "@/db/queries/consultations";
import { getPatientFilesTimelineSorted } from "@/db/queries/medical-records-timeline";
import { getActiveServiceTypes } from "@/db/queries/service-types";
import { getClinicHealthInsurances } from "@/db/queries/health-insurances";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import { MedicalRecordsClient } from "@/components/medical-records/MedicalRecordsClient";
import { db } from "@/db";
import { clinicUsers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

interface MedicalRecordsPageProps {
    params: Promise<{
        patientId: string;
    }>;
    searchParams: Promise<{ openConsultation?: string }>;
}

export default async function MedicalRecordsPage({ params, searchParams }: MedicalRecordsPageProps) {
    const { patientId } = await params;
    const { openConsultation } = await searchParams;
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

    const [consultations, fileTimeline, serviceTypes, healthInsurances] = await Promise.all([
        getPatientConsultationsTimeline(patientId, session.user.clinicId),
        getPatientFilesTimelineSorted(patientId, session.user.clinicId),
        getActiveServiceTypes(session.user.clinicId),
        getClinicHealthInsurances(session.user.clinicId),
    ]);
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

    let queuedConsultation: {
        id: string;
        status: string;
        serviceTypeId: string | null;
        healthInsuranceId: string | null;
        serviceType: { name: string | null; workflow: string | null } | null;
    } | null = null;

    if (openConsultation && docId && isDoctor) {
        const detail = await getConsultationDetails(openConsultation, session.user.clinicId);
        if (
            detail &&
            detail.patientId === patientId &&
            detail.status === "waiting"
        ) {
            queuedConsultation = {
                id: detail.id,
                status: detail.status,
                serviceTypeId: detail.serviceTypeId,
                healthInsuranceId: detail.healthInsuranceId,
                serviceType: detail.serviceType
                    ? { name: detail.serviceType.name, workflow: detail.serviceType.workflow }
                    : null,
            };
        }
    }

    return (
        <MedicalRecordsClient
            clinicId={session.user.clinicId}
            patient={patient}
            consultations={consultations}
            fileTimeline={fileTimeline}
            latestVitals={latestVitals}
            serviceTypes={serviceTypes as { id: string; name: string; workflow: "consultation" | "generic" | "exam_review" | "procedure"; slug?: string | null }[]}
            healthInsurances={healthInsurances}
            isDoctor={isDoctor}
            canManagePatientFiles={canManagePatientFiles}
            currentDoctorId={docId}
            queuedConsultation={queuedConsultation}
        />
    );
}
