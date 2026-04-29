"use client";

import { useMemo } from "react";
import { format, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentCard, type AppointmentCardData } from "../AppointmentCard";
import { CalendarIcon } from "lucide-react";

const statusOrder = [
    "in_progress",
    "confirmed",
    "scheduled",
    "done",
    "no_show",
    "cancelled",
];

interface DayGroup {
    date: Date;
    appointments: AppointmentCardData[];
}

interface AppointmentSlotListProps {
    appointments: AppointmentCardData[];
    startDate: Date;
    endDate: Date;
    onAppointmentClick: (appointment: AppointmentCardData) => void;
    showQuickCheckIn?: boolean;
}

export function AppointmentSlotList({
    appointments,
    startDate,
    endDate,
    onAppointmentClick,
    showQuickCheckIn = false,
}: AppointmentSlotListProps) {
    const days = useMemo(() => {
        const result: DayGroup[] = [];
        const cursor = new Date(startDate);
        cursor.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        while (cursor <= end) {
            const day = new Date(cursor);
            const dayAppts = appointments
                .filter((a) => isSameDay(new Date(a.scheduledAt), day))
                .sort((a, b) => {
                    const timeA = new Date(a.scheduledAt).getTime();
                    const timeB = new Date(b.scheduledAt).getTime();
                    if (timeA !== timeB) return timeA - timeB;
                    return (
                        statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
                    );
                });
            result.push({ date: day, appointments: dayAppts });
            cursor.setDate(cursor.getDate() + 1);
        }
        return result;
    }, [appointments, startDate, endDate]);

    const totalAppointments = appointments.filter(
        (a) => a.status !== "cancelled" && a.status !== "no_show"
    ).length;

    return (
        <div className="space-y-4">
            {/* Sumário */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="size-4" />
                <span>
                    {totalAppointments === 0
                        ? "Nenhum agendamento no período"
                        : `${totalAppointments} agendamento${totalAppointments !== 1 ? "s" : ""} no período`}
                </span>
            </div>

            {/* Grupos por dia */}
            {days.map(({ date, appointments: dayAppts }) => {
                const today = isToday(date);
                return (
                    <div key={date.toISOString()} className="space-y-1">
                        {/* Cabeçalho do dia */}
                        <div
                            className={`flex items-center gap-2 py-1 ${today ? "text-primary" : "text-foreground"}`}
                        >
                            <div
                                className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${today ? "bg-primary text-primary-foreground" : ""}`}
                            >
                                {format(date, "d")}
                            </div>
                            <span className="text-sm capitalize">
                                {format(date, "EEEE", { locale: ptBR })}
                            </span>
                            {dayAppts.length > 0 && (
                                <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                    {dayAppts.length}
                                </span>
                            )}
                        </div>

                        {/* Agendamentos do dia */}
                        {dayAppts.length === 0 ? (
                            <div className="border border-dashed rounded-md p-3 text-xs text-muted-foreground text-center">
                                Sem agendamentos
                            </div>
                        ) : (
                            <div className="space-y-1 pl-4 border-l-2 border-border/40 ml-3">
                                {dayAppts.map((appt) => (
                                    <AppointmentCard
                                        key={appt.id}
                                        appointment={appt}
                                        onClick={onAppointmentClick}
                                        showQuickCheckIn={showQuickCheckIn}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
