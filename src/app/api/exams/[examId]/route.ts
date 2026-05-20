import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getExamDetails } from "@/db/queries/exams";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ examId: string }> }
) {
    const session = await auth();
    const { examId } = await params;

    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const exam = await getExamDetails(examId, session.user.clinicId);

        if (!exam) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        return NextResponse.json(exam);
    } catch (error) {
        console.error("API Error (Exam Detail):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
