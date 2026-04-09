"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface ProposalPrintButtonsProps {
    proposalId: string;
}

export function ProposalPrintButtons({ proposalId }: ProposalPrintButtonsProps) {
    function openPrint(mode: "print" | "pdf") {
        const params = new URLSearchParams({ mode });
        window.open(`/proposals/${proposalId}/print?${params.toString()}`, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => openPrint("print")}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
            </Button>
            <Button type="button" variant="outline" onClick={() => openPrint("pdf")}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
            </Button>
        </div>
    );
}
