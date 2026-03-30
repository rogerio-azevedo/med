import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPatientFileById } from "@/db/queries/files";
import { createPresignedGetUrl } from "@/infra/storage/presign";

export const runtime = "nodejs";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ fileId: string }> }
) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const file = await getPatientFileById(fileId, session.user.clinicId);
    if (!file) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        const url = await createPresignedGetUrl(file.remoteKey);
        return NextResponse.json({ url, mimeType: file.mimeType, fileName: file.fileName });
    } catch (e) {
        console.error("presigned get error:", e);
        return NextResponse.json({ error: "Falha ao gerar URL de download" }, { status: 500 });
    }
}
