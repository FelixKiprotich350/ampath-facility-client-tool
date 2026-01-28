"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/app-layout";

type StagedIndicator = {
  id: number;
  indicatorCode: string;
  indicatorName: string;
  sectionId: string;
  sectionName: string;
  datasetId: string;
  datasetName: string;
  rawResult: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  syncedToAmpathAt: string | null;
};

export default function StagedIndicatorsPage() {
  const [pendingData, setPendingData] = useState<StagedIndicator[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [credentialsDialog, setCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    yearMonth: "",
    importStrategy: "CREATE_AND_UPDATE",
  });
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
  const [checkCredentialsDialog, setCheckCredentialsDialog] = useState(false);
  const [checkCredentials, setCheckCredentials] = useState({
    username: "",
    password: "",
  });
  const [periodFilter, setPeriodFilter] = useState("");
  const [indicatorFilter, setIndicatorFilter] = useState("");

  const [syncResultDialog, setSyncResultDialog] = useState<{
    open: boolean;
    result: any;
  }>({ open: false, result: null });

  useEffect(() => {
    loadPendingData();
  }, []);

  const getGroupedIndicators = () => {
    const filteredIndicators = getFilteredIndicators();
    const grouped = filteredIndicators.reduce(
      (acc, indicator) => {
        const sectionKey = indicator.sectionId;
        if (!acc[sectionKey]) {
          acc[sectionKey] = {
            sectionName: indicator.sectionName,
            items: [],
          };
        }
        acc[sectionKey].items.push(indicator);
        return acc;
      },
      {} as Record<string, { sectionName: string; items: StagedIndicator[] }>,
    );

    return grouped;
  };

  const toggleSection = (sectionKey: string) => {
    const sectionData = getGroupedIndicators()[sectionKey];
    const sectionIds = sectionData?.items.map((r) => r.id) || [];
    const allSelected = sectionIds.every((id) => selectedItems.has(id));

    if (allSelected) {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        sectionIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedItems((prev) => new Set([...prev, ...sectionIds]));
    }
  };

  const getFilteredIndicators = () => {
    return pendingData.filter((indicator) => {
      const matchesIndicator =
        indicatorFilter === "" || indicator.sectionName === indicatorFilter;

      const matchesPeriod =
        periodFilter === "" ||
        indicator.startDate.startsWith(periodFilter) ||
        indicator.endDate.startsWith(periodFilter);

      return matchesIndicator && matchesPeriod;
    });
  };

  const getUniquePeriods = () => {
    const periods = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      periods.push(yearMonth);
    }

    return periods;
  };

  const loadPendingData = async () => {
    setPendingLoading(true);
    setSelectedItems(new Set());
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

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDownloadExistingData = () => {
    const csvContent = [
      [
        "Data Element",
        "Age Band",
        "Gender",
        "Stored By",
        "Period",
        "Existing Values",
      ],
      ...existingDataDialog.data.map((item) => [
        item.dataElement,
        item.age_band || "-",
        item.gender || "-",
        item.storedBy,
        item.period,
        item.value,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "existing-data-check.csv";
    a.click();
    URL.revokeObjectURL(url);
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
          ...credentials,
          selectedItems: Array.from(selectedItems),
        }),
      });
      const result = await response.json();

      // Show sync results
      if (response.ok && result?.responseData != null) {
        setSyncResultDialog({ open: true, result: result });
      }

      if (result.successfullSync?.length > 0) {
        setSelectedItems(new Set());
        loadPendingData();
      }
    } catch {
      console.error("Sync failed");
    } finally {
      setLoading(false);
      setCredentials({
        username: "",
        password: "",
        yearMonth: "",
        importStrategy: "CREATE_AND_UPDATE",
      });
    }
  };

  const handleCheckExisting = async () => {
    if (selectedItems.size === 0) {
      alert("Please select items to check");
      return;
    }
    setCheckCredentialsDialog(true);
  };

  const performExistingDataCheck = async () => {
    setCheckingExisting(true);
    setCheckCredentialsDialog(false);
    try {
      const response = await fetch("/api/check-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indicatorIds: Array.from(selectedItems),
          username: checkCredentials.username,
          password: checkCredentials.password,
        }),
      });
      const result = await response.json();
      setExistingDataDialog({ open: true, data: result.existingData || [] });
    } catch (error) {
      console.error("Failed to check existing data:", error);
    } finally {
      setCheckingExisting(false);
      setCheckCredentials({ username: "", password: "" });
    }
  };

  const handleSyncClick = () => {
    if (selectedItems.size === 0) {
      alert("Please select items to sync");
      return;
    }
    setCredentialsDialog(true);
  };

  const handleGroupPreview = (sectionKey: string) => {
    const sectionData = getGroupedIndicators()[sectionKey];
    const matrixData = new Map();
    const indicators: string[] = [];
    const ageBands = new Set();

    // Collect all data and build list of indicators (allowing duplicates)
    sectionData.items.forEach((indicator, indicatorIndex) => {
      try {
        let data: any[] = [];
        if (Array.isArray(indicator.rawResult)) {
          data = indicator.rawResult;
        } else if (typeof indicator.rawResult === "string") {
          data = JSON.parse(indicator.rawResult);
        }

        indicators.push(indicator.indicatorName);

        data.forEach((row) => {
          const ageBand = row.age_band || "Unknown";
          const gender = row.gender || "Unknown";
          const value = row.value || 0;

          ageBands.add(ageBand);

          const key = `${indicator.indicatorName}_${indicatorIndex}_${ageBand}_${gender}`;
          matrixData.set(key, value);
        });
      } catch (err) {
        console.error(
          `Error parsing data for ${indicator.indicatorName}:`,
          err,
        );
      }
    });

    // Build matrix rows with indicators as rows (including duplicates)
    const matrixRows = indicators.map((indicator, index) => {
      const row: any = { Indicator: indicator };

      Array.from(ageBands).forEach((ageBand) => {
        const keyF = `${indicator}_${index}_${ageBand}_F`;
        const keyM = `${indicator}_${index}_${ageBand}_M`;
        
        row[`${ageBand} - F`] = matrixData.get(keyF) || 0;
        row[`${ageBand} - M`] = matrixData.get(keyM) || 0;
      });

      return row;
    });

    setPreviewDialog({
      open: true,
      data: matrixRows,
      reportName: `${sectionData.sectionName} - Matrix View`,
    });
  };

  return (
    <AppLayout
      title="Staged Reports"
      subtitle="Reports ready for synchronization"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Staged Reports</h2>
            <p className="text-gray-600">Reports waiting to be synchronized</p>
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
              onClick={handleCheckExisting}
              disabled={selectedItems.size === 0 || checkingExisting}
              variant="outline"
            >
              {checkingExisting ? "🔍 Checking..." : "🔍 Check Existing"}
            </Button>
            <Button
              onClick={handleSyncClick}
              disabled={selectedItems.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
            >
              🚀 Sync Selected ({selectedItems.size})
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
              <option value="">All groups</option>
              {[...new Set(pendingData.map((report) => report.sectionName))]
                .sort()
                .map((sectionName) => (
                  <option key={sectionName} value={sectionName}>
                    {sectionName}
                  </option>
                ))}
            </select>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All periods</option>
              {getUniquePeriods().map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>

          {pendingLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading staged reports...</p>
            </div>
          ) : getFilteredIndicators().length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Staged Indicators
                </h3>
                <p className="text-gray-500">
                  All Indicators have been synchronized successfully.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(getGroupedIndicators()).map(
                ([sectionKey, sectionReports]) => {
                  const allSectionSelected = sectionReports.items.every(
                    (report) => selectedItems.has(report.id),
                  );

                  return (
                    <div
                      key={sectionKey}
                      className="bg-white rounded-lg shadow overflow-hidden"
                    >
                      <div className="bg-gray-50 p-4 flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSectionSelected}
                            onChange={() => toggleSection(sectionKey)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="font-medium text-gray-900">
                            {sectionReports.sectionName}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({sectionReports.items.length} Indicators)
                          </span>
                        </label>
                        <Button
                          onClick={() => handleGroupPreview(sectionKey)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          👁️ Preview
                        </Button>
                      </div>
                    </div>
                  );
                },
              )}
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
                  {previewDialog.reportName.includes("Matrix View") ? (
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              rowSpan={2}
                              className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r"
                            >
                              Indicator
                            </th>
                            {Array.from(
                              new Set(
                                Object.keys(previewDialog.data[0])
                                  .filter((key) => key !== "Indicator")
                                  .map((key) => key.split(" - ")[0]),
                              ),
                            ).map((ageBand) => (
                              <th
                                key={ageBand}
                                colSpan={2}
                                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r"
                              >
                                {ageBand}
                              </th>
                            ))}
                          </tr>
                          <tr>
                            {Array.from(
                              new Set(
                                Object.keys(previewDialog.data[0])
                                  .filter((key) => key !== "Indicator")
                                  .map((key) => key.split(" - ")[0]),
                              ),
                            ).map((ageBand) => (
                              <React.Fragment key={ageBand}>
                                <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase border-r">
                                  M
                                </th>
                                <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase border-r">
                                  F
                                </th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewDialog.data.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-2 py-2 text-xs font-medium text-gray-900 border-r">
                                {row.Indicator}
                              </td>
                              {Array.from(
                                new Set(
                                  Object.keys(row)
                                    .filter((key) => key !== "Indicator")
                                    .map((key) => key.split(" - ")[0]),
                                ),
                              ).map((ageBand) => (
                                <React.Fragment key={ageBand}>
                                  <td className="px-2 py-2 text-xs text-gray-900 text-center border-r">
                                    {row[`${ageBand} - M`] || 0}
                                  </td>
                                  <td className="px-2 py-2 text-xs text-gray-900 text-center border-r">
                                    {row[`${ageBand} - F`] || 0}
                                  </td>
                                </React.Fragment>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
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
                  )}
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
                  Username
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Month (YYYYMM)
                </label>
                <input
                  type="text"
                  value={credentials.yearMonth || ""}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      yearMonth: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="202501"
                  pattern="\\d{6}"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Import Strategy
                </label>
                <select
                  value={credentials.importStrategy}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      importStrategy: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="CREATE_AND_UPDATE">CREATE_AND_UPDATE</option>
                </select>
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
                  disabled={!credentials.username || !credentials.password}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Sync
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={checkCredentialsDialog}
          onOpenChange={setCheckCredentialsDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter AMEP Credentials</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={checkCredentials.username}
                  onChange={(e) =>
                    setCheckCredentials({
                      ...checkCredentials,
                      username: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={checkCredentials.password}
                  onChange={(e) =>
                    setCheckCredentials({
                      ...checkCredentials,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setCheckCredentialsDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={performExistingDataCheck}
                  disabled={
                    !checkCredentials.username || !checkCredentials.password
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Check
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
                            Age Band
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Gender
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
                              {item.age_band || "-"}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {item.gender || "-"}
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
              <div className="flex justify-between mt-4">
                <Button
                  onClick={handleDownloadExistingData}
                  variant="outline"
                  disabled={existingDataDialog.data.length === 0}
                >
                  📥 Download CSV
                </Button>
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

        <Dialog
          open={syncResultDialog.open}
          onOpenChange={(open) =>
            setSyncResultDialog({ ...syncResultDialog, open })
          }
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sync Results</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {syncResultDialog.result && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`text-2xl ${
                        syncResultDialog.result.responseData?.status ===
                        "SUCCESS"
                          ? "✅"
                          : syncResultDialog.result.responseData?.status ===
                              "WARNING"
                            ? "⚠️"
                            : "❌"
                      }`}
                    >
                      {syncResultDialog.result.responseData?.status ===
                      "SUCCESS"
                        ? "✅"
                        : syncResultDialog.result.responseData?.status ===
                            "WARNING"
                          ? "⚠️"
                          : "❌"}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {syncResultDialog.result.responseData?.description}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Status: {syncResultDialog.result.responseData?.status}
                      </p>
                    </div>
                  </div>

                  {syncResultDialog.result.responseData?.importCount && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Import Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          Imported:{" "}
                          <span className="font-medium text-green-600">
                            {
                              syncResultDialog.result.responseData?.importCount
                                .imported
                            }
                          </span>
                        </div>
                        <div>
                          Updated:{" "}
                          <span className="font-medium text-blue-600">
                            {
                              syncResultDialog.result.responseData?.importCount
                                .updated
                            }
                          </span>
                        </div>
                        <div>
                          Ignored:{" "}
                          <span className="font-medium text-yellow-600">
                            {
                              syncResultDialog.result.responseData?.importCount
                                .ignored
                            }
                          </span>
                        </div>
                        <div>
                          Deleted:{" "}
                          <span className="font-medium text-red-600">
                            {
                              syncResultDialog.result.responseData?.importCount
                                .deleted
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {syncResultDialog.result.responseData?.conflicts &&
                    syncResultDialog.result.responseData?.conflicts.length >
                      0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2 text-yellow-800">
                          Conflicts
                        </h4>
                        <div className="space-y-2">
                          {syncResultDialog.result.responseData?.conflicts.map(
                            (conflict: any, index: number) => (
                              <div
                                key={index}
                                className="text-sm text-yellow-700"
                              >
                                <strong>Object:</strong> {conflict.object}
                                <br />
                                <strong>Issue:</strong> {conflict.value}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    setSyncResultDialog({ open: false, result: null })
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
