import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { id } = await request.json();
  await prisma.reportQueue.update({
    where: { id },
    data: { status: "PENDING", error: null, processedAt: null },
  });
  return NextResponse.json({ success: true });
}
