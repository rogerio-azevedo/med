import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronRight, ClipboardList, RotateCcw } from "lucide-react";
import { resolveTimelineVisual } from "@/lib/formatters/medical-timeline-visual";
import { cn } from "@/lib/utils";

export type MedicalTimelineRow = {
    id: string;
    serviceTypeId?: string | null;
    startTime: string | Date;
    doctorName?: string | null;
    diagnosis?: string | null;
    cidCode?: string | null;
    serviceTypeName?: string | null;
    /** Workflow do tipo de atendimento (consultas); cirurgias usam timelineKind. */
    serviceTypeWorkflow?: string | null;
    serviceTypeSlug?: string | null;
    /** Personalização no cadastro do tipo de atendimento */
    serviceTypeTimelineIconKey?: string | null;
    serviceTypeTimelineColorHex?: string | null;
    status?: string | null;
    timelineKind?: "consultation" | "surgery";
    /** Só em consulta “mãe”: já existe registro de retorno */
    hasReturn?: boolean;
    parentConsultationId?: string | null;
    healthInsuranceId?: string | null;
};

interface ConsultationTimelineProps {
    consultations: MedicalTimelineRow[];
    onSelect?: (id: string, kind: "consultation" | "surgery") => void;
    /**
     * Quando preenchido (ex.: usuário é médico), exibe botão "Retorno" no card
     * para consultas concluídas ainda sem retorno (sem abrir o painel de detalhe).
     */
    onRequestReturn?: (payload: { consultationId: string; healthInsuranceId: string | null }) => void;
    /** Enquanto o retorno está sendo criado no servidor (evita duplo clique). */
    isRequestReturnLoading?: boolean;
}

export function ConsultationTimeline({
    consultations = [],
    onSelect,
    onRequestReturn,
    isRequestReturnLoading = false,
}: ConsultationTimelineProps) {
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
                const kind = consultation.timelineKind ?? "consultation";
                const lifecycle = timelineLifecycleBadge(consultation.status);
                const visual = resolveTimelineVisual({
                    timelineKind: kind,
                    serviceTypeWorkflow: consultation.serviceTypeWorkflow,
                    serviceTypeName: consultation.serviceTypeName,
                    serviceTypeSlug: consultation.serviceTypeSlug,
                    serviceTypeTimelineIconKey: consultation.serviceTypeTimelineIconKey,
                    serviceTypeTimelineColorHex: consultation.serviceTypeTimelineColorHex,
                });
                const { Icon } = visual;
                const canQuickReturn =
                    onRequestReturn &&
                    kind === "consultation" &&
                    consultation.status === "finished" &&
                    !consultation.parentConsultationId &&
                    !consultation.hasReturn;

                return (
                    <div key={`${kind}-${consultation.id}`} className="group relative">
                        {/* Indicador na timeline — alinhado ao trilho; padding à esquerda evita corte */}
                        <div
                            className={cn(
                                "absolute -left-8.5 top-1 z-10 rounded-full p-1 md:-left-9.5 border-2",
                                visual.ringStyle ? "shadow-sm" : cn("bg-background", visual.ringClass)
                            )}
                            style={visual.ringStyle}
                        >
                            <Icon className="size-4 md:size-4.5" />
                        </div>

                        <Card
                            className="cursor-pointer gap-0 py-0 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                            onClick={() => onSelect?.(consultation.id, kind)}
                        >
                            <div className="flex flex-col gap-1.5 px-3 py-2.5 md:px-4 md:py-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            {format(new Date(consultation.startTime), "dd MMM yyyy", { locale: ptBR })}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "h-5 px-2 py-0 text-[10px] font-bold uppercase md:text-xs",
                                                !visual.typeBadgeStyle && visual.typeBadgeClass
                                            )}
                                            style={visual.typeBadgeStyle}
                                        >
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
                                            {consultation.diagnosis ||
                                                (kind === "surgery" ? "Cirurgia" : "Atendimento Clínico")}
                                        </h4>
                                        {consultation.cidCode ? (
                                            <Badge
                                                variant="outline"
                                                className="h-5 shrink-0 border-primary/20 px-2 py-0 text-xs text-primary"
                                            >
                                                {consultation.cidCode}
                                            </Badge>
                                        ) : null}
                                        {kind === "consultation" && consultation.hasReturn ? (
                                            <Badge
                                                variant="secondary"
                                                className="h-5 border-indigo-500/30 bg-indigo-500/12 px-2 py-0 text-[10px] font-bold uppercase text-indigo-900 md:text-xs dark:text-indigo-100"
                                            >
                                                Retorno realizado
                                            </Badge>
                                        ) : null}
                                        {kind === "consultation" && consultation.serviceTypeWorkflow === "return" ? (
                                            <Badge
                                                variant="secondary"
                                                className="h-5 border-indigo-500/30 bg-indigo-500/12 px-2 py-0 text-[10px] font-bold uppercase text-indigo-900 md:text-xs dark:text-indigo-100"
                                            >
                                                Retorno
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        {canQuickReturn ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="default"
                                                className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
                                                disabled={isRequestReturnLoading}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onRequestReturn({
                                                        consultationId: consultation.id,
                                                        healthInsuranceId: consultation.healthInsuranceId ?? null,
                                                    });
                                                }}
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                <RotateCcw className="size-3.5" />
                                                {isRequestReturnLoading ? "Abrindo…" : "Retorno"}
                                            </Button>
                                        ) : null}
                                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary md:size-5" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}

/** Indicador: consulta ou cirurgia (status variados). */
function timelineLifecycleBadge(status: string | null | undefined): { label: string; className: string } {
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
    if (status === "scheduled") {
        return {
            label: "Agendado",
            className: "border-sky-500/35 bg-sky-500/10 text-sky-900 dark:text-sky-100",
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
