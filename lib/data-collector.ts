import { fetchFromKenyaEMRDatabase } from "./database";
import { addIndicator, addLineList, addReportDownload } from "./local-db";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { addReportToQueue } from "./report-queue";

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
  [k: string]: any;
};

let sharedBrowser: Browser | null = null;
let sharedContext: BrowserContext | null = null;
let sharedPage: Page | null = null;
let isLoggedIn = false;

/**
 * ---------- CONFIG ----------
 */ 
const REPORT_POLL_INTERVAL_MS = 5000;
const REPORT_POLL_MAX_ITER = 60; // ~5 minutes by default (60 * 5s)
const DOWNLOAD_RETRY = 5;
const DOWNLOAD_RETRY_DELAY_MS = 5000;

/**
 * Initialize browser and context (singletons).
 */
async function initBrowser(headless = true) {
  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch({ headless });
    sharedContext = await sharedBrowser.newContext();
  }
}

/**
 * Get a single reusable page (creates/returns sharedPage)
 */
async function getPage(): Promise<Page> {
  if (!sharedContext) {
    await initBrowser();
  }
  if (!sharedPage) {
    sharedPage = await sharedContext!.newPage();
  }
  return sharedPage!;
}

/**
 * Login to KenyaEMR SPA if not already logged in.
 * Uses standard selectors but tries to be resilient.
 */
async function ensureLoggedIn() {
  if (isLoggedIn && sharedPage) return sharedPage;

  const page = await getPage();
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(60000);

  const server = process.env.KENYAEMR_SERVER;
  if (!server) throw new Error("KENYAEMR_SERVER env var not set");

  const username = process.env.KENYAEMR_API_USERNAME;
  const password = process.env.KENYAEMR_API_PASSWORD;
  if (!username || !password) {
    throw new Error("KENYAEMR_API_USERNAME / KENYAEMR_API_PASSWORD required");
  }

  // Navigate to login page
  await page.goto(`${server}/spa/login`, { waitUntil: "domcontentloaded" }); //not load

  // Fill credentials (try multiple possible selectors)
  try {
    await page.fill('input[name="username"]', username);
  } catch {
    await page.fill('input[type="text"]', username);
  }

  try {
    await page.fill('input[name="password"]', password);
  } catch {
    await page.fill('input[type="password"]', password);
  }

  // Submit the form (try button or input)
  const submitBtn = page.locator(
    'button[type="submit"], input[type="submit"], button:has-text("Login")'
  );
  await Promise.all([
    submitBtn
      .first()
      .click()
      .catch(() =>
        page.evaluate(() =>
          (document.querySelector("form") as HTMLFormElement)?.submit()
        )
      ),
    page
      .waitForNavigation({ waitUntil: "networkidle", timeout: 30_000 })
      .catch(() => null),
  ]);

  // If location selection appears, choose the first available
  const locationRadio = page.locator("label.cds--radio-button__label").first();
  if (await locationRadio.isVisible().catch(() => false)) {
    await locationRadio.click().catch(() => null);
    const confirmBtn = page.locator(
      'button:has-text("Confirm"), input[value="Confirm"], button[type="submit"]'
    );
    await Promise.all([
      confirmBtn
        .first()
        .click()
        .catch(() => null),
      page
        .waitForNavigation({ waitUntil: "networkidle", timeout: 20_000 })
        .catch(() => null),
    ]);
  }

  isLoggedIn = true;
  return page;
}

/**
 * Helper: capture requestId emitted by page responses.
 * Listens for responses with requestReport.action or reportUuid and extracts an "id" using regex.
 * Returns the first id found or null.
 */
async function captureRequestIdOnce(
  page: Page,
  timeoutMs = 15_000
): Promise<number | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const onResponse = async (response: any) => {
      try {
        const url = response.url();
        if (
          !url.includes("requestReport.action") &&
          !url.includes("reportUuid")
        )
          return;

        const text = await response.text().catch(() => "");
        // Look for JSON-like id:  { "id": 123 } possibly embedded in HTML
        const match =
          text.match(/"id"\s*:\s*(\d+)/i) ||
          text.match(/id\s*=\s*(\d+)/i) ||
          text.match(/"requestId"\s*:\s*(\d+)/i);
        if (match) {
          const id = parseInt(match[1], 10);
          if (!isNaN(id) && !resolved) {
            resolved = true;
            page.removeListener("response", onResponse);
            resolve(id);
          }
        }
      } catch {
        // ignore parsing errors
      }
    };

    page.on("response", onResponse);

    // timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        page.removeListener("response", onResponse);
        resolve(null);
      }
    }, timeoutMs);
  });
}

/**
 * Poll the report status endpoint until it is completed or failed.
 * Returns true when completed, throws on failure or timeout.
 */
async function waitForReportReady(requestId: number, cookieString: string) {
  const server = process.env.KENYAEMR_SERVER;
  if (!server) throw new Error("KENYAEMR_SERVER env var not set");

  const statusUrl = `${server}/kenyaemr/reportStatus.action?request=${requestId}`;

  for (let i = 0; i < REPORT_POLL_MAX_ITER; i++) {
    try {
      const res = await fetch(statusUrl, {
        headers: {
          Cookie: cookieString,
          Accept: "text/plain, text/html, application/json",
          "User-Agent": "Mozilla/5.0 (Playwright)",
        },
      });
      const text = await res.text();

      // Adjust detection to how your server reports states.
      // Look for common words like COMPLETED / FAILED or status field
      if (
        /COMPLETED|SUCCESS/i.test(text) ||
        /"status"\s*:\s*"COMPLETED"/i.test(text)
      ) {
        return true;
      }
      if (/FAILED|ERROR/i.test(text) || /"status"\s*:\s*"FAILED"/i.test(text)) {
        throw new Error(`Report generation failed for request ${requestId}`);
      }
    } catch (err) {
      // continue to retry until max iterations
      console.warn("Status check error:", (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, REPORT_POLL_INTERVAL_MS));
  }

  throw new Error(
    `Report not ready after ${
      (REPORT_POLL_MAX_ITER * REPORT_POLL_INTERVAL_MS) / 1000
    }s`
  );
}
async function waitForReportReadyNew(
  reportUuid: string,
  requestId: number,
  cookieString: string
): Promise<{ status: "COMPLETED" | "FAILED"; error: string | null }> {
  const server = process.env.KENYAEMR_SERVER;
  if (!server) throw new Error("KENYAEMR_SERVER env var required for polling");

  const statusUrl = `${server}/kenyaemr/report/reportUtils/getFinishedRequests.action?reportUuid=${reportUuid}&`;

  for (let i = 0; i < REPORT_POLL_MAX_ITER; i++) {
    try {
      const res = await fetch(statusUrl, {
        headers: {
          Cookie: cookieString,
          Accept: "application/json,text/plain,*/*",
          "User-Agent": "Mozilla/5.0 (Playwright)",
        },
      });

      if (!res.ok) {
        console.log(`Status check failed HTTP ${res.status}`);
        continue;
      }

      const json = await res.json().catch(() => []);
      if (Array.isArray(json) && json.length > 0) {
        const request = json.find(
          (r) => r.status === "COMPLETED" && r.id === requestId
        );
        if (request) {
          return { status: "COMPLETED", error: null };
        }
      }
    } catch (err) {
      console.log(`Status check error: ${(err as Error).message}`);
    }

    await new Promise((r) => setTimeout(r, REPORT_POLL_INTERVAL_MS));
  }

  // If loop exits without finding the completed request
  return { status: "FAILED", error: "timeout" };
}

/**
 * Download the report CSV using session cookies and retry logic.
 * Returns absolute file path.
 */
async function downloadReportCsv(downloadUrl: string, cookieString: string) {
  let lastErr: any = null;

  for (let attempt = 1; attempt <= DOWNLOAD_RETRY; attempt++) {
    try {
      const res = await fetch(downloadUrl, {
        headers: {
          Cookie: cookieString,
          Accept: "text/csv,application/csv,*/*",
          Referer: downloadUrl,
          "User-Agent": "Mozilla/5.0 (Playwright)",
        },
      });

      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} ${res.statusText}`);
        console.warn(`Download attempt ${attempt} failed: ${lastErr.message}`);
        if (attempt < DOWNLOAD_RETRY)
          await new Promise((r) => setTimeout(r, DOWNLOAD_RETRY_DELAY_MS));
        continue;
      }

      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (
        !contentType.includes("text/csv") &&
        !contentType.includes("application/csv")
      ) {
        throw new Error(`Downloaded content-type is not CSV: ${contentType}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());

      // Quick HTML sanity check
      const head = buffer.toString("utf8", 0, 200).toLowerCase();
      if (head.includes("<!doctype html") || head.includes("<html")) {
        throw new Error("Downloaded file appears to be HTML, not CSV");
      }

      // Parse CSV in memory
      const csvText = buffer.toString("utf8");
      const records = parse(csvText, {
        columns: false, // dynamic columns
        skip_empty_lines: true,
        trim: false,
      });

      const csvContent = records.map((row: string[]) => {
        const obj: Record<string, string> = {};
        row.forEach((value, index) => {
          obj[`column${index}`] = value;
        });
        return obj;
      });

      return {
        status: `${res.status} ${res.statusText}`,
        data: csvContent,
      };
    } catch (err) {
      lastErr = err;
      console.warn(
        `Download attempt ${attempt} error: ${(err as Error).message}`
      );
      if (attempt < DOWNLOAD_RETRY)
        await new Promise((r) => setTimeout(r, DOWNLOAD_RETRY_DELAY_MS));
    }
  }

  throw lastErr || new Error("Failed to download report after retries");
}

/**
 * Request a single report using the Playwright page.
 * This implements the robust flow:
 *  - navigate to report page
 *  - click to open dialog
 *  - fill date or month
 *  - click request and capture requestId
 *  - poll until report ready
 *  - download csv using session cookies
 */
export async function downloadSingleReport(report: ReportType) {
  const startTime = Date.now();
  const server = process.env.KENYAEMR_SERVER;
  if (!server) throw new Error("KENYAEMR_SERVER env var not set");

  try {
        console.log("Starting Download...");

    const reportPageBase = `${process.env.KENYAEMR_SERVER}/kenyaemr/report.page`;
    const page = await ensureLoggedIn();
    console.log("Logged in. Navigating reports...");
    const reportHomePath = `${server}/kenyaemr/reports/reportsHome.page`;
    const reportPageUrl = `${reportPageBase}?appId=kenyaemr.reports&reportUuid=${
      report.kenyaEmrReportUuid
    }&returnUrl=${encodeURIComponent(reportHomePath)}`;

    console.log("Navigating to report page:", reportPageUrl);
    await page.goto(reportPageUrl, { waitUntil: "networkidle" });

    // Click Request report (try robust locators)
    const requestMenu = page.locator("div.ke-menu-item", {
      hasText: "Request",
    });
    if (await requestMenu.count()) {
      await requestMenu
        .first()
        .click()
        .catch(() => null);
    } else {
      // fallback to calling the JS function if exposed
      await page.evaluate(() => {
        try {
          // @ts-ignore
          if (typeof requestReport === "function") requestReport();
        } catch {}
      });
    }

    // Detect if dialog expects a Date Range or Month
    const isDateRange = await page
      .locator('div.ke-field-label:has-text("Date Range")')
      .isVisible()
      .catch(() => false);
    const isMonth = await page
      .locator('div.ke-field-label:has-text("Month")')
      .isVisible()
      .catch(() => false);

    // Get current year-month in YYYYMM format
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const startdate = "01-Jan-25";
    const enddate = "31-Jan-25";
    let reportMonth: string | null = null;

    if (isDateRange) {
      // Try multiple possible selectors for date inputs
      try {
        await page.fill("#startDate_date", startdate);
        await page.fill("#endDate_date", enddate);
      } catch {
        // fallback selectors
        await page.fill('input[name="startDate"]', startdate).catch(() => null);
        await page.fill('input[name="endDate"]', enddate).catch(() => null);
      }
    } else if (isMonth) {
      // select last option (usually the latest)
      reportMonth = await page
        .$eval("select:first-of-type", (sel: HTMLSelectElement) => {
          const opts = Array.from(sel.options).filter(
            (o) => o.value && o.value.trim() !== ""
          );
          const opt = opts[opts.length - 1] || sel.options[0];
          return opt.value;
        })
        .catch(() => null);
      if (reportMonth)
        await page
          .selectOption("select:first-of-type", reportMonth)
          .catch(() => null);
    }

    // Prepare to capture requestId
    const capturePromise = captureRequestIdOnce(page, 20_000);

    // Click Request/Submit on dialog
    const submitBtn = page.locator(
      'button[id*="btn"]:has-text("Request"), button:has-text("Request"), input[value="Request"]'
    );
    await Promise.all([
      submitBtn
        .first()
        .click()
        .catch(() => null),
      // The submit may not trigger navigation; we rely on response listener instead
    ]);

    const capturedId = await capturePromise;
    if (!capturedId) {
      // give a short additional wait then try to find request id via page content
      await page.waitForTimeout(3000);
      // try scanning page HTML for id
      const html = await page.content();
      const match =
        html.match(/"id"\s*:\s*(\d+)/i) || html.match(/request\s*:\s*(\d+)/i);
      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (capturedId as number) = parseInt(match[1], 10);
      }
    }

    const requestId = capturedId;
    if (!requestId) {
      throw new Error(
        "Failed to capture request ID after submitting report request"
      );
    }

    console.log("Captured request ID:", requestId);

    // Build download URL
    const downloadUrl = `${server}/kenyaemr/reportExport.page?appId=kenyaemr.reports&request=${requestId}&type=csv`;

    // Get cookies to use with fetch
    const cookies = (await sharedContext!.cookies())
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // Wait for report ready by polling the status endpoint
    console.log("Polling report status for completion...");
    const requeststatus = await waitForReportReadyNew(
      report.kenyaEmrReportUuid,
      requestId,
      cookies
    );

    if (requeststatus.status !== "COMPLETED") {
      throw new Error(
        `Report generation failed: ${requeststatus.error || "unknown error"}`
      );
    }
    // Download CSV using session cookies and retry logic
    console.log("Downloading report:", downloadUrl);
    const { data, status } = await downloadReportCsv(downloadUrl, cookies);

    // Read CSV to count records reliably (skip header)
    const csvContent = JSON.stringify(data);

    const recordCount = Math.max(0, csvContent.length - 1);

    // Convert period to YYYYMM format
    const periodYYYYMM = isDateRange
      ? currentYearMonth // Use current year-month for date ranges
      : reportMonth
      ? convertToYYYYMM(reportMonth)
      : currentYearMonth;

    await addReportDownload(
      report.kenyaEmrReportUuid,
      csvContent,
      downloadUrl,
      status,
      periodYYYYMM,
      recordCount
    );

    console.log(
      `Report ${report.kenyaEmrReportUuid} saved: (${recordCount} records)`
    );

    return { records: recordCount, message: "success" };
  } catch (error) {
    console.error("Data collection failed:", (error as Error).message);
    throw error;
  } finally {
    // small delay to avoid hammering the server
    await new Promise((r) => setTimeout(r, 500));
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
 * cleanup - close browser and clear shared instances
 */
export async function cleanup() {
  try {
    if (sharedPage) {
      await sharedPage.close().catch(() => null);
      sharedPage = null;
    }
    if (sharedContext) {
      await sharedContext.close().catch(() => null);
      sharedContext = null;
    }
    if (sharedBrowser) {
      await sharedBrowser.close().catch(() => null);
      sharedBrowser = null;
    }
    isLoggedIn = false;
  } catch (err) {
    console.warn("Error during cleanup:", (err as Error).message);
  }
}

/**
 * Expose a graceful shutdown handler in case the process is terminated.
 */
process.on("SIGINT", async () => {
  console.log("SIGINT received. Cleaning up...");
  await cleanup();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Cleaning up...");
  await cleanup();
  process.exit(0);
});
