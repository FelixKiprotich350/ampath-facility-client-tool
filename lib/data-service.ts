import { getUnsyncedReports } from "./local-db";
import { readFileSync } from "fs";
import { prisma } from "./prisma";
import { error } from "console";
import { KENYAEMR_REPORTS } from "./database";
import https from "https"; // Add this import

const SYNC_URL = process.env.AMEP_SERVER_URL;
const targetUrl = `${SYNC_URL}/dataValueSets`;

// Get mapping for a report key
export async function getDataElementMapping() {
  return await prisma.amepElementstMapping.findMany({});
}

export async function syncToAmep(
  reportingMonth: string,
  username?: string,
  password?: string
) {
  let successfullSync = [];
  let failedSync = [];

  try {
    const lineList = await getUnsyncedReports();
    const report = lineList[0];

    if (!report) {
      console.log("No unsynced reports found");
      return { successfullSync, failedSync, error: null };
    }

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

    // Example of using mapping - replace with actual report data processing
    const mappings = await getDataElementMapping();
    const dataValues = mappings.map((m) => ({
      dataElement: m?.dataElementId,
      attributeOptionCombo: m?.attributeOptionComboId,
      categoryOptionCombo: m?.categoryOptionComboId,
      value: "10",
    }));
    const body = {
      dataSet: "Lf1skJGdrzj",
      completeDate: "2025-11-01",
      period: reportingMonth,
      orgUnit: "fCj9Bn7iW2m",
      dataValues,
    };

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      // agent: httpsAgent, // Add this line - CRITICAL for Node.js
      // Optional: Add signal for timeout control
      signal: AbortSignal.timeout(35000),
    });

    const responseText = await response.json();
    console.log("Response status:", response.status);

    console.log("Response body:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    if (response.ok) {
      // Uncomment when ready to update database
      /*
      await prisma.reportDownload.update({
        where: { id: report.id },
        data: { 
          synced: true, 
          syncedAt: new Date(),
          syncResponse: responseData
        },
      });
      */

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
          responseData.message || responseData.description || responseText,
        conflicts: responseData.conflicts,
        response: responseData,
      });
      console.error(`Failed to sync report ${report.id}:`, responseData);
    }

    return {
      successfullSync,
      failedSync,
      error: null,
      response: responseData,
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
