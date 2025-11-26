import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pending = await prisma.reportDownload.findMany({
      where: { synced: false },
      orderBy: { requestedAt: "desc" },
    });
    return NextResponse.json(pending);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Pending Data" },
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
