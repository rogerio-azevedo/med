"use client";

import { useState, useCallback, useEffect, useLayoutEffect } from "react";
import {
    format,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfDay,
    endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Settings,
    CalendarDays,
    List,
    ChevronLeft,
    ChevronRight,
    Lock,
    Calendar,
    LayoutGrid,
    Plus,
} from "lucide-react";
import Link from "next/link";
import Select from "react-select";
import { accentInsensitiveSelectFilter } from "@/lib/search-normalize";
import { Button } from "@/components/ui/button";
import { AppointmentCalendar } from "@/components/schedule/AppointmentCalendar";
import { AppointmentSlotList } from "@/components/schedule/AppointmentSlotList";
import { AppointmentMonthView } from "@/components/schedule/AppointmentMonthView";
import {
    AppointmentDetailDrawer,
    type AppointmentDetail,
} from "@/components/schedule/AppointmentDetailDrawer";
import { NewAppointmentDrawer } from "@/components/schedule/NewAppointmentDrawer";
import { DoctorScheduleBlockModal } from "@/components/schedule/DoctorScheduleBlockModal";
import type { AppointmentCardData } from "@/components/schedule/AppointmentCard";
import { listScheduleAppointmentsAction } from "@/app/actions/appointments";
import { useHeaderStore } from "@/store/header";

type Doctor = { id: string; name: string | null; relationshipType: "linked" | "partner" | null };
type Patient = { id: string; name: string; phone: string | null };

export type ScheduleServiceTypeOption = {
    id: string;
    name: string;
    workflow: string;
    timelineIconKey: string | null;
    timelineColorHex: string | null;
};

interface ScheduleViewProps {
    pageTitle: string;
    pageDescription: string;
    appointments: AppointmentCardData[];
    doctors: Doctor[];
    patients: Patient[];
    serviceTypes: ScheduleServiceTypeOption[];
}

type TimeGranularity = "day" | "week" | "month";
type PlannerLayout = "calendar" | "list";

function getRange(anchor: Date, g: TimeGranularity) {
    if (g === "day") {
        return { start: startOfDay(anchor), end: endOfDay(anchor) };
    }
    if (g === "week") {
        return {
            start: startOfWeek(anchor, { weekStartsOn: 1 }),
            end: endOfWeek(anchor, { weekStartsOn: 1 }),
        };
    }
    return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

function shiftAnchor(anchor: Date, dir: -1 | 1, g: TimeGranularity) {
    if (g === "day") return dir === 1 ? addDays(anchor, 1) : subDays(anchor, 1);
    if (g === "week") return dir === 1 ? addWeeks(anchor, 1) : subWeeks(anchor, 1);
    return dir === 1 ? addMonths(anchor, 1) : subMonths(anchor, 1);
}

function formatPeriodLabel(anchor: Date, g: TimeGranularity) {
    if (g === "day") {
        return format(anchor, "d MMM yyyy", { locale: ptBR });
    }
    if (g === "week") {
        const ws = startOfWeek(anchor, { weekStartsOn: 1 });
        const we = endOfWeek(anchor, { weekStartsOn: 1 });
        return `${format(ws, "d MMM", { locale: ptBR })} – ${format(we, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(anchor, "MMMM yyyy", { locale: ptBR });
}

export function ScheduleView({
    pageTitle,
    pageDescription,
    appointments: initialAppointments,
    doctors,
    patients,
    serviceTypes,
}: ScheduleViewProps) {
    const setHeader = useHeaderStore((s) => s.setHeader);
    const setToolbar = useHeaderStore((s) => s.setToolbar);
    const clearHeader = useHeaderStore((s) => s.clearHeader);

    const [granularity, setGranularity] = useState<TimeGranularity>("week");
    const [layout, setLayout] = useState<PlannerLayout>("calendar");
    const [anchorDate, setAnchorDate] = useState(() => new Date());
    const [appointmentItems, setAppointmentItems] = useState(initialAppointments);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

    const [newDrawerOpen, setNewDrawerOpen] = useState(false);
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] =
        useState<AppointmentDetail | null>(null);
    const [defaultSlotDate, setDefaultSlotDate] = useState<Date | undefined>();

    useLayoutEffect(() => {
        setHeader(pageTitle, pageDescription);
        setToolbar(
            <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                    setDefaultSlotDate(undefined);
                    setNewDrawerOpen(true);
                }}
            >
                <Plus className="size-4" />
                Novo
            </Button>
        );
        return () => clearHeader();
    }, [pageTitle, pageDescription, setHeader, setToolbar, clearHeader]);

    const { start: rangeStart, end: rangeEnd } = getRange(anchorDate, granularity);
    const weekStartForCalendar = startOfWeek(anchorDate, { weekStartsOn: 1 });

    useEffect(() => {
        setAppointmentItems(initialAppointments);
    }, [initialAppointments]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await listScheduleAppointmentsAction(
                rangeStart.toISOString(),
                rangeEnd.toISOString()
            );
            if (cancelled || "error" in res || !res.success) return;
            setAppointmentItems(res.appointments as AppointmentCardData[]);
        })();
        return () => {
            cancelled = true;
        };
    }, [anchorDate, granularity]);

    const filteredAppointments = selectedDoctorId
        ? appointmentItems.filter((a) => a.doctor.id === selectedDoctorId)
        : appointmentItems;

    const visibleAppointments = filteredAppointments.filter(
        (appointment) => appointment.status !== "cancelled"
    );

    const handleAppointmentClick = useCallback((appt: AppointmentCardData) => {
        setSelectedAppointment({
            id: appt.id,
            scheduledAt: appt.scheduledAt,
            durationMinutes: appt.durationMinutes,
            modality: appt.modality,
            status: appt.status as AppointmentDetail["status"],
            notes: null,
            doctor: appt.doctor,
            patient: {
                id: appt.patient.id,
                name: appt.patient.name,
                phone: appt.patient.phone,
                email: null,
            },
            specialty: appt.specialty,
            serviceType: appt.serviceType,
        });
        setDetailDrawerOpen(true);
    }, []);

    const handleSlotClick = useCallback((date: Date) => {
        setDefaultSlotDate(date);
        setNewDrawerOpen(true);
    }, []);

    const handleAppointmentUpdated = useCallback(
        (appointmentId: string, status: AppointmentDetail["status"]) => {
            setAppointmentItems((current) =>
                current.flatMap((appointment) => {
                    if (appointment.id !== appointmentId) {
                        return [appointment];
                    }
                    if (status === "cancelled") {
                        return [];
                    }
                    return [{ ...appointment, status }];
                })
            );

            setSelectedAppointment((current) =>
                current && current.id === appointmentId ? { ...current, status } : current
            );
        },
        []
    );

    const doctorOptions = [
        { value: "", label: "Todos os médicos" },
        ...doctors.map((d) => ({ value: d.id, label: d.name })),
    ];

    const showCalendarGrid =
        layout === "calendar" && (granularity === "day" || granularity === "week");
    const showMonthGrid = layout === "calendar" && granularity === "month";

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-64">
                    <Select
                        options={doctorOptions}
                        value={doctorOptions.find((o) => o.value === selectedDoctorId) ?? doctorOptions[0]}
                        onChange={(opt) => setSelectedDoctorId(opt?.value ?? "")}
                        placeholder="Todos os médicos"
                        filterOption={accentInsensitiveSelectFilter}
                        classNamePrefix="rs"
                    />
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setAnchorDate((a) => shiftAnchor(a, -1, granularity))}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-medium px-2 min-w-[200px] text-center capitalize">
                        {formatPeriodLabel(anchorDate, granularity)}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setAnchorDate((a) => shiftAnchor(a, 1, granularity))}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
                    <Button asChild variant="outline" className="hidden sm:flex">
                        <Link href="/schedule/settings">
                            <Settings className="mr-2 size-4" />
                            Configurar
                        </Link>
                    </Button>

                    <div className="flex flex-wrap rounded-md border overflow-hidden">
                        <Button
                            variant={granularity === "day" && layout === "calendar" ? "default" : "ghost"}
                            className="rounded-none h-8 px-2.5 gap-1 text-xs sm:text-sm"
                            onClick={() => {
                                setGranularity("day");
                                setLayout("calendar");
                            }}
                        >
                            <Calendar className="size-3.5 shrink-0" />
                            Dia
                        </Button>
                        <Button
                            variant={granularity === "week" && layout === "calendar" ? "default" : "ghost"}
                            className="rounded-none border-l h-8 px-2.5 gap-1 text-xs sm:text-sm"
                            onClick={() => {
                                setGranularity("week");
                                setLayout("calendar");
                            }}
                        >
                            <CalendarDays className="size-3.5 shrink-0" />
                            Semana
                        </Button>
                        <Button
                            variant={granularity === "month" && layout === "calendar" ? "default" : "ghost"}
                            className="rounded-none border-l h-8 px-2.5 gap-1 text-xs sm:text-sm"
                            onClick={() => {
                                setGranularity("month");
                                setLayout("calendar");
                            }}
                        >
                            <LayoutGrid className="size-3.5 shrink-0" />
                            Mês
                        </Button>
                        <Button
                            variant={layout === "list" ? "default" : "ghost"}
                            className="rounded-none rounded-r-md border-l h-8 px-2.5 gap-1 text-xs sm:text-sm"
                            onClick={() => setLayout("list")}
                        >
                            <List className="size-3.5 shrink-0" />
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
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs bg-muted/30 px-4 py-3 rounded-lg border">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Categoria:
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="flex items-center justify-center size-5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded shadow-sm text-[10px]">
                            🏥
                        </span>
                        <span className="text-muted-foreground font-medium">Presencial</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="flex items-center justify-center size-5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded shadow-sm text-[10px]">
                            💻
                        </span>
                        <span className="text-muted-foreground font-medium">Teleconsulta</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="flex items-center justify-center size-5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded shadow-sm text-[10px]">
                            📞
                        </span>
                        <span className="text-muted-foreground font-medium">Telefone</span>
                    </div>
                </div>

                <div className="hidden sm:block w-px h-4 bg-border" />

                <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Status (Barra Lateral):
                    </span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-3.5 bg-blue-500 rounded-sm" />
                        <span className="text-muted-foreground font-medium">Agendado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-3.5 bg-teal-500 rounded-sm" />
                        <span className="text-muted-foreground font-medium">Confirmado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-3.5 bg-amber-500 rounded-sm" />
                        <span className="text-muted-foreground font-medium">Em Atend.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-3.5 bg-green-600 rounded-sm" />
                        <span className="text-muted-foreground font-medium">Concluído</span>
                    </div>
                </div>
            </div>

            {layout === "list" ? (
                <AppointmentSlotList
                    appointments={visibleAppointments}
                    startDate={rangeStart}
                    endDate={rangeEnd}
                    onAppointmentClick={handleAppointmentClick}
                />
            ) : showMonthGrid ? (
                <AppointmentMonthView
                    monthAnchor={anchorDate}
                    appointments={visibleAppointments}
                    onAppointmentClick={handleAppointmentClick}
                    onDayClick={(day) => handleSlotClick(day)}
                />
            ) : showCalendarGrid ? (
                <AppointmentCalendar
                    appointments={visibleAppointments}
                    weekStart={weekStartForCalendar}
                    mode={granularity === "day" ? "day" : "week"}
                    dayDate={granularity === "day" ? anchorDate : undefined}
                    onAppointmentClick={handleAppointmentClick}
                    onSlotClick={handleSlotClick}
                />
            ) : null}

            <NewAppointmentDrawer
                open={newDrawerOpen}
                onOpenChange={setNewDrawerOpen}
                doctors={doctors}
                patients={patients}
                serviceTypes={serviceTypes}
                defaultDoctorId={selectedDoctorId || undefined}
                defaultDate={defaultSlotDate}
            />

            <AppointmentDetailDrawer
                open={detailDrawerOpen}
                onOpenChange={setDetailDrawerOpen}
                appointment={selectedAppointment}
                onAppointmentUpdated={handleAppointmentUpdated}
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
