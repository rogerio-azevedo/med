import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fileMetadataBodySchema } from "@/lib/validations/file";
import { assertRemoteKeyForPatient, validateFileUploadContext } from "@/services/files";
import { headObject } from "@/infra/storage/presign";
import { insertPatientFile } from "@/db/queries/files";

export const runtime = "nodejs";

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.clinicId || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = fileMetadataBodySchema.safeParse(body);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue?.message ?? parsed.error.message },
            { status: 400 }
        );
    }

    const d = parsed.data;
    const clinicId = session.user.clinicId;

    let resolvedMime: string;
    try {
        assertRemoteKeyForPatient(d.remoteKey, clinicId, d.patientId);
        resolvedMime = await validateFileUploadContext({
            clinicId,
            patientId: d.patientId,
            consultationId: d.consultationId ?? null,
            mimeType: d.mimeType,
            sizeBytes: d.sizeBytes,
            fileName: d.fileName,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Validation failed";
        return NextResponse.json({ error: msg }, { status: 400 });
    }

    try {
        const meta = await headObject(d.remoteKey);
        const remoteSize = meta.ContentLength;
        if (remoteSize != null && remoteSize !== d.sizeBytes) {
            return NextResponse.json(
                { error: "Tamanho do arquivo no armazenamento não confere com o informado" },
                { status: 400 }
            );
        }
    } catch (e: unknown) {
        const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
        const code = err.name;
        const status = err.$metadata?.httpStatusCode;
        if (code === "NotFound" || code === "NoSuchKey" || status === 404) {
            return NextResponse.json({ error: "Arquivo não encontrado no armazenamento" }, { status: 400 });
        }
        console.error("headObject error:", e);
        return NextResponse.json({ error: "Falha ao validar upload" }, { status: 500 });
    }

    let referenceDate: string | null = null;
    if (d.referenceDate && d.referenceDate.trim() !== "") {
        referenceDate = d.referenceDate.trim().slice(0, 10);
    }

    try {
        const row = await insertPatientFile({
            patientId: d.patientId,
            consultationId: d.consultationId ?? null,
            clinicId,
            uploadedBy: session.user.id,
            title: d.title,
            category: d.category,
            remoteKey: d.remoteKey,
            fileName: d.fileName,
            mimeType: resolvedMime,
            sizeBytes: d.sizeBytes,
            referenceDate,
            notes: d.notes?.trim() ? d.notes.trim() : null,
            uploadGroupId: d.uploadGroupId ?? null,
            groupOrder: d.groupOrder ?? null,
        });
        return NextResponse.json({ fileId: row.id, success: true });
    } catch (e) {
        console.error("insert patient file:", e);
        return NextResponse.json({ error: "Falha ao salvar metadados" }, { status: 500 });
    }
}
