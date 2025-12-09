import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const fac_name = process.env.FACILITY_NAME;
  const pendingData = await prisma.reportDownload.count({
    where: { syncedToAmep: false },
  });
  const syncedData = await prisma.reportDownload.count({
    where: { syncedToAmep: true },
  });
  return NextResponse.json({
    facilityName: fac_name,
    lastSync: new Date(),
    pendingData,
    syncedData,
  });
}
