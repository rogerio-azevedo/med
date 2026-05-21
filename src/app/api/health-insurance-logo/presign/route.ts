import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { healthInsurances } from "@/db/schema";
import { createPresignedPutUrl } from "@/infra/storage/presign";
import { can } from "@/lib/permissions";
import { buildHealthInsuranceLogoRemoteKey } from "@/services/files";
import { assertMimeAndSize, normalizeMimeType } from "@/validations/file";
import { healthInsuranceLogoPresignBodySchema } from "@/validations/health-insurance-logo";

export const runtime = "nodejs";

const ALLOWED_LOGO_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await can("health-insurances", "can_update");
    if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = healthInsuranceLogoPresignBodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const d = parsed.data;
    const row = await db.query.healthInsurances.findFirst({
        where: eq(healthInsurances.id, d.healthInsuranceId),
        columns: { id: true },
    });
    if (!row) {
        return NextResponse.json({ error: "Convênio não encontrado" }, { status: 404 });
    }

    const mime = normalizeMimeType(d.mimeType, d.fileName);
    if (!ALLOWED_LOGO_MIMES.has(mime)) {
        return NextResponse.json({ error: "Apenas PNG, JPEG ou WebP" }, { status: 400 });
    }
    try {
        assertMimeAndSize(mime, d.sizeBytes);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Arquivo inválido";
        return NextResponse.json({ error: msg }, { status: 400 });
    }

    const remoteKey = buildHealthInsuranceLogoRemoteKey(d.healthInsuranceId, d.fileName);

    try {
        const presignedUrl = await createPresignedPutUrl(remoteKey, mime);
        return NextResponse.json({ presignedUrl, remoteKey, contentType: mime });
    } catch (e) {
        console.error("health-insurance-logo presign:", e);
        return NextResponse.json({ error: "Falha ao gerar URL de upload" }, { status: 500 });
    }
}
