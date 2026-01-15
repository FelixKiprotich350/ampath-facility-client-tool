import { addIndicator, addLineList, addStagedResults } from "./local-db";
import { addReportToQueue } from "./report-queue";
import { executeReportQuery } from "./queryreports";

/**
 * Convert month format to YYYYMM
 */
function convertToYYYYMM(monthValue: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();

  // If already in YYYYMM format, return as is
  if (/^\d{6}$/.test(monthValue)) {
    return monthValue;
  }

  // Extract month number from various formats
  const monthMatch = monthValue.match(/\d{1,2}/);
  if (monthMatch) {
    const month = parseInt(monthMatch[0], 10);
    return `${currentYear}${String(month).padStart(2, "0")}`;
  }

  // Fallback to current year-month
  return `${currentYear}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type ReportType = {
  kenyaEmrReportUuid: string;
  name?: string;
  reportType?: string;
  [k: string]: any;
};

type ComboDefinition = {
  id: string;
  comboId: string;
  gender: string;
  ageband: string;
  description?: string; 
  createdAt: string;
  updatedAt: string;
};

/**
 * Execute a single indicator query directly from database
 */
export async function executeSingleIndicator(
  indicatorObj: any,
  startDate: string,
  endDate: string
) {
  try {
    console.log(`Starting direct query for indicator: ${indicatorObj}`);
    if (!indicatorObj) {
      throw new Error("Indicator object is required for direct database query");
    }

    const data = await executeReportQuery(indicatorObj, startDate, endDate);
    const recordCount = Array.isArray(data) ? data.length : 0;

    // Convert data to CSV-like format for compatibility
    const csvContent = JSON.stringify(data);
    await addStagedResults(indicatorObj, csvContent, startDate, endDate);

    console.log(
      `Indicator ${indicatorObj} completed: (${recordCount} records)`
    );

    return { records: recordCount, message: "success" };
  } catch (error) {
    console.error("Direct query failed:", (error as Error).message);
    throw error;
  }
}

/**
 * getMappings - fetch mappings from API
 */
export async function getDataElementsMapping(): Promise<ReportType[]> {
  try {
    const serverUrl = process.env.AMPATH_SERVER_URL;
    if (!serverUrl) {
      console.warn("SERVER_URL not set - returning empty mapping list");
      return [];
    }
    const response = await fetch(`${serverUrl}/mappings`, {
      headers: { Accept: "application/json" },
    });
    const reports = await response.json();
    return Array.isArray(reports) ? reports : [];
  } catch (error) {
    console.error("Failed to fetch reports types:", (error as Error).message);
    return [];
  }
}

/**
 * getComboElementsMapping - fetch combo elements mappings from API
 */
export async function getComboElementsMapping(): Promise<ComboDefinition[]> {
  try {
    const serverUrl = process.env.AMPATH_SERVER_URL;
    if (!serverUrl) {
      console.warn("SERVER_URL not set - returning empty mapping list");
      return [];
    }
    const response = await fetch(`${serverUrl}/combomappings`, {
      headers: { Accept: "application/json" },
    });
    const reports = await response.json();
    return Array.isArray(reports) ? reports : [];
  } catch (error) {
    console.error("Failed to fetch reports types:", (error as Error).message);
    return [];
  }
}
