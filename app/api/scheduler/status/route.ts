import { NextResponse } from "next/server";
import { getSchedulerStatus } from "@/lib/scheduler-manager";

export async function GET() {
  const running = getSchedulerStatus();
  return NextResponse.json({ running });
}
