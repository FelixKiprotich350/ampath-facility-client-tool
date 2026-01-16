import { NextRequest, NextResponse } from "next/server";
import { getStagedIndicators } from "@/lib/local-db";

export async function GET(request: NextRequest) {
  try {
    const reports = await getStagedIndicators(false);
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch pending reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending reports" },
      { status: 500 }
    );
  }
}
