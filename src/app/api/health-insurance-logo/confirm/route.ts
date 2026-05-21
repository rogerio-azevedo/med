import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { healthInsurances } from "@/db/schema";
import { headObject } from "@/infra/storage/presign";
import { can } from "@/lib/permissions";
import { assertHealthInsuranceLogoRemoteKey } from "@/services/files";
import { healthInsuranceLogoConfirmBodySchema } from "@/validations/health-insurance-logo";

export const runtime = "nodejs";

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

    const parsed = healthInsuranceLogoConfirmBodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { healthInsuranceId, remoteKey, sizeBytes } = parsed.data;

    const insurance = await db.query.healthInsurances.findFirst({
        where: eq(healthInsurances.id, healthInsuranceId),
        columns: { id: true },
    });
    if (!insurance) {
        return NextResponse.json({ error: "Convênio não encontrado" }, { status: 404 });
    }

    try {
        assertHealthInsuranceLogoRemoteKey(remoteKey, healthInsuranceId);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Chave inválida";
        return NextResponse.json({ error: msg }, { status: 400 });
    }

    try {
        const meta = await headObject(remoteKey);
        const remoteSize = meta.ContentLength;
        if (remoteSize != null && remoteSize !== sizeBytes) {
            return NextResponse.json({ error: "Tamanho do arquivo não confere" }, { status: 400 });
        }
    } catch (e: unknown) {
        const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
            return NextResponse.json({ error: "Arquivo não encontrado no armazenamento" }, { status: 400 });
        }
        console.error("health-insurance-logo headObject:", e);
        return NextResponse.json({ error: "Falha ao validar upload" }, { status: 500 });
    }

    try {
        await db
            .update(healthInsurances)
            .set({ logoUrl: remoteKey, updatedAt: new Date() })
            .where(eq(healthInsurances.id, healthInsuranceId));
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("health-insurance-logo confirm db:", e);
        return NextResponse.json({ error: "Falha ao salvar logo" }, { status: 500 });
    }
}
