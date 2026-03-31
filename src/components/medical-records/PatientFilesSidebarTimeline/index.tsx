"use client";

import { Button } from "@/components/ui/button";
import { Paperclip, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProntuarioFileTimelineEntry } from "@/db/queries/prontuario-timeline";
import { FileCard, type PatientFileRow } from "../FileCard";

function entryToRow(e: ProntuarioFileTimelineEntry): PatientFileRow {
    return {
        id: e.id,
        title: e.title,
        category: e.category,
        mimeType: e.mimeType,
        fileName: e.fileName,
        createdAt: e.createdAt,
        referenceDate: e.referenceDate,
        notes: e.notes,
        consultationId: e.consultationId,
        uploader: e.uploader,
    };
}

export function PatientFilesSidebarTimeline({
    files,
    canManagePatientFiles = false,
    onAnexar,
    onFilesChanged,
}: {
    files: ProntuarioFileTimelineEntry[];
    canManagePatientFiles?: boolean;
    onAnexar?: () => void;
    onFilesChanged?: () => void;
}) {
    return (
        <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-sm">
                    <Paperclip className="size-4 shrink-0" />
                    Arquivos
                </h3>
                {canManagePatientFiles && onAnexar ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 px-2.5 text-xs"
                        onClick={onAnexar}
                    >
                        <Plus className="size-4" />
                        Anexar
                    </Button>
                ) : null}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
                Ordem pela data do exame ou documento; se não houver, pela data de envio.
            </p>

            {files.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">Nenhum arquivo anexado.</p>
            ) : (
                <div className="relative">
                    {/* Trilho vertical: sem posicionamento negativo — não é cortado pelo ScrollArea */}
                    <div
                        className="pointer-events-none absolute bottom-3 left-[9px] top-3 w-0.5 bg-border/90"
                        aria-hidden
                    />
                    <ul className="flex flex-col gap-4">
                        {files.map((item) => (
                            <li key={item.id} className="flex gap-3">
                                <div className="relative z-10 flex w-5 shrink-0 justify-center pt-1">
                                    <span
                                        className="mt-0.5 block size-2.5 shrink-0 rounded-full border-2 border-primary bg-background ring-2 ring-muted/30"
                                        aria-hidden
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:text-xs">
                                        {format(new Date(item.sortAt), "dd MMM yyyy", { locale: ptBR })}
                                    </div>
                                    {item.referenceDate ? (
                                        <p className="mb-1.5 text-xs text-muted-foreground">
                                            Anexado em{" "}
                                            {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                        </p>
                                    ) : null}
                                    <FileCard
                                        file={entryToRow(item)}
                                        onDeleted={onFilesChanged}
                                        canDelete={canManagePatientFiles}
                                        compact
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
