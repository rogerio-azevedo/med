"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import ReactSelect from "react-select";
import type { SurgeryStatusValue } from "@/validations/surgeries";
import { FormSelect, BASE_SELECT_STYLES, type SelectOption } from "./FormSelect";

type ProcedureOpt = { id: string; name: string };

const STATUS_OPTIONS: SelectOption[] = [
    { value: "scheduled", label: "Agendado" },
    { value: "waiting", label: "Na fila" },
    { value: "in_progress", label: "Em andamento" },
    { value: "finished", label: "Concluída" },
    { value: "cancelled", label: "Cancelada" },
];

interface BasicDataSectionProps {
    surgeryDate: string;
    onSurgeryDateChange: (v: string) => void;
    status: SurgeryStatusValue;
    onStatusChange: (v: SurgeryStatusValue) => void;
    procedures: ProcedureOpt[];
    procedureIds: string[];
    onProcedureIdsChange: (ids: string[]) => void;
}

export function BasicDataSection({
    surgeryDate,
    onSurgeryDateChange,
    status,
    onStatusChange,
    procedures,
    procedureIds,
    onProcedureIdsChange,
}: BasicDataSectionProps) {
    const procOptions = procedures.map((p) => ({ value: p.id, label: p.name }));
    const selected = procOptions.filter((o) => procedureIds.includes(o.value));

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <CalendarDays className="size-4 text-primary" />
                    Dados básicos
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="surgery-date">Data da cirurgia *</Label>
                    <Input
                        id="surgery-date"
                        type="date"
                        value={surgeryDate}
                        onChange={(e) => onSurgeryDateChange(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="surgery-status">Status *</Label>
                    <FormSelect
                        inputId="surgery-status"
                        options={STATUS_OPTIONS}
                        value={status}
                        onChange={(v) => v && onStatusChange(v as SurgeryStatusValue)}
                        placeholder="Selecione o status"
                    />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                    <Label>Procedimentos *</Label>
                    <ReactSelect
                        isMulti
                        options={procOptions}
                        value={selected}
                        onChange={(opts) =>
                            onProcedureIdsChange(
                                (opts as { value: string; label: string }[] | null)?.map((o) => o.value) ?? []
                            )
                        }
                        placeholder="Selecione um ou mais procedimentos"
                        noOptionsMessage={() => "Nenhum procedimento encontrado"}
                        styles={BASE_SELECT_STYLES}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
