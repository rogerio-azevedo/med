"use client";

import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineFilters } from "./TimelineFilters";

interface MedicalRecordsTimelineToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onNewConsultation: () => void;
    isDoctor?: boolean;
}

export function MedicalRecordsTimelineToolbar({
    searchTerm,
    onSearchChange,
    onNewConsultation,
    isDoctor,
}: MedicalRecordsTimelineToolbarProps) {
    return (
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div className="relative min-w-48 max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground md:size-4.5" />
                    <Input
                        placeholder="Busca"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-10 min-h-10 py-2 pl-10 text-sm md:h-11 md:min-h-11"
                    />
                </div>
                <TimelineFilters onFilterChange={() => {}} />
            </div>
            <Button
                type="button"
                size="lg"
                onClick={onNewConsultation}
                className="shrink-0 gap-2 text-sm"
                disabled={!isDoctor}
                title={!isDoctor ? "Apenas médicos podem iniciar atendimentos" : undefined}
            >
                <Plus className="size-4 md:size-4.5" />
                Novo Atendimento
            </Button>
        </div>
    );
}
