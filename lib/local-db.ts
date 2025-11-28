import { prisma } from "./prisma";

export async function addIndicator(
  facilityId: string,
  indicatorId: string,
  name: string,
  value: string,
  period: string,
  data: any
) {
  return prisma.indicator.create({
    data: { facilityId, indicatorId, name, value, period, data },
  });
}

export async function addLineList(
  facilityId: string,
  patientId: string | null,
  data: any
) {
  return prisma.lineList.create({
    data: { facilityId, patientId, data },
  });
}
 

export async function getUnsyncedReports() {
  return prisma.reportDownload.findMany({
    where: { synced: false },
  });
}

export async function markIndicatorsAsSynced(ids: number[]) {
  return prisma.indicator.updateMany({
    where: { id: { in: ids } },
    data: { synced: true, syncedAt: new Date() },
  });
}
 

export async function addReportDownload(
  reportUuid: string,
  filePath: string,
  requestUrl: string,
  response: string,
  period: string,
  recordCount?: number
) {
  return prisma.reportDownload.create({
    data: {
      reportUuid,
      filePath,
      requestUrl,
      response,
      reportPeriod: period,
      recordCount,
    },
  });
}

export async function getDataSummary() {
  const [pendingReports, syncedReports] = await Promise.all([
    prisma.reportDownload.count({ where: { synced: false } }),
    prisma.reportDownload.count({ where: { synced: true } }),
  ]);

  return {
    pendingReports: { total: pendingReports },
    syncedReports: { total: syncedReports },
  };
}
