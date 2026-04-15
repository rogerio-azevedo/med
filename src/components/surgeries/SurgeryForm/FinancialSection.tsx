"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";

interface FinancialSectionProps {
    repasseHospital: boolean;
    repasseAnesthesia: boolean;
    repassePathology: boolean;
    repasseDoctor: boolean;
    repasseInstrumentist: boolean;
    repasseMedicalAux: boolean;
    onChange: (field: RepasseField, checked: boolean) => void;
}

export type RepasseField =
    | "repasseHospital"
    | "repasseAnesthesia"
    | "repassePathology"
    | "repasseDoctor"
    | "repasseInstrumentist"
    | "repasseMedicalAux";

const ITEMS: { key: RepasseField; label: string }[] = [
    { key: "repasseHospital", label: "Hospital" },
    { key: "repasseAnesthesia", label: "Anestesia" },
    { key: "repassePathology", label: "Patologia" },
    { key: "repasseDoctor", label: "Médico" },
    { key: "repasseInstrumentist", label: "Instrumentador" },
    { key: "repasseMedicalAux", label: "Médico auxiliar" },
];

export function FinancialSection(props: FinancialSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Wallet className="size-4 text-primary" />
                    Repasses financeiros
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {ITEMS.map(({ key, label }) => (
                        <label
                            key={key}
                            htmlFor={key}
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                        >
                            <Checkbox
                                id={key}
                                checked={props[key]}
                                onCheckedChange={(c) => props.onChange(key, c === true)}
                            />
                            <span className="text-sm">{label}</span>
                        </label>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
