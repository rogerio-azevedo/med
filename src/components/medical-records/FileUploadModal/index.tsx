"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { categoryRequiresReferenceDate } from "@/validations/file";
import { cn } from "@/lib/utils";
import { CheckCircle2, ImagePlus, Loader2, Upload, X, XCircle } from "lucide-react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
    { value: "lab_exam", label: "Exame laboratorial" },
    { value: "imaging", label: "Imagem (RX, TC, etc.)" },
    { value: "clinical_photo", label: "Foto clínica" },
    { value: "report", label: "Laudo / relatório" },
    { value: "other", label: "Outro" },
] as const;

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FileUploadItem {
    id: string;
    file: File;
    status: UploadStatus;
    progress: number; // 0-100
    error?: string;
}

type ModalMode = "single" | "multi";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function compressImage(file: File, maxPx = 1920, quality = 0.85): Promise<File> {
    return new Promise((resolve) => {
        if (!file.type.startsWith("image/")) {
            resolve(file);
            return;
        }
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            if (width > maxPx || height > maxPx) {
                if (width > height) {
                    height = Math.round((height * maxPx) / width);
                    width = maxPx;
                } else {
                    width = Math.round((width * maxPx) / height);
                    height = maxPx;
                }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    resolve(new File([blob], file.name, { type: "image/jpeg" }));
                },
                "image/jpeg",
                quality
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file);
        };
        img.src = url;
    });
}

function uploadWithProgress(
    presignedUrl: string,
    file: File,
    contentType: string,
    onProgress: (pct: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl, true);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                onProgress(Math.round((e.loaded * 100) / e.total));
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error("Falha ao enviar ao armazenamento (verifique CORS no bucket R2)"));
        };
        xhr.onerror = () => reject(new Error("Erro de rede ao enviar arquivo"));
        xhr.send(file);
    });
}

// ─── Sub-componente: Item de arquivo na fila ──────────────────────────────────

function UploadItemRow({
    item,
    onRemove,
}: {
    item: FileUploadItem;
    onRemove?: () => void;
}) {
    const sizeLabel = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
            {/* Thumbnail */}
            <div className="size-10 shrink-0 overflow-hidden rounded border bg-muted">
                {item.file.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={URL.createObjectURL(item.file)}
                        alt={item.file.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        FILE
                    </div>
                )}
            </div>

            {/* Info + progresso */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{item.file.name}</p>
                <p className="text-[10px] text-muted-foreground">{sizeLabel(item.file.size)}</p>
                {item.status === "uploading" && (
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                )}
                {item.status === "error" && (
                    <p className="text-[10px] text-destructive">{item.error ?? "Erro no upload"}</p>
                )}
            </div>

            {/* Status */}
            <div className="shrink-0">
                {item.status === "idle" && onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={onRemove}
                    >
                        <X className="size-3.5" />
                    </Button>
                )}
                {item.status === "uploading" && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
                {item.status === "success" && (
                    <CheckCircle2 className="size-4 text-green-500" />
                )}
                {item.status === "error" && (
                    <XCircle className="size-4 text-destructive" />
                )}
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FileUploadModal({
    open,
    onOpenChange,
    patientId,
    consultationId,
    surgeryId,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    patientId: string;
    consultationId?: string | null;
    surgeryId?: string | null;
    onSuccess?: () => void;
}) {
    const [mode, setMode] = useState<ModalMode>("single");

    // ── Modo único (estado atual) ─────────────────────────────────────────────
    const [singleFile, setSingleFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<string>("lab_exam");
    const [referenceDate, setReferenceDate] = useState("");
    const [notes, setNotes] = useState("");
    const [submittingSingle, setSubmittingSingle] = useState(false);

    // ── Modo multi-foto ───────────────────────────────────────────────────────
    const [multiFiles, setMultiFiles] = useState<FileUploadItem[]>([]);
    const [multiTitle, setMultiTitle] = useState("");
    const [multiCategory, setMultiCategory] = useState<string>("clinical_photo");
    const [multiDate, setMultiDate] = useState("");
    const [multiNotes, setMultiNotes] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalProgress =
        multiFiles.length === 0
            ? 0
            : Math.round(
                  multiFiles.reduce((acc, f) => acc + f.progress, 0) / multiFiles.length
              );
    const allDone = multiFiles.length > 0 && multiFiles.every((f) => f.status === "success");
    const hasErrors = multiFiles.some((f) => f.status === "error");

    const reset = useCallback(() => {
        setSingleFile(null);
        setTitle("");
        setCategory("lab_exam");
        setReferenceDate("");
        setNotes("");
        setMultiFiles([]);
        setMultiTitle("");
        setMultiCategory("clinical_photo");
        setMultiDate("");
        setMultiNotes("");
        setIsUploading(false);
        setIsDragOver(false);
        setMode("single");
    }, []);

    const handleClose = (v: boolean) => {
        if (!v) reset();
        onOpenChange(v);
    };

    // Reseta ao fechar
    useEffect(() => {
        if (!open) reset();
    }, [open, reset]);

    const addMultiFiles = (incoming: File[]) => {
        const images = incoming.filter((f) => f.type.startsWith("image/"));
        if (images.length === 0) {
            toast.error("Selecione apenas imagens (JPG, PNG, WEBP)");
            return;
        }
        setMultiFiles((prev) => [
            ...prev,
            ...images.map((f) => ({
                id: crypto.randomUUID(),
                file: f,
                status: "idle" as UploadStatus,
                progress: 0,
            })),
        ]);
    };

    const removeMultiFile = (id: string) => {
        setMultiFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const updateFile = (id: string, patch: Partial<FileUploadItem>) => {
        setMultiFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
        );
    };

    // ── Submit modo único ─────────────────────────────────────────────────────
    const onSubmitSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleFile) { toast.error("Selecione um arquivo"); return; }
        if (!title.trim()) { toast.error("Informe um título"); return; }
        if (categoryRequiresReferenceDate(category) && !referenceDate.trim()) {
            toast.error("Informe a data do exame ou documento.");
            return;
        }
        setSubmittingSingle(true);
        try {
            const presignRes = await fetch("/api/files/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: singleFile.name,
                    mimeType: singleFile.type || "application/octet-stream",
                    sizeBytes: singleFile.size,
                    category,
                    patientId,
                    consultationId: consultationId ?? null,
                    surgeryId: surgeryId ?? null,
                }),
            });
            if (!presignRes.ok) {
                const err = await presignRes.json().catch(() => ({}));
                throw new Error(typeof err.error === "string" ? err.error : "Falha ao preparar upload");
            }
            const { presignedUrl, remoteKey, contentType } = (await presignRes.json()) as {
                presignedUrl: string;
                remoteKey: string;
                contentType: string;
            };

            const putRes = await fetch(presignedUrl, {
                method: "PUT",
                body: singleFile,
                headers: { "Content-Type": contentType },
            });
            if (!putRes.ok) throw new Error("Falha ao enviar arquivo ao armazenamento");

            const metaRes = await fetch("/api/files/metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    remoteKey,
                    fileName: singleFile.name,
                    mimeType: singleFile.type || "application/octet-stream",
                    sizeBytes: singleFile.size,
                    category,
                    patientId,
                    consultationId: consultationId ?? null,
                    surgeryId: surgeryId ?? null,
                    title: title.trim(),
                    referenceDate: referenceDate || null,
                    notes: notes.trim() || null,
                }),
            });
            if (!metaRes.ok) {
                const err = await metaRes.json().catch(() => ({}));
                throw new Error(typeof err.error === "string" ? err.error : "Falha ao salvar metadados");
            }

            toast.success("Arquivo enviado com sucesso");
            reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro no upload");
        } finally {
            setSubmittingSingle(false);
        }
    };

    // ── Submit modo multi ─────────────────────────────────────────────────────
    const onSubmitMulti = async (e: React.FormEvent) => {
        e.preventDefault();
        if (multiFiles.length === 0) { toast.error("Adicione pelo menos uma imagem"); return; }
        if (!multiTitle.trim()) { toast.error("Informe um título para o grupo"); return; }
        if (categoryRequiresReferenceDate(multiCategory) && !multiDate.trim()) {
            toast.error("Informe a data de referência.");
            return;
        }

        setIsUploading(true);
        const groupId = crypto.randomUUID();

        // Marca todos como uploading
        setMultiFiles((prev) => prev.map((f) => ({ ...f, status: "uploading", progress: 0 })));

        let successCount = 0;

        await Promise.all(
            multiFiles.map(async (item, idx) => {
                try {
                    // Comprime se imagem
                    const compressed = await compressImage(item.file);

                    // Presign
                    const presignRes = await fetch("/api/files/presign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fileName: compressed.name,
                            mimeType: compressed.type || "image/jpeg",
                            sizeBytes: compressed.size,
                            category: multiCategory,
                            patientId,
                            consultationId: consultationId ?? null,
                            surgeryId: surgeryId ?? null,
                        }),
                    });
                    if (!presignRes.ok) {
                        const err = await presignRes.json().catch(() => ({}));
                        throw new Error(typeof err.error === "string" ? err.error : "Falha ao preparar upload");
                    }
                    const { presignedUrl, remoteKey, contentType } = (await presignRes.json()) as {
                        presignedUrl: string;
                        remoteKey: string;
                        contentType: string;
                    };

                    // Upload com progresso
                    await uploadWithProgress(presignedUrl, compressed, contentType, (pct) => {
                        updateFile(item.id, { progress: pct });
                    });

                    // Título individual: "Título – Foto N de M"
                    const fileTitle = `${multiTitle.trim()} – Foto ${idx + 1} de ${multiFiles.length}`;

                    // Salva metadados
                    const metaRes = await fetch("/api/files/metadata", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            remoteKey,
                            fileName: compressed.name,
                            mimeType: compressed.type || "image/jpeg",
                            sizeBytes: compressed.size,
                            category: multiCategory,
                            patientId,
                            consultationId: consultationId ?? null,
                            surgeryId: surgeryId ?? null,
                            title: fileTitle,
                            referenceDate: multiDate || null,
                            notes: multiNotes.trim() || null,
                            uploadGroupId: groupId,
                            groupOrder: idx,
                        }),
                    });
                    if (!metaRes.ok) {
                        const err = await metaRes.json().catch(() => ({}));
                        throw new Error(typeof err.error === "string" ? err.error : "Falha ao salvar metadados");
                    }

                    updateFile(item.id, { status: "success", progress: 100 });
                    successCount++;
                } catch (err) {
                    updateFile(item.id, {
                        status: "error",
                        error: err instanceof Error ? err.message : "Erro no upload",
                    });
                }
            })
        );

        setIsUploading(false);

        if (successCount === multiFiles.length) {
            toast.success(`${successCount} ${successCount === 1 ? "foto enviada" : "fotos enviadas"} com sucesso!`);
            setTimeout(() => {
                reset();
                onOpenChange(false);
                onSuccess?.();
            }, 800);
        } else {
            toast.error(`${successCount} de ${multiFiles.length} fotos enviadas. Verifique os erros.`);
        }
    };

    // ── Drag & Drop handlers ──────────────────────────────────────────────────
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const onDragLeave = () => setIsDragOver(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        addMultiFiles(Array.from(e.dataTransfer.files));
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Enviar arquivo</DialogTitle>
                </DialogHeader>

                {/* Toggle de modo */}
                <div className="flex rounded-lg border p-1 gap-1">
                    <button
                        type="button"
                        onClick={() => setMode("single")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                            mode === "single"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Upload className="size-3.5" />
                        Arquivo único
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("multi")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
                            mode === "multi"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ImagePlus className="size-3.5" />
                        Múltiplas fotos
                    </button>
                </div>

                {/* ── Modo único ── */}
                {mode === "single" && (
                    <form onSubmit={onSubmitSingle} className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
                        <div className="space-y-2">
                            <Label htmlFor="file-input">Arquivo</Label>
                            <Input
                                id="file-input"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp,.dcm,application/pdf,image/jpeg,image/png,image/webp"
                                onChange={(ev) => {
                                    const f = ev.target.files?.[0];
                                    setSingleFile(f ?? null);
                                    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file-title">Título</Label>
                            <Input
                                id="file-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex.: Hemograma completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ref-date">
                                {categoryRequiresReferenceDate(category)
                                    ? "Data do exame / documento (obrigatória)"
                                    : "Data de referência (opcional)"}
                            </Label>
                            <Input
                                id="ref-date"
                                type="date"
                                value={referenceDate}
                                onChange={(e) => setReferenceDate(e.target.value)}
                                required={categoryRequiresReferenceDate(category)}
                            />
                            <p className="text-xs text-muted-foreground">
                                {categoryRequiresReferenceDate(category)
                                    ? "Use a data em que o exame foi realizado, não a data de hoje."
                                    : "Se preencher, a timeline usa esta data em vez da data de envio."}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file-notes">Observações (opcional)</Label>
                            <Textarea
                                id="file-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Notas clínicas sobre o arquivo"
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-auto">
                            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submittingSingle}>
                                {submittingSingle ? "Enviando…" : "Enviar"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {/* ── Modo multi-foto ── */}
                {mode === "multi" && (
                    <form onSubmit={onSubmitMulti} className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
                        {/* Dropzone */}
                        {!isUploading && (
                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                                data-active={isDragOver}
                                className={cn(
                                    "cursor-pointer rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-6 transition-colors",
                                    isDragOver
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border text-muted-foreground hover:border-muted-foreground/50"
                                )}
                            >
                                <ImagePlus className="size-8 opacity-60" />
                                <p className="text-sm font-medium">Arraste as fotos ou clique para selecionar</p>
                                <p className="text-xs">JPG, PNG, WEBP · Múltiplos arquivos permitidos</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={(e) => addMultiFiles(Array.from(e.target.files ?? []))}
                                />
                            </div>
                        )}

                        {/* Lista de arquivos */}
                        {multiFiles.length > 0 && (
                            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                                {multiFiles.map((item) => (
                                    <UploadItemRow
                                        key={item.id}
                                        item={item}
                                        onRemove={!isUploading ? () => removeMultiFile(item.id) : undefined}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Barra de progresso global */}
                        {isUploading && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Enviando {multiFiles.length} {multiFiles.length === 1 ? "foto" : "fotos"}…</span>
                                    <span>{totalProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-300",
                                            allDone ? "bg-green-500" : hasErrors ? "bg-amber-500" : "bg-primary"
                                        )}
                                        style={{ width: `${totalProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Campos do grupo */}
                        {!isUploading && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="multi-title">Título do grupo de fotos</Label>
                                    <Input
                                        id="multi-title"
                                        value={multiTitle}
                                        onChange={(e) => setMultiTitle(e.target.value)}
                                        placeholder="Ex.: Pré-operatório nariz"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Cada foto receberá um sufixo automático ("– Foto 1 de 3").
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select value={multiCategory} onValueChange={setMultiCategory}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="multi-date">
                                        {categoryRequiresReferenceDate(multiCategory)
                                            ? "Data das fotos (obrigatória)"
                                            : "Data de referência (opcional)"}
                                    </Label>
                                    <Input
                                        id="multi-date"
                                        type="date"
                                        value={multiDate}
                                        onChange={(e) => setMultiDate(e.target.value)}
                                        required={categoryRequiresReferenceDate(multiCategory)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="multi-notes">Observações (opcional)</Label>
                                    <Textarea
                                        id="multi-notes"
                                        value={multiNotes}
                                        onChange={(e) => setMultiNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Notas clínicas sobre as fotos"
                                    />
                                </div>
                            </>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleClose(false)}
                                disabled={isUploading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUploading || multiFiles.length === 0}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Enviando…
                                    </>
                                ) : (
                                    `Enviar ${multiFiles.length > 0 ? `${multiFiles.length} ` : ""}${multiFiles.length === 1 ? "foto" : "fotos"}`
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
