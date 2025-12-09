import { startAllSchedulers } from "@/lib/scheduler-manager";
import { NextResponse } from "next/server";

export async function POST() {
  startAllSchedulers();
  return NextResponse.json({ message: "Scheduler started" });
}
