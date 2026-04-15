import { z } from "zod";
import { SERVICE_TYPE_WORKFLOWS } from "@/lib/service-type-workflows";
import { SERVICE_TYPE_TIMELINE_ICONS, type ServiceTypeTimelineIconKey } from "@/lib/service-type-timeline-icons";

const workflowValues = SERVICE_TYPE_WORKFLOWS.map((item) => item.value) as [
    (typeof SERVICE_TYPE_WORKFLOWS)[number]["value"],
    ...(typeof SERVICE_TYPE_WORKFLOWS)[number]["value"][],
];

const timelineIconKeys = Object.keys(SERVICE_TYPE_TIMELINE_ICONS) as [
    ServiceTypeTimelineIconKey,
    ...ServiceTypeTimelineIconKey[],
];

export const serviceTypeSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(120, "Nome muito longo"),
    description: z
        .string()
        .trim()
        .max(500, "Descrição muito longa")
        .optional()
        .or(z.literal("")),
    workflow: z.enum(workflowValues, {
        message: "Fluxo do tipo de atendimento inválido",
    }),
    /** Ícone na timeline; omitido = padrão automático */
    timelineIconKey: z.enum(timelineIconKeys).optional(),
    /** Cor #RRGGBB; omitida = padrão automático */
    timelineColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use cor no formato #RRGGBB").optional(),
});

export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;

/** Normaliza payload do formulário antes do parse (strings vazias → omitidas). */
export function normalizeServiceTypePayload(data: unknown): unknown {
    if (data === null || typeof data !== "object") return data;
    const o = { ...(data as Record<string, unknown>) };
    if (o.timelineIconKey === "" || o.timelineIconKey === null || o.timelineIconKey === undefined) {
        delete o.timelineIconKey;
    }
    if (o.timelineColorHex === "" || o.timelineColorHex === null || o.timelineColorHex === undefined) {
        delete o.timelineColorHex;
    }
    return o;
}
