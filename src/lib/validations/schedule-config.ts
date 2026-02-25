import { z } from "zod";

export const periodSchema = z.object({
    id: z.string().optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)" }),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)" }),
    slotDurationMin: z.number().min(5).max(120),
}).refine(
    (data) => {
        const start = parseTime(data.startTime);
        const end = parseTime(data.endTime);
        return start < end;
    },
    { message: "A hora final deve ser maior que a hora inicial", path: ["endTime"] }
).refine(
    (data) => {
        const start = parseTime(data.startTime);
        const end = parseTime(data.endTime);
        const duration = end - start;
        return duration >= data.slotDurationMin;
    },
    { message: "A duração do período deve ser maior ou igual ao tempo de consulta", path: ["endTime"] }
);

export const dayConfigSchema = z.object({
    weekday: z.number().min(0).max(6),
    active: z.boolean(),
    periods: z.array(periodSchema),
}).refine(
    (data) => {
        if (!data.active) return true;
        // Check for overlaps in periods
        const timeRanges = data.periods.map(p => ({
            start: parseTime(p.startTime),
            end: parseTime(p.endTime)
        }));

        // Sort by start time
        timeRanges.sort((a, b) => a.start - b.start);

        // Check overlaps
        for (let i = 0; i < timeRanges.length - 1; i++) {
            if (timeRanges[i].end > timeRanges[i + 1].start) {
                return false;
            }
        }
        return true;
    },
    { message: "Existem períodos sobrepostos neste dia", path: ["periods"] }
);

export const saveScheduleSchema = z.object({
    doctorId: z.string().min(1),
    days: z.array(dayConfigSchema).length(7),
});

export type PeriodDraft = z.infer<typeof periodSchema>;
export type DayConfigDraft = z.infer<typeof dayConfigSchema>;
export type SaveScheduleInput = z.infer<typeof saveScheduleSchema>;

// Helper to convert HH:MM to minutes for easy comparison
function parseTime(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}
