"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { FormSelect, type SelectOption } from "./FormSelect";

type DoctorOpt = { id: string; name: string | null };

interface MedicalTeamSectionProps {
    doctors: DoctorOpt[];
    surgeonId: string;
    firstAuxId: string;
    secondAuxId: string;
    thirdAuxId: string;
    anesthetistId: string;
    instrumentistId: string;
    onChange: (field: TeamField, value: string) => void;
}

export type TeamField =
    | "surgeonId"
    | "firstAuxId"
    | "secondAuxId"
    | "thirdAuxId"
    | "anesthetistId"
    | "instrumentistId";

const LABELS: Record<TeamField, string> = {
    surgeonId: "Cirurgião *",
    firstAuxId: "1º auxiliar",
    secondAuxId: "2º auxiliar",
    thirdAuxId: "3º auxiliar",
    anesthetistId: "Anestesista",
    instrumentistId: "Instrumentador",
};

export function MedicalTeamSection({
    doctors,
    surgeonId,
    firstAuxId,
    secondAuxId,
    thirdAuxId,
    anesthetistId,
    instrumentistId,
    onChange,
}: MedicalTeamSectionProps) {
    const doctorOptions: SelectOption[] = doctors.map((d) => ({
        value: d.id,
        label: d.name ?? "—",
    }));

    const fields: { key: TeamField; value: string; required: boolean }[] = [
        { key: "surgeonId", value: surgeonId, required: true },
        { key: "firstAuxId", value: firstAuxId, required: false },
        { key: "secondAuxId", value: secondAuxId, required: false },
        { key: "thirdAuxId", value: thirdAuxId, required: false },
        { key: "anesthetistId", value: anesthetistId, required: false },
        { key: "instrumentistId", value: instrumentistId, required: false },
    ];

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Users className="size-4 text-primary" />
                    Equipe médica
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map(({ key, value, required }) => (
                    <div key={key} className="space-y-1.5">
                        <Label htmlFor={`team-${key}`}>{LABELS[key]}</Label>
                        <FormSelect
                            inputId={`team-${key}`}
                            options={doctorOptions}
                            value={value || null}
                            onChange={(v) => onChange(key, v ?? "")}
                            placeholder="Selecione"
                            isClearable={!required}
                            noOptionsMessage="Nenhum médico encontrado"
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
