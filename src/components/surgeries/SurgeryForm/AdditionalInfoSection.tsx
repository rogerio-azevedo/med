"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Monitor } from "lucide-react";

interface AdditionalInfoSectionProps {
    usesMonitor: boolean;
    cancerDiagnosis: boolean;
    observations: string;
    onUsesMonitorChange: (v: boolean) => void;
    onCancerDiagnosisChange: (v: boolean) => void;
    onObservationsChange: (v: string) => void;
}

export function AdditionalInfoSection({
    usesMonitor,
    cancerDiagnosis,
    observations,
    onUsesMonitorChange,
    onCancerDiagnosisChange,
    onObservationsChange,
}: AdditionalInfoSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Monitor className="size-4 text-primary" />
                    Informações adicionais
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                    <label
                        htmlFor="uses-monitor"
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                    >
                        <Checkbox
                            id="uses-monitor"
                            checked={usesMonitor}
                            onCheckedChange={(c) => onUsesMonitorChange(c === true)}
                        />
                        <span className="text-sm">Uso de monitor durante a cirurgia</span>
                    </label>
                    <label
                        htmlFor="cancer-dx"
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                    >
                        <Checkbox
                            id="cancer-dx"
                            checked={cancerDiagnosis}
                            onCheckedChange={(c) => onCancerDiagnosisChange(c === true)}
                        />
                        <span className="text-sm">Diagnóstico de câncer</span>
                    </label>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="surgery-obs">Observações</Label>
                    <Textarea
                        id="surgery-obs"
                        rows={4}
                        placeholder="Observações adicionais sobre a cirurgia..."
                        value={observations}
                        onChange={(e) => onObservationsChange(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
