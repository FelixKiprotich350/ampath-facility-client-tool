import {
  getNextPendingReport,
  markReportProcessing,
  markReportCompleted,
  markReportFailed,
  addReportToQueue,
} from "./report-queue";
import { downloadSingleReport } from "./data-collector";
import { addLineList } from "./local-db";

type ReportType = {
  kenyaEmrReportUuid: string;
  name?: string;
  [k: string]: any;
};

let isRunning = false;

export async function startDownloadScheduler() {
  if (isRunning) return;

  isRunning = true;
  console.log(
    "Report download scheduler started - processing reports continuously"
  );

  while (isRunning) {
    try {
      const report = await getNextPendingReport();

      if (!report) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      console.log(
        `Processing report: ${report.kenyaEmrReportUuid} for period ${report.reportPeriod}`
      );
      await markReportProcessing(report.id);

      try {
        const reportPageUrl = `${process.env.KENYAEMR_SERVER}/kenyaemr/report.page`;
        await downloadSingleReport({
          kenyaEmrReportUuid: report.kenyaEmrReportUuid,
        });

        await markReportCompleted(report.id);
        console.log(`Report ${report.kenyaEmrReportUuid} completed`);
      } catch (error: any) {
        await markReportFailed(report.id, error.message);
        console.error(
          `Report ${report.kenyaEmrReportUuid} failed:`,
          error.message
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error("Queue processing error:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export function stopDownloadScheduler() {
  isRunning = false;
}

export function getDownloadSchedulerStatus() {
  return isRunning;
}

/**
 * collectFromBrowser - iterate reports and schedule them
 */
export async function schedulePlaywrightReports(reportPeriod: string) {
  try {
    const all_reports = await getReportsList();
    const reports = all_reports.filter((r) => r.isReporting == true);
    console.log(
      `Found ${all_reports.length} report types. Processing ${reports.length} reports.`
    );
    const results: any[] = [];
    const errors: any[] = [];

    for (const report of reports) {
      try {
        const queueItem = await addReportToQueue(
          report.kenyaEmrReportUuid,
          reportPeriod
        );
        results.push(queueItem);
      } catch (error) {
        console.error(
          `Failed to schedule report ${report.kenyaEmrReportUuid}:`,
          (error as Error).message
        );
        errors.push({
          uuid: report.kenyaEmrReportUuid,
          error: (error as Error).message,
        });
      }
    }

    return { scheduled: results.length, results, errors };
  } catch (error) {
    console.error("Report scheduling failed:", (error as Error).message);
    throw error;
  }
}

/**
 * collectLineList - improved but mostly the same as your original
 */
export async function collectLineList() {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lineList = [];

    for (const record of lineList) {
      await addLineList(record.facility_id, record.patient_id, {
        gender: record.gender,
        birthdate: record.birthdate,
        dateCreated: record.date_created,
        encounterDatetime: record.encounter_datetime,
        encounterType: record.encounter_type,
      });
    }

    return { collected: lineList.length, type: "lineList" };
  } catch (error) {
    console.error("Line list collection failed:", (error as Error).message);
    throw error;
  }
}

/**
 * getReportsList - fetch report types from API
 */
export async function getReportsList(): Promise<ReportType[]> {
  try {
    const serverUrl = process.env.AMPATH_SERVER_URL;
    if (!serverUrl) {
      console.warn("SERVER_URL not set - returning empty reports list");
      return [];
    }
    const response = await fetch(`${serverUrl}/report-types`, {
      headers: { Accept: "application/json" },
    });
    const reports = await response.json();
    return Array.isArray(reports) ? reports : [];
  } catch (error) {
    console.error("Failed to fetch reports types:", (error as Error).message);
    return [];
  }
}
