"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MedicationSearch } from "../MedicationSearch";
import { addPrescriptionAction, updatePrescriptionAction } from "@/app/actions/prescriptions";
import { toast } from "sonner";
import type { InferSelectModel } from "drizzle-orm";
import { prescriptions } from "@/db/schema";
import { PRESCRIPTION_ROUTE_LABELS, type PrescriptionRoute } from "@/lib/prescription-route-map";
import { addCalendarDays, parseDurationDays, toDateInputValue } from "@/lib/formatters/prescription-form-dates";

type PrescriptionRow = InferSelectModel<typeof prescriptions>;

const ROUTE_ENTRIES = Object.entries(PRESCRIPTION_ROUTE_LABELS) as [PrescriptionRoute, string][];

function emptyFormState() {
    return {
        medicationId: null as string | null,
        medicineName: "",
        dosage: "",
        pharmaceuticalForm: "",
        frequency: "",
        duration: "",
        quantity: "",
        route: "oral" as PrescriptionRoute,
        instructions: "",
        isContinuous: false,
        startDate: "",
        endDate: "",
    };
}

function stateFromRow(row: PrescriptionRow) {
    return {
        medicationId: row.medicationId,
        medicineName: row.medicineName ?? "",
        dosage: row.dosage ?? "",
        pharmaceuticalForm: row.pharmaceuticalForm ?? "",
        frequency: row.frequency ?? "",
        duration: row.duration ?? "",
        quantity: row.quantity ?? "",
        route: (row.route ?? "oral") as PrescriptionRoute,
        instructions: row.instructions ?? "",
        isContinuous: row.isContinuous ?? false,
        startDate: toDateInputValue(row.startDate),
        endDate: toDateInputValue(row.endDate),
    };
}

export type PrescriptionItemFormPanelProps = {
    /** Quando false, não sincroniza nem calcula datas (modal fechado). */
    active: boolean;
    consultationId?: string | null;
    patientId?: string | null;
    editingItem: PrescriptionRow | null;
    onClearEditing: () => void;
    onSaved: () => void | Promise<void>;
};

export function PrescriptionItemFormPanel({
    active,
    consultationId,
    patientId,
    editingItem,
    onClearEditing,
    onSaved,
}: PrescriptionItemFormPanelProps) {
    const [medicationId, setMedicationId] = useState<string | null>(null);
    const [medicineName, setMedicineName] = useState("");
    const [dosage, setDosage] = useState("");
    const [pharmaceuticalForm, setPharmaceuticalForm] = useState("");
    const [frequency, setFrequency] = useState("");
    const [duration, setDuration] = useState("");
    const [quantity, setQuantity] = useState("");
    const [route, setRoute] = useState<PrescriptionRoute>("oral");
    const [instructions, setInstructions] = useState("");
    const [isContinuous, setIsContinuous] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [saving, setSaving] = useState(false);

    const canUse = Boolean(consultationId && patientId);
    const isEdit = Boolean(editingItem);

    const applyState = (s: ReturnType<typeof emptyFormState>) => {
        setMedicationId(s.medicationId);
        setMedicineName(s.medicineName);
        setDosage(s.dosage);
        setPharmaceuticalForm(s.pharmaceuticalForm);
        setFrequency(s.frequency);
        setDuration(s.duration);
        setQuantity(s.quantity);
        setRoute(s.route);
        setInstructions(s.instructions);
        setIsContinuous(s.isContinuous);
        setStartDate(s.startDate);
        setEndDate(s.endDate);
    };

    useEffect(() => {
        if (!active) return;
        if (editingItem) {
            const s = stateFromRow(editingItem);
            setMedicationId(s.medicationId);
            setMedicineName(s.medicineName);
            setDosage(s.dosage);
            setPharmaceuticalForm(s.pharmaceuticalForm);
            setFrequency(s.frequency);
            setDuration(s.duration);
            setQuantity(s.quantity);
            setRoute(s.route);
            setInstructions(s.instructions);
            setIsContinuous(s.isContinuous);
            setStartDate(s.startDate);
            setEndDate(s.endDate);
        } else {
            const z = emptyFormState();
            setMedicationId(z.medicationId);
            setMedicineName(z.medicineName);
            setDosage(z.dosage);
            setPharmaceuticalForm(z.pharmaceuticalForm);
            setFrequency(z.frequency);
            setDuration(z.duration);
            setQuantity(z.quantity);
            setRoute(z.route);
            setInstructions(z.instructions);
            setIsContinuous(z.isContinuous);
            setStartDate(z.startDate);
            setEndDate(z.endDate);
        }
    }, [active, editingItem]);

    const catalogDraftSecondaryLine = useMemo(() => {
        const parts = [pharmaceuticalForm.trim(), dosage.trim()].filter(Boolean);
        return parts.join(" · ");
    }, [pharmaceuticalForm, dosage]);

    useEffect(() => {
        if (!active) return;
        const days = parseDurationDays(duration);
        if (!startDate || !days) return;
        const lastDay = addCalendarDays(startDate, days - 1);
        if (lastDay) setEndDate(lastDay);
    }, [active, startDate, duration]);

    const payload = () => ({
        medicationId,
        medicineName: medicineName.trim(),
        dosage: dosage.trim() || null,
        pharmaceuticalForm: pharmaceuticalForm.trim() || null,
        frequency: frequency.trim() || null,
        duration: duration.trim() || null,
        quantity: quantity.trim() || null,
        route,
        instructions: instructions.trim() || null,
        isContinuous,
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
    });

    const handleSubmit = async () => {
        if (!consultationId || !patientId) {
            toast.error("Conclua o passo inicial do atendimento (Continuar) para prescrever.");
            return;
        }
        const name = medicineName.trim();
        if (!name) {
            toast.error("Informe o nome do medicamento.");
            return;
        }
        setSaving(true);
        try {
            const body = payload();
            if (isEdit && editingItem) {
                const res = await updatePrescriptionAction(editingItem.id, consultationId, patientId, body);
                if (res.success) {
                    toast.success("Medicamento atualizado na prescrição.");
                    onClearEditing();
                    applyState(emptyFormState());
                    await onSaved();
                } else {
                    toast.error(res.error || "Não foi possível salvar.");
                }
            } else {
                const res = await addPrescriptionAction(consultationId, patientId, body);
                if (res.success) {
                    toast.success("Medicamento incluído na prescrição.");
                    applyState(emptyFormState());
                    await onSaved();
                } else {
                    toast.error(res.error || "Não foi possível salvar.");
                }
            }
        } finally {
            setSaving(false);
        }
    };

    const handleClearForm = () => {
        onClearEditing();
        applyState(emptyFormState());
    };

    return (
        <div className="space-y-4">
            {!canUse ? (
                <p className="text-sm text-muted-foreground">
                    Use <strong>Continuar</strong> no primeiro passo do atendimento para criar o encontro; em seguida você
                    poderá lançar medicamentos.
                </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2">
                {/* <p className="text-sm font-medium text-foreground">
                    {isEdit ? "Editando item da prescrição" : "Novo medicamento"}
                </p> */}
                {isEdit ? (
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={handleClearForm}>
                        Descartar edição e lançar outro
                    </Button>
                ) : null}
            </div>

            <MedicationSearch
                value={medicineName}
                onChangeName={setMedicineName}
                selectedMedicationId={medicationId}
                onClearMedicationId={() => setMedicationId(null)}
                catalogDraftSecondaryLine={catalogDraftSecondaryLine}
                formMode={isEdit ? "edit" : "add"}
                onSelectMedication={(picked) => {
                    setMedicationId(picked.medicationId);
                    setMedicineName(picked.medicineName);
                    setPharmaceuticalForm(picked.pharmaceuticalForm);
                    setRoute(picked.route);
                    if (picked.dosageHint) setDosage(picked.dosageHint);
                }}
                inputRowEnd={
                    <div className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-muted/30 px-2.5 sm:px-3">
                        <Label htmlFor="rx-panel-continuous" className="mb-0 text-sm font-medium leading-none">
                            Uso contínuo
                        </Label>
                        <Switch
                            id="rx-panel-continuous"
                            checked={isContinuous}
                            onCheckedChange={setIsContinuous}
                            className="shrink-0"
                        />
                    </div>
                }
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                    <Label htmlFor="rx-panel-dosage">Dosagem</Label>
                    <Input
                        id="rx-panel-dosage"
                        placeholder="Ex.: 500 mg"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="rx-panel-form">Forma farmacêutica</Label>
                    <Input
                        id="rx-panel-form"
                        placeholder="Ex.: comprimido"
                        value={pharmaceuticalForm}
                        onChange={(e) => setPharmaceuticalForm(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Via de administração</Label>
                    <Select value={route} onValueChange={(v) => setRoute(v as PrescriptionRoute)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ROUTE_ENTRIES.map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="rx-panel-freq">Frequência</Label>
                    <Input
                        id="rx-panel-freq"
                        placeholder="Ex.: 8/8 h"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="rx-panel-dur">Duração</Label>
                    <Input
                        id="rx-panel-dur"
                        placeholder="Ex.: 7 dias"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="rx-panel-qty">Quantidade</Label>
                    <Input
                        id="rx-panel-qty"
                        placeholder="Ex.: 12 comprimidos"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="rx-panel-start">Início</Label>
                    <Input id="rx-panel-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="rx-panel-end">Fim</Label>
                    <Input id="rx-panel-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="rx-panel-instructions">Instruções ao paciente</Label>
                <Textarea
                    id="rx-panel-instructions"
                    placeholder="Orientações de uso, jejum, interações, etc."
                    className="min-h-[88px]"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <Button type="button" disabled={!canUse || saving} onClick={() => void handleSubmit()}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando…
                        </>
                    ) : isEdit ? (
                        "Atualizar na prescrição"
                    ) : (
                        "Salvar na prescrição"
                    )}
                </Button>
            </div>
        </div>
    );
}
