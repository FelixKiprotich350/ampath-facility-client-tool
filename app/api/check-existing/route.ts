import { NextRequest, NextResponse } from "next/server";
import { checkExistingData } from "@/lib/local-db";

export async function POST(request: NextRequest) {
  try {
    const { indicatorIds, username, password } = await request.json();
    
    if (!Array.isArray(indicatorIds) || indicatorIds.length === 0) {
      return NextResponse.json({ error: "Invalid indicator IDs" }, { status: 400 });
    }

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const existingData = await checkExistingData(indicatorIds, username, password);
    
    return NextResponse.json({ existingData });
  } catch (error) {
    console.error("Error checking existing data:", error);
    return NextResponse.json({ error: "Failed to check existing data" }, { status: 500 });
  }
}