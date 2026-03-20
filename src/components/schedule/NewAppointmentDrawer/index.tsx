"use client";

import { useState, useTransition } from "react";
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

type Doctor = { id: string; name: string | null; relationshipType: "linked" | "partner" | null };
type Patient = { id: string; name: string; phone: string | null };
type Specialty = { id: string; name: string };
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
    specialties: Specialty[];
    defaultDoctorId?: string;
    defaultDate?: Date;
}

export function NewAppointmentDrawer({
    open,
    onOpenChange,
    doctors,
    patients,
    specialties,
    defaultDoctorId,
    defaultDate,
}: NewAppointmentDrawerProps) {
    const [isPending, startTransition] = useTransition();

    const [doctorId, setDoctorId] = useState(defaultDoctorId ?? "");
    const [patientId, setPatientId] = useState("");
    const [specialtyId, setSpecialtyId] = useState("");
    const [date, setDate] = useState(
        defaultDate ? defaultDate.toISOString().split("T")[0] : ""
    );
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [modality, setModality] = useState<(typeof appointmentModalityValues)[number]>("in_person");
    const [notes, setNotes] = useState("");
    
    // timeZone atual do navegador
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    async function handleDateChange(newDate: string) {
        setDate(newDate);
        setSelectedSlot(null);
        if (!doctorId || !newDate) return;
        setLoadingSlots(true);
        const res = await getAvailableSlotsAction(doctorId, newDate, timeZone);
        setLoadingSlots(false);
        if ("slots" in res && res.slots) {
            // Server returns Date objects serialized as strings via JSON
            setSlots(res.slots.map((s) => ({
                startsAt: new Date(s.startsAt).toISOString(),
                endsAt: new Date(s.endsAt).toISOString(),
                available: s.available,
            })));
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
            setSlots(res.slots.map((s) => ({
                startsAt: new Date(s.startsAt).toISOString(),
                endsAt: new Date(s.endsAt).toISOString(),
                available: s.available,
            })));
        }
    }

    function handleSubmit() {
        if (!patientId || !doctorId || !selectedSlot || !modality) return;

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
            if (specialtyId) formData.set("specialtyId", specialtyId);
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
        setSpecialtyId("");
        setDate(defaultDate ? defaultDate.toISOString().split("T")[0] : "");
        setSlots([]);
        setSelectedSlot(null);
        setModality("in_person");
        setNotes("");
    }

    const doctorOptions = doctors.map((d) => ({ value: d.id, label: d.name }));
    const patientOptions = patients.map((p) => ({ value: p.id, label: p.name }));
    const specialtyOptions = [
        { value: "", label: "Sem especialidade" },
        ...specialties.map((s) => ({ value: s.id, label: s.name })),
    ];

    const availableSlots = slots.filter((s) => s.available);
    const isFormValid = patientId && doctorId && selectedSlot && modality;

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

                    {/* Sessão 1: Pessoas */}
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
                                <Select
                                    placeholder="Buscar médico..."
                                    options={doctorOptions}
                                    value={doctorOptions.find((o) => o.value === doctorId) ?? null}
                                    onChange={(opt) => handleDoctorChange(opt?.value ?? "")}
                                    classNamePrefix="rs"
                                    styles={{
                                        control: (base) => ({ ...base, borderColor: 'hsl(var(--border))', borderRadius: '0.375rem', padding: '2px', boxShadow: 'none' })
                                    }}
                                />
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
                                        control: (base) => ({ ...base, borderColor: 'hsl(var(--border))', borderRadius: '0.375rem', padding: '2px', boxShadow: 'none' })
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sessão 2: Data e Hora */}
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
                                                            onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                                            className={`
                                                                rounded-md px-3 py-1.5 text-sm font-medium border transition-all duration-200
                                                                ${isSelected
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
                                                {format(new Date(selectedSlot.startsAt), "EEEE, dd/MM", { locale: ptBR })}
                                            </span>
                                            <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {format(new Date(selectedSlot.startsAt), "HH:mm")} – {format(new Date(selectedSlot.endsAt), "HH:mm")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sessão 3: Detalhes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary">
                                <span className="text-xs font-bold">3</span>
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Detalhes</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2 sm:col-span-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                    Modalidade *
                                </Label>
                                <ShadSelect
                                    value={modality}
                                    onValueChange={(v) => setModality(v as (typeof appointmentModalityValues)[number])}
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

                            {specialties.length > 0 && (
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                        Especialidade
                                    </Label>
                                    <ShadSelect
                                        value={specialtyId}
                                        onValueChange={setSpecialtyId}
                                    >
                                        <SelectTrigger className="bg-card shadow-sm h-10 text-left">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sem especialidade</SelectItem>
                                            {specialties.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </ShadSelect>
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
