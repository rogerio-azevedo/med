"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Pill, Trash2, X } from "lucide-react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deletePrescriptionAction, listConsultationPrescriptionsAction } from "@/app/actions/prescriptions";
import { toast } from "sonner";
import type { InferSelectModel } from "drizzle-orm";
import { prescriptions } from "@/db/schema";
import { PrescriptionItemDetails } from "@/components/medical-records/PrescriptionItemDetails";
import { PrescriptionPrintButtons } from "@/components/medical-records/PrescriptionPrintButtons";
import { PrescriptionItemFormPanel } from "./PrescriptionItemFormPanel";

type PrescriptionRow = InferSelectModel<typeof prescriptions>;

type PrescriptionModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    consultationId?: string | null;
    patientId?: string | null;
    /** Echo of current clinic context (server actions use session). */
    clinicId?: string | null;
};

export function PrescriptionModal({
    open,
    onOpenChange,
    consultationId,
    patientId,
    clinicId,
}: PrescriptionModalProps) {
    void clinicId;

    const [list, setList] = useState<PrescriptionRow[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<PrescriptionRow | null>(null);
    const launchSectionRef = useRef<HTMLDivElement>(null);

    const canUse = Boolean(consultationId && patientId);

    const loadList = useCallback(async () => {
        if (!consultationId || !patientId) {
            setList([]);
            return;
        }
        setLoadingList(true);
        try {
            const res = await listConsultationPrescriptionsAction(consultationId, patientId);
            if (res.success) {
                setList(res.items as PrescriptionRow[]);
            } else {
                setList([]);
                if (res.error) toast.error(res.error);
            }
        } finally {
            setLoadingList(false);
        }
    }, [consultationId, patientId]);

    useEffect(() => {
        if (!open) return;
        void loadList();
    }, [open, loadList]);

    useEffect(() => {
        if (!open) {
            setEditingItem(null);
        }
    }, [open]);

    const openEdit = (row: PrescriptionRow) => {
        setEditingItem(row);
        requestAnimationFrame(() => {
            launchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const handleRemove = async (id: string) => {
        if (!consultationId || !patientId) return;
        setRemovingId(id);
        try {
            const res = await deletePrescriptionAction(id, consultationId, patientId);
            if (res.success) {
                toast.success("Item removido.");
                if (editingItem?.id === id) setEditingItem(null);
                await loadList();
            } else {
                toast.error(res.error || "Não foi possível remover.");
            }
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="flex max-h-[92vh] max-w-6xl flex-col gap-0 p-0 sm:max-w-6xl"
            >
                <DialogHeader className="border-b px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0 flex-1 space-y-1 pr-0 sm:pr-2">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Pill className="h-5 w-5 shrink-0 text-primary" />
                                Prescrição
                            </DialogTitle>
                            <p className="text-left text-sm text-muted-foreground">Prescrição desta consulta</p>
                            {!canUse ? (
                                <p className="text-left text-sm text-muted-foreground">
                                    Use <strong>Continuar</strong> no primeiro passo do atendimento para criar o
                                    encontro; em seguida você poderá montar a prescrição.
                                </p>
                            ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                            {canUse && consultationId && patientId && list.length > 0 ? (
                                <PrescriptionPrintButtons patientId={patientId} consultationId={consultationId} />
                            ) : null}
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0 rounded-md opacity-70 hover:opacity-100"
                                    aria-label="Fechar"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </DialogClose>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    <section
                        ref={launchSectionRef}
                        className="rounded-xl border border-border/80 bg-card p-5 shadow-sm"
                        aria-labelledby="rx-launch-heading"
                    >
                        <div className="mb-4 space-y-1">
                            <h2 id="rx-launch-heading" className="text-base font-semibold text-foreground">
                                Lançar medicamento
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Preencha o formulário acima da lista. Só depois de{" "}
                                <strong className="font-medium text-foreground">Salvar na prescrição</strong> o item
                                aparece em <strong className="font-medium text-foreground">Itens já na prescrição</strong>.
                            </p>
                        </div>
                        <PrescriptionItemFormPanel
                            active={open}
                            consultationId={consultationId}
                            patientId={patientId}
                            editingItem={editingItem}
                            onClearEditing={() => setEditingItem(null)}
                            onSaved={loadList}
                        />
                    </section>

                    <section className="space-y-3" aria-labelledby="rx-list-heading">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 id="rx-list-heading" className="text-base font-semibold text-foreground">
                                Itens já na prescrição
                            </h2>
                            {!loadingList ? (
                                <span className="text-sm text-muted-foreground">
                                    {list.length === 0 ? "Nenhum item ainda" : `${list.length} medicamento(s)`}
                                </span>
                            ) : null}
                        </div>

                        {loadingList ? (
                            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Carregando itens…
                            </div>
                        ) : list.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Nenhum medicamento salvo. Use a seção <strong className="text-foreground">Lançar medicamento</strong>{" "}
                                    e clique em <strong className="text-foreground">Salvar na prescrição</strong>.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {list.map((row, idx) => (
                                    <li
                                        key={row.id}
                                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-start"
                                    >
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <p className="text-sm font-semibold leading-snug text-foreground">
                                                {idx + 1}. {row.medicineName}
                                            </p>
                                            <PrescriptionItemDetails
                                                item={row}
                                                variant="detailed"
                                                omitMedicineTitle
                                                className="border-t border-border/40 pt-2"
                                            />
                                        </div>
                                        <div className="flex shrink-0 flex-row justify-end gap-1 sm:flex-col sm:justify-start">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0"
                                                disabled={!canUse}
                                                onClick={() => openEdit(row)}
                                                aria-label="Editar medicamento"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 text-destructive hover:text-destructive"
                                                disabled={removingId === row.id || !canUse}
                                                onClick={() => void handleRemove(row.id)}
                                                aria-label="Remover medicamento"
                                            >
                                                {removingId === row.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
