export const SERVICE_TYPE_WORKFLOWS = [
    {
        value: "consultation",
        label: "Consulta estruturada",
        description: "Usa o prontuário completo em SOAP com sinais vitais.",
    },
    {
        value: "generic",
        label: "Registro simples",
        description: "Usa um registro resumido para atendimentos ainda sem formulário próprio.",
    },
    {
        value: "exam_review",
        label: "Revisão de exames",
        description: "Fluxo resumido voltado para análise de exames e devolutiva.",
    },
    {
        value: "procedure",
        label: "Procedimento",
        description: "Fluxo voltado para procedimentos e intervenções.",
    },
] as const;

export type ServiceTypeWorkflow = (typeof SERVICE_TYPE_WORKFLOWS)[number]["value"];

export function getServiceTypeWorkflowLabel(workflow: string) {
    return SERVICE_TYPE_WORKFLOWS.find((item) => item.value === workflow)?.label || workflow;
}
