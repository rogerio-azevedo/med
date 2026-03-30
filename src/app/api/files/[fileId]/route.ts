import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deletePatientFileRecord } from "@/db/queries/files";
import { deleteObjectFromR2 } from "@/infra/storage/presign";

export const runtime = "nodejs";

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ fileId: string }> }
) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const removed = await deletePatientFileRecord(fileId, session.user.clinicId);
    if (!removed) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await deleteObjectFromR2(removed.remoteKey);
    } catch (e) {
        console.error("R2 delete error (record already removed):", e);
    }

    return NextResponse.json({ success: true });
}
