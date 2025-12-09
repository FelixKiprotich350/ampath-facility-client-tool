import { schedulePlaywrightReports } from "@/lib/download-scheduler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { reportPeriod } = await request.json();

    if (!reportPeriod) {
      return NextResponse.json(
        { error: "reportPeriod is required" },
        { status: 400 }
      );
    }
    let result = await schedulePlaywrightReports(reportPeriod);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Collection failed" }, { status: 500 });
  }
}
