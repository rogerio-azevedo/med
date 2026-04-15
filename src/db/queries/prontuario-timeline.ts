import { getPatientConsultationsTimeline } from "@/db/queries/consultations";
import { listPatientFilesByPatient } from "@/db/queries/files";

export type ProntuarioTimelineConsultationItem = {
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

export type ProntuarioTimelineFileItem = {
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
    /** Presente apenas quando o arquivo é parte de um grupo de multi-upload. */
    uploadGroupId: string | null;
    /** Quantos arquivos existem no grupo (1 = não é grupo). */
    groupCount: number;
};

/** Metadados de arquivo para timeline lateral (sem `kind`). */
export type ProntuarioFileTimelineEntry = Omit<ProntuarioTimelineFileItem, "kind">;

export type ProntuarioTimelineItem = ProntuarioTimelineConsultationItem | ProntuarioTimelineFileItem;

function toIso(d: Date | string): string {
    if (d instanceof Date) return d.toISOString();
    return new Date(d).toISOString();
}

/**
 * Drizzle/PG pode devolver `reference_date` como Date ou "YYYY-MM-DD".
 * Nunca use template string em cima de Date (gera string inválida e quebra a ordenação).
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
 * Arquivos do paciente ordenados para a timeline lateral.
 * Arquivos com mesmo `upload_group_id` são representados por um único entry
 * com `groupCount > 1` — o entry usa os dados do primeiro arquivo do grupo.
 */
export async function getPatientFilesTimelineSorted(
    patientId: string,
    clinicId: string
): Promise<ProntuarioFileTimelineEntry[]> {
    const files = await listPatientFilesByPatient(patientId, clinicId);

    // Mapear cada arquivo para entry individual primeiro
    type RawEntry = ProntuarioFileTimelineEntry & { _rawGroupId: string | null };

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

    // Agrupar: para cada uploadGroupId, manter apenas o primeiro entry e atualizar groupCount
    const groupMap = new Map<string, RawEntry>();
    const result: RawEntry[] = [];

    for (const entry of rawEntries) {
        if (!entry._rawGroupId) {
            // Arquivo individual — entra direto
            result.push(entry);
        } else {
            const existing = groupMap.get(entry._rawGroupId);
            if (!existing) {
                // Primeiro arquivo do grupo — usa como representante
                groupMap.set(entry._rawGroupId, entry);
                result.push(entry);
            } else {
                // Incrementa o contador do representante
                existing.groupCount += 1;
                // Usa a sortAt mais antiga para ordenar o grupo corretamente na timeline
                if (new Date(entry.sortAt) < new Date(existing.sortAt)) {
                    existing.sortAt = entry.sortAt;
                    existing.referenceDate = entry.referenceDate;
                    existing.createdAt = entry.createdAt;
                }
            }
        }
    }

    // Remove campo interno
    const entries: ProntuarioFileTimelineEntry[] = result.map(({ _rawGroupId: _, ...e }) => e);

    entries.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
    return entries;
}

/**
 * Consultas e arquivos em uma única lista (ex.: relatórios). Preferir telas separadas: consultas + getPatientFilesTimelineSorted.
 */
export async function getMergedProntuarioTimeline(
    patientId: string,
    clinicId: string
): Promise<ProntuarioTimelineItem[]> {
    const [consultations, fileEntries] = await Promise.all([
        getPatientConsultationsTimeline(patientId, clinicId),
        getPatientFilesTimelineSorted(patientId, clinicId),
    ]);

    const items: ProntuarioTimelineItem[] = [];

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
