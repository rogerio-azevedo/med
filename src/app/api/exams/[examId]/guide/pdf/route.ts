import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { generateSadtPdfFromTemplate } from "@/lib/medical-document/exam-sadt-template";
import { resolveHealthInsuranceLogoUrlForPrint } from "@/lib/medical-document/resolve-signature-url";
import { getExamGuidePrintContext } from "@/db/queries/exams/guide-print-context";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ examId: string }> }
) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;
    if (!clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await can("medical-records", "can_read"))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { examId } = await params;

    try {
        const context = await getExamGuidePrintContext(examId, clinicId);
        if (!context) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        const logoUrl = await resolveHealthInsuranceLogoUrlForPrint(context.insuranceLogoKeyOrUrl);
        const pdf = await generateSadtPdfFromTemplate(context, {
            insuranceLogoGetUrl: logoUrl,
            numeroGuiaPrestador: examId.replace(/\D/g, "").slice(0, 20) || examId.slice(0, 20),
        });

        const filename = `Guia-SP-SADT-${examId.slice(0, 8)}.pdf`;
        const forceDownload = new URL(request.url).searchParams.get("download") === "1";
        const disposition = forceDownload
            ? `attachment; filename="${filename}"`
            : `inline; filename="${filename}"`;

        return new NextResponse(Buffer.from(pdf), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Length": String(pdf.byteLength),
                "Content-Disposition": disposition,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("API Error (Exam SADT PDF):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
