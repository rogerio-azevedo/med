import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSurgeryDetails } from "@/db/queries/surgeries";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ surgeryId: string }> }
) {
    const session = await auth();
    const { surgeryId } = await params;

    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const surgery = await getSurgeryDetails(surgeryId, session.user.clinicId);

        if (!surgery) {
            return NextResponse.json({ error: "Surgery not found" }, { status: 404 });
        }

        return NextResponse.json(surgery);
    } catch (error) {
        console.error("API Error (Surgery Detail):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
