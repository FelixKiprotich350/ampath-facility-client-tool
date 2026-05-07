import { NextRequest, NextResponse } from "next/server";
import { getStagedIndicators } from "@/lib/local-db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportPeriod = parseInt(searchParams.get("reportPeriod") ?? "");
    const staged = await getStagedIndicators(false, reportPeriod);

    return NextResponse.json(staged);
  } catch (error: any) {
    console.error("Error fetching staged indicators:", error);
    return NextResponse.json(
      { error: "Failed to fetch staged indicators" },
      { status: 500 }
    );
  }
}
