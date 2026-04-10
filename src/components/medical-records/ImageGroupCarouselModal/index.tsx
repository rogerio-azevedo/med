"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Loader2, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GroupFile {
    id: string;
    title: string;
    fileName: string;
    mimeType: string;
    groupOrder: number;
    viewUrl: string | null;
    uploader: { name: string | null } | null;
}

interface ImageGroupCarouselModalProps {
    groupId: string | null;
    groupTitle: string;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}

export function ImageGroupCarouselModal({
    groupId,
    groupTitle,
    open,
    onOpenChange,
}: ImageGroupCarouselModalProps) {
    const [files, setFiles] = useState<GroupFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [zoomed, setZoomed] = useState(false);

    // Busca arquivos do grupo ao abrir
    useEffect(() => {
        if (!open || !groupId) {
            setFiles([]);
            setCurrentIndex(0);
            setZoomed(false);
            return;
        }
        setLoading(true);
        fetch(`/api/files/group/${groupId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Falha ao carregar imagens");
                return res.json() as Promise<{ files: GroupFile[] }>;
            })
            .then((data) => {
                setFiles(data.files);
                setCurrentIndex(0);
            })
            .catch(() => toast.error("Não foi possível carregar as imagens do grupo"))
            .finally(() => setLoading(false));
    }, [open, groupId]);

    const goToPrev = useCallback(() => {
        setZoomed(false);
        setCurrentIndex((i) => (i > 0 ? i - 1 : files.length - 1));
    }, [files.length]);

    const goToNext = useCallback(() => {
        setZoomed(false);
        setCurrentIndex((i) => (i < files.length - 1 ? i + 1 : 0));
    }, [files.length]);

    // Navegação por teclado
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPrev();
            if (e.key === "ArrowRight") goToNext();
            if (e.key === "Escape") onOpenChange(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, goToPrev, goToNext, onOpenChange]);

    const current = files[currentIndex];

    const handleDownload = async () => {
        if (!current?.viewUrl) return;
        try {
            const res = await fetch(current.viewUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = current.fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Não foi possível baixar a imagem");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-4xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
                <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
                    <DialogTitle className="text-base font-semibold truncate max-w-[70%]">
                        {groupTitle}
                    </DialogTitle>
                    <div className="flex items-center gap-1">
                        {current && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => setZoomed((z) => !z)}
                                    title={zoomed ? "Reduzir" : "Ampliar"}
                                >
                                    <ZoomIn className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={handleDownload}
                                    title="Baixar foto"
                                >
                                    <Download className="size-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Área principal da imagem */}
                <div className="relative flex items-center justify-center bg-black/80 min-h-[50vh] max-h-[65vh] overflow-hidden">
                    {loading ? (
                        <Loader2 className="size-10 animate-spin text-muted-foreground" />
                    ) : files.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Nenhuma imagem encontrada.</p>
                    ) : current ? (
                        <>
                            {/* Botão anterior */}
                            {files.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 z-10 size-10 bg-black/40 hover:bg-black/60 text-white rounded-full"
                                    onClick={goToPrev}
                                >
                                    <ChevronLeft className="size-6" />
                                </Button>
                            )}

                            {/* Imagem */}
                            {current.viewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    key={current.id}
                                    src={current.viewUrl}
                                    alt={current.title}
                                    className={cn(
                                        "max-h-[65vh] object-contain transition-transform duration-300 select-none",
                                        zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                                    )}
                                    onClick={() => setZoomed((z) => !z)}
                                    draggable={false}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <p className="text-sm">Imagem indisponível</p>
                                    <p className="text-xs">{current.fileName}</p>
                                </div>
                            )}

                            {/* Botão próximo */}
                            {files.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 z-10 size-10 bg-black/40 hover:bg-black/60 text-white rounded-full"
                                    onClick={goToNext}
                                >
                                    <ChevronRight className="size-6" />
                                </Button>
                            )}

                            {/* Contador */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                                {currentIndex + 1} de {files.length}
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Thumbnails */}
                {files.length > 1 && (
                    <div className="flex gap-2 px-4 py-3 overflow-x-auto border-t bg-background">
                        {files.map((f, idx) => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                    setZoomed(false);
                                    setCurrentIndex(idx);
                                }}
                                className={cn(
                                    "shrink-0 size-14 rounded-md overflow-hidden border-2 transition-all",
                                    idx === currentIndex
                                        ? "border-primary shadow-md scale-105"
                                        : "border-transparent opacity-60 hover:opacity-100"
                                )}
                            >
                                {f.viewUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={f.viewUrl}
                                        alt={f.title}
                                        className="w-full h-full object-cover"
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                                        {idx + 1}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Título da foto atual */}
                {current && !loading && (
                    <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{current.title}</span>
                        {current.uploader?.name && ` · Por ${current.uploader.name}`}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
