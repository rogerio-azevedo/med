import { getPatientById } from "@/db/queries/patients";
import { getPatientConsultationsTimeline } from "@/db/queries/consultations";
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

    const consultations = await getPatientConsultationsTimeline(patientId, session.user.clinicId);
    const isDoctor = !!(session.user as any).doctorId;

    return (
        <ProntuarioClient 
            patient={patient} 
            consultations={consultations} 
            isDoctor={isDoctor}
        />
    );
}
