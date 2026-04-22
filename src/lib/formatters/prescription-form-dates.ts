/** First integer in the string: "7", "7 dias", "10 dia" → days count. */
export function parseDurationDays(raw: string): number | null {
    const m = raw.trim().match(/^(\d+)/);
    if (!m) return null;
    const n = Number.parseInt(m[1], 10);
    if (!Number.isFinite(n) || n < 1) return null;
    return n;
}

/** `isoYmd` = YYYY-MM-DD; `deltaDays` can be negative. Uses local calendar date (no UTC shift). */
export function addCalendarDays(isoYmd: string, deltaDays: number): string | null {
    const parts = isoYmd.trim().split("-").map(Number);
    if (parts.length !== 3 || parts.some((x) => !Number.isFinite(x))) return null;
    const [y, mo, d] = parts;
    const dt = new Date(y, mo - 1, d);
    if (Number.isNaN(dt.getTime())) return null;
    dt.setDate(dt.getDate() + deltaDays);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}

/** Normaliza valor de coluna `date` do Drizzle para input type="date". */
export function toDateInputValue(v: string | Date | null | undefined): string {
    if (v == null) return "";
    if (typeof v === "string") return v.slice(0, 10);
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
        const yy = v.getFullYear();
        const mm = String(v.getMonth() + 1).padStart(2, "0");
        const dd = String(v.getDate()).padStart(2, "0");
        return `${yy}-${mm}-${dd}`;
    }
    return "";
}
