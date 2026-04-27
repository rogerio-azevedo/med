import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
    ClipboardList,
    FileText,
    FlaskConical,
    Microscope,
    RotateCcw,
    Scissors,
    Stethoscope,
    Video,
} from "lucide-react";
import { getServiceTypeTimelineIcon } from "@/lib/service-type-timeline-icons";
import { isValidTimelineHex, timelineVisualStylesFromHex } from "@/lib/formatters/timeline-color-styles";

export type TimelineVisual = {
    Icon: LucideIcon;
    /** Círculo do ícone na linha do tempo (Tailwind) */
    ringClass: string;
    /** Badge do nome do tipo de atendimento (Tailwind) */
    typeBadgeClass: string;
    /** Quando a cor vem do cadastro (#hex) */
    ringStyle?: CSSProperties;
    typeBadgeStyle?: CSSProperties;
};

function heuristicVisual(input: {
    timelineKind: "consultation" | "surgery";
    serviceTypeWorkflow?: string | null;
    serviceTypeName?: string | null;
    serviceTypeSlug?: string | null;
}): Omit<TimelineVisual, "ringStyle" | "typeBadgeStyle"> {
    const name = (input.serviceTypeName || "").toLowerCase();
    const slug = (input.serviceTypeSlug || "").toLowerCase();
    const wf = input.serviceTypeWorkflow || "";

    if (input.timelineKind === "surgery" || wf === "surgery") {
        return {
            Icon: Scissors,
            ringClass: "border-rose-500/70 bg-rose-500/12 text-rose-700 shadow-sm dark:text-rose-200",
            typeBadgeClass: "border-rose-500/30 bg-rose-500/15 text-rose-950 dark:text-rose-50",
        };
    }

    if (slug === "video" || name.includes("vídeo") || name.includes("video")) {
        return {
            Icon: Video,
            ringClass: "border-cyan-500/70 bg-cyan-500/12 text-cyan-800 shadow-sm dark:text-cyan-200",
            typeBadgeClass: "border-cyan-500/30 bg-cyan-500/15 text-cyan-950 dark:text-cyan-50",
        };
    }

    if (wf === "exam_review") {
        return {
            Icon: Microscope,
            ringClass: "border-violet-500/65 bg-violet-500/12 text-violet-800 shadow-sm dark:text-violet-200",
            typeBadgeClass: "border-violet-500/30 bg-violet-500/15 text-violet-950 dark:text-violet-50",
        };
    }

    if (wf === "procedure") {
        return {
            Icon: ClipboardList,
            ringClass: "border-amber-500/70 bg-amber-500/12 text-amber-900 shadow-sm dark:text-amber-100",
            typeBadgeClass: "border-amber-500/30 bg-amber-500/15 text-amber-950 dark:text-amber-50",
        };
    }

    if (wf === "return") {
        return {
            Icon: RotateCcw,
            ringClass: "border-indigo-500/70 bg-indigo-500/12 text-indigo-900 shadow-sm dark:text-indigo-100",
            typeBadgeClass: "border-indigo-500/30 bg-indigo-500/15 text-indigo-950 dark:text-indigo-50",
        };
    }

    if (slug === "exam" || (name.includes("exame") && !name.includes("vídeo") && !name.includes("video"))) {
        return {
            Icon: FlaskConical,
            ringClass: "border-emerald-600/65 bg-emerald-500/12 text-emerald-800 shadow-sm dark:text-emerald-200",
            typeBadgeClass: "border-emerald-500/30 bg-emerald-500/15 text-emerald-950 dark:text-emerald-50",
        };
    }

    if (wf === "consultation") {
        return {
            Icon: Stethoscope,
            ringClass: "border-sky-600/65 bg-sky-500/12 text-sky-900 shadow-sm dark:text-sky-100",
            typeBadgeClass: "border-sky-500/30 bg-sky-500/15 text-sky-950 dark:text-sky-50",
        };
    }

    return {
        Icon: FileText,
        ringClass: "border-slate-400/60 bg-slate-500/10 text-slate-800 shadow-sm dark:text-slate-200",
        typeBadgeClass: "border-slate-500/25 bg-slate-500/10 text-slate-900 dark:text-slate-100",
    };
}

/**
 * Identidade visual: prioriza ícone e cor configurados no tipo de atendimento; senão, heurística por workflow/nome.
 */
export function resolveTimelineVisual(input: {
    timelineKind: "consultation" | "surgery";
    serviceTypeWorkflow?: string | null;
    serviceTypeName?: string | null;
    serviceTypeSlug?: string | null;
    /** Chave do ícone no cadastro (`service_types.timeline_icon_key`) */
    serviceTypeTimelineIconKey?: string | null;
    /** Cor #RRGGBB no cadastro (`service_types.timeline_color_hex`) */
    serviceTypeTimelineColorHex?: string | null;
}): TimelineVisual {
    const base = heuristicVisual(input);
    const customIcon = getServiceTypeTimelineIcon(input.serviceTypeTimelineIconKey);
    const Icon = customIcon ?? base.Icon;

    const hex = input.serviceTypeTimelineColorHex?.trim();
    if (hex && isValidTimelineHex(hex)) {
        const { ringStyle, typeBadgeStyle } = timelineVisualStylesFromHex(hex);
        return {
            Icon,
            ringClass: "border-2 shadow-sm",
            typeBadgeClass: "",
            ringStyle,
            typeBadgeStyle,
        };
    }

    if (customIcon) {
        return { Icon: customIcon, ringClass: base.ringClass, typeBadgeClass: base.typeBadgeClass };
    }

    return { Icon: base.Icon, ringClass: base.ringClass, typeBadgeClass: base.typeBadgeClass };
}
