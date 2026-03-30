import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { consultations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { listPatientFilesByConsultation } from "@/db/queries/files";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ consultationId: string }> }
) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { consultationId } = await params;
    const consultation = await db.query.consultations.findFirst({
        where: and(
            eq(consultations.id, consultationId),
            eq(consultations.clinicId, session.user.clinicId)
        ),
    });

    if (!consultation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const files = await listPatientFilesByConsultation(consultationId, session.user.clinicId);
    return NextResponse.json(files);
}
