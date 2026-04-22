"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertCircle, User, Activity, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MedicalRecordsFileTimelineEntry } from "@/db/queries/medical-records";
import { PatientFilesSidebarTimeline } from "../PatientFilesSidebarTimeline";
import { PatientDetailsModal } from "../PatientDetailsModal";

interface PatientContextPanelProps {
    patient: any;
    latestVitals?: any;
    alerts?: any[];
    fileTimeline?: MedicalRecordsFileTimelineEntry[];
    canManagePatientFiles?: boolean;
    onAttachFile?: () => void;
    onFilesChanged?: () => void;
}

export function PatientContextPanel({
    patient,
    latestVitals,
    alerts = [],
    fileTimeline = [],
    canManagePatientFiles = false,
    onAttachFile,
    onFilesChanged,
}: PatientContextPanelProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const age = patient.birthDate
        ? Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / 31536000000)
        : null;
    const primaryHealthInsurance =
        patient.patientHealthInsurances?.find((item: any) => item.isPrimary) ||
        patient.patientHealthInsurances?.[0] ||
        null;
    const healthInsuranceLabel = primaryHealthInsurance
        ? [primaryHealthInsurance.name, primaryHealthInsurance.planName].filter(Boolean).join(" • ")
        : patient.healthInsurance?.company || "Particular";

    return (
        <div className="flex h-full min-h-0 flex-col bg-muted/30">
            {/* Bloco fixo: igual ao banner + contexto da coluna de atendimentos */}
            <div className="shrink-0 space-y-4 p-4 md:p-5">
                <div className="flex items-start gap-3">
                    <Avatar className="size-16 shrink-0 border-2 border-primary/20 md:size-18">
                        <AvatarImage src={patient.image} />
                        <AvatarFallback>
                            <User className="size-8" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-bold leading-tight text-foreground">{patient.name}</h2>
                        <p className="text-xs text-muted-foreground md:text-sm">
                            {patient.sex === "M" ? "Masculino" : patient.sex === "F" ? "Feminino" : "Não informado"}
                            {age !== null && ` • ${age} a.`}
                        </p>
                        <Badge variant="outline" className="mt-1.5 max-w-full truncate bg-background text-xs">
                                {patient.cpf || "CPF não informado"}
                        </Badge>
                    </div>
                </div>

                <Button
                    id="patient-details-btn"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60"
                    onClick={() => setIsDetailsOpen(true)}
                >
                    <Info className="size-3.5" />
                    Ver detalhes do paciente
                </Button>

                <PatientDetailsModal
                    patient={patient}
                    isOpen={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                />

                <Separator />

                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertCircle className="size-4 shrink-0" />
                        Alertas
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alerts.length > 0 ? (
                            alerts.map((alert) => (
                                <Badge
                                    key={alert.id}
                                    variant="secondary"
                                    className="border-destructive/20 bg-destructive/10 text-xs text-destructive"
                                >
                                    {alert.description}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-xs italic text-muted-foreground md:text-sm">Nenhum alerta</p>
                        )}
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Activity className="size-4 shrink-0 text-primary" />
                        Métricas
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {(
                            [
                                ["PA", latestVitals?.bloodPressure || "—"],
                                ["Peso", latestVitals?.weight ? `${latestVitals.weight} kg` : "—"],
                                ["FC", latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : "—"],
                                ["Temp", latestVitals?.temperature ? `${latestVitals.temperature} °C` : "—"],
                            ] as const
                        ).map(([label, value]) => (
                            <div
                                key={label}
                                className="flex min-h-0 items-center justify-between gap-2 rounded-md border border-border/80 bg-background px-2.5 py-2"
                            >
                                <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
                                <span className="truncate text-right text-sm font-semibold tabular-nums leading-none">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Info className="size-4 shrink-0 text-primary" />
                        Resumo
                    </div>
                    <Card className="gap-0 border bg-background py-0 shadow-none">
                        <CardContent className="space-y-2.5 px-3 py-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground md:text-sm">Convênio</p>
                                <p className="font-medium leading-snug">{healthInsuranceLabel}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground md:text-sm">Última consulta</p>
                                <p className="font-medium">
                                    {patient.lastConsultationDate
                                        ? format(new Date(patient.lastConsultationDate), "dd MMM yyyy", {
                                              locale: ptBR,
                                          })
                                        : "—"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Separator className="shrink-0" />

            {/* Mesmo padrão da coluna direita: só a linha do tempo rola, ocupando o restante da altura */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-0 md:px-5 md:pb-5">
                <PatientFilesSidebarTimeline
                    files={fileTimeline}
                    canManagePatientFiles={canManagePatientFiles}
                    onAttachFile={onAttachFile}
                    onFilesChanged={onFilesChanged}
                />
            </div>
        </div>
    );
}
