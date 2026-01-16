import { prisma } from "./prisma";

// the whole CSV as array of rows

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

export async function getStagedIndicators(synced: boolean) {
  return prisma.stagedIndicator.findMany({
    where: { syncedToAmpathAt: synced ? { not: null } : null },
  });
}

export async function markIndicatorsAsSynced(ids: number[]) {
  return prisma.indicator.updateMany({
    where: { id: { in: ids } },
    data: { synced: true, syncedAt: new Date() },
  });
}

export async function addStagedResults(
  indicatorObj: any,
  rawResult: any,
  startDate: string,
  endDate: string
) {
  return prisma.stagedIndicator.create({
    data: {
      indicatorCode: indicatorObj.code,
      indicatorName: indicatorObj.name,
      rawResult,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });
}

export async function getDataSummary() {
  const [pendingReports, syncedReports] = await Promise.all([
    prisma.stagedIndicator.count({ where: { syncedToAmpathAt: null } }),
    prisma.stagedIndicator.count({
      where: { syncedToAmpathAt: { not: null } },
    }),
  ]);

  return {
    pendingReports: { total: pendingReports },
    syncedReports: { total: syncedReports },
  };
}
