"use client";

import { useMemo, useState } from "react";
import { FileStack, Microscope, Pill } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PlanActionButton } from "./PlanActionButton";
import { ExamsModal } from "./modals/ExamsModal";
import type { ExamFormProcedureOption } from "@/components/medical-records/ExamForm";
import { PrescriptionModal } from "./modals/PrescriptionModal";
import {
    GenerateDocumentModal,
    type DocumentTemplateListItem,
} from "@/components/document-templates/GenerateDocumentModal";
import { getTemplatesAction } from "@/app/actions/document-templates";
import { cn } from "@/lib/utils";

type OpenPlanModal = "prescription" | "exams" | "documents" | null;

export type PlanActionsToolbarProps = {
    consultationId?: string | null;
    patientId?: string | null;
    clinicId?: string | null;
    healthInsuranceId?: string | null;
    serviceTypes?: { id: string; name: string; workflow: string | null; slug?: string | null }[];
    healthInsurances?: { id: string; name: string }[];
    doctors?: { id: string; name: string | null }[];
    procedures?: ExamFormProcedureOption[];
    currentDoctorId?: string;
    patientName?: string | null;
    className?: string;
};

const MODAL_ORDER: Exclude<OpenPlanModal, null>[] = [
    "prescription",
    "exams",
    "documents",
];

export function PlanActionsToolbar({
    consultationId,
    patientId,
    clinicId,
    healthInsuranceId,
    serviceTypes = [],
    healthInsurances = [],
    doctors = [],
    procedures = [],
    currentDoctorId,
    patientName,
    className,
}: PlanActionsToolbarProps) {
    const [openModal, setOpenModal] = useState<OpenPlanModal>(null);
    const [templates, setTemplates] = useState<DocumentTemplateListItem[]>([]);

    const activeIndex = useMemo(() => {
        if (!openModal) return -1;
        return MODAL_ORDER.indexOf(openModal);
    }, [openModal]);

    const handleOpenDocuments = async () => {
        setOpenModal("documents");
        if (templates.length === 0) {
            try {
                const data = await getTemplatesAction();
                setTemplates(data);
            } catch (error) {
                console.error("Erro ao carregar modelos", error);
            }
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-xs font-semibold text-muted-foreground">
                Ações do atendimento
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
                <PlanActionButton
                    label="Prescrever"
                    icon={Pill}
                    active={openModal === "prescription"}
                    onClick={() => setOpenModal("prescription")}
                />
                <PlanActionButton
                    label="Exames"
                    icon={Microscope}
                    active={openModal === "exams"}
                    onClick={() => setOpenModal("exams")}
                />
                <PlanActionButton
                    label="Documentos"
                    icon={FileStack}
                    active={openModal === "documents"}
                    onClick={handleOpenDocuments}
                />
            </div>
            <div
                className="relative h-0.5 w-full overflow-hidden rounded-full bg-muted"
                aria-hidden
            >
                <div
                    className={cn(
                        "absolute top-0 h-full rounded-full bg-primary transition-[left,width] duration-200 ease-out",
                        activeIndex < 0 && "opacity-0",
                    )}
                    style={{
                        width: activeIndex >= 0 ? `${100 / MODAL_ORDER.length}%` : "0%",
                        left:
                            activeIndex >= 0
                                ? `${(100 / MODAL_ORDER.length) * activeIndex}%`
                                : "0%",
                    }}
                />
            </div>

            <PrescriptionModal
                open={openModal === "prescription"}
                onOpenChange={(open) => setOpenModal(open ? "prescription" : null)}
                consultationId={consultationId}
                patientId={patientId}
                clinicId={clinicId}
            />
            <ExamsModal
                open={openModal === "exams"}
                onOpenChange={(open) => setOpenModal(open ? "exams" : null)}
                clinicId={clinicId ?? ""}
                patientId={patientId ?? ""}
                patientName={patientName ?? undefined}
                consultationId={consultationId ?? null}
                healthInsuranceId={healthInsuranceId ?? null}
                serviceTypes={serviceTypes}
                healthInsurances={healthInsurances}
                doctors={doctors}
                procedures={procedures}
                currentDoctorId={currentDoctorId}
            />
            <GenerateDocumentModal
                isOpen={openModal === "documents"}
                setIsOpen={(open) => setOpenModal(open ? "documents" : null)}
                patientId={patientId || ""}
                consultationId={consultationId || undefined}
                templates={templates}
            />
        </div>
    );
}
