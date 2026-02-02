import { NextRequest, NextResponse } from "next/server";
import { getStagedIndicators, deleteStagedIndicators } from "@/lib/local-db";

export async function GET(request: NextRequest) {
  try {
    const reports = await getStagedIndicators(false);
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch pending reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending reports" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing ids" },
        { status: 400 }
      );
    }

    const result = await deleteStagedIndicators(ids);
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    });
  } catch (error) {
    console.error("Failed to delete staged indicators:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete staged indicators" },
      { status: 500 }
    );
  }
}
