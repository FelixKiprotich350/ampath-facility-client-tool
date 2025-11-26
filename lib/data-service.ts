import { getUnsyncedLineList } from "./local-db";
import { readFileSync } from "fs";
import { prisma } from "./prisma";

export async function syncLocalData(targetUrl: string) {
  try {
    const facilityKey = process.env.FACILITY_KEY;

    const lineList = await getUnsyncedLineList();
    const report = lineList[0];
    let syncedCount = 0;

    if (lineList.length > 0) {
      const formData = new FormData();
      const csvFile = readFileSync(report.filePath);
      formData.append(
        "file",
        new Blob([csvFile], { type: "text/csv" }),
        "report.csv"
      );
      formData.append("reportTypeId", report.reportUuid);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FACILITY_KEY}`,
          "x-key": process.env.FACILITY_KEY || "",
        },
        body: formData,
      });

      if (response.ok) {
        await prisma.reportDownload.update({
          where: { id: report.id },
          data: { synced: true, syncedAt: new Date() },
        });
        syncedCount += 1;
      }
    }

    return {
      success: true,
      message: "Sync completed",
      count: syncedCount,
      details: {
        lineList: lineList.length,
      },
    };
  } catch (error) {
    console.error("Sync failed:", error);
    return {
      success: false,
      error: "Sync failed",
    };
  }
}
