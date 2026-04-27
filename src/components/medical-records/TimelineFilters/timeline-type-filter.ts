import type { MedicalTimelineRow } from "../ConsultationTimeline";

export type TimelineTypeFilter = {
    consultation: boolean;
    return: boolean;
    exam: boolean;
    procedure: boolean;
    other: boolean;
    surgery: boolean;
};

export const defaultTimelineTypeFilter: TimelineTypeFilter = {
    consultation: true,
    return: true,
    exam: true,
    procedure: true,
    other: true,
    surgery: true,
};

export function timelineRowMatchesTypeFilter(
    row: MedicalTimelineRow,
    filter: TimelineTypeFilter
): boolean {
    if (row.timelineKind === "surgery") {
        return filter.surgery;
    }
    const w = row.serviceTypeWorkflow;
    if (w === "return") {
        return filter.return;
    }
    if (w === "consultation") {
        return filter.consultation;
    }
    if (w === "exam_review") {
        return filter.exam;
    }
    if (w === "procedure") {
        return filter.procedure;
    }
    return filter.other;
}
