import type { LucideIcon } from "lucide-react";
import {
    Activity,
    Calendar,
    ClipboardList,
    FileText,
    FlaskConical,
    HeartPulse,
    Microscope,
    Pill,
    Scissors,
    Stethoscope,
    Video,
} from "lucide-react";

/** Ícones permitidos no cadastro de tipo de atendimento (timeline / identidade visual). */
export const SERVICE_TYPE_TIMELINE_ICONS = {
    stethoscope: Stethoscope,
    scissors: Scissors,
    flask_conical: FlaskConical,
    video: Video,
    clipboard_list: ClipboardList,
    microscope: Microscope,
    file_text: FileText,
    calendar: Calendar,
    activity: Activity,
    heart_pulse: HeartPulse,
    pill: Pill,
} as const satisfies Record<string, LucideIcon>;

export type ServiceTypeTimelineIconKey = keyof typeof SERVICE_TYPE_TIMELINE_ICONS;

/** Rótulos para o cadastro de tipos de atendimento */
export const SERVICE_TYPE_TIMELINE_ICON_LABELS: Record<ServiceTypeTimelineIconKey, string> = {
    stethoscope: "Estetoscópio",
    scissors: "Tesoura",
    flask_conical: "Frasco (exame)",
    video: "Vídeo",
    clipboard_list: "Lista / procedimento",
    microscope: "Microscópio (revisão)",
    file_text: "Documento",
    calendar: "Calendário",
    activity: "Atividade",
    heart_pulse: "Batimentos",
    pill: "Medicamento",
};

export const SERVICE_TYPE_TIMELINE_ICON_OPTIONS = Object.entries(SERVICE_TYPE_TIMELINE_ICONS).map(
    ([value, Icon]) => ({ value: value as ServiceTypeTimelineIconKey, Icon })
);

export function getServiceTypeTimelineIcon(
    key: string | null | undefined
): LucideIcon | null {
    if (!key) return null;
    return SERVICE_TYPE_TIMELINE_ICONS[key as ServiceTypeTimelineIconKey] ?? null;
}

/** Valor vindo do banco ou legado → chave válida ou undefined (formulário). */
export function parseServiceTypeTimelineIconKey(
    raw: string | null | undefined
): ServiceTypeTimelineIconKey | undefined {
    if (!raw || !(raw in SERVICE_TYPE_TIMELINE_ICONS)) return undefined;
    return raw as ServiceTypeTimelineIconKey;
}
