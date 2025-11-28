import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const fac_name = process.env.FACILITY_NAME;
  const pendingData = await prisma.reportDownload.count({
    where: { synced: false },
  });
  const syncedData = await prisma.reportDownload.count({
    where: { synced: true },
  });
  return NextResponse.json({
    facilityName: fac_name,
    lastSync: new Date(),
    pendingData,
    syncedData,
  });
}
