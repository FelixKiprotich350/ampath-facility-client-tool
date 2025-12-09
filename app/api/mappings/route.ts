import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDataElementsMapping } from "@/lib/data-collector";

export async function GET() {
   try {
     const mappings = await getDataElementsMapping();
     return NextResponse.json(mappings);
   } catch (error) {
     console.error("Error fetching mapppings:", error);
     return NextResponse.json(
       { error: "Internal server error" },
       { status: 500 }
     );
   }
}
 