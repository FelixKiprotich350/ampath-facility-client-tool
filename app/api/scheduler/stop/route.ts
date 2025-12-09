import { stopAllSchedulers } from "@/lib/scheduler-manager";
import { NextResponse } from "next/server";

export async function POST() {
  stopAllSchedulers();
  return NextResponse.json({ message: "Scheduler stopped" });
}
