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

    indicators.forEach(async (indicator) => {
      await executeSingleIndicator(indicator, reportPeriod, reportPeriod);
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
