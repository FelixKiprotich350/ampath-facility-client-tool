import { schedulePlaywrightReports } from "@/lib/download-scheduler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { reportPeriod, reports } = (await request.json()) as {
      reportPeriod: string;
      reports: any[];
    };

    if (!reportPeriod) {
      return NextResponse.json(
        { error: "reportPeriod is required" },
        { status: 400 }
      );
    }
    let result = await schedulePlaywrightReports(reportPeriod, reports);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Collection failed" }, { status: 500 });
  }
}
