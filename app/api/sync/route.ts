import { NextRequest, NextResponse } from "next/server";
import { manualSync } from "@/lib/sync-scheduler";
import { syncToAmep } from "@/lib/data-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    const result = await syncToAmep("202509", username, password);
    if (result.error) {
      return NextResponse.json({ result }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
