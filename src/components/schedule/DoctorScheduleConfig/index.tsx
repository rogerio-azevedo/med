"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Plus, Trash2, Loader2, Save, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkedDoctorSelect } from "@/components/shared/LinkedDoctorSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScheduleAction, saveScheduleAction } from "@/app/actions/schedule-config";
import type { DayConfigDraft, PeriodDraft } from "@/lib/validations/schedule-config";

type Doctor = { id: string; name: string | null };

const WEEKDAYS = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
];

const SLOT_DURATIONS = [
    { value: 15, label: "15 minutos" },
    { value: 20, label: "20 minutos" },
    { value: 30, label: "30 minutos" },
    { value: 45, label: "45 minutos" },
    { value: 60, label: "1 hora" },
    { value: 90, label: "1 hora e 30 minutos" },
    { value: 120, label: "2 horas" },
];

const DEFAULT_SCHEDULE: DayConfigDraft[] = Array.from({ length: 7 }).map((_, i) => {
    // Seg a Sex ativo
    const isWorkday = i >= 1 && i <= 5;
    return {
        weekday: i,
        active: isWorkday,
        periods: isWorkday
            ? [
                { startTime: "08:00", endTime: "12:00", slotDurationMin: 30 },
                { startTime: "14:00", endTime: "18:00", slotDurationMin: 30 },
            ]
            : [],
    };
});

// Helper to easily deep clone the state
function cloneConfig(config: DayConfigDraft[]): DayConfigDraft[] {
    return JSON.parse(JSON.stringify(config));
}

interface DoctorScheduleConfigProps {
    doctors: Doctor[];
    // if a doctor is accessing their own config, pre-select it
    defaultDoctorId?: string;
}

export function DoctorScheduleConfig({ doctors, defaultDoctorId }: DoctorScheduleConfigProps) {
    const [isPending, startTransition] = useTransition();

    const [doctorId, setDoctorId] = useState(defaultDoctorId ?? (doctors.length === 1 ? doctors[0].id : ""));
    const [defaultSlotDuration, setDefaultSlotDuration] = useState<number>(30);
    const [schedule, setSchedule] = useState<DayConfigDraft[]>(cloneConfig(DEFAULT_SCHEDULE));
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    const loadSchedule = useCallback(async (selectedDoctorId: string) => {
        if (!selectedDoctorId) return;
        setLoadingSchedule(true);
        const res = await getScheduleAction(selectedDoctorId);
        setLoadingSchedule(false);

        if (res.error) {
            toast.error(res.error);
        } else if (res.data) {
            // Se o medico não tiver agenda alguma (todos os length = 0 e dias inativos), 
            // podemos deixar em branco ou manter a default vazia. O BD trará config inativa.
            const hasAnyConfig = res.data.some((d) => d.periods.length > 0);
            if (!hasAnyConfig) {
                // If it's a completely blank slate, set a blank state or empty
                setSchedule(res.data);
            } else {
                setSchedule(res.data);
            }
        }
    }, []);

    // Load initial doctor schedule when component mounts or doctor changes
    useEffect(() => {
        if (doctorId) {
            loadSchedule(doctorId);
        } else {
            setSchedule(cloneConfig(DEFAULT_SCHEDULE));
        }
    }, [doctorId, loadSchedule]);

    function handleApplyDefaultWeek() {
        setSchedule(cloneConfig(DEFAULT_SCHEDULE).map(day => ({
            ...day,
            periods: day.periods.map(p => ({ ...p, slotDurationMin: defaultSlotDuration }))
        })));
        toast.success("Semana padrão (Seg-Sex, 08-12h e 14-18h) aplicada.");
    }

    function toggleDay(weekday: number, active: boolean) {
        setSchedule((prev) => {
            const next = cloneConfig(prev);
            next[weekday].active = active;
            // if activating a day with no periods, add a default one
            if (active && next[weekday].periods.length === 0) {
                next[weekday].periods.push({
                    startTime: "08:00",
                    endTime: "18:00",
                    slotDurationMin: defaultSlotDuration,
                });
            }
            return next;
        });
    }

    function addPeriod(weekday: number) {
        setSchedule((prev) => {
            const next = cloneConfig(prev);
            next[weekday].periods.push({
                startTime: "08:00",
                endTime: "12:00",
                slotDurationMin: defaultSlotDuration,
            });
            return next;
        });
    }

    function removePeriod(weekday: number, index: number) {
        setSchedule((prev) => {
            const next = cloneConfig(prev);
            next[weekday].periods.splice(index, 1);
            if (next[weekday].periods.length === 0) {
                next[weekday].active = false;
            }
            return next;
        });
    }

    function updatePeriod(weekday: number, index: number, field: keyof PeriodDraft, value: string | number) {
        setSchedule((prev) => {
            const next = cloneConfig(prev);
            next[weekday].periods[index] = {
                ...next[weekday].periods[index],
                [field]: value,
            };
            return next;
        });
    }

    function copyDayToAllActive(sourceWeekday: number) {
        setSchedule((prev) => {
            const next = cloneConfig(prev);
            const sourcePeriods = cloneConfig([next[sourceWeekday]])[0].periods;

            for (let i = 0; i < 7; i++) {
                if (i !== sourceWeekday && next[i].active) {
                    next[i].periods = JSON.parse(JSON.stringify(sourcePeriods));
                }
            }
            return next;
        });
        toast.success(`Horários de ${WEEKDAYS[sourceWeekday]} copiados para os outros dias ativos.`);
    }

    function handleSave() {
        if (!doctorId) {
            toast.error("Selecione um médico primeiro.");
            return;
        }

        // Add some basic client side validation before submit
        for (const day of schedule) {
            if (!day.active) continue;
            for (const p of day.periods) {
                if (p.startTime >= p.endTime) {
                    toast.error(`Horário inválido em ${WEEKDAYS[day.weekday]}: ${p.startTime} deve ser antes de ${p.endTime}`);
                    return;
                }
            }

            // Check for overlaps simply
            // Convert to minutes for easy comparison
            const times = day.periods.map(p => {
                const [sh, sm] = p.startTime.split(":").map(Number);
                const [eh, em] = p.endTime.split(":").map(Number);
                return { start: sh * 60 + sm, end: eh * 60 + em };
            }).sort((a, b) => a.start - b.start);

            for (let i = 0; i < times.length - 1; i++) {
                if (times[i].end > times[i + 1].start) {
                    toast.error(`Existem horários sobrepostos na ${WEEKDAYS[day.weekday]}`);
                    return;
                }
            }
        }

        startTransition(async () => {
            const res = await saveScheduleAction(doctorId, schedule);
            if (res.error) {
                if (res.details) {
                    // map Zod details to toast
                    toast.error("Existem erros de validação nos horários inseridos.");
                } else {
                    toast.error(res.error);
                }
            } else {
                toast.success("Agenda configurada com sucesso!");
            }
        });
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
                <LinkedDoctorSelect
                    className="flex-1 max-w-xs"
                    doctors={doctors}
                    value={doctorId}
                    onChange={setDoctorId}
                    isDisabled={doctors.length <= 1}
                />

                <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2">
                        <Label className="text-muted-foreground whitespace-nowrap">Slot padrão:</Label>
                        <Select
                            value={String(defaultSlotDuration)}
                            onValueChange={(v) => setDefaultSlotDuration(Number(v))}
                        >
                            <SelectTrigger className="w-32 bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SLOT_DURATIONS.map((s) => (
                                    <SelectItem key={s.value} value={String(s.value)}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" onClick={handleApplyDefaultWeek}>
                        <CalendarRange className="mr-2 size-4" />
                        Semana Padrão
                    </Button>

                    <Button onClick={handleSave} disabled={!doctorId || isPending || loadingSchedule}>
                        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Salvar Agenda
                    </Button>
                </div>
            </div>

            {loadingSchedule ? (
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="mr-2 size-6 animate-spin" />
                    Carregando grade atual...
                </div>
            ) : doctorId ? (
                <div className="grid gap-4">
                    {schedule.map((dayConfig) => (
                        <Card key={dayConfig.weekday} className={`transition-colors ${!dayConfig.active && "border-dashed opacity-75"}`}>
                            <CardHeader className="py-4 flex flex-row items-center space-y-0 gap-4 bg-muted/10">
                                <Switch
                                    checked={dayConfig.active}
                                    onCheckedChange={(c) => toggleDay(dayConfig.weekday, c)}
                                />
                                <div className="flex-1 flex items-center justify-between">
                                    <CardTitle className={`text-base font-semibold ${!dayConfig.active && "text-muted-foreground"}`}>
                                        {WEEKDAYS[dayConfig.weekday]}
                                    </CardTitle>

                                    {dayConfig.active && dayConfig.periods.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-muted-foreground hover:text-primary"
                                            onClick={() => copyDayToAllActive(dayConfig.weekday)}
                                        >
                                            <Copy className="mr-1.5 size-3" />
                                            Copiar para todos
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            {dayConfig.active && (
                                <CardContent className="py-4 space-y-3">
                                    {dayConfig.periods.map((period, index) => (
                                        <div key={index} className="flex flex-wrap items-center gap-2 relative">
                                            <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-md border">
                                                <input
                                                    type="time"
                                                    value={period.startTime}
                                                    onChange={(e) => updatePeriod(dayConfig.weekday, index, "startTime", e.target.value)}
                                                    className="w-[100px] h-8 rounded px-2 border-border border text-sm bg-background"
                                                />
                                                <span className="text-muted-foreground text-sm">até</span>
                                                <input
                                                    type="time"
                                                    value={period.endTime}
                                                    onChange={(e) => updatePeriod(dayConfig.weekday, index, "endTime", e.target.value)}
                                                    className="w-[100px] h-8 rounded px-2 border-border border text-sm bg-background"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground text-xs ml-2">Duração:</span>
                                                <Select
                                                    value={String(period.slotDurationMin)}
                                                    onValueChange={(v) => updatePeriod(dayConfig.weekday, index, "slotDurationMin", Number(v))}
                                                >
                                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {SLOT_DURATIONS.map((s) => (
                                                            <SelectItem key={s.value} value={String(s.value)} className="text-xs">
                                                                {s.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto"
                                                onClick={() => removePeriod(dayConfig.weekday, index)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 text-xs border-dashed w-full sm:w-auto"
                                        onClick={() => addPeriod(dayConfig.weekday)}
                                    >
                                        <Plus className="mr-1.5 size-3" />
                                        Adicionar Turno
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 py-20 border rounded-lg border-dashed text-muted-foreground">
                    Selecione um médico acima para configurar sua agenda
                </div>
            )}
        </div>
    );
}
