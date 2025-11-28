"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { IndicatorTypesPage } from "@/components/indicator-types-page";
import { ReportDownload } from "@/lib/prisma/client";

interface DataSummary {
  pendingReports: { total: number };
  syncedReports: { total: number };
}

interface ReportType {
  kenyaEmrReportUuid: string;
  name: string;
  reportType: string;
  isReporting: boolean;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [facilityDetails, setFacilityDetails] = useState<{
    facilityName: string;
    lastSync: string;
    pendingData: number;
    syncedData: number;
  }>({ facilityName: "", lastSync: "", pendingData: 0, syncedData: 0 });
  const [pendingData, setPendingData] = useState<ReportDownload[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [syncHistory, setSyncHistory] = useState<ReportDownload[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [masterReportList, setMasterReportList] = useState<ReportType[]>();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    data: any[] | null;
    reportName: string;
  }>({ open: false, data: null, reportName: "" });
  useEffect(() => {
    const loadData = async () => {
      console.log("Loading master report list...");
      const response = await fetch(`/api/report-types`);
      setMasterReportList(response.ok ? await response.json() : []);
    };
    fetchDashboard();
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "pending") {
      loadPendingData();
    } else if (activeTab === "history") {
      loadSyncHistory();
    }
  }, [activeTab]);

  const loadPendingData = async () => {
    setPendingLoading(true);
    try {
      const response = await fetch("/api/pendingdata");
      const data = await response.json();
      setPendingData(data);
    } catch {
      setStatus("Failed to load pending data");
    } finally {
      setPendingLoading(false);
    }
  };

  const loadSyncHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/synchistory");
      const data = await response.json();
      setSyncHistory(data);
    } catch {
      setStatus("Failed to load sync history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setStatus("🔄 Syncing data to server...");
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const result = await response.json();
      if (result.success) {
        setStatus(`✅ Sync completed: ${result.count} records synced`);
        if (activeTab === "pending") loadPendingData();
        if (activeTab === "history") loadSyncHistory();
      } else {
        setStatus("❌ Sync failed");
      }
    } catch {
      setStatus("❌ Sync failed");
    } finally {
      setLoading(false);
    }
  };

  const getLast12Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const displayName = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      months.push({ value: monthYear, label: displayName });
    }
    return months;
  };

  const handleCollectClick = () => {
    setShowMonthPicker(true);
  };

  const handleCollect = async (source: string, month?: string) => {
    setLoading(true);
    setStatus(`🔍 Collecting from ${source}${month ? ` for ${month}` : ""}...`);
    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        body: JSON.stringify({
          source,
          apiUrl: "",
          dataType: "indicators",
          month,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (result.indicators !== undefined) {
        setStatus(
          `✅ Collected ${result.indicators} indicators, ${result.lineList} line list records`
        );
      } else {
        setStatus(`✅ Collected ${result.collected} ${result.type} records`);
      }
      setShowMonthPicker(false);
      setSelectedMonth("");
    } catch (error) {
      console.log(error);
      setStatus("❌ Collection failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard", { method: "GET" });
      const result = await response.json();
      setFacilityDetails(result);
    } catch {}
  };

  const handlePreview = async (item: ReportDownload) => {
    try {
      const reportName =
        masterReportList?.find((k) => k.kenyaEmrReportUuid === item.reportUuid)
          ?.name || "Unknown Report";

      // Normalize CSV content
      let data: any[] = [];
      if (Array.isArray(item.csvContent)) {
        // Already parsed JSON
        data = item.csvContent;
      } else if (typeof item.csvContent === "string") {
        // Stored as JSON string in DB
        data = JSON.parse(item.csvContent);
      }

      setPreviewDialog({ open: true, data, reportName });
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to preview data");
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "home":
        return "Dashboard";
      case "pending":
        return "Pending Data";
      case "history":
        return "Sync History";
      default:
        return "Dashboard";
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "home":
        return "Overview of data collection and sync status";
      case "pending":
        return "Data waiting to be synchronized";
      case "history":
        return "Previous synchronization activities";
      default:
        return "Overview of data collection and sync status";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col">
        <Header title={getPageTitle()} subtitle={getPageSubtitle()} />

        <main className="flex-1 p-6">
          {activeTab === "home" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facilityDetails ? (
                  <>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-orange-800">
                            <span className="text-2xl">⏳</span> Pending Reports
                          </span>
                          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-orange-700">
                              {facilityDetails.pendingData}
                            </span>
                            <span className="text-sm text-orange-600 mb-1">
                              reports
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Awaiting synchronization
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-green-800">
                            <span className="text-2xl">✅</span> Synced Reports
                          </span>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-green-700">
                              {facilityDetails.syncedData}
                            </span>
                            <span className="text-sm text-green-600 mb-1">
                              reports
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Successfully synchronized
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <span className="text-2xl">⚡</span> Facility Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Name :
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600`}
                            >
                              {facilityDetails?.facilityName || "--"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Last sync:
                            </span>
                            <span className="text-xs text-gray-500">
                              {facilityDetails.lastSync}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="text-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                      <div className="text-gray-600">
                        Loading data summary...
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">⚙️</span> Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button
                      onClick={handleCollectClick}
                      disabled={loading}
                      className="h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <span className="mr-2">🔍</span> Collect Data
                    </Button>
                  </div>

                  {showMonthPicker && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Select Month and Year
                      </h4>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select month...</option>
                            {getLast12Months().map((month) => (
                              <option key={month.value} value={month.value}>
                                {month.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          onClick={() => handleCollect("api", selectedMonth)}
                          disabled={!selectedMonth || loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Collect
                        </Button>
                        <Button
                          onClick={() => {
                            setShowMonthPicker(false);
                            setSelectedMonth("");
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {status && (
                <Card className="border-l-4 border-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl flex-shrink-0">
                        {loading ? "⏳" : "💬"}
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-800 font-medium">
                          {status}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "pending" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Pending Data
                  </h2>
                  <p className="text-gray-600">
                    Records waiting to be synchronized
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={loadPendingData}
                    disabled={pendingLoading}
                    variant="outline"
                  >
                    {pendingLoading ? "🔄 Loading..." : "🔄 Refresh"}
                  </Button>
                  <Button
                    onClick={handleSync}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? "🔄 Syncing..." : "🚀 Sync Now"}
                  </Button>
                </div>
              </div>

              {pendingLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading pending data...</p>
                </div>
              ) : pendingData.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Report Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Requested At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Period
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingData.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {masterReportList?.find(
                                (k) => k.kenyaEmrReportUuid === item.reportUuid
                              )?.name || "Unknown Report"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {masterReportList?.find(
                                (k) => k.kenyaEmrReportUuid === item.reportUuid
                              )?.reportType || "Unknown Report"}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.requestedAt).toLocaleString()}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.reportPeriod}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handlePreview(item)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  👁️ Preview
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Pending Data
                    </h3>
                    <p className="text-gray-500">
                      All data has been synchronized successfully.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Sync History
                  </h2>
                  <p className="text-gray-600">
                    Previously synchronized records
                  </p>
                </div>
                <Button
                  onClick={loadSyncHistory}
                  disabled={historyLoading}
                  variant="outline"
                >
                  {historyLoading ? "🔄 Loading..." : "🔄 Refresh"}
                </Button>
              </div>

              {historyLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading sync history...</p>
                </div>
              ) : syncHistory.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Report Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Period
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Synced At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Records
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {syncHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {masterReportList?.find(
                                (k) => k.kenyaEmrReportUuid === item.reportUuid
                              )?.name || "Unknown Report"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {masterReportList?.find(
                                (k) => k.kenyaEmrReportUuid === item.reportUuid
                              )?.reportType || "Unknown"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.reportPeriod}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.syncedAt
                                ? new Date(item.syncedAt).toLocaleString()
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.recordCount || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Sync History
                    </h3>
                    <p className="text-gray-500">
                      Sync history will appear here after your first sync.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>

      <Dialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog({ ...previewDialog, open })}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewDialog.reportName}</DialogTitle>
            <Button
              onClick={() =>
                setPreviewDialog({ open: false, data: null, reportName: "" })
              }
              variant="outline"
              size="sm"
            >
              ✕ Close
            </Button>
          </DialogHeader>
          <div className="mt-4">
            {previewDialog.data && previewDialog.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewDialog.data[0]).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewDialog.data.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, i) => (
                          <td
                            key={i}
                            className="px-3 py-2 whitespace-nowrap text-xs text-gray-900"
                          >
                            {value?.toString() || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No data available
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
