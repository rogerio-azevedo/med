"use client";

import { ClipboardList } from "lucide-react";
import { PlanPlaceholderDialog } from "./PlanPlaceholderDialog";

type ReportsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ReportsModal({ open, onOpenChange }: ReportsModalProps) {
    return (
        <PlanPlaceholderDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Laudos"
            Icon={ClipboardList}
        />
    );
}
