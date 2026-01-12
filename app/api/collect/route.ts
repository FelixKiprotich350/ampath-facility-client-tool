import { executeSingleIndicator } from "@/lib/data-collector";
import { executeReportQuery } from "@/lib/queryreports";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { reportType, indicators, reportPeriod } = await request.json();

    if (!reportType || !indicators || !reportPeriod) {
      return NextResponse.json(
        { error: "reportType, indicators, and reportPeriod are required" },
        { status: 400 }
      );
    }
    if (indicators.length <= 0 && !Array.isArray(indicators)) {
      return NextResponse.json(
        { error: "At least one indicator must be specified" },
        { status: 400 }
      );
    }
    const [year, month] = reportPeriod.split("-").map(Number);
    const lastdate = new Date(year, month, 0).getDate();
    const endDate = `${reportPeriod}-${String(lastdate).padStart(2, "0")}`;
    const startDate = `${reportPeriod}-01`;
    indicators.forEach(async (indicator) => {
      await executeSingleIndicator(indicator, startDate, endDate);
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Query execution failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
