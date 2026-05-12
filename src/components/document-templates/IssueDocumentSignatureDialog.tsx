"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import imageCompression from "browser-image-compression";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { medicalDocumentPrintSignatureKey } from "@/lib/constants/medical-document-print-storage";
import { DoctorSignaturePad, type DoctorSignaturePadHandle } from "@/components/shared/DoctorSignaturePad";
import { uploadDoctorSignaturePngBlob } from "@/lib/client/doctor-signature-upload";

type IssueDocumentSignatureDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    docId: string;
    templateId: string;
    printMode: "print" | "pdf";
    onComplete: () => void;
};

function openPrintWindow(templateId: string, docId: string, printMode: "print" | "pdf") {
    const params = new URLSearchParams({ docId });
    if (printMode === "pdf") params.set("mode", "pdf");
    window.open(`/document-templates/${templateId}/print?${params.toString()}`, "_blank", "noopener,noreferrer");
}

export function IssueDocumentSignatureDialog({
    open,
    onOpenChange,
    docId,
    templateId,
    printMode,
    onComplete,
}: IssueDocumentSignatureDialogProps) {
    const [hasSavedSignatureHint, setHasSavedSignatureHint] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [padResetSeq, setPadResetSeq] = useState(0);
    const padRef = useRef<DoctorSignaturePadHandle | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!open) return;
        queueMicrotask(() => {
            setPadResetSeq((n) => n + 1);
        });
    }, [open]);

    const finishAndOpen = useCallback(
        (dataUrl: string | null) => {
            try {
                if (dataUrl) {
                    sessionStorage.setItem(medicalDocumentPrintSignatureKey(docId), dataUrl);
                }
            } catch {
                toast.error("Não foi possível guardar a assinatura neste navegador.");
                return;
            }
            openPrintWindow(templateId, docId, printMode);
            onOpenChange(false);
            onComplete();
        },
        [docId, onComplete, onOpenChange, printMode, templateId]
    );

    const handleUseDefault = () => {
        finishAndOpen(null);
    };

    const handleConfirmRubric = () => {
        const dataUrl = padRef.current?.toDataUrl();
        if (!dataUrl) {
            toast.error("Desenhe a rubrica antes de continuar.");
            return;
        }
        startTransition(() => {
            finishAndOpen(dataUrl);
        });
    };

    const handleSaveToProfile = () => {
        startTransition(() => {
            void (async () => {
                try {
                    const blob = await padRef.current?.toPngBlob();
                    if (!blob) {
                        toast.error("Desenhe a rubrica antes de salvar.");
                        return;
                    }
                    await uploadDoctorSignaturePngBlob(blob, { maxWidthOrHeight: 1600, maxSizeMB: 2 });
                    toast.success("Assinatura salva no cadastro.");
                    setHasSavedSignatureHint(true);
                } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Erro ao salvar assinatura");
                }
            })();
        });
    };

    const handlePickFile = () => fileInputRef.current?.click();

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        void fetch("/api/doctor-signature/preview")
            .then((r) => (r.ok ? r.json() : Promise.resolve({ url: null })))
            .then((d: { url?: string | null }) => {
                if (!cancelled) setHasSavedSignatureHint(Boolean(d?.url));
            })
            .catch(() => {
                if (!cancelled) setHasSavedSignatureHint(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        startTransition(() => {
            void (async () => {
                try {
                    const compressed = await imageCompression(file, {
                        maxWidthOrHeight: 1200,
                        maxSizeMB: 1.5,
                        fileType: "image/png",
                    });
                    const reader = new FileReader();
                    reader.onload = () => {
                        const res = reader.result;
                        if (typeof res === "string") finishAndOpen(res);
                    };
                    reader.readAsDataURL(compressed);
                } catch {
                    toast.error("Falha ao processar a imagem.");
                }
            })();
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Assinatura neste documento</DialogTitle>
                    <DialogDescription>
                        Escolha como assinar esta emissão. A opção com rubrica ou imagem vale só para esta
                        impressão, salvo se você já tiver assinatura salva no perfil.
                        {hasSavedSignatureHint ? " Você possui assinatura salva no cadastro." : ""}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" disabled={isPending} onClick={handleUseDefault}>
                            Usar assinatura do cadastro / linha em branco
                        </Button>
                        <Button type="button" variant="outline" disabled={isPending} onClick={handlePickFile}>
                            Enviar imagem
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={onFileChange}
                        />
                    </div>

                    <div>
                        <Label className="text-sm">Rubricar (mouse ou toque)</Label>
                        <DoctorSignaturePad
                            ref={padRef}
                            resetKey={padResetSeq}
                            className="mt-2 h-36 w-full cursor-crosshair touch-none rounded-md border border-slate-300 bg-white"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => padRef.current?.clear()}
                            >
                                Limpar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={handleSaveToProfile}
                            >
                                Salvar no cadastro
                            </Button>
                            <Button type="button" size="sm" disabled={isPending} onClick={handleConfirmRubric}>
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Usar rubrica e abrir impressão"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
