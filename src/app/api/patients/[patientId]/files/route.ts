import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { patientBelongsToClinic, listPatientFilesByPatient } from "@/db/queries/files";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ patientId: string }> }
) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId } = await params;
    const ok = await patientBelongsToClinic(patientId, session.user.clinicId);
    if (!ok) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const files = await listPatientFilesByPatient(patientId, session.user.clinicId);
    return NextResponse.json(files);
}
