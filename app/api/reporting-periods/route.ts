import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const periods = await prisma.reportingPeriod.findMany({
      where: { deletedAt: null },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return NextResponse.json({ data: periods, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reporting periods" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { year, month } = await request.json();

    const period = await prisma.reportingPeriod.create({
      data: {
        year: parseInt(year),
        month: parseInt(month),
        fullName: parseInt(`${year}${month.toString().padStart(2, "0")}`),
      },
    });

    return NextResponse.json({ data: period, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create reporting period" },
      { status: 500 },
    );
  }
}
