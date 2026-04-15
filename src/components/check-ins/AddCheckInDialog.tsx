"use client";

import { useState } from "react";
import Select from "react-select";
import {
    Loader2,
    Plus,
    Stethoscope,
    Scissors,
    FlaskConical,
    Video,
    ClipboardList,
    Microscope,
    FileText,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Option = {
    value: string;
    label: string;
};

interface AddCheckInDialogProps {
    patients: { id: string; name: string }[];
    serviceTypes: { id: string; name: string; workflow: string }[];
    healthInsurances: { id: string; name: string }[];
    doctors: { id: string; name: string | null }[];
}

function getServiceTypeIcon(name: string, workflow: string) {
    const lower = name.toLowerCase();
    if (lower.includes("video") || lower.includes("vídeo")) return Video;
    if (lower.includes("ciru")) return Scissors;
    if (lower.includes("exam") || lower.includes("exame")) return FlaskConical;
    if (workflow === "consultation") return Stethoscope;
    if (workflow === "surgery") return Scissors;
    if (workflow === "procedure") return ClipboardList;
    if (workflow === "exam_review") return Microscope;
    return FileText;
}

export function AddCheckInDialog({ patients, serviceTypes, healthInsurances, doctors }: AddCheckInDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [patientId, setPatientId] = useState("");
    const [serviceTypeId, setServiceTypeId] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [healthInsuranceId, setHealthInsuranceId] = useState("");
    const [notes, setNotes] = useState("");

    const patientOptions: Option[] = patients.map((patient) => ({
        value: patient.id,
        label: patient.name,
    }));

    const doctorOptions: Option[] = doctors.map((d) => ({
        value: d.id,
        label: d.name?.trim() ? `Dr(a). ${d.name}` : "Médico sem nome",
    }));

    const healthInsuranceOptions: Option[] = [
        { value: "", label: "Particular / Sem convênio" },
        ...healthInsurances.map((item) => ({ value: item.id, label: item.name })),
    ];

    function resetForm() {
        setPatientId("");
        setServiceTypeId("");
        setDoctorId("");
        setHealthInsuranceId("");
        setNotes("");
    }

    async function handleSubmit() {
        setIsPending(true);
        try {
            const result = await createCheckInAction({
                patientId,
                serviceTypeId,
                doctorId,
                healthInsuranceId: healthInsuranceId || "",
                notes,
            });

            if (!result.success) {
                toast.error(typeof result.error === "string" ? result.error : "Erro ao registrar check-in");
                return;
            }

            toast.success("Check-in registrado. O paciente entrou na fila de atendimento do médico.");
            resetForm();
            setOpen(false);
        } catch {
            toast.error("Erro ao registrar check-in");
        } finally {
            setIsPending(false);
        }
    }

    const isFormValid = Boolean(patientId && serviceTypeId && doctorId);

    const reactSelectStyles = {
        container: (base: Record<string, unknown>) => ({
            ...base,
            width: "100%",
        }),
        control: (base: Record<string, unknown>) => ({
            ...base,
            width: "100%",
            borderColor: "hsl(var(--border))",
            borderRadius: "0.5rem",
            padding: "2px",
            boxShadow: "none",
            "&:hover": { borderColor: "hsl(var(--border))" },
        }),
        menu: (base: Record<string, unknown>) => ({
            ...base,
            zIndex: 50,
        }),
    };

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
            <DialogContent className="flex max-h-[90vh] flex-col overflow-y-auto sm:max-w-2xl">
                <div className="space-y-1">
                    <DialogTitle>Novo Check-in</DialogTitle>
                    <DialogDescription>
                        Registre a chegada do paciente, o tipo de atendimento, o médico e o convênio.
                    </DialogDescription>
                </div>

                <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">
                            Tipo de atendimento <span className="text-destructive">*</span>
                        </Label>
                        <div
                            className={cn(
                                "grid gap-3",
                                serviceTypes.length <= 2
                                    ? "grid-cols-2"
                                    : serviceTypes.length === 3
                                      ? "grid-cols-3"
                                      : "grid-cols-2 sm:grid-cols-4"
                            )}
                        >
                            {serviceTypes.map((st) => {
                                const Icon = getServiceTypeIcon(st.name, st.workflow);
                                const isSelected = serviceTypeId === st.id;
                                return (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => setServiceTypeId(st.id)}
                                        className={cn(
                                            "group relative flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 px-3 py-4 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                            isSelected
                                                ? "border-primary bg-primary/8 shadow-sm"
                                                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200",
                                                isSelected
                                                    ? "bg-primary/15 text-primary"
                                                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span
                                            className={cn(
                                                "text-xs font-semibold leading-tight sm:text-sm",
                                                isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                                            )}
                                        >
                                            {st.name}
                                        </span>
                                        {isSelected ? (
                                            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                                ✓
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Paciente <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            placeholder="Buscar paciente..."
                            options={patientOptions}
                            value={patientOptions.find((option) => option.value === patientId) ?? null}
                            onChange={(option) => setPatientId(option?.value ?? "")}
                            classNamePrefix="rs"
                            styles={reactSelectStyles}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Médico <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            placeholder="Selecione o médico..."
                            options={doctorOptions}
                            value={doctorOptions.find((option) => option.value === doctorId) ?? null}
                            onChange={(option) => setDoctorId(option?.value ?? "")}
                            classNamePrefix="rs"
                            styles={reactSelectStyles}
                            isDisabled={doctors.length === 0}
                        />
                        {doctors.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Nenhum médico vinculado ativo nesta clínica (parceiros não aparecem aqui).
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Convênio</Label>
                        <Select
                            placeholder="Particular / Sem convênio"
                            options={healthInsuranceOptions}
                            value={
                                healthInsuranceOptions.find((option) => option.value === healthInsuranceId) ??
                                healthInsuranceOptions[0] ??
                                null
                            }
                            onChange={(option) => setHealthInsuranceId(option?.value ?? "")}
                            classNamePrefix="rs"
                            styles={reactSelectStyles}
                            isClearable={false}
                        />
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

                <DialogFooter className="gap-2 sm:gap-0">
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
