import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIndicators } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  try {
    const indicators = await getIndicators();
    return NextResponse.json(Array.isArray(indicators) ? indicators : []);
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
