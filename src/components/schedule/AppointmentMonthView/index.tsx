"use client";

import { useMemo } from "react";
import {
    addDays,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import type { AppointmentCardData } from "../AppointmentCard";
import { cn } from "@/lib/utils";

interface AppointmentMonthViewProps {
    monthAnchor: Date;
    appointments: AppointmentCardData[];
    onAppointmentClick: (appointment: AppointmentCardData) => void;
    onDayClick: (day: Date) => void;
}

export function AppointmentMonthView({
    monthAnchor,
    appointments,
    onAppointmentClick,
    onDayClick,
}: AppointmentMonthViewProps) {
    const monthStart = startOfMonth(monthAnchor);
    const monthEnd = endOfMonth(monthAnchor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = useMemo(
        () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
        [gridStart, gridEnd]
    );

    const byDay = useMemo(() => {
        const map = new Map<string, AppointmentCardData[]>();
        for (const a of appointments) {
            const key = format(new Date(a.scheduledAt), "yyyy-MM-dd");
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(a);
        }
        return map;
    }, [appointments]);

    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const today = new Date();

    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="grid grid-cols-7 border-b bg-muted/40 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {weekDays.map((d) => (
                    <div key={d}>{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-border/50">
                {days.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayAppts = byDay.get(key) ?? [];
                    const visible = dayAppts.filter((a) => a.status !== "cancelled");
                    const inMonth = isSameMonth(day, monthAnchor);
                    const isToday = isSameDay(day, today);

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onDayClick(day)}
                            className={cn(
                                "min-h-[92px] bg-background p-1.5 text-left transition-colors hover:bg-muted/40",
                                !inMonth && "bg-muted/20 text-muted-foreground/70"
                            )}
                        >
                            <div
                                className={cn(
                                    "mb-1 flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                                    isToday && "bg-primary text-primary-foreground",
                                    !isToday && inMonth && "text-foreground",
                                    !inMonth && "text-muted-foreground"
                                )}
                            >
                                {format(day, "d")}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {visible.slice(0, 3).map((a) => {
                                    const color = a.serviceType?.timelineColorHex;
                                    return (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAppointmentClick(a);
                                            }}
                                            className="truncate rounded border border-border/60 bg-muted/30 px-1 py-0.5 text-left text-[10px] font-medium leading-tight hover:bg-muted"
                                            title={`${format(new Date(a.scheduledAt), "HH:mm")} ${a.patient.name}`}
                                        >
                                            <span
                                                className="mr-0.5 inline-block size-1.5 shrink-0 rounded-full align-middle"
                                                style={{
                                                    backgroundColor: color ?? "hsl(var(--primary))",
                                                }}
                                            />
                                            <span className="align-middle">
                                                {format(new Date(a.scheduledAt), "HH:mm")}{" "}
                                                {a.patient.name.split(" ")[0]}
                                            </span>
                                        </button>
                                    );
                                })}
                                {visible.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        +{visible.length - 3} mais
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
