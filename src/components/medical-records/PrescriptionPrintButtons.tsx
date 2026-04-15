"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

type PrescriptionPrintButtonsProps = {
    patientId: string;
    consultationId: string;
    className?: string;
};

export function PrescriptionPrintButtons({ patientId, consultationId, className }: PrescriptionPrintButtonsProps) {
    function openPrint(mode: "print" | "pdf") {
        const params = new URLSearchParams({ patientId, mode });
        window.open(`/prescription-print/${consultationId}?${params.toString()}`, "_blank", "noopener,noreferrer");
    }

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openPrint("print")}>
                <Printer className="h-4 w-4 shrink-0" />
                Imprimir
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openPrint("pdf")}>
                <Download className="h-4 w-4 shrink-0" />
                PDF
            </Button>
        </div>
    );
}
