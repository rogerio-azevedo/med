"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
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
import { getAvailableSlotsAction, updateAppointmentAction } from "@/app/actions/appointments";
import { appointmentModalityValues } from "@/validations/appointments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { accentInsensitiveSelectFilter } from "@/lib/search-normalize";
import { cn } from "@/lib/utils";
import { resolveServiceTypeDisplayIcon } from "@/lib/formatters/resolve-service-type-display";

type Doctor = { id: string; name: string | null; relationshipType: "linked" | "partner" | null };
type Patient = { id: string; name: string; phone: string | null };
type ServiceTypeOption = {
    id: string;
    name: string;
    workflow: string;
    timelineIconKey: string | null;
    timelineColorHex: string | null;
};

export type AppointmentForEdit = {
    id: string;
    scheduledAt: Date | string;
    durationMinutes: number;
    modality: string;
    notes: string | null;
    doctor: { id: string; name: string | null };
    patient: { id: string; name: string; phone: string | null; email: string | null };
    specialty: { id: string; name: string } | null;
    serviceType: {
        id: string;
        name: string;
        workflow: string;
        timelineIconKey: string | null;
        timelineColorHex: string | null;
    } | null;
};

type TimeSlot = { startsAt: string; endsAt: string; available: boolean };

const modalityLabels: Record<(typeof appointmentModalityValues)[number], string> = {
    in_person: "Presencial",
    remote: "Teleconsulta",
    phone: "Telefone",
    whatsapp: "WhatsApp",
};

interface EditAppointmentDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: AppointmentForEdit | null;
    doctors: Doctor[];
    patients: Patient[];
    serviceTypes: ServiceTypeOption[];
    onSuccess?: () => void;
}

export function EditAppointmentDrawer({
    open,
    onOpenChange,
    appointment,
    doctors,
    patients,
    serviceTypes,
    onSuccess,
}: EditAppointmentDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const [doctorId, setDoctorId] = useState("");
    const [patientId, setPatientId] = useState("");
    const [serviceTypeId, setServiceTypeId] = useState("");
    const [specialtyId, setSpecialtyId] = useState("");
    const [date, setDate] = useState("");
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [modality, setModality] = useState<(typeof appointmentModalityValues)[number]>("in_person");
    const [notes, setNotes] = useState("");

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fetchSlots = useCallback(
        async (
            docId: string,
            dateStr: string,
            apptId: string,
            /** Garante que o horário atual do agendamento apareça na lista (ex.: fora da grade padrão). */
            currentSlot?: { startsAt: string; endsAt: string }
        ) => {
            if (!docId || !dateStr) return;
            setLoadingSlots(true);
            const res = await getAvailableSlotsAction(docId, dateStr, timeZone, apptId);
            setLoadingSlots(false);
            if ("slots" in res && res.slots) {
                let mapped: TimeSlot[] = res.slots.map((s) => ({
                    startsAt: new Date(s.startsAt).toISOString(),
                    endsAt: new Date(s.endsAt).toISOString(),
                    available: s.available,
                }));
                if (currentSlot) {
                    const exists = mapped.some(
                        (s) => s.startsAt === currentSlot.startsAt && s.endsAt === currentSlot.endsAt
                    );
                    if (!exists) {
                        mapped = [{ ...currentSlot, available: true }, ...mapped];
                    }
                }
                setSlots(mapped);
            }
        },
        [timeZone]
    );

    useEffect(() => {
        if (!open || !appointment) return;
        const docId = appointment.doctor.id;
        const dateStr = format(new Date(appointment.scheduledAt), "yyyy-MM-dd");
        setDoctorId(docId);
        setPatientId(appointment.patient.id);
        setServiceTypeId(appointment.serviceType?.id ?? "");
        setSpecialtyId(appointment.specialty?.id ?? "");
        setDate(dateStr);
        setModality(
            appointmentModalityValues.includes(appointment.modality as (typeof appointmentModalityValues)[number])
                ? (appointment.modality as (typeof appointmentModalityValues)[number])
                : "in_person"
        );
        setNotes(appointment.notes ?? "");
        const startIso = new Date(appointment.scheduledAt).toISOString();
        const endIso = new Date(
            new Date(appointment.scheduledAt).getTime() + appointment.durationMinutes * 60_000
        ).toISOString();
        setSelectedSlot({
            startsAt: startIso,
            endsAt: endIso,
            available: true,
        });
        void fetchSlots(docId, dateStr, appointment.id, { startsAt: startIso, endsAt: endIso });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- só reidratar ao abrir / trocar agendamento
    }, [open, appointment?.id, fetchSlots]);

    async function handleDateChange(newDate: string) {
        if (!appointment) return;
        setDate(newDate);
        setSelectedSlot(null);
        if (!doctorId || !newDate) return;
        await fetchSlots(doctorId, newDate, appointment.id);
    }

    async function handleDoctorChange(id: string) {
        if (!appointment) return;
        setDoctorId(id);
        setSelectedSlot(null);
        if (!date || !id) return;
        await fetchSlots(id, date, appointment.id);
    }

    function handleSubmit() {
        if (!appointment || !patientId || !doctorId || !selectedSlot || !modality) return;
        if (serviceTypes.length > 0 && !serviceTypeId) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.set("id", appointment.id);
            formData.set("patientId", patientId);
            formData.set("doctorId", doctorId);
            formData.set("scheduledAt", selectedSlot.startsAt);
            const durationMs =
                new Date(selectedSlot.endsAt).getTime() - new Date(selectedSlot.startsAt).getTime();
            formData.set("durationMinutes", String(durationMs / 60000));
            formData.set("modality", modality);
            if (serviceTypeId) formData.set("serviceTypeId", serviceTypeId);
            if (specialtyId) formData.set("specialtyId", specialtyId);
            if (notes) formData.set("notes", notes);

            const result = await updateAppointmentAction(formData);

            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Agendamento atualizado!");
                onSuccess?.();
                onOpenChange(false);
            }
        });
    }

    const doctorOptions = doctors.map((d) => ({ value: d.id, label: d.name }));
    const patientOptions = patients.map((p) => ({ value: p.id, label: p.name }));
    const availableSlots = slots.filter((s) => s.available);
    const needsServiceType = serviceTypes.length > 0;
    const isFormValid =
        Boolean(patientId && doctorId && selectedSlot && modality) &&
        (!needsServiceType || Boolean(serviceTypeId));

    if (!appointment) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col w-full sm:max-w-md overflow-hidden bg-background p-0">
                <SheetHeader className="px-6 py-5 border-b bg-card">
                    <SheetTitle className="text-xl">Editar agendamento</SheetTitle>
                    <SheetDescription className="text-sm">
                        Ajuste horário, participantes ou detalhes. O horário atual permanece disponível na
                        lista.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/30">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                            Participantes
                        </h3>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                Médico responsável *
                            </Label>
                            <Select
                                placeholder="Buscar médico..."
                                options={doctorOptions}
                                value={doctorOptions.find((o) => o.value === doctorId) ?? null}
                                onChange={(opt) => handleDoctorChange(opt?.value ?? "")}
                                filterOption={accentInsensitiveSelectFilter}
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
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                Paciente *
                            </Label>
                            <Select
                                placeholder="Buscar paciente..."
                                options={patientOptions}
                                value={patientOptions.find((o) => o.value === patientId) ?? null}
                                onChange={(opt) => setPatientId(opt?.value ?? "")}
                                filterOption={accentInsensitiveSelectFilter}
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

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                            Data e horário
                        </h3>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                <CalendarIcon className="size-3.5" />
                                Data *
                            </Label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => void handleDateChange(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                            />
                        </div>

                        {date && doctorId && (
                            <div className="space-y-2 p-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    Horário *
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
                                                        className={cn(
                                                            "rounded-md px-3 py-1.5 text-sm font-medium border transition-all duration-200",
                                                            isSelected
                                                                ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-[1.02]"
                                                                : "bg-background border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                                                        )}
                                                    >
                                                        {format(start, "HH:mm")}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                {selectedSlot && (
                                    <div className="mt-2 text-xs flex items-center justify-between text-muted-foreground px-1">
                                        <span>
                                            {format(new Date(selectedSlot.startsAt), "EEEE, dd/MM", {
                                                locale: ptBR,
                                            })}
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

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Detalhes</h3>
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

                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                Observações
                            </Label>
                            <Textarea
                                placeholder="Notas internas..."
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
                        Fechar
                    </Button>
                    <Button
                        className="w-full sm:w-auto shadow-md"
                        onClick={handleSubmit}
                        disabled={!isFormValid || isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Salvar alterações"
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
