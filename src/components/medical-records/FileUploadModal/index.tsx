"use client";

import { useState } from "react";
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
import { categoryRequiresReferenceDate } from "@/lib/validations/file";

const CATEGORIES = [
    { value: "lab_exam", label: "Exame laboratorial" },
    { value: "imaging", label: "Imagem (RX, TC, etc.)" },
    { value: "clinical_photo", label: "Foto clínica" },
    { value: "report", label: "Laudo / relatório" },
    { value: "other", label: "Outro" },
] as const;

export function FileUploadModal({
    open,
    onOpenChange,
    patientId,
    consultationId,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    patientId: string;
    consultationId?: string | null;
    onSuccess?: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<string>("lab_exam");
    const [referenceDate, setReferenceDate] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setFile(null);
        setTitle("");
        setCategory("lab_exam");
        setReferenceDate("");
        setNotes("");
    };

    const handleClose = (v: boolean) => {
        if (!v) reset();
        onOpenChange(v);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Selecione um arquivo");
            return;
        }
        if (!title.trim()) {
            toast.error("Informe um título");
            return;
        }
        if (categoryRequiresReferenceDate(category) && !referenceDate.trim()) {
            toast.error(
                "Informe a data do exame ou do documento (quando foi feito), para o histórico ficar na ordem correta."
            );
            return;
        }
        setSubmitting(true);
        try {
            const presignRes = await fetch("/api/files/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    mimeType: file.type || "application/octet-stream",
                    sizeBytes: file.size,
                    category,
                    patientId,
                    consultationId: consultationId ?? null,
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
                body: file,
                headers: { "Content-Type": contentType },
            });
            if (!putRes.ok) {
                throw new Error("Falha ao enviar arquivo ao armazenamento (verifique CORS no bucket R2)");
            }

            const metaRes = await fetch("/api/files/metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    remoteKey,
                    fileName: file.name,
                    mimeType: file.type || "application/octet-stream",
                    sizeBytes: file.size,
                    category,
                    patientId,
                    consultationId: consultationId ?? null,
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
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Enviar arquivo</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file-input">Arquivo</Label>
                        <Input
                            id="file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.dcm,application/pdf,image/jpeg,image/png,image/webp"
                            onChange={(ev) => {
                                const f = ev.target.files?.[0];
                                setFile(f ?? null);
                                if (f && !title) {
                                    setTitle(f.name.replace(/\.[^.]+$/, ""));
                                }
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
                            {categoryRequiresReferenceDate(category) ? (
                                <>
                                    Use a <span className="font-medium text-foreground/90">data em que o exame foi
                                    realizado</span>, não a data de hoje — assim o arquivo aparece no lugar certo na
                                    linha do tempo (ex.: exame de janeiro enviado em março).
                                </>
                            ) : (
                                "Se preencher, a timeline usa esta data em vez da data de envio."
                            )}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file-notes">Observações (opcional)</Label>
                        <Textarea
                            id="file-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Notas clínicas sobre o arquivo"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Enviando…" : "Enviar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
