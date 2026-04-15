import { z } from "zod";
import { SERVICE_TYPE_WORKFLOWS } from "@/lib/service-type-workflows";

const workflowValues = SERVICE_TYPE_WORKFLOWS.map((item) => item.value) as [
    (typeof SERVICE_TYPE_WORKFLOWS)[number]["value"],
    ...(typeof SERVICE_TYPE_WORKFLOWS)[number]["value"][],
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
});

export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;
