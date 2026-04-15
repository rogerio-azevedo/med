import { getPatientConsultationsTimeline } from "@/db/queries/consultations";
import { listPatientFilesByPatient } from "@/db/queries/files";

export type MedicalRecordsTimelineConsultationItem = {
    kind: "consultation";
    sortAt: string;
    id: string;
    startTime: string;
    serviceTypeName: string | null;
    doctorName: string | null;
    diagnosis: string | null;
    cidCode: string | null;
    cidDescription: string | null;
};

export type MedicalRecordsTimelineFileItem = {
    kind: "file";
    sortAt: string;
    id: string;
    title: string;
    category: string;
    mimeType: string;
    fileName: string;
    createdAt: string;
    referenceDate: string | null;
    notes: string | null;
    consultationId: string | null;
    uploader: { name: string | null } | null;
    /** Present when the file belongs to a multi-upload group. */
    uploadGroupId: string | null;
    /** Number of files in the group (1 = not a group). */
    groupCount: number;
};

/** File metadata for the sidebar timeline (without `kind`). */
export type MedicalRecordsFileTimelineEntry = Omit<MedicalRecordsTimelineFileItem, "kind">;

export type MedicalRecordsTimelineItem = MedicalRecordsTimelineConsultationItem | MedicalRecordsTimelineFileItem;

function toIso(d: Date | string): string {
    if (d instanceof Date) return d.toISOString();
    return new Date(d).toISOString();
}

/**
 * Drizzle/PG may return `reference_date` as Date or "YYYY-MM-DD".
 * Do not use template strings on Date (invalid sort keys).
 */
export function normalizePatientFileReferenceDate(value: unknown): string | null {
    if (value == null || value === "") return null;
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return value.toISOString().slice(0, 10);
    }
    if (typeof value === "string") {
        const s = value.trim().slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    }
    return null;
}

function fileSortAtIso(referenceYmd: string | null, createdAt: Date | string): string {
    const createdIso = toIso(createdAt as Date | string);
    if (referenceYmd) {
        return `${referenceYmd}T12:00:00.000Z`;
    }
    return createdIso;
}

/**
 * Patient files ordered for the sidebar timeline.
 * Files sharing `upload_group_id` collapse into one entry with `groupCount > 1`.
 */
export async function getPatientFilesTimelineSorted(
    patientId: string,
    clinicId: string
): Promise<MedicalRecordsFileTimelineEntry[]> {
    const files = await listPatientFilesByPatient(patientId, clinicId);

    type RawEntry = MedicalRecordsFileTimelineEntry & { _rawGroupId: string | null };

    const rawEntries: RawEntry[] = files.map((f) => {
        const createdIso = toIso(f.createdAt as Date | string);
        const referenceYmd = normalizePatientFileReferenceDate(f.referenceDate);
        const sortAt = fileSortAtIso(referenceYmd, f.createdAt as Date | string);
        return {
            sortAt,
            id: f.id,
            title: f.title,
            category: f.category,
            mimeType: f.mimeType,
            fileName: f.fileName,
            createdAt: createdIso,
            referenceDate: referenceYmd,
            notes: f.notes ?? null,
            consultationId: f.consultationId ?? null,
            uploader: f.uploader ? { name: f.uploader.name } : null,
            uploadGroupId: f.uploadGroupId ?? null,
            groupCount: 1,
            _rawGroupId: f.uploadGroupId ?? null,
        };
    });

    const groupMap = new Map<string, RawEntry>();
    const result: RawEntry[] = [];

    for (const entry of rawEntries) {
        if (!entry._rawGroupId) {
            result.push(entry);
        } else {
            const existing = groupMap.get(entry._rawGroupId);
            if (!existing) {
                groupMap.set(entry._rawGroupId, entry);
                result.push(entry);
            } else {
                existing.groupCount += 1;
                if (new Date(entry.sortAt) < new Date(existing.sortAt)) {
                    existing.sortAt = entry.sortAt;
                    existing.referenceDate = entry.referenceDate;
                    existing.createdAt = entry.createdAt;
                }
            }
        }
    }

    const entries: MedicalRecordsFileTimelineEntry[] = result.map(({ _rawGroupId: _, ...e }) => e);

    entries.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
    return entries;
}

/**
 * Consultations and files in one list (e.g. reports). Prefer separate views: consultations + getPatientFilesTimelineSorted.
 */
export async function getMergedMedicalRecordsTimeline(
    patientId: string,
    clinicId: string
): Promise<MedicalRecordsTimelineItem[]> {
    const [consultations, fileEntries] = await Promise.all([
        getPatientConsultationsTimeline(patientId, clinicId),
        getPatientFilesTimelineSorted(patientId, clinicId),
    ]);

    const items: MedicalRecordsTimelineItem[] = [];

    for (const c of consultations) {
        const start = toIso(c.startTime as Date | string);
        items.push({
            kind: "consultation",
            sortAt: start,
            id: c.id,
            startTime: start,
            serviceTypeName: c.serviceTypeName ?? null,
            doctorName: c.doctorName ?? null,
            diagnosis: c.diagnosis ?? null,
            cidCode: c.cidCode ?? null,
            cidDescription: c.cidDescription ?? null,
        });
    }

    for (const fe of fileEntries) {
        items.push({ kind: "file", ...fe });
    }

    items.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());

    return items;
}
