import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { doctors } from "@/db/schema/doctors";
import { resolveDoctorSignatureUrlForPrint } from "@/lib/medical-document/resolve-signature-url";

export const runtime = "nodejs";

export async function GET() {
    const session = await auth();
    if (!session?.user?.doctorId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const row = await db.query.doctors.findFirst({
        where: eq(doctors.id, session.user.doctorId),
        columns: { signatureUrl: true },
    });
    const url = await resolveDoctorSignatureUrlForPrint(row?.signatureUrl ?? null);
    return NextResponse.json({ url });
}
