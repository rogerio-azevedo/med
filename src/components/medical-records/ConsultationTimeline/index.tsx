import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, ClipboardList, Stethoscope } from "lucide-react";

interface ConsultationTimelineProps {
    consultations: {
        id: string;
        startTime: string | Date;
        doctorName?: string | null;
        diagnosis?: string | null;
        cidCode?: string | null;
        serviceTypeName?: string | null;
        status?: string | null;
    }[];
    onSelect?: (consultationId: string) => void;
}

export function ConsultationTimeline({ consultations = [], onSelect }: ConsultationTimelineProps) {
    if (consultations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
                <ClipboardList className="h-16 w-16 opacity-20" />
                <p className="text-center text-sm">Nenhum atendimento registrado no histórico deste paciente.</p>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-5 pl-9 before:absolute before:bottom-0 before:left-[13px] before:top-2 before:w-0.5 before:bg-border md:pl-10 md:before:left-[15px]">
            {consultations.map((consultation) => {
                const lifecycle = consultationLifecycleBadge(consultation.status);
                return (
                    <div key={consultation.id} className="group relative">
                        {/* Indicador na timeline — alinhado ao trilho; padding à esquerda evita corte */}
                        <div className="absolute -left-8.5 top-1 z-10 rounded-full border-2 border-primary bg-background p-1 md:-left-9.5">
                            <Stethoscope className="size-4 text-primary md:size-4.5" />
                        </div>

                        <Card
                            className="cursor-pointer gap-0 py-0 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                            onClick={() => onSelect?.(consultation.id)}
                        >
                            <div className="flex flex-col gap-1.5 px-3 py-2.5 md:px-4 md:py-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            {format(new Date(consultation.startTime), "dd MMM yyyy", { locale: ptBR })}
                                        </span>
                                        <Badge variant="secondary" className="h-5 px-2 py-0 text-[10px] font-bold uppercase md:text-xs">
                                            {consultation.serviceTypeName?.trim() || "Atendimento"}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={`h-5 px-2 py-0 text-[10px] font-bold uppercase md:text-xs ${lifecycle.className}`}
                                        >
                                            {lifecycle.label}
                                        </Badge>
                                    </div>
                                    <div className="shrink-0 truncate text-xs font-medium text-muted-foreground">
                                        {consultation.doctorName
                                            ? `Dr(a). ${consultation.doctorName}`
                                            : consultation.status === "waiting"
                                              ? "Aguardando médico"
                                              : "—"}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <h4 className="truncate text-base font-bold text-card-foreground">
                                            {consultation.diagnosis || "Atendimento Clínico"}
                                        </h4>
                                        {consultation.cidCode ? (
                                            <Badge
                                                variant="outline"
                                                className="h-5 shrink-0 border-primary/20 px-2 py-0 text-xs text-primary"
                                            >
                                                {consultation.cidCode}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary md:size-5" />
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}

/** Indicador explícito: consulta aberta (em curso / fila) vs concluída vs cancelada. */
function consultationLifecycleBadge(status: string | null | undefined): { label: string; className: string } {
    if (status === "finished") {
        return {
            label: "Concluída",
            className: "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        };
    }
    if (status === "cancelled") {
        return {
            label: "Cancelada",
            className: "border-destructive/40 bg-destructive/10 text-destructive",
        };
    }
    if (status === "waiting" || status === "in_progress") {
        return {
            label: "Aberta",
            className: "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        };
    }
    return {
        label: "Aberta",
        className: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    };
}
