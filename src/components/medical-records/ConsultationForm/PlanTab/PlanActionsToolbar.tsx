"use client";

import { useMemo, useState } from "react";
import { ClipboardList, FileText, Microscope, Pill } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PlanActionButton } from "./PlanActionButton";
import { CertificateModal } from "./modals/CertificateModal";
import { ExamsModal } from "./modals/ExamsModal";
import { ReportsModal } from "./modals/ReportsModal";
import { PrescriptionModal } from "./modals/PrescriptionModal";
import { GenerateDocumentModal } from "@/components/document-templates/GenerateDocumentModal";
import { getTemplatesAction } from "@/app/actions/document-templates";
import { cn } from "@/lib/utils";

type OpenPlanModal = "prescription" | "certificate" | "exams" | "reports" | "templates" | null;

export type PlanActionsToolbarProps = {
    consultationId?: string | null;
    patientId?: string | null;
    clinicId?: string | null;
    className?: string;
};

const MODAL_ORDER: Exclude<OpenPlanModal, null>[] = [
    "prescription",
    "certificate",
    "exams",
    "reports",
    "templates",
];

export function PlanActionsToolbar({
    consultationId,
    patientId,
    clinicId,
    className,
}: PlanActionsToolbarProps) {
    const [openModal, setOpenModal] = useState<OpenPlanModal>(null);
    const [templates, setTemplates] = useState<any[]>([]);

    const activeIndex = useMemo(() => {
        if (!openModal) return -1;
        return MODAL_ORDER.indexOf(openModal);
    }, [openModal]);

    const handleOpenTemplates = async () => {
        setOpenModal("templates");
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2.5">
                <PlanActionButton
                    label="Prescrever"
                    icon={Pill}
                    active={openModal === "prescription"}
                    onClick={() => setOpenModal("prescription")}
                />
                <PlanActionButton
                    label="Atestado"
                    icon={FileText}
                    active={openModal === "certificate"}
                    onClick={() => setOpenModal("certificate")}
                />
                <PlanActionButton
                    label="Exames"
                    icon={Microscope}
                    active={openModal === "exams"}
                    onClick={() => setOpenModal("exams")}
                />
                <PlanActionButton
                    label="Laudos"
                    icon={ClipboardList}
                    active={openModal === "reports"}
                    onClick={() => setOpenModal("reports")}
                />
                <PlanActionButton
                    label="Modelos"
                    icon={FileText}
                    active={openModal === "templates"}
                    onClick={handleOpenTemplates}
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
            <CertificateModal
                open={openModal === "certificate"}
                onOpenChange={(open) => setOpenModal(open ? "certificate" : null)}
            />
            <ExamsModal
                open={openModal === "exams"}
                onOpenChange={(open) => setOpenModal(open ? "exams" : null)}
            />
            <ReportsModal
                open={openModal === "reports"}
                onOpenChange={(open) => setOpenModal(open ? "reports" : null)}
            />
            <GenerateDocumentModal
                isOpen={openModal === "templates"}
                setIsOpen={(open) => setOpenModal(open ? "templates" : null)}
                patientId={patientId || ""}
                consultationId={consultationId || undefined}
                templates={templates}
            />
        </div>
    );
}
