"use client";

import { useState, useMemo, useCallback } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar as CalendarIcon,
    Settings,
    CalendarDays,
    List,
    Plus,
    ChevronLeft,
    ChevronRight,
    Lock
} from "lucide-react";
import Link from "next/link";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { AppointmentCalendar } from "@/components/schedule/AppointmentCalendar";
import { AppointmentSlotList } from "@/components/schedule/AppointmentSlotList";
import {
    AppointmentDetailDrawer,
    type AppointmentDetail,
} from "@/components/schedule/AppointmentDetailDrawer";
import { NewAppointmentDrawer } from "@/components/schedule/NewAppointmentDrawer";
import { DoctorScheduleBlockModal } from "@/components/schedule/DoctorScheduleBlockModal";
import type { AppointmentCardData } from "@/components/schedule/AppointmentCard";

type Doctor = { id: string; name: string | null };
type Patient = { id: string; name: string; phone: string | null };
type Specialty = { id: string; name: string };

interface ScheduleViewProps {
    appointments: AppointmentCardData[];
    doctors: Doctor[];
    patients: Patient[];
    specialties: Specialty[];
}

type ViewMode = "calendar" | "list";

export function ScheduleView({
    appointments,
    doctors,
    patients,
    specialties,
}: ScheduleViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("calendar");
    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

    // Drawers / modals
    const [newDrawerOpen, setNewDrawerOpen] = useState(false);
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] =
        useState<AppointmentDetail | null>(null);
    const [defaultSlotDate, setDefaultSlotDate] = useState<Date | undefined>();

    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

    const filteredAppointments = selectedDoctorId
        ? appointments.filter((a) => a.doctor.id === selectedDoctorId)
        : appointments;

    const handleAppointmentClick = useCallback((appt: AppointmentCardData) => {
        // Map card data to detail shape
        setSelectedAppointment({
            id: appt.id,
            scheduledAt: appt.scheduledAt,
            durationMinutes: appt.durationMinutes,
            modality: appt.modality,
            status: appt.status as AppointmentDetail["status"],
            notes: null,
            doctor: appt.doctor,
            patient: { id: appt.patient.id, name: appt.patient.name, phone: appt.patient.phone, email: null },
            specialty: appt.specialty,
        });
        setDetailDrawerOpen(true);
    }, []);

    const handleSlotClick = useCallback((date: Date) => {
        setDefaultSlotDate(date);
        setNewDrawerOpen(true);
    }, []);

    const doctorOptions = [
        { value: "", label: "Todos os médicos" },
        ...doctors.map((d) => ({ value: d.id, label: d.name })),
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Seletor de médico */}
                <div className="w-full sm:w-64">
                    <Select
                        options={doctorOptions}
                        value={doctorOptions.find((o) => o.value === selectedDoctorId) ?? doctorOptions[0]}
                        onChange={(opt) => setSelectedDoctorId(opt?.value ?? "")}
                        placeholder="Todos os médicos"
                        classNamePrefix="rs"
                    />
                </div>

                {/* Navegação de semana */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-medium px-2 min-w-[180px] text-center">
                        {format(currentWeekStart, "d MMM", { locale: ptBR })} –{" "}
                        {format(weekEnd, "d MMM yyyy", { locale: ptBR })}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                {/* View toggle + ações */}
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Button asChild variant="outline" className="hidden sm:flex">
                        <Link href="/schedule/settings">
                            <Settings className="mr-2 size-4" />
                            Configurar Agenda
                        </Link>
                    </Button>
                    {/* Toggle de visualização */}
                    <div className="flex rounded-md border overflow-hidden">
                        <Button
                            variant={viewMode === "calendar" ? "default" : "ghost"}
                            className="rounded-none rounded-l-md h-8 px-3 gap-1.5"
                            onClick={() => setViewMode("calendar")}
                        >
                            <CalendarDays className="size-3.5" />
                            Calendário
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            className="rounded-none rounded-r-md border-l h-8 px-3 gap-1.5"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="size-3.5" />
                            Lista
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-muted-foreground"
                        onClick={() => setBlockModalOpen(true)}
                    >
                        <Lock className="size-3.5" />
                        Bloquear
                    </Button>

                    <Button
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => {
                            setDefaultSlotDate(undefined);
                            setNewDrawerOpen(true);
                        }}
                    >
                        <Plus className="size-4" />
                        Novo
                    </Button>
                </div>
            </div>

            {/* Legenda de Cores e Ícones */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs bg-muted/30 px-4 py-3 rounded-lg border">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Categoria:</span>
                    <div className="flex items-center gap-1.5"><span className="flex items-center justify-center size-5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded shadow-sm text-[10px]">🏥</span><span className="text-muted-foreground font-medium">Presencial</span></div>
                    <div className="flex items-center gap-1.5"><span className="flex items-center justify-center size-5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded shadow-sm text-[10px]">💻</span><span className="text-muted-foreground font-medium">Teleconsulta</span></div>
                    <div className="flex items-center gap-1.5"><span className="flex items-center justify-center size-5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded shadow-sm text-[10px]">📞</span><span className="text-muted-foreground font-medium">Telefone</span></div>
                </div>

                <div className="hidden sm:block w-px h-4 bg-border"></div>

                <div className="flex items-center gap-3">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Status (Barra Lateral):</span>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-3.5 bg-blue-500 rounded-sm"></div><span className="text-muted-foreground font-medium">Agendado</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-3.5 bg-teal-500 rounded-sm"></div><span className="text-muted-foreground font-medium">Confirmado</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-3.5 bg-amber-500 rounded-sm"></div><span className="text-muted-foreground font-medium">Em Atend.</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-3.5 bg-green-600 rounded-sm"></div><span className="text-muted-foreground font-medium">Concluído</span></div>
                </div>
            </div>

            {/* Visualização principal */}
            {viewMode === "calendar" ? (
                <AppointmentCalendar
                    appointments={filteredAppointments}
                    weekStart={currentWeekStart}
                    onAppointmentClick={handleAppointmentClick}
                    onSlotClick={handleSlotClick}
                />
            ) : (
                <AppointmentSlotList
                    appointments={filteredAppointments}
                    startDate={currentWeekStart}
                    endDate={weekEnd}
                    onAppointmentClick={handleAppointmentClick}
                />
            )}

            {/* Drawers e Modals */}
            <NewAppointmentDrawer
                open={newDrawerOpen}
                onOpenChange={setNewDrawerOpen}
                doctors={doctors}
                patients={patients}
                specialties={specialties}
                defaultDoctorId={selectedDoctorId || undefined}
                defaultDate={defaultSlotDate}
            />

            <AppointmentDetailDrawer
                open={detailDrawerOpen}
                onOpenChange={setDetailDrawerOpen}
                appointment={selectedAppointment}
            />

            <DoctorScheduleBlockModal
                open={blockModalOpen}
                onOpenChange={setBlockModalOpen}
                doctors={doctors}
                defaultDoctorId={selectedDoctorId || undefined}
            />
        </div>
    );
}
