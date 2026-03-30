"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ImageIcon, Scan, File, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type PatientFileRow = {
    id: string;
    title: string;
    category: string;
    mimeType: string;
    fileName: string;
    createdAt: string;
    referenceDate: string | null;
    notes: string | null;
    consultationId: string | null;
    uploader?: { name: string | null } | null;
};

function fileIcon(mime: string, compact?: boolean) {
    const s = compact ? "size-4 md:size-5" : "h-5 w-5";
    if (mime.startsWith("image/")) return <ImageIcon className={s} />;
    if (mime === "application/pdf") return <FileText className={s} />;
    if (mime === "application/dicom") return <Scan className={s} />;
    return <File className={s} />;
}

const CATEGORY_LABELS: Record<string, string> = {
    lab_exam: "Exame laboratorial",
    imaging: "Imagem",
    clinical_photo: "Foto clínica",
    report: "Laudo / relatório",
    other: "Outro",
};

export function FileCard({
    file,
    onDeleted,
    canDelete,
    compact,
}: {
    file: PatientFileRow;
    onDeleted?: () => void;
    canDelete?: boolean;
    /** Layout menor para timeline na lateral */
    compact?: boolean;
}) {
    const [opening, setOpening] = useState(false);

    const openFile = async () => {
        setOpening(true);
        try {
            const res = await fetch(`/api/files/${file.id}/url`);
            if (!res.ok) throw new Error("fetch failed");
            const data = await res.json();
            window.open(data.url as string, "_blank", "noopener,noreferrer");
        } catch {
            toast.error("Não foi possível abrir o arquivo");
        } finally {
            setOpening(false);
        }
    };

    const deleteFile = async () => {
        if (!confirm("Excluir este arquivo permanentemente?")) return;
        try {
            const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("delete failed");
            toast.success("Arquivo removido");
            onDeleted?.();
        } catch {
            toast.error("Falha ao excluir o arquivo");
        }
    };

    const refLabel =
        file.referenceDate &&
        format(new Date(`${file.referenceDate}T12:00:00`), "dd/MM/yyyy", { locale: ptBR });

    return (
        <div
            className={cn(
                "flex items-start rounded-lg border bg-card text-sm",
                compact ? "gap-2.5 p-2.5 text-sm md:gap-3 md:p-3" : "gap-3 p-3"
            )}
        >
            <div
                className={cn(
                    "shrink-0 rounded-md bg-muted text-muted-foreground",
                    compact ? "p-2 md:p-2.5" : "p-2"
                )}
            >
                {fileIcon(file.mimeType, compact)}
            </div>
            <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium text-foreground", compact && "text-sm")}>{file.title}</p>
                <p className={cn("text-muted-foreground", compact ? "text-xs leading-snug" : "text-xs")}>
                    {CATEGORY_LABELS[file.category] ?? file.category}
                    {refLabel && ` · Ref. ${refLabel}`}
                </p>
                <p className={cn("truncate text-muted-foreground", compact ? "text-xs" : "text-xs")}>
                    {file.fileName}
                </p>
                {file.uploader?.name ? (
                    <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-xs")}>
                        Por {file.uploader.name}
                    </p>
                ) : null}
            </div>
            <div className="flex shrink-0 gap-0">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={compact ? "size-8 md:size-9" : undefined}
                    onClick={openFile}
                    disabled={opening}
                    title="Abrir"
                >
                    <ExternalLink className={compact ? "size-4" : "h-4 w-4"} />
                </Button>
                {canDelete ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("text-destructive hover:text-destructive", compact && "size-8 md:size-9")}
                        onClick={deleteFile}
                        title="Excluir"
                    >
                        <Trash2 className={compact ? "size-4" : "h-4 w-4"} />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
