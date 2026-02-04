import { prisma } from "./prisma";

// the whole CSV as array of rows

export async function addIndicator(
  facilityId: string,
  indicatorId: string,
  name: string,
  value: string,
  period: string,
  data: any,
) {
  return prisma.indicator.create({
    data: { facilityId, indicatorId, name, value, period, data },
  });
}

export async function addLineList(
  facilityId: string,
  patientId: string | null,
  data: any,
) {
  return prisma.lineList.create({
    data: { facilityId, patientId, data },
  });
}

export async function getStagedIndicators(synced: boolean) {
  return prisma.stagedIndicator.findMany({
    where: { syncedToAmpathAt: synced ? { not: null } : null },
    orderBy: { createdAt: "desc" },
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
  endDate: string,
  reportPeriod: number,
) {
  return prisma.stagedIndicator.create({
    data: {
      indicatorCode: indicatorObj.code,
      indicatorName: indicatorObj.name,
      sectionId: indicatorObj.datasetSectionId,
      sectionName: indicatorObj.DatasetSection?.name ?? "--",
      datasetId: indicatorObj.datasetId,
      datasetName: indicatorObj.Dataset?.name ?? "--",
      reportPeriod: parseInt(reportPeriod.toString()),
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

export async function checkExistingData(
  indicatorIds: number[],
  username?: string,
  password?: string,
) {
  try {
    // Get the staged indicators
    const stagedIndicators = await prisma.stagedIndicator.findMany({
      where: { id: { in: indicatorIds } },
      select: {
        id: true,
        indicatorCode: true,
        indicatorName: true,
        startDate: true,
        endDate: true,
        rawResult: true,
      },
    });

    const existingData = [];
    const AMEP_URL = process.env.AMEP_SERVER_URL;

    if (!AMEP_URL) {
      console.warn("AMEP_SERVER_URL not configured");
      return [];
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString(
        "base64",
      );
      headers.Authorization = `Basic ${credentials}`;
    }

    for (const indicator of stagedIndicators) {
      try {
        // Format period from dates (assuming monthly reporting)
        const startDate = new Date(indicator.startDate);
        const period = `${startDate.getFullYear()}${String(
          startDate.getMonth() + 1,
        ).padStart(2, "0")}`;

        // Check AMEP for existing data values
        const checkUrl = `${AMEP_URL}/dataValueSets?dataSet=Lf1skJGdrzj&orgUnit=fCj9Bn7iW2m&period=${period}&dataElement=${indicator.indicatorCode}&format=json`;
        console.log(
          `Checking existing data for indicator ${indicator.indicatorCode} at ${checkUrl}`,
        );
        const response = await fetch(checkUrl, {
          headers,
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          // If dataValues exist, this indicator has existing data
          if (data.dataValues && data.dataValues.length > 0) {
            for (const dv of data.dataValues) {
              existingData.push({
                dataElement: dv.dataElement,
                categoryOptionCombo: dv.categoryOptionCombo,
                attributeOptionCombo: dv.attributeOptionCombo,
                value: dv.value,
                storedBy: dv.storedBy,
                lastUpdated: dv.lastUpdated,
                period: dv.period,
              });
            }
          }
        }
      } catch (error) {
        console.error(
          `Error checking indicator ${indicator.indicatorCode}:`,
          error,
        );
      }
    }

    return existingData;
  } catch (error) {
    console.error("Error in checkExistingData:", error);
    return [];
  }
}

export async function deleteStagedIndicators(ids: number[]) {
  return prisma.stagedIndicator.deleteMany({
    where: { id: { in: ids } },
  });
}
