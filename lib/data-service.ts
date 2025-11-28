import { getUnsyncedReports } from "./local-db";
import { readFileSync } from "fs";
import { prisma } from "./prisma";
import { error } from "console";

export async function syncLocalData(targetUrl: string) {
  let successfullSync = [];
  let failedSync = [];
  try {
    const lineList = await getUnsyncedReports();
    const report = lineList[0];

    if (lineList.length > 0) {
      const formData = new FormData();
      // const csvFile = readFileSync(report.filePath);
      // formData.append(
      //   "file",
      //   new Blob([csvFile], { type: "text/csv" }),
      //   "report.csv"
      // );
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
        successfullSync.push(report.id);
      } else {
        failedSync.push({ id: report.id, error: `HTTP ${response.status}` });
      }
    }

    return {
      successfullSync,
      failedSync,
      error: null,
    };
  } catch (error) {
    console.error("Sync failed:", error);
    return {
      successfullSync,
      failedSync,
      error: error,
    };
  }
}
