"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { medicalDocumentPrintSignatureKey } from "@/lib/constants/medical-document-print-storage";
import { DoctorSignaturePad, type DoctorSignaturePadHandle } from "@/components/shared/DoctorSignaturePad";
import { uploadDoctorSignaturePngBlob } from "@/lib/client/doctor-signature-upload";

export type IssueDocumentSignaturePanelProps = {
    docId: string;
    templateId: string;
    printMode: "print" | "pdf";
    onComplete: () => void;
    /** Desativa interações (ex.: operação global no modal pai). */
    disabled?: boolean;
};

function openPrintWindow(templateId: string, docId: string, printMode: "print" | "pdf") {
    const params = new URLSearchParams({ docId });
    if (printMode === "pdf") params.set("mode", "pdf");
    window.open(`/document-templates/${templateId}/print?${params.toString()}`, "_blank", "noopener,noreferrer");
}

export function IssueDocumentSignaturePanel({
    docId,
    templateId,
    printMode,
    onComplete,
    disabled: disabledFromParent = false,
}: IssueDocumentSignaturePanelProps) {
    const [hasSavedSignatureHint, setHasSavedSignatureHint] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [padResetSeq, setPadResetSeq] = useState(0);
    const padRef = useRef<DoctorSignaturePadHandle | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const disabled = disabledFromParent || isPending;

    useEffect(() => {
        queueMicrotask(() => {
            setPadResetSeq((n) => n + 1);
        });
    }, [docId]);

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
            onComplete();
        },
        [docId, onComplete, printMode, templateId]
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
    }, [docId]);

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

    const openVerb =
        printMode === "pdf"
            ? "gerar o PDF em uma nova aba"
            : "abrir a janela de impressão em uma nova aba";

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    Confira o documento nesta tela e escolha como a assinatura deve aparecer nesta emissão.
                </p>
                <Button
                    type="button"
                    variant="default"
                    className="h-auto w-full flex-col items-start gap-1 py-3 text-left whitespace-normal"
                    disabled={disabled}
                    onClick={handleUseDefault}
                >
                    <span className="text-sm font-semibold">
                        {hasSavedSignatureHint
                            ? "Continuar com assinatura do cadastro"
                            : "Continuar sem imagem na assinatura"}
                    </span>
                    <span className="text-xs font-normal opacity-90">
                        {hasSavedSignatureHint
                            ? `Usa a imagem salva no seu perfil e ${openVerb}.`
                            : `Será exibida uma linha em branco para assinar à mão depois. Você pode ${openVerb} assim mesmo.`}
                    </span>
                </Button>
            </div>

            <Separator />

            <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Outras opções nesta emissão
                </p>
                <p className="text-xs text-muted-foreground">
                    Rubrica e imagem enviada valem só para este documento, salvo se você salvar a rubrica no cadastro
                    abaixo.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2 sm:w-auto"
                    disabled={disabled}
                    onClick={handlePickFile}
                >
                    <Upload className="h-4 w-4 shrink-0" />
                    Enviar imagem (PNG, JPEG ou WebP)
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={onFileChange}
                />

                <div className="rounded-lg border bg-card p-3 sm:p-4">
                    <Label className="text-sm font-medium">Rubricar (mouse ou toque)</Label>
                    <DoctorSignaturePad
                        ref={padRef}
                        resetKey={padResetSeq}
                        className="mt-2 h-36 w-full cursor-crosshair touch-none rounded-md border border-slate-300 bg-white"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => padRef.current?.clear()}>
                            Limpar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={disabled}
                            onClick={handleSaveToProfile}
                        >
                            Salvar no cadastro
                        </Button>
                        <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={handleConfirmRubric}>
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : printMode === "pdf" ? (
                                "Usar rubrica e gerar PDF"
                            ) : (
                                "Usar rubrica e abrir impressão"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
