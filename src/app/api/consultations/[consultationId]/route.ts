import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConsultationDetailsWithDoctor, getConsultationReturnStatus } from "@/db/queries/consultations";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ consultationId: string }> }
) {
    const session = await auth();
    const { consultationId } = await params;

    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const consultation = await getConsultationDetailsWithDoctor(
            consultationId,
            session.user.clinicId
        );

        if (!consultation) {
            return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
        }

        const returnStatus = await getConsultationReturnStatus(consultationId, session.user.clinicId);

        return NextResponse.json({
            ...consultation,
            hasReturn: returnStatus.hasReturn,
            returnConsultationId: returnStatus.returnConsultationId,
        });
    } catch (error) {
        console.error("API Error (Consultation Detail):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
