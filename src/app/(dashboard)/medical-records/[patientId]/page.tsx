import { getPatientById } from "@/db/queries/patients";
import { getPatientConsultationsTimeline, getPatientLatestVitals } from "@/db/queries/consultations";
import { getPatientFilesTimelineSorted } from "@/db/queries/prontuario-timeline";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { ProntuarioClient } from "@/components/medical-records/ProntuarioClient";

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
    const docId = (session.user as any).doctorId;
    const isDoctor = !!docId;

    return (
        <ProntuarioClient
            patient={patient}
            consultations={consultations}
            fileTimeline={fileTimeline}
            latestVitals={latestVitals}
            isDoctor={isDoctor}
            currentDoctorId={docId}
        />
    );
}
