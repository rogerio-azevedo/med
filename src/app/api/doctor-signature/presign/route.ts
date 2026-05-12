import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { doctorSignaturePresignBodySchema } from "@/validations/doctor-signature";
import { assertMimeAndSize, normalizeMimeType } from "@/validations/file";
import { buildDoctorSignatureRemoteKey } from "@/services/files";
import { createPresignedPutUrl } from "@/infra/storage/presign";

export const runtime = "nodejs";

const ALLOWED_SIGNATURE_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.clinicId || !session.user.id || !session.user.doctorId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = doctorSignaturePresignBodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const d = parsed.data;
    const mime = normalizeMimeType(d.mimeType, d.fileName);
    if (!ALLOWED_SIGNATURE_MIMES.has(mime)) {
        return NextResponse.json({ error: "Apenas PNG, JPEG ou WebP" }, { status: 400 });
    }
    try {
        assertMimeAndSize(mime, d.sizeBytes);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Arquivo inválido";
        return NextResponse.json({ error: msg }, { status: 400 });
    }

    const remoteKey = buildDoctorSignatureRemoteKey(session.user.clinicId, session.user.doctorId, d.fileName);

    try {
        const presignedUrl = await createPresignedPutUrl(remoteKey, mime);
        return NextResponse.json({ presignedUrl, remoteKey, contentType: mime });
    } catch (e) {
        console.error("doctor-signature presign:", e);
        return NextResponse.json({ error: "Falha ao gerar URL de upload" }, { status: 500 });
    }
}
