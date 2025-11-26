import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const serverUrl = process.env.SERVER_URL;

    const response = await fetch(`${serverUrl}/report-types`);
    const reports = await response.json();
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Report Types" },
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
