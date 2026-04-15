"use client";

import { useMemo, useState } from "react";
import { ClipboardList, FileText, Microscope, Pill } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlanActionButton } from "./PlanActionButton";
import { CertificateModal } from "./modals/CertificateModal";
import { ExamsModal } from "./modals/ExamsModal";
import { ReportsModal } from "./modals/ReportsModal";
import { PrescriptionModal } from "./modals/PrescriptionModal";
import { cn } from "@/lib/utils";

type OpenPlanModal = "prescription" | "certificate" | "exams" | "reports" | null;

type PlanTabProps = {
    planValue: string;
    onPlanChange: (value: string) => void;
    consultationId?: string | null;
    patientId?: string | null;
    clinicId?: string | null;
};

const MODAL_ORDER: Exclude<OpenPlanModal, null>[] = [
    "prescription",
    "certificate",
    "exams",
    "reports",
];

export function PlanTab({
    planValue,
    onPlanChange,
    consultationId,
    patientId,
    clinicId,
}: PlanTabProps) {
    const [openModal, setOpenModal] = useState<OpenPlanModal>(null);

    const activeIndex = useMemo(() => {
        if (!openModal) return -1;
        return MODAL_ORDER.indexOf(openModal);
    }, [openModal]);

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">
                    Ações do plano
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                </div>
                <div
                    className="relative h-1 w-full overflow-hidden rounded-full bg-muted"
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

            <div className="space-y-2">
                <Label className="text-lg font-semibold">
                    Conduta / Orientações ao Paciente
                </Label>
                <Textarea
                    placeholder="Descreva as orientações, próximas etapas e plano de cuidado..."
                    className="min-h-[200px]"
                    value={planValue}
                    onChange={(e) => onPlanChange(e.target.value)}
                />
            </div>
        </div>
    );
}
