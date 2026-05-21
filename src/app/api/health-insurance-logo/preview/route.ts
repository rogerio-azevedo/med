import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { healthInsurances } from "@/db/schema";
import { resolveHealthInsuranceLogoUrlForPrint } from "@/lib/medical-document/resolve-signature-url";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await can("health-insurances", "can_read");
    if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const healthInsuranceId = searchParams.get("healthInsuranceId")?.trim();
    if (!healthInsuranceId) {
        return NextResponse.json({ error: "healthInsuranceId é obrigatório" }, { status: 400 });
    }

    const row = await db.query.healthInsurances.findFirst({
        where: eq(healthInsurances.id, healthInsuranceId),
        columns: { logoUrl: true },
    });
    const url = await resolveHealthInsuranceLogoUrlForPrint(row?.logoUrl ?? null);
    return NextResponse.json({ url });
}
