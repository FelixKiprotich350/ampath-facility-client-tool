import { getStagedIndicators } from "./local-db";
import { prisma } from "./prisma";
import { getComboElementsMapping } from "./data-collector";

const SYNC_URL = process.env.AMEP_SERVER_URL;
const targetUrl = `${SYNC_URL}/dataValueSets`;

/**
 * Find findCategoryOptionCombo in data by gender and ageband
 */
function findCategoryOptionCombo(
  data: any[],
  gender: string,
  ageband: string,
): any | null {
  if (!Array.isArray(data) || !data.length) return null;

  if (!gender || !gender.trim()) return null;
  if (!ageband || !ageband.trim()) return null;

  const match = data.find((item) => {
    return (
      item.gender.toLowerCase() === gender.toLowerCase() &&
      item.ageband.toLowerCase() === ageband.toLowerCase()
    );
  });

  return match ? match : null;
}
export async function getIndicators() {
  try {
    const serverUrl = process.env.AMPATH_SERVER_URL;
    if (!serverUrl) {
      console.warn("SERVER_URL not set - returning empty mapping list");
      return [];
    }
    const response = await fetch(`${serverUrl}/indicators`, {
      headers: { Accept: "application/json" },
    });
    const indicators = await response.json();
    return Array.isArray(indicators) ? indicators : [];
  } catch (error) {
    console.error("Error fetching reportTypes:", error);
    return [];
  }
}
export async function syncToAmep(
  reportingMonth: string,
  username: string,
  password: string,
  importStrategy: string,
  selectedItems: number[],
) {
  let successfullSync = [];
  let failedSync = [];

  try {
    const pendingReports = await getStagedIndicators(false);

    if (!pendingReports.length) {
      console.log("No unsynced indicators found");
      return { successfullSync, failedSync, error: null };
    }

    const selectedIndicators = pendingReports.filter((report) =>
      selectedItems.includes(report.id),
    );

    if (!selectedIndicators.length) {
      console.log("No Indicators matches the selected items");
      return { successfullSync, failedSync, error: null };
    }

    console.log(`Processing ${selectedIndicators.length} pending indicators`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString(
        "base64",
      );
      headers.Authorization = `Basic ${credentials}`;
    }
    // Process each pending report
    for (const report of selectedIndicators) {
      try {
        // Parse data content
        const data = JSON.parse(report.rawResult.toString()) as any[];

        // Get mappings for this report
        const raw_mappings = await getComboElementsMapping();
        const mappings = raw_mappings;
        if (mappings.length <= 0) {
          console.log(`No mappings found for report ${report.indicatorCode}`);
          continue;
        }

        // Map data variables to data elements
        const dataValues = [];

        for (const element of data) {
          const categoryOptionCombo = findCategoryOptionCombo(
            mappings,
            element.gender,
            element.age_band,
          );
          // Find value in data by variable name
          if (categoryOptionCombo !== null) {
            dataValues.push({
              dataElement: report.indicatorCode,
              attributeOptionCombo: categoryOptionCombo.attributeOptionComboId,
              categoryOptionCombo: categoryOptionCombo.comboId,
              value: element.totalcount.toString(),
            });
          }
        }

        if (!dataValues.length) {
          console.log(
            `No data values mapped for report ${report.indicatorCode}`,
          );
          return;
        }

        const body = {
          dataSet: "Lf1skJGdrzj",
          completeDate: new Date().toISOString().split("T")[0],
          period: reportingMonth,
          orgUnit: "fCj9Bn7iW2m",
          dataValues,
        };
        console.log(
          `Syncing report ${report.id} to AMEP at ${targetUrl + "?importStrategy=" + importStrategy}`,
        );
        const response = await fetch(
          targetUrl + "?importStrategy=" + importStrategy,
          {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(35000),
          },
        );

        const responseData = await response.json();
        console.log("Response status:", response.status);
        console.log("Response body:", responseData);

        if (response.ok) {
          await prisma.stagedIndicator.update({
            where: { id: report.id },
            data: {
              syncedToAmpathAt: new Date(),
              syncedValues: JSON.stringify(responseData),
            },
          });

          successfullSync.push({
            id: report.id,
            response: responseData,
          });
          console.log(`Successfully synced report ${report.id}`);
        } else {
          failedSync.push({
            id: report.id,
            status: response.status,
            error: `HTTP ${response.status}`,
            message:
              responseData.message ||
              responseData.description ||
              "Unknown error",
            conflicts: responseData.conflicts,
            response: responseData,
          });
          console.error(`Failed to sync report ${report.id}:`, responseData);
        }
      } catch (reportError: any) {
        console.error(
          `Error processing report ${report.id}:`,
          reportError.message,
        );
        failedSync.push({
          id: report.id,
          error: reportError.message,
        });
      }
    }

    return {
      successfullSync,
      failedSync,
      error: null,
      message: `Processed ${pendingReports.length} reports`,
      count: successfullSync.length,
    };
  } catch (error: any) {
    console.error("Sync failed with error:", error);

    // Detailed error logging
    if (
      error.name === "TimeoutError" ||
      error.code === "UND_ERR_CONNECT_TIMEOUT"
    ) {
      console.error("Connection timeout - check network connectivity");
    } else if (
      error.code === "CERT_HAS_EXPIRED" ||
      error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
    ) {
      console.error(
        "SSL certificate error - server certificate may be invalid",
      );
    } else if (error.code === "ECONNREFUSED") {
      console.error("Connection refused - server may be down or port blocked");
    }

    return {
      successfullSync,
      failedSync,
      error: error.message,
    };
  }
}
