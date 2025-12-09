import { NextRequest, NextResponse } from "next/server";
import { getUnsyncedReports } from "@/lib/local-db";

export async function GET(request: NextRequest) {
  try {
    const reports = await getUnsyncedReports();
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch pending reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending reports" },
      { status: 500 }
    );
  }
}
