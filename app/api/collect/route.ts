import { NextRequest, NextResponse } from "next/server";
import { collectFromBroswer } from "@/lib/data-collector";

export async function POST(request: NextRequest) {
  try {
    const { dataType } = await request.json();
    let result = await collectFromBroswer();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Collection failed" }, { status: 500 });
  }
}
