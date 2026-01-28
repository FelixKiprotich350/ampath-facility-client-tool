import { NextRequest, NextResponse } from "next/server";
import { syncToAmep } from "@/lib/data-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password, yearMonth, selectedItems, importStrategy } =
      body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 },
      );
    }
    if (!yearMonth || !importStrategy) {
      return NextResponse.json(
        { error: "yearMonth and importStrategy are required" },
        { status: 400 },
      );
    }

    if (
      !selectedItems ||
      !Array.isArray(selectedItems) ||
      selectedItems.length === 0
    ) {
      return NextResponse.json(
        { error: "You must select atleast 1 Report" },
        { status: 400 },
      );
    }

    const result = await syncToAmep(
      yearMonth,
      username,
      password,
      importStrategy,
      selectedItems,
    );
    if (result.error) {
      return NextResponse.json(result.responseData, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
