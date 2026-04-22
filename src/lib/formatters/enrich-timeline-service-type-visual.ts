/**
 * Completa ícone/cor da timeline a partir do catálogo de tipos de atendimento,
 * quando o JOIN da query não trouxe as colunas (ex.: cache, migração antiga) ou vieram nulas.
 */
export function enrichTimelineRowsWithServiceTypeCatalog<
    T extends {
        serviceTypeId?: string | null;
        serviceTypeTimelineIconKey?: string | null;
        serviceTypeTimelineColorHex?: string | null;
    },
>(
    rows: T[],
    serviceTypes: {
        id: string;
        timelineIconKey: string | null;
        timelineColorHex: string | null;
    }[]
): T[] {
    const byId = new Map(serviceTypes.map((s) => [s.id, s]));
    return rows.map((row) => {
        const sid = row.serviceTypeId;
        if (!sid) return row;
        const st = byId.get(sid);
        if (!st) return row;
        return {
            ...row,
            serviceTypeTimelineIconKey: row.serviceTypeTimelineIconKey ?? st.timelineIconKey ?? null,
            serviceTypeTimelineColorHex: row.serviceTypeTimelineColorHex ?? st.timelineColorHex ?? null,
        };
    });
}
