"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { FormSelect } from "./FormSelect";

type Opt = { id: string; name: string };

interface LocationAndInsuranceSectionProps {
    hospitals: Opt[];
    healthInsurances: Opt[];
    hospitalId: string;
    onHospitalIdChange: (v: string) => void;
    healthInsuranceId: string;
    onHealthInsuranceIdChange: (v: string) => void;
}

export function LocationAndInsuranceSection({
    hospitals,
    healthInsurances,
    hospitalId,
    onHospitalIdChange,
    healthInsuranceId,
    onHealthInsuranceIdChange,
}: LocationAndInsuranceSectionProps) {
    const hospitalOptions = hospitals.map((h) => ({ value: h.id, label: h.name }));
    const insuranceOptions = [
        { value: "__particular__", label: "Particular / Sem convênio" },
        ...healthInsurances.map((h) => ({ value: h.id, label: h.name })),
    ];

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Building2 className="size-4 text-primary" />
                    Local e convênio
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="hospital-select">Hospital</Label>
                    <FormSelect
                        inputId="hospital-select"
                        options={hospitalOptions}
                        value={hospitalId || null}
                        onChange={(v) => onHospitalIdChange(v ?? "")}
                        placeholder="Selecione o hospital"
                        isClearable
                        noOptionsMessage="Nenhum hospital encontrado"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="insurance-select">Convênio</Label>
                    <FormSelect
                        inputId="insurance-select"
                        options={insuranceOptions}
                        value={healthInsuranceId || "__particular__"}
                        onChange={(v) =>
                            onHealthInsuranceIdChange(v === "__particular__" || !v ? "" : v)
                        }
                        placeholder="Selecione o convênio"
                        noOptionsMessage="Nenhum convênio encontrado"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
