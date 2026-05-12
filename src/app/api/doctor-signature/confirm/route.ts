import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { doctors } from "@/db/schema/doctors";
import { doctorSignatureConfirmBodySchema } from "@/validations/doctor-signature";
import { assertDoctorSignatureRemoteKey } from "@/services/files";
import { headObject } from "@/infra/storage/presign";

export const runtime = "nodejs";

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

    const parsed = doctorSignatureConfirmBodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { remoteKey, sizeBytes } = parsed.data;
    try {
        assertDoctorSignatureRemoteKey(remoteKey, session.user.clinicId, session.user.doctorId);
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
        console.error("doctor-signature headObject:", e);
        return NextResponse.json({ error: "Falha ao validar upload" }, { status: 500 });
    }

    try {
        await db
            .update(doctors)
            .set({ signatureUrl: remoteKey })
            .where(eq(doctors.id, session.user.doctorId));
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("doctor-signature confirm db:", e);
        return NextResponse.json({ error: "Falha ao salvar assinatura" }, { status: 500 });
    }
}
