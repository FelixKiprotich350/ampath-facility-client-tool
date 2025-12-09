import { NextRequest, NextResponse } from "next/server"; 
import { syncToAmep } from "@/lib/data-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password, yearMonth } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const result = await syncToAmep(yearMonth, username, password);
    if (result.error) {
      return NextResponse.json({ result }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
