"use client";

import { useState } from "react";
import Select from "react-select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createCheckInAction } from "@/app/actions/check-ins";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select as ShadSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Option = {
    value: string;
    label: string;
};

interface AddCheckInDialogProps {
    patients: { id: string; name: string }[];
    serviceTypes: { id: string; name: string }[];
    healthInsurances: { id: string; name: string }[];
    scoreItems: { id: string; name: string; score: number }[];
}

export function AddCheckInDialog({
    patients,
    serviceTypes,
    healthInsurances,
    scoreItems,
}: AddCheckInDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [patientId, setPatientId] = useState("");
    const [serviceTypeId, setServiceTypeId] = useState("");
    const [healthInsuranceId, setHealthInsuranceId] = useState("");
    const [scoreItemId, setScoreItemId] = useState("");
    const [notes, setNotes] = useState("");

    const patientOptions: Option[] = patients.map((patient) => ({
        value: patient.id,
        label: patient.name,
    }));

    function resetForm() {
        setPatientId("");
        setServiceTypeId("");
        setHealthInsuranceId("");
        setScoreItemId("");
        setNotes("");
    }

    async function handleSubmit() {
        setIsPending(true);
        try {
            const result = await createCheckInAction({
                patientId,
                serviceTypeId,
                healthInsuranceId: healthInsuranceId || "",
                scoreItemId,
                notes,
            });

            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao registrar check-in");
                return;
            }

            toast.success("Check-in registrado com sucesso!");
            resetForm();
            setOpen(false);
        } catch {
            toast.error("Erro ao registrar check-in");
        } finally {
            setIsPending(false);
        }
    }

    const isFormValid = patientId && serviceTypeId && scoreItemId;

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) {
                    resetForm();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Check-in
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <div className="space-y-1">
                    <DialogTitle>Novo Check-in</DialogTitle>
                    <DialogDescription>
                        Registre a chegada do paciente e classifique o atendimento da recepção.
                    </DialogDescription>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label>Paciente</Label>
                        <Select
                            placeholder="Buscar paciente..."
                            options={patientOptions}
                            value={patientOptions.find((option) => option.value === patientId) ?? null}
                            onChange={(option) => setPatientId(option?.value ?? "")}
                            classNamePrefix="rs"
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "0.5rem",
                                    padding: "2px",
                                    boxShadow: "none",
                                }),
                            }}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Tipo de Atendimento</Label>
                            <ShadSelect value={serviceTypeId} onValueChange={setServiceTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {serviceTypes.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </ShadSelect>
                        </div>

                        <div className="space-y-2">
                            <Label>Convênio</Label>
                            <ShadSelect value={healthInsuranceId || "__none__"} onValueChange={(value) => setHealthInsuranceId(value === "__none__" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o convênio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Particular / Sem convênio</SelectItem>
                                    {healthInsurances.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </ShadSelect>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Pontuação</Label>
                        <ShadSelect value={scoreItemId} onValueChange={setScoreItemId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a pontuação" />
                            </SelectTrigger>
                            <SelectContent>
                                {scoreItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name} ({item.score} pontos)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </ShadSelect>
                    </div>

                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            placeholder="Informações adicionais da recepção"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" disabled={!isFormValid || isPending} onClick={handleSubmit}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar Check-in
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
