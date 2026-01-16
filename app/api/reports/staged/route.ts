import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStagedIndicators } from "@/lib/local-db";

export async function GET(request: NextRequest) {
  try {
    const staged = await getStagedIndicators(false);

    return NextResponse.json(staged);
  } catch (error: any) {
    console.error("Error fetching staged indicators:", error);
    return NextResponse.json(
      { error: "Failed to fetch staged indicators" },
      { status: 500 }
    );
  }
}
