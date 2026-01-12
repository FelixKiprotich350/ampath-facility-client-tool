import { executeReportQuery } from "@/lib/queryreports";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { reportType, startDate, endDate } = await request.json();

    if (!reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "reportType, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const data = await executeReportQuery(reportType, startDate, endDate);

    return NextResponse.json({
      success: true,
      data,
      recordCount: Array.isArray(data) ? data.length : 0
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Query execution failed", 
      details: error.message 
    }, { status: 500 });
  }
}
