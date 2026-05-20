"use client";

import { Search, Plus, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineFilters, type TimelineTypeFilter } from "./TimelineFilters";

interface MedicalRecordsTimelineToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onNewConsultation: () => void;
    /** Abre fluxo de registro de exame (sem vínculo com consulta). */
    onNewExam?: () => void;
    isDoctor?: boolean;
    typeFilter: TimelineTypeFilter;
    onTypeFilterChange: (next: TimelineTypeFilter) => void;
}

export function MedicalRecordsTimelineToolbar({
    searchTerm,
    onSearchChange,
    onNewConsultation,
    onNewExam,
    isDoctor,
    typeFilter,
    onTypeFilterChange,
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
                <TimelineFilters filter={typeFilter} onFilterChange={onTypeFilterChange} />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                {onNewExam ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={onNewExam}
                        className="gap-2 text-sm"
                        disabled={!isDoctor}
                        title={!isDoctor ? "Apenas médicos podem registrar exames" : undefined}
                    >
                        <Microscope className="size-4 md:size-4.5" />
                        Novo exame
                    </Button>
                ) : null}
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
        </div>
    );
}
