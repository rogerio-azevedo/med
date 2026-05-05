import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { patientBelongsToClinic } from "@/db/queries/files";
import { getPatientConsultationsSummaryForPanel } from "@/db/queries/patient-consultation-history-panel";

export async function GET(
    request: Request,
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

    const url = new URL(request.url);
    const excludeId = url.searchParams.get("exclude")?.trim() || undefined;

    try {
        const rows = await getPatientConsultationsSummaryForPanel(patientId, session.user.clinicId, {
            excludeConsultationId: excludeId,
            limit: 20,
        });
        return NextResponse.json(rows);
    } catch (error) {
        console.error("API Error (consultation-history):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
