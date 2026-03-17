import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchIcd10 } from "@/db/queries/icd10";

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        const results = await searchIcd10(query);
        return NextResponse.json(results);
    } catch (error) {
        console.error("API Error (ICD10 Search):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
