"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ConsultationHistoryPanelEntry = {
    id: string;
    startTime: string | Date;
    serviceTypeName?: string | null;
    doctorName?: string | null;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    diagnosisFreeText?: string | null;
    cidCode?: string | null;
};

type ConsultationHistoryPanelProps = {
    entries: ConsultationHistoryPanelEntry[];
    loading?: boolean;
    error?: string | null;
    className?: string;
};

function hasText(v: string | null | undefined) {
    return !!v?.trim();
}

/** Só texto livre (consulta simples): preencheu subjetivo e deixou O/A/P vazios. */
function isSimpleStyleRecord(entry: ConsultationHistoryPanelEntry): boolean {
    return (
        hasText(entry.subjective) &&
        !hasText(entry.objective) &&
        !hasText(entry.assessment) &&
        !hasText(entry.plan)
    );
}

function SoapSnippet({ label, text }: { label: string; text: string }) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    return (
        <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
            <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-snug text-foreground">{trimmed}</p>
        </div>
    );
}

export function ConsultationHistoryPanel({
    entries,
    loading = false,
    error = null,
    className,
}: ConsultationHistoryPanelProps) {
    return (
        <div className={cn("flex min-h-0 flex-col bg-muted/15", className)}>
            <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80">
                <h3 className="text-sm font-semibold tracking-tight">Histórico</h3>
                <p className="text-xs text-muted-foreground">
                    {loading ? "Carregando…" : `${entries.length} consulta${entries.length !== 1 ? "s" : ""} anterior${entries.length !== 1 ? "es" : ""}`}
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                {loading ? (
                    <div className="space-y-4 px-1">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2 rounded-lg border bg-card p-3">
                                <Skeleton className="h-3 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <p className="px-1 py-6 text-center text-sm text-destructive">{error}</p>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground">
                        <ClipboardList className="h-12 w-12 opacity-25" />
                        <p className="max-w-[220px] text-center text-xs leading-relaxed">
                            Nenhuma consulta anterior finalizada neste prontuário.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-2">
                        {entries.map((entry) => {
                            const dateLabel = format(new Date(entry.startTime), "dd MMM yyyy", { locale: ptBR });
                            const doctorLabel = entry.doctorName?.trim()
                                ? `Dr(a). ${entry.doctorName}`
                                : null;
                            const typeLabel = entry.serviceTypeName?.trim() || "Atendimento";
                            const diag =
                                entry.diagnosisFreeText?.trim() ||
                                (entry.cidCode ? `CID ${entry.cidCode}` : "");

                            return (
                                <article
                                    key={entry.id}
                                    className="rounded-lg border border-border/80 bg-card px-3 py-3 shadow-sm"
                                >
                                    <header className="mb-2 space-y-1 border-b border-border/60 pb-2">
                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            <span>{dateLabel}</span>
                                            <span className="font-normal opacity-60">·</span>
                                            <span>{typeLabel}</span>
                                            {doctorLabel ? (
                                                <>
                                                    <span className="font-normal opacity-60">·</span>
                                                    <span className="normal-case">{doctorLabel}</span>
                                                </>
                                            ) : null}
                                        </div>
                                        {diag ? (
                                            <p className="text-xs font-medium leading-snug text-foreground">
                                                <span className="text-muted-foreground">Diagnóstico: </span>
                                                {diag}
                                                {entry.cidCode && entry.diagnosisFreeText?.trim() ? (
                                                    <span className="ml-1 text-muted-foreground">
                                                        ({entry.cidCode})
                                                    </span>
                                                ) : null}
                                            </p>
                                        ) : null}
                                    </header>
                                    <div className="space-y-2">
                                        {isSimpleStyleRecord(entry) ? (
                                            <SoapSnippet label="Registro" text={entry.subjective ?? ""} />
                                        ) : (
                                            <>
                                                <SoapSnippet label="Subjetivo" text={entry.subjective ?? ""} />
                                                <SoapSnippet label="Objetivo" text={entry.objective ?? ""} />
                                                <SoapSnippet label="Avaliação" text={entry.assessment ?? ""} />
                                                <SoapSnippet label="Plano" text={entry.plan ?? ""} />
                                            </>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
