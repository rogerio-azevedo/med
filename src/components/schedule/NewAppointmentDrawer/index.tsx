"use client";

import { useState, useTransition, useEffect } from "react";
import Select from "react-select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select as ShadSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAvailableSlotsAction, createAppointmentAction } from "@/app/actions/appointments";
import { appointmentModalityValues } from "@/lib/validations/appointments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AddPatientDialog } from "@/components/patients/AddPatientDialog";
import { cn } from "@/lib/utils";
import { resolveServiceTypeDisplayIcon } from "@/lib/resolve-service-type-display";

type Doctor = { id: string; name: string | null; relationshipType: "linked" | "partner" | null };
type Patient = { id: string; name: string; phone: string | null };
type ServiceTypeOption = {
    id: string;
    name: string;
    workflow: string;
    timelineIconKey: string | null;
    timelineColorHex: string | null;
};
type TimeSlot = { startsAt: string; endsAt: string; available: boolean };

const modalityLabels: Record<(typeof appointmentModalityValues)[number], string> = {
    in_person: "Presencial",
    remote: "Teleconsulta",
    phone: "Telefone",
    whatsapp: "WhatsApp",
};

interface NewAppointmentDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doctors: Doctor[];
    patients: Patient[];
    serviceTypes: ServiceTypeOption[];
    defaultDoctorId?: string;
    defaultDate?: Date;
}

export function NewAppointmentDrawer({
    open,
    onOpenChange,
    doctors,
    patients,
    serviceTypes,
    defaultDoctorId,
    defaultDate,
}: NewAppointmentDrawerProps) {
    const [isPending, startTransition] = useTransition();

    const [doctorId, setDoctorId] = useState(defaultDoctorId ?? "");
    const [patientId, setPatientId] = useState("");
    const [serviceTypeId, setServiceTypeId] = useState("");
    const [date, setDate] = useState(
        defaultDate ? defaultDate.toISOString().split("T")[0] : ""
    );
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [modality, setModality] = useState<(typeof appointmentModalityValues)[number]>("in_person");
    const [notes, setNotes] = useState("");

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const hasNonMidnightTime = (d: Date) => d.getHours() !== 0 || d.getMinutes() !== 0;

    const [shouldAutoSelectSlot, setShouldAutoSelectSlot] = useState(false);

    useEffect(() => {
        const newDate = defaultDate ? format(defaultDate, "yyyy-MM-dd") : "";
        setDate(newDate);
        setDoctorId(defaultDoctorId ?? "");
        setSelectedSlot(null);
        setSlots([]);

        if (defaultDate && hasNonMidnightTime(defaultDate)) {
            setShouldAutoSelectSlot(true);
        } else {
            setShouldAutoSelectSlot(false);
        }
    }, [defaultDate, defaultDoctorId]);

    function autoSelectSlot(fetchedSlots: TimeSlot[]) {
        if (!shouldAutoSelectSlot || !defaultDate) return;

        const targetTime = format(defaultDate, "HH:mm");
        const matchingSlot = fetchedSlots.find(
            (s) => s.available && format(new Date(s.startsAt), "HH:mm") === targetTime
        );

        if (matchingSlot) {
            setSelectedSlot(matchingSlot);
        }
        setShouldAutoSelectSlot(false);
    }

    async function handleDateChange(newDate: string) {
        setDate(newDate);
        setSelectedSlot(null);
        if (!doctorId || !newDate) return;
        setLoadingSlots(true);
        const res = await getAvailableSlotsAction(doctorId, newDate, timeZone);
        setLoadingSlots(false);
        if ("slots" in res && res.slots) {
            const fetchedSlots: TimeSlot[] = res.slots.map((s) => ({
                startsAt: new Date(s.startsAt).toISOString(),
                endsAt: new Date(s.endsAt).toISOString(),
                available: s.available,
            }));
            setSlots(fetchedSlots);
            autoSelectSlot(fetchedSlots);
        }
    }

    async function handleDoctorChange(id: string) {
        setDoctorId(id);
        setSelectedSlot(null);
        if (!date || !id) return;
        setLoadingSlots(true);
        const res = await getAvailableSlotsAction(id, date, timeZone);
        setLoadingSlots(false);
        if ("slots" in res && res.slots) {
            const fetchedSlots: TimeSlot[] = res.slots.map((s) => ({
                startsAt: new Date(s.startsAt).toISOString(),
                endsAt: new Date(s.endsAt).toISOString(),
                available: s.available,
            }));
            setSlots(fetchedSlots);
            autoSelectSlot(fetchedSlots);
        }
    }

    function handleSubmit() {
        if (!patientId || !doctorId || !selectedSlot || !modality) return;
        if (serviceTypes.length > 0 && !serviceTypeId) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.set("patientId", patientId);
            formData.set("doctorId", doctorId);
            formData.set("scheduledAt", selectedSlot.startsAt);
            const durationMs =
                new Date(selectedSlot.endsAt).getTime() -
                new Date(selectedSlot.startsAt).getTime();
            formData.set("durationMinutes", String(durationMs / 60000));
            formData.set("modality", modality);
            if (serviceTypeId) formData.set("serviceTypeId", serviceTypeId);
            if (notes) formData.set("notes", notes);

            const result = await createAppointmentAction(formData);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Agendamento criado com sucesso!");
                onOpenChange(false);
                resetForm();
            }
        });
    }

    function resetForm() {
        setDoctorId(defaultDoctorId ?? "");
        setPatientId("");
        setServiceTypeId("");
        setDate(defaultDate ? defaultDate.toISOString().split("T")[0] : "");
        setSlots([]);
        setSelectedSlot(null);
        setModality("in_person");
        setNotes("");
    }

    const doctorOptions = doctors.map((d) => ({ value: d.id, label: d.name }));
    const patientOptions = patients.map((p) => ({ value: p.id, label: p.name }));

    const availableSlots = slots.filter((s) => s.available);
    const needsServiceType = serviceTypes.length > 0;
    const isFormValid =
        Boolean(patientId && doctorId && selectedSlot && modality) &&
        (!needsServiceType || Boolean(serviceTypeId));

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col w-full sm:max-w-md overflow-hidden bg-background p-0">
                <SheetHeader className="px-6 py-5 border-b bg-card">
                    <SheetTitle className="text-xl">Agendar Consulta</SheetTitle>
                    <SheetDescription className="text-sm">
                        Preencha os dados abaixo para reservar um horário.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/30">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary">
                                <span className="text-xs font-bold">1</span>
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Participantes</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    Médico Responsável *
                                </Label>
                                {doctors.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        Nenhum médico vinculado ativo nesta clínica (parceiros não aparecem
                                        aqui).
                                    </p>
                                ) : (
                                    <Select
                                        placeholder="Buscar médico..."
                                        options={doctorOptions}
                                        value={doctorOptions.find((o) => o.value === doctorId) ?? null}
                                        onChange={(opt) => handleDoctorChange(opt?.value ?? "")}
                                        classNamePrefix="rs"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderColor: "hsl(var(--border))",
                                                borderRadius: "0.375rem",
                                                padding: "2px",
                                                boxShadow: "none",
                                            }),
                                        }}
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                        Paciente *
                                    </Label>
                                    <AddPatientDialog doctors={doctors} onSuccess={(id) => setPatientId(id)}>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-primary hover:bg-primary/10 gap-1 rounded-sm"
                                        >
                                            <Plus className="size-3" />
                                            Novo Paciente
                                        </Button>
                                    </AddPatientDialog>
                                </div>
                                <Select
                                    placeholder="Buscar paciente..."
                                    options={patientOptions}
                                    value={patientOptions.find((o) => o.value === patientId) ?? null}
                                    onChange={(opt) => setPatientId(opt?.value ?? "")}
                                    classNamePrefix="rs"
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderColor: "hsl(var(--border))",
                                            borderRadius: "0.375rem",
                                            padding: "2px",
                                            boxShadow: "none",
                                        }),
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary">
                                <span className="text-xs font-bold">2</span>
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Data e Horário</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    <CalendarIcon className="size-3.5" />
                                    Data da Consulta *
                                </Label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                />
                            </div>

                            {date && doctorId && (
                                <div className="space-y-2 p-1">
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                        Selecione um Horário *
                                    </Label>

                                    <div className="min-h-[100px] border rounded-md bg-card p-3 shadow-sm">
                                        {loadingSlots ? (
                                            <div className="flex flex-col items-center justify-center h-[100px] gap-2 text-muted-foreground">
                                                <Loader2 className="size-5 animate-spin text-primary" />
                                                <span className="text-xs">Buscando horários...</span>
                                            </div>
                                        ) : availableSlots.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground">
                                                <CalendarIcon className="size-6 mb-2 opacity-20" />
                                                <span className="text-sm">Nenhum horário disponível.</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                                {availableSlots.map((slot) => {
                                                    const start = new Date(slot.startsAt);
                                                    const isSelected = selectedSlot?.startsAt === slot.startsAt;
                                                    return (
                                                        <button
                                                            key={slot.startsAt}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedSlot(isSelected ? null : slot)
                                                            }
                                                            className={`
                                                                rounded-md px-3 py-1.5 text-sm font-medium border transition-all duration-200
                                                                ${
                                                                    isSelected
                                                                        ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-[1.02]"
                                                                        : "bg-background border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                                                                }
                                                            `}
                                                        >
                                                            {format(start, "HH:mm")}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {selectedSlot && (
                                        <div className="mt-2 text-xs flex items-center justify-between text-muted-foreground px-1 animate-in fade-in slide-in-from-top-1">
                                            <span>
                                                {format(
                                                    new Date(selectedSlot.startsAt),
                                                    "EEEE, dd/MM",
                                                    { locale: ptBR }
                                                )}
                                            </span>
                                            <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {format(new Date(selectedSlot.startsAt), "HH:mm")} –{" "}
                                                {format(new Date(selectedSlot.endsAt), "HH:mm")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary">
                                <span className="text-xs font-bold">3</span>
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Detalhes</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    Modalidade *
                                </Label>
                                <ShadSelect
                                    value={modality}
                                    onValueChange={(v) =>
                                        setModality(v as (typeof appointmentModalityValues)[number])
                                    }
                                >
                                    <SelectTrigger className="bg-card shadow-sm h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {appointmentModalityValues.map((m) => (
                                            <SelectItem key={m} value={m}>
                                                {modalityLabels[m]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </ShadSelect>
                            </div>

                            {serviceTypes.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                        Tipo de atendimento *
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
                                            const Icon = resolveServiceTypeDisplayIcon({
                                                name: st.name,
                                                workflow: st.workflow,
                                                timelineIconKey: st.timelineIconKey,
                                            });
                                            const isSelected = serviceTypeId === st.id;
                                            const accent = st.timelineColorHex ?? undefined;
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
                                                        style={
                                                            accent
                                                                ? {
                                                                      color: accent,
                                                                      backgroundColor: isSelected
                                                                          ? `${accent}22`
                                                                          : undefined,
                                                                  }
                                                                : undefined
                                                        }
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "text-xs font-semibold leading-tight sm:text-sm",
                                                            isSelected
                                                                ? "text-primary"
                                                                : "text-foreground group-hover:text-primary"
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
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                Observações
                            </Label>
                            <Textarea
                                placeholder="Notas internas ou motivo da consulta..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="resize-none bg-card shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 bg-card border-t flex-col sm:flex-row gap-3">
                    <Button
                        variant="ghost"
                        className="w-full sm:w-auto hover:bg-muted"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="w-full sm:w-auto shadow-md"
                        onClick={handleSubmit}
                        disabled={!isFormValid || isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Validando...
                            </>
                        ) : (
                            "Confirmar Reserva"
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
