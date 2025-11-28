import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const fac_name = process.env.FACILITY_NAME;

  return NextResponse.json({
    facilityName: fac_name,
    lastSync: new Date(),
  });
}
