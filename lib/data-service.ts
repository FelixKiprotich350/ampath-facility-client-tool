import { getStagedIndicators } from "./local-db";
import { prisma } from "./prisma";
import { getComboElementsMapping } from "./data-collector";

const SYNC_URL = process.env.AMEP_SERVER_URL;
const targetUrl = `${SYNC_URL}/dataValueSets`;

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
    let dataValues = [];
    // Process each pending indicator
    for (const indicator of selectedIndicators) {
      try {
        // Parse data content
        const data = JSON.parse(indicator.rawResult.toString()) as any[];

        // Get mappings for this report
        const raw_mappings = await getComboElementsMapping();
        const mappings = raw_mappings;
        if (mappings.length <= 0) {
          console.log(
            `No mappings found for report ${indicator.indicatorCode}`,
          );
          continue;
        }

        for (const m of mappings) {
          dataValues.push({
            dataElement: indicator.indicatorCode,
            attributeOptionCombo: m.attributeOptionComboId,
            categoryOptionCombo: m.comboId,
            value:
              data.find(
                (v) => v.gender === m.gender && v.age_band === m.ageband,
              )?.totalcount ?? 0,
          });
        }
        // // Map data variables to data elements
        // for (const element of data) {
        //   const categoryOptionCombo = findCategoryOptionCombo(
        //     mappings,
        //     element.gender,
        //     element.age_band,
        //   );
        //   // Find value in data by variable name
        //   if (categoryOptionCombo !== null) {
        //     dataValues.push({
        //       dataElement: indicator.indicatorCode,
        //       attributeOptionCombo: categoryOptionCombo.attributeOptionComboId,
        //       categoryOptionCombo: categoryOptionCombo.comboId,
        //       value: element.totalcount.toString(),
        //     });
        //   }
        // }
      } catch (reportError: any) {
        console.error(
          `Error processing report ${indicator.id}:`,
          reportError.message,
        );
        failedSync.push({
          id: indicator.id,
          error: reportError.message,
        });
      }
    }
    if (!dataValues.length) {
      console.log(`No data values mapped for syncing to AMEP`);
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
      `Syncing to AMEP at ${targetUrl + "?importStrategy=" + importStrategy}`,
    );
    const response = await fetch(
      targetUrl + "?dryRun=true&importStrategy=" + importStrategy,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(35000),
      },
    );

    const responseData = await response.json();
    console.log("Response body:", responseData);
    let error = null;
    if (response.ok) {
      // await prisma.stagedIndicator.update({
      //   where: { id: ind.id },
      //   data: {
      //     syncedToAmpathAt: new Date(),
      //     syncedValues: JSON.stringify(responseData),
      //   },
      // });
    } else {
      console.error(`Failed to sync to AMEP:`, responseData);
      error = responseData;
    }
    return { responseData, error };
  } catch (error: any) {
    console.error("Sync failed with error:", error);
    return {
      responseData: null,
      error: error,
    };
  }
}
