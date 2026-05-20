"use client";

import { ExamForm, type ExamFormProcedureOption } from "@/components/medical-records/ExamForm";
import { useRouter } from "next/navigation";

type ExamsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clinicId: string;
    patientId: string;
    patientName?: string;
    consultationId?: string | null;
    healthInsuranceId?: string | null;
    serviceTypes: { id: string; name: string; workflow: string | null; slug?: string | null }[];
    healthInsurances: { id: string; name: string }[];
    doctors: { id: string; name: string | null }[];
    procedures: ExamFormProcedureOption[];
    currentDoctorId?: string;
};

export function ExamsModal({
    open,
    onOpenChange,
    clinicId,
    patientId,
    patientName,
    consultationId = null,
    healthInsuranceId = null,
    serviceTypes,
    healthInsurances,
    doctors,
    procedures,
    currentDoctorId,
}: ExamsModalProps) {
    const router = useRouter();

    return (
        <ExamForm
            open={open}
            onOpenChange={onOpenChange}
            clinicId={clinicId}
            patientId={patientId}
            patientName={patientName}
            consultationId={consultationId}
            healthInsuranceId={healthInsuranceId}
            serviceTypes={serviceTypes}
            healthInsurances={healthInsurances}
            doctors={doctors}
            procedures={procedures}
            currentDoctorId={currentDoctorId}
            onSaved={() => router.refresh()}
        />
    );
}
