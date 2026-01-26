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
import { AppLayout } from "@/components/layout/app-layout";
import { getReportDefinitions } from "@/lib/data-collector";

type Report = {
  id: number;
  indicatorCode: string;
  indicatorName: string;
  rawResult: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  syncedToAmpathAt: string | null;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportDefinitions, setReportDefinitions] = useState<any[]>([]);
  const [pendingData, setPendingData] = useState<Report[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [credentialsDialog, setCredentialsDialog] = useState(false);
  const [period, setPeriod] = useState("");
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    data: any[] | null;
    reportName: string;
  }>({ open: false, data: null, reportName: "" });
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingDataDialog, setExistingDataDialog] = useState<{
    open: boolean;
    data: any[];
  }>({ open: false, data: [] });

  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [indicatorFilter, setIndicatorFilter] = useState("");

  useEffect(() => {
    fetchReports();
    loadReportDefinitions();
  }, []);

  const loadReportDefinitions = async () => {
    try {
      const definitions = await getReportDefinitions();
      setReportDefinitions(definitions);
    } catch (error) {
      console.error("Failed to load report definitions:", error);
    }
  };

  const getFilteredReports = () => {
    return reports.filter((report) => {
      const matchesIndicator =
        indicatorFilter === "" || report.indicatorName === indicatorFilter;

      const matchesPeriod =
        periodFilter === "" ||
        report.startDate.includes(periodFilter) ||
        report.endDate.includes(periodFilter);

      return matchesIndicator && matchesPeriod;
    });
  };



  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports/staged");
      const data = await response.json();
      setReports(data);
    } catch {}
    setLoading(false);
  };

  const loadPendingData = async () => {
    setPendingLoading(true);
    try {
      const response = await fetch("/api/pendingdata");
      const data = await response.json();
      setPendingData(data);
    } catch {
      console.error("Failed to load pending data");
    } finally {
      setPendingLoading(false);
    }
  };

  const toggleSelectAll = () => {
    const filteredReports = getFilteredReports();
    if (
      selectedItems.size === filteredReports.length &&
      filteredReports.length > 0
    ) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredReports.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSync = async () => {
    setLoading(true);
    setCredentialsDialog(false);
    try {
      const selectedData = pendingData.filter((item) =>
        selectedItems.has(item.id),
      );
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          selectedItems: Array.from(selectedItems),
        }),
      });
      const result = await response.json();
      if (result.successfullSync?.length > 0) {
        setSelectedItems(new Set());
        loadPendingData();
      }
    } catch {
      console.error("Sync failed");
    } finally {
      setLoading(false);
      setPeriod("");
    }
  };

  const handleSelectPeriod = () => {
    if (selectedItems.size === 0) {
      alert("Please select items to sync");
      return;
    }
    setCredentialsDialog(true);
  };

  const handlePreview = (report: Report) => {
    try {
      let data: any[] = [];
      if (Array.isArray(report.rawResult)) {
        data = report.rawResult;
      } else if (typeof report.rawResult === "string") {
        data = JSON.parse(report.rawResult);
      }
      setPreviewDialog({ open: true, data, reportName: report.indicatorName });
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (report: Report) => {
    const synced = report.syncedToAmpathAt;
    const status = synced ? "SYNCED" : "PENDING";
    const style = synced
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${style}`}>
        {status}
      </span>
    );
  };

  return (
    <AppLayout title="Reports" subtitle="Reports page">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Report</h2>
            <p className="text-gray-600">Generate New Reports</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchReports} disabled={loading} variant="outline">
              {loading ? "🔄 Loading..." : "🔄 Refresh"}
            </Button>
            <Button
              onClick={handleSelectPeriod}
              disabled={selectedItems.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
            >
              Select Period ({selectedItems.size})
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <select
              value={indicatorFilter}
              onChange={(e) => setIndicatorFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All indicators</option>
              {reportDefinitions.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading staged reports...</p>
            </div>
          ) : getFilteredReports().length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Staged Reports
                </h3>
                <p className="text-gray-500">
                  All reports have been synchronized successfully.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.size ===
                              getFilteredReports().length &&
                            getFilteredReports().length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indicator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Synced
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredReports().map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(report.id)}
                            onChange={() => toggleSelectItem(report.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.indicatorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.startDate).toLocaleDateString()} -{" "}
                          {new Date(report.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(report)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.syncedToAmpathAt
                            ? new Date(report.syncedToAmpathAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            onClick={() => handlePreview(report)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            👁️ Preview
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                <div>
                  <table className="w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewDialog.data[0]).map((key) => (
                          <th
                            key={key}
                            className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase truncate"
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
                              className="px-2 py-2 text-xs text-gray-900 truncate max-w-0"
                              title={value?.toString() || ""}
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

        <Dialog open={credentialsDialog} onOpenChange={setCredentialsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Credentials</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Month (YYYYMM)
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="202501"
                  pattern="\\d{6}"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setCredentialsDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSync}
                  disabled={!period}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Generate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={existingDataDialog.open}
          onOpenChange={(open) =>
            setExistingDataDialog({ ...existingDataDialog, open })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Existing Data Check Results</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {existingDataDialog.data.length > 0 ? (
                <div>
                  <p className="text-sm text-amber-600 mb-4">
                    ⚠️ The following indicators already have data values in
                    AMEP:
                  </p>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Data Element
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Stored By
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Period
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Existing Values
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {existingDataDialog.data.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">
                              {item.dataElement}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {item.storedBy}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {item.period}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-green-600 font-medium">
                    No existing data found in AMEP
                  </p>
                  <p className="text-sm text-gray-600">
                    Selected indicators are safe to sync
                  </p>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() =>
                    setExistingDataDialog({ open: false, data: [] })
                  }
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
