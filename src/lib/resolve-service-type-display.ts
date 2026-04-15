import type { LucideIcon } from "lucide-react";
import {
    ClipboardList,
    FileText,
    FlaskConical,
    Microscope,
    Scissors,
    Stethoscope,
    Video,
} from "lucide-react";
import { getServiceTypeTimelineIcon } from "@/lib/service-type-timeline-icons";

/** Ícone para tipo de atendimento: cadastro (timelineIconKey) ou heurística por nome/fluxo. */
export function resolveServiceTypeDisplayIcon(params: {
    name: string;
    workflow: string;
    timelineIconKey: string | null;
}): LucideIcon {
    const fromKey = getServiceTypeTimelineIcon(params.timelineIconKey);
    if (fromKey) return fromKey;

    const lower = params.name.toLowerCase();
    if (lower.includes("video") || lower.includes("vídeo")) return Video;
    if (lower.includes("ciru")) return Scissors;
    if (lower.includes("exam") || lower.includes("exame")) return FlaskConical;
    if (params.workflow === "consultation") return Stethoscope;
    if (params.workflow === "surgery") return Scissors;
    if (params.workflow === "procedure") return ClipboardList;
    if (params.workflow === "exam_review") return Microscope;
    return FileText;
}
