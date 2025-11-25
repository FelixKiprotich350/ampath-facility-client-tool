import { fetchFromKenyaEMRDatabase } from "./database";
import createKenyaEMRSession from "./kenyaemr";
import { addIndicator, addLineList } from "./local-db";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

let sharedBrowser: Browser | null = null;
let sharedContext: BrowserContext | null = null;
let isLoggedIn = false;

export async function collectIndicators() {
  try {
    const indicators = (await fetchFromKenyaEMRDatabase(
      `SELECT 
        f.uuid as facility_id,
        i.indicator_id,
        i.name,
        i.value,
        i.period,
        i.created_date
      FROM indicators i 
      JOIN facilities f ON i.facility_id = f.id 
      WHERE i.created_date > ?`,
      [new Date(Date.now() - 24 * 60 * 60 * 1000)]
    )) as any[];

    for (const indicator of indicators) {
      await addIndicator(
        indicator.facility_id,
        indicator.indicator_id,
        indicator.name,
        indicator.value,
        indicator.period,
        { createdDate: indicator.created_date }
      );
    }

    return { collected: indicators.length, type: "indicators" };
  } catch (error) {
    console.error("Indicator collection failed:", error);
    throw error;
  }
}

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
    const reports = [
      "9952e9d5-b5cf-4c59-ab36-b961c11f6930", // covid 19 indicators
      "5609a402-94b2-11e3-9ca9-93351facf9dd", //art indicators
      "28a9006e-7826-11e8-adc0-fa7ae01bbebc", //hts monthly indicators
    ]; //  report UUIDs
    getSingleReport(page, reports[0], reportPageUrl);
  } catch (error) {
    console.error("Playwright collection failed:", error);
    throw error;
  }
}

export async function getSingleReport(
  page: Page,
  reportUuid: string,
  reportPage: string
) {
  try {
    const reportHomePath = `${process.env.KENYAEMR_SERVER}/kenyaemr/reports/reportsHome.page`;
    const reportPageUrl = `${reportPage}?appId=kenyaemr.reports&reportUuid=${reportUuid}&returnUrl=${reportHomePath}`;
    await page.goto(reportPageUrl);
    console.log("Navigated to report page:", reportPageUrl);
    // await page.click(`div.ke-stack-item[onclick*="${reportUuid}"]`);

    // Click Request report button
    await page.click('div.ke-menu-item[onclick="requestReport()"]');

    // Handle dialog - check if it's date range or month
    const isDateRange = await page
      .locator('div.ke-field-label:has-text("Date Range")')
      .isVisible();
    const isMonth = await page
      .locator('div.ke-field-label:has-text("Month")')
      .isVisible();

    if (isDateRange) {
      await page.fill("#startDate_date", "01-Jan-25");
      await page.fill("#endDate_date", "31-Jan-25");
    } else if (isMonth) {
      await page.selectOption("select", { index: 0 });
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
    await page.waitForTimeout(3000);
    console.log("Captured request ID:", requestId);
    if (requestId === null) {
      throw new Error("Failed to capture request ID");
    }

    // Poll for report completion and download
    const downloadUrl = `${process.env.KENYAEMR_SERVER}/kenyaemr/reportExport.page?appId=kenyaemr.reports&request=${requestId}&type=csv`;

    const downloadPath = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    // Get cookies from the browser context
    const cookies = await sharedContext!.cookies();
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    // Download using fetch with session cookies
    console.log("Downloading with fetch:", downloadUrl);
    const response = await fetch(downloadUrl, {
      headers: {
        Cookie: cookieString,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Download failed: ${response.status} ${response.statusText}`
      );
    }

    const fileBuffer = await response.arrayBuffer();
    const filePath = path.join(downloadPath, `report-${Date.now()}.csv`);
    fs.writeFileSync(filePath, Buffer.from(fileBuffer));
    console.log("Downloaded file:", filePath);
    const csvData = fs.readFileSync(filePath, "utf-8");
    const lines = csvData.split("\n").filter((line) => line.trim());
    return { collected: lines.length - 1, filePath };
  } catch (error) {
    console.error("Data collection failed:", error);
    throw error;
  }
}

export async function collectAllData() {
  try {
  } catch (error) {
    console.error("Data collection failed:", error);
    throw error;
  }
  const results = await Promise.allSettled([
    collectIndicators(),
    collectLineList(),
  ]);

  const summary = {
    indicators: 0,
    lineList: 0,
    errors: [] as string[],
  };

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      if (result.value.type === "indicators") {
        summary.indicators = result.value.collected;
      } else {
        summary.lineList = result.value.collected;
      }
    } else {
      summary.errors.push(
        `${index === 0 ? "Indicators" : "Line List"}: ${result.reason}`
      );
    }
  });

  return summary;
}
