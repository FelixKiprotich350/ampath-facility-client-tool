import getReportsList from "@/lib/masterReportList";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const test = await getReportsList();

  return NextResponse.json({
    message: "Hello from Next.js API!",
    timestamp: new Date().toISOString(),
  });
}
