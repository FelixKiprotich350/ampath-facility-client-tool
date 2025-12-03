import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const mappings = await prisma.dataElementMapping.findMany();
    return NextResponse.json(mappings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch mappings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const mapping = await prisma.dataElementMapping.upsert({
      where: { reportKey: data.reportKey },
      update: data,
      create: data
    });
    return NextResponse.json(mapping);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create mapping" }, { status: 500 });
  }
}