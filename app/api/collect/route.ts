import { executeSingleIndicator } from "@/lib/data-collector";
import { getIndicators } from "@/lib/data-service";
import { executeReportQuery } from "@/lib/queryreports";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { reportType, selectedIndicators, reportPeriod } =
      await request.json();

    if (!reportType || !selectedIndicators || !reportPeriod) {
      return NextResponse.json(
        {
          error:
            "reportType, selectedIndicators, and reportPeriod are required",
        },
        { status: 400 },
      );
    }
    if (selectedIndicators.length <= 0 && !Array.isArray(selectedIndicators)) {
      return NextResponse.json(
        { error: "At least one indicator must be specified" },
        { status: 400 },
      );
    }
    const [year, month] = reportPeriod.split("-").map(Number);
    const lastdate = new Date(year, month, 0).getDate();
    const endDate = `${reportPeriod}-${String(lastdate).padStart(2, "0")}`;
    const startDate = `${reportPeriod}-01`;

    const allindicators = await getIndicators();

    selectedIndicators.forEach(async (selected) => {
      const indicatorObj = allindicators.find((ind) => ind.code === selected);
      if (!indicatorObj) {
        throw new Error(`Indicator with id ${selected} not found`);
      }
      console.log(
        `Executing indicator ${indicatorObj.code} for period ${reportPeriod}`,
      );
      await executeSingleIndicator(
        indicatorObj,
        startDate,
        endDate,
        (reportPeriod as string).replace("-", ""),
      );
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
      { status: 500 },
    );
  }
}
