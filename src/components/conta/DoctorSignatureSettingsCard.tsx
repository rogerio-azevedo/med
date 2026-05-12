"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { clearDoctorSignatureAction } from "@/app/actions/doctor-signature";
import { DoctorSignaturePad, type DoctorSignaturePadHandle } from "@/components/shared/DoctorSignaturePad";
import { uploadDoctorSignatureFile, uploadDoctorSignaturePngBlob } from "@/lib/client/doctor-signature-upload";

export function DoctorSignatureSettingsCard() {
    const [isPending, startTransition] = useTransition();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [drawOpen, setDrawOpen] = useState(false);
    const [drawPadKey, setDrawPadKey] = useState(0);
    const drawPadRef = useRef<DoctorSignaturePadHandle | null>(null);

    const loadPreview = useCallback(() => {
        void fetch("/api/doctor-signature/preview")
            .then((r) => (r.ok ? r.json() : Promise.resolve({ url: null })))
            .then((d: { url?: string | null }) => setPreviewUrl(d?.url ?? null))
            .catch(() => setPreviewUrl(null));
    }, []);

    useEffect(() => {
        loadPreview();
    }, [loadPreview]);

    const uploadFile = (file: File) => {
        startTransition(() => {
            void (async () => {
                try {
                    await uploadDoctorSignatureFile(file);
                    toast.success("Assinatura salva.");
                    loadPreview();
                } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Erro ao enviar assinatura");
                }
            })();
        });
    };

    const openDrawDialog = () => {
        setDrawPadKey((k) => k + 1);
        setDrawOpen(true);
    };

    const handleSaveDrawing = () => {
        startTransition(() => {
            void (async () => {
                try {
                    const blob = await drawPadRef.current?.toPngBlob();
                    if (!blob) {
                        toast.error("Desenhe a rubrica antes de salvar.");
                        return;
                    }
                    await uploadDoctorSignaturePngBlob(blob);
                    toast.success("Assinatura salva.");
                    setDrawOpen(false);
                    loadPreview();
                } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Erro ao enviar assinatura");
                }
            })();
        });
    };

    const handleClear = () => {
        startTransition(() => {
            void (async () => {
                const res = await clearDoctorSignatureAction();
                if ("error" in res) {
                    toast.error(res.error);
                    return;
                }
                toast.success("Assinatura removida.");
                setPreviewUrl(null);
            })();
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PenLine className="h-5 w-5 text-primary" />
                    Assinatura em documentos
                </CardTitle>
                <CardDescription>
                    Imagem usada por padrão em atestados e demais documentos gerados a partir dos modelos. Você
                    ainda pode rubricar ou enviar outra imagem na hora de cada impressão.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex min-h-[100px] items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
                    {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="Pré-visualização da assinatura" className="max-h-28 object-contain" />
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma assinatura cadastrada.</p>
                    )}
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isPending}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) uploadFile(f);
                    }}
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => fileRef.current?.click()}
                    >
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Enviar imagem
                    </Button>
                    <Button type="button" variant="outline" disabled={isPending} onClick={openDrawDialog}>
                        Desenhar
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive"
                        disabled={isPending || !previewUrl}
                        onClick={handleClear}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                    </Button>
                </div>

                <Dialog open={drawOpen} onOpenChange={setDrawOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Desenhar assinatura</DialogTitle>
                            <DialogDescription>
                                Use o mouse ou o toque para rubricar. Depois salve para usar em documentos.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <Label className="text-sm">Rubrica</Label>
                            <DoctorSignaturePad
                                ref={drawPadRef}
                                resetKey={drawPadKey}
                                className="h-36 w-full cursor-crosshair touch-none rounded-md border border-slate-300 bg-white"
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" size="sm" variant="ghost" onClick={() => drawPadRef.current?.clear()}>
                                    Limpar
                                </Button>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setDrawOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="button" disabled={isPending} onClick={handleSaveDrawing}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
