import { fetchFromKenyaEMRDatabase } from "./database";
import { addIndicator, addLineList, addReportDownload } from "./local-db";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

let sharedBrowser: Browser | null = null;
let sharedContext: BrowserContext | null = null;
let isLoggedIn = false;


export async function collectLineList() {
  try {
    const lineList = (await fetchFromKenyaEMRDatabase(
      `SELECT 
        f.uuid as facility_id,
        p.patient_id,
        p.gender,
        p.birthdate,
        p.date_created,
        e.encounter_datetime,
        e.encounter_type
      FROM patient p
      JOIN encounter e ON p.patient_id = e.patient_id
      JOIN location f ON e.location_id = f.location_id
      WHERE e.encounter_datetime > ?`,
      [new Date(Date.now() - 24 * 60 * 60 * 1000)]
    )) as any[];

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
    console.error("Line list collection failed:", error);
    throw error;
  }
}

export async function getReportsList() {
  try {
    const serverUrl = process.env.SERVER_URL;
    const response = await fetch(`${serverUrl}/report-types`);
    const reports = await response.json();
    return reports ?? [];
  } catch (error) {
    console.error("Failed to fetch reports types:", error);
    return [];
  }
}
async function getAuthenticatedPage(): Promise<Page> {
  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch({ headless: true });
    sharedContext = await sharedBrowser.newContext();
  }

  const page = await sharedContext!.newPage();

  if (!isLoggedIn) {
    await page.goto(`${process.env.KENYAEMR_SERVER}/spa/login`);
    await page.fill(
      'input[name="username"]',
      process.env.KENYAEMR_API_USERNAME!
    );
    await page.fill(
      'input[name="password"]',
      process.env.KENYAEMR_API_PASSWORD!
    );
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForNavigation();

    // Check if location selection is needed
    const locationRadio = await page
      .locator("label.cds--radio-button__label")
      .first();
    if (await locationRadio.isVisible()) {
      await page.click("label.cds--radio-button__label:first-of-type");
      await page.click(
        'button:has-text("Confirm"), input[value="Confirm"], button[type="submit"]'
      );
    }

    isLoggedIn = true;
  }

  return page;
}

export async function collectFromBroswer() {
  try {
    const page = await getAuthenticatedPage();
    console.log("Login success Navigating to reports page...");
    const reportPageUrl = `${process.env.KENYAEMR_SERVER}/kenyaemr/report.page`;
    const reports = await getReportsList();

    console.log(`Found ${reports.length} report types to process.`);
    const results = [];
    const errors = [];
    for (const report of reports) {
      try {
        const result = await getSingleReport(page, report, reportPageUrl);
        results.push({ uuid: report.kenyaEmrReportUuid, result: result });
      } catch (error) {
        console.error(
          `Failed to process report ${report.kenyaEmrReportUuid}:`,
          error
        );
        errors.push({ uuid: report.kenyaEmrReportUuid, error: error.message });
      }
    }

    return { completed: results.length, results, errors };
  } catch (error) {
    console.error("Playwright collection failed:", error);
    throw error;
  }
}

export async function getSingleReport(
  page: Page,
  report: any,
  reportPage: string
) {
  const startTime = Date.now();
  try {
    console.log("Processing report:", report.name);
    const reportHomePath = `${process.env.KENYAEMR_SERVER}/kenyaemr/reports/reportsHome.page`;
    const reportPageUrl = `${reportPage}?appId=kenyaemr.reports&reportUuid=${report.kenyaEmrReportUuid}&returnUrl=${reportHomePath}`;
    await page.goto(reportPageUrl);
    console.log("Navigated to report page:", reportPageUrl);

    // Click Request report button
    await page.click('div.ke-menu-item[onclick="requestReport()"]');

    // Handle dialog - check if it's date range or month
    const isDateRange = await page
      .locator('div.ke-field-label:has-text("Date Range")')
      .isVisible();
    const isMonth = await page
      .locator('div.ke-field-label:has-text("Month")')
      .isVisible();

    const startdate = "01-Jan-25";
    const enddate = "31-Jan-25";
    let reportMonth = null;
    if (isDateRange) {
      await page.fill("#startDate_date", startdate);
      await page.fill("#endDate_date", enddate);
    } else if (isMonth) {
      reportMonth = await page.$eval(
        "select:first-of-type",
        (select: HTMLSelectElement) => {
          return select.options[0].value;
        }
      );
      await page.selectOption("select:first-of-type", reportMonth);
    }

    // Intercept API response to get request ID
    let requestId: number | null = null;
    page.on("response", async (response) => {
      if (
        response.url().includes("requestReport.action") ||
        response.url().includes("reportUuid")
      ) {
        try {
          const responseBody = await response.json();
          if (responseBody && responseBody.id) {
            requestId = responseBody.id;
          }
        } catch (e) {
          // Response might not be JSON
        }
      }
    });

    await page.click('button[id*="btn"]:has-text("Request")');

    console.log("Report requested, waiting for completion...");
    // Wait for request ID to be captured
    await page.waitForTimeout(5000);
    console.log("Captured request ID:", requestId);
    if (requestId === null) {
      throw new Error("Failed to capture request ID");
    }

    // Poll for report completion
    const downloadUrl = `${process.env.KENYAEMR_SERVER}/kenyaemr/reportExport.page?appId=kenyaemr.reports&request=${requestId}&type=csv`;

    // Wait for report to be ready by polling the status
    console.log("Waiting for report to be ready...");
    await page.waitForTimeout(10000); // Wait 10 seconds for report generation

    const downloadPath = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    // Get cookies from the browser context
    const cookies = await sharedContext!.cookies();
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    // Download using fetch with session cookies and retry logic
    console.log("Downloading with fetch:", downloadUrl);
    let response;
    let lastError;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        response = await fetch(downloadUrl, {
          headers: {
            Cookie: cookieString,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "text/csv,application/csv,*/*",
            Referer: reportPageUrl,
          },
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          console.log(`Download successful, content-type: ${contentType}`);
          break;
        }

        lastError = new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
        console.log(`Attempt ${attempt} failed:`, lastError.message);

        if (attempt < 5) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed:`, error.message);

        if (attempt < 5) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error("Download failed after 5 attempts");
    }

    const fileBuffer = await response.arrayBuffer();
    const filePath = path.join(downloadPath, `report-${Date.now()}.csv`);
    fs.writeFileSync(filePath, Buffer.from(fileBuffer));
    console.log("Downloaded file:", filePath);
    const csvData = fs.readFileSync(filePath, "utf-8");
    const lines = csvData.split("\n").filter((line) => line.trim());
    const recordCount = lines.length - 1;

    const duration = isDateRange ? `${startdate} to ${enddate}` : reportMonth;
    const responseStatus = `${response.status} ${response.statusText}`;

    await addReportDownload(
      report.kenyaEmrReportUuid,
      filePath,
      downloadUrl,
      responseStatus,
      duration,
      recordCount
    );

    return { records: recordCount, message: "suceess" };
  } catch (error) {
    console.error("Data collection failed:", error);
    throw error;
  }
}
