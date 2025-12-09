import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReportsList } from "@/lib/data-collector";

export async function GET(request: NextRequest) {
  try {
    const reportTypes = await getReportsList();
    return NextResponse.json(reportTypes);
  } catch (error) {
    console.error("Error fetching reportTypes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const { name, description, query, source, apiUrl } = await request.json();

    const indicatorType = await prisma.indicatorType.create({
      data: { name, description, query, source, apiUrl },
    });

    return NextResponse.json(indicatorType);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create indicator type" },
      { status: 500 }
    );
  }
}
