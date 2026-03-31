import { getPatientById } from "@/db/queries/patients";
import { getPatientConsultationsTimeline, getPatientLatestVitals } from "@/db/queries/consultations";
import { getPatientFilesTimelineSorted } from "@/db/queries/prontuario-timeline";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { ProntuarioClient } from "@/components/medical-records/ProntuarioClient";
import { db } from "@/db";
import { clinicUsers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

interface ProntuarioPageProps {
    params: Promise<{
        patientId: string;
    }>;
}

export default async function ProntuarioPage({ params }: ProntuarioPageProps) {
    const { patientId } = await params;
    const session = await auth();

    if (!session?.user?.clinicId) {
        return <div>Não autorizado</div>;
    }

    const patient = await getPatientById(patientId, session.user.clinicId);
    if (!patient) {
        notFound();
    }

    const [consultations, fileTimeline] = await Promise.all([
        getPatientConsultationsTimeline(patientId, session.user.clinicId),
        getPatientFilesTimelineSorted(patientId, session.user.clinicId),
    ]);
    const latestVitals = await getPatientLatestVitals(patientId, session.user.clinicId);
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

    return (
        <ProntuarioClient
            patient={patient}
            consultations={consultations}
            fileTimeline={fileTimeline}
            latestVitals={latestVitals}
            isDoctor={isDoctor}
            canManagePatientFiles={canManagePatientFiles}
            currentDoctorId={docId}
        />
    );
}
