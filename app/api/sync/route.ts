import { NextRequest, NextResponse } from "next/server";
import { manualSync } from "@/lib/sync-scheduler";
import { syncLocalData } from "@/lib/data-service";

export async function POST() {
  try {
    const SYNC_URL = process.env.SERVER_URL;
    const facilityId = process.env.FACILITY_ID;
    const result = await syncLocalData(
      `${SYNC_URL}/facility-report/${facilityId}`
    );
    if (result.error) {
      return NextResponse.json({ result }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
