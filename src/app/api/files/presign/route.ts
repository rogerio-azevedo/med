import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { filePresignBodySchema } from "@/validations/file";
import { buildPatientFileRemoteKey, validateFileUploadContext } from "@/services/files";
import { createPresignedPutUrl } from "@/infra/storage/presign";

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

    const parsed = filePresignBodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const d = parsed.data;
    let resolvedMime: string;
    try {
        resolvedMime = await validateFileUploadContext({
            clinicId: session.user.clinicId,
            patientId: d.patientId,
            consultationId: d.consultationId ?? null,
            surgeryId: d.surgeryId ?? null,
            mimeType: d.mimeType,
            sizeBytes: d.sizeBytes,
            fileName: d.fileName,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Validation failed";
        return NextResponse.json({ error: msg }, { status: 400 });
    }

    const remoteKey = buildPatientFileRemoteKey(
        session.user.clinicId,
        d.patientId,
        d.category,
        d.fileName
    );

    try {
        const presignedUrl = await createPresignedPutUrl(remoteKey, resolvedMime);
        return NextResponse.json({ presignedUrl, remoteKey, contentType: resolvedMime });
    } catch (e) {
        console.error("R2 presign error:", e);
        return NextResponse.json({ error: "Falha ao gerar URL de upload" }, { status: 500 });
    }
}
