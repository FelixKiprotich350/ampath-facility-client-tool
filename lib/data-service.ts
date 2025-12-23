import { getUnsyncedReports } from "./local-db";
import { readFileSync } from "fs";
import { prisma } from "./prisma";
import { error } from "console";
import { KENYAEMR_REPORTS } from "./database";
import https from "https"; // Add this import
import { getDataElementsMapping } from "./data-collector";

const SYNC_URL = process.env.AMEP_SERVER_URL;
const targetUrl = `${SYNC_URL}/dataValueSets`;

/**
 * Find value in CSV data by variable name
 */
function findValueInCsvData(
  csvData: any[],
  variableName: string
): string | null {
  if (!Array.isArray(csvData) || !csvData.length) return null;

  if (!variableName || !variableName.trim()) return null;
  if (variableName.trim().toLowerCase() === "calculated") return null;
  for (const reportElement of csvData) {
    // Search through all values in this row
    for (const key of Object.keys(reportElement)) {
      const cellValue = String(reportElement[key] ?? "")
        .trim()
        .toLowerCase();

      if (cellValue == variableName.trim().toLowerCase()) {
        // Found the matching row — return the result column
        return reportElement.column2 ?? null; // <-- change column2 if needed
      }
    }
  }

  return null;
}

export async function syncToAmep(
  reportingMonth: string,
  username: string,
  password: string,
  selectedItems: number[]
) {
  let successfullSync = [];
  let failedSync = [];

  try {
    const pendingReports = await getUnsyncedReports();

    if (!pendingReports.length) {
      console.log("No unsynced reports found");
      return { successfullSync, failedSync, error: null };
    }

    const selectedReports = pendingReports.filter((report) =>
      selectedItems.includes(report.id)
    );

    if (!selectedReports.length) {
      console.log("No reports match the selected items");
      return { successfullSync, failedSync, error: null };
    }

    console.log(`Processing ${selectedReports.length} pending reports`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (username && password) {
      // Use Buffer instead of btoa for Node.js
      const credentials = Buffer.from(`${username}:${password}`).toString(
        "base64"
      );
      headers.Authorization = `Basic ${credentials}`;
    }

    // Process each pending report
    for (const report of selectedReports) {
      try {
        // Parse CSV content
        const csvData =
          typeof report.csvContent === "string"
            ? JSON.parse(report.csvContent)
            : report.csvContent;
        // Get mappings for this report
        const raw_mappings = await getDataElementsMapping();
        const mappings = raw_mappings.filter(
          (m) => m.kenyaEmrReportUuid === report.kenyaEmrReportUuid
        );

        if (mappings.length <= 0) {
          console.log(
            `No mappings found for report ${report.kenyaEmrReportUuid}`
          );
          continue;
        }

        // Map CSV variables to data elements
        const dataValues = [];
        for (const mapping of mappings) {
          // Find value in CSV data by variable name
          const csvValue = findValueInCsvData(
            csvData,
            mapping.reportVariableName
          );
          if (csvValue !== null) {
            dataValues.push({
              dataElement: mapping.dataElementId,
              attributeOptionCombo: mapping.attributeOptionComboId,
              categoryOptionCombo: mapping.categoryOptionComboId,
              value: csvValue.toString(),
            });
          }
        }
        if (!dataValues.length) {
          console.log(
            `No data values mapped for report ${report.kenyaEmrReportUuid}`
          );
          continue;
        }
        const body = {
          dataSet: "Lf1skJGdrzj",
          completeDate: new Date().toISOString().split("T")[0],
          period: reportingMonth,
          orgUnit: "fCj9Bn7iW2m",
          dataValues,
        };
        const response = await fetch(targetUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(35000),
        });

        const responseData = await response.json();
        console.log("Response status:", response.status);
        console.log("Response body:", responseData);

        if (response.ok) {
          await prisma.reportDownload.update({
            where: { id: report.id },
            data: {
              syncedToAmep: true,
              syncedToAmepAt: new Date(),
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
          reportError.message
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
        "SSL certificate error - server certificate may be invalid"
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
