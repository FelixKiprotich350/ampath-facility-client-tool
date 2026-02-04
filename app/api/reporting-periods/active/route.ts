import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const reportingPeriod = await prisma.reportingPeriod.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!reportingPeriod) {
      return NextResponse.json(
        { error: "No reporting period found", success: false, data: null },
        { status: 404 },
      );
    }
    if (reportingPeriod.deletedAt !== null) {
      return NextResponse.json(
        { error: "Reporting period is Disabled", success: false, data: null },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: reportingPeriod });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to retrieve reporting period" },
      { status: 500 },
    );
  }
}
