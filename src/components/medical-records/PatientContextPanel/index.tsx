import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, User, Activity, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MedicalRecordsFileTimelineEntry } from "@/db/queries/medical-records-timeline";
import { PatientFilesSidebarTimeline } from "../PatientFilesSidebarTimeline";

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
        <div className="flex h-full min-h-0 flex-col gap-4 bg-muted/30 p-4 md:p-5">
            {/* Cabeçalho compacto: avatar + dados */}
            <div className="flex shrink-0 items-start gap-3">
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

            <Separator className="shrink-0" />

            <ScrollArea className="min-h-0 flex-1 pr-1 md:pr-2">
                <div className="flex flex-col gap-5 pb-4">
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

                    <Separator />

                    <PatientFilesSidebarTimeline
                        files={fileTimeline}
                        canManagePatientFiles={canManagePatientFiles}
                        onAttachFile={onAttachFile}
                        onFilesChanged={onFilesChanged}
                    />
                </div>
            </ScrollArea>
        </div>
    );
}
