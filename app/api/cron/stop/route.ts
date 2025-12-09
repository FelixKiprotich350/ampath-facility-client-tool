import { startAllSchedulers, stopAllSchedulers } from "@/lib/scheduler-manager";
import { NextResponse } from "next/server";

let schedulerStarted = false;

export async function POST() {
  if (!schedulerStarted) {
    stopAllSchedulers();
    schedulerStarted = true;
    return NextResponse.json({ message: "Cron scheduler started" });
  }
  return NextResponse.json({ message: "Cron scheduler already running" });
}
