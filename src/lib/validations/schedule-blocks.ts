import { z } from "zod";

export const scheduleBlockReasonValues = [
    "vacation",
    "sick_leave",
    "conference",
    "personal",
    "holiday",
    "other",
] as const;

export const scheduleBlockReasonLabels: Record<
    (typeof scheduleBlockReasonValues)[number],
    string
> = {
    vacation: "Férias",
    sick_leave: "Licença médica",
    conference: "Congresso / Evento",
    personal: "Assunto pessoal",
    holiday: "Feriado",
    other: "Outro",
};

export const createScheduleBlockSchema = z
    .object({
        doctorId: z.string().uuid("Médico inválido"),
        reason: z.enum(scheduleBlockReasonValues, {
            message: "Motivo inválido",
        }),
        note: z.string().max(500).optional(),
        startsAt: z.string().datetime("Data/hora de início inválida"),
        endsAt: z.string().datetime("Data/hora de fim inválida"),
    })
    .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
        message: "O fim do bloqueio deve ser posterior ao início",
        path: ["endsAt"],
    });

export type CreateScheduleBlockInput = z.infer<typeof createScheduleBlockSchema>;
