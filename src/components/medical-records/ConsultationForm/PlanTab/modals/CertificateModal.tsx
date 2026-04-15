"use client";

import { FileText } from "lucide-react";
import { PlanPlaceholderDialog } from "./PlanPlaceholderDialog";

type CertificateModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function CertificateModal({ open, onOpenChange }: CertificateModalProps) {
    return (
        <PlanPlaceholderDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Atestado"
            Icon={FileText}
        />
    );
}
