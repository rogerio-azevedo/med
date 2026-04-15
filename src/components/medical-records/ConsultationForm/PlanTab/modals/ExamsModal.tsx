"use client";

import { Microscope } from "lucide-react";
import { PlanPlaceholderDialog } from "./PlanPlaceholderDialog";

type ExamsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ExamsModal({ open, onOpenChange }: ExamsModalProps) {
    return (
        <PlanPlaceholderDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Exames"
            Icon={Microscope}
        />
    );
}
