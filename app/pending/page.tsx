"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReportDownload } from "@/lib/prisma/client";
import { AppLayout } from "@/components/layout/app-layout";

interface ReportType {
  kenyaEmrReportUuid: string;
  name: string;
  reportType: string;
  isReporting: boolean;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export default function PendingPage() {
  const [pendingData, setPendingData] = useState<ReportDownload[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [masterReportList, setMasterReportList] = useState<ReportType[]>();
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    data: any[] | null;
    reportName: string;
  }>({ open: false, data: null, reportName: "" });
  const [credentialsDialog, setCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    yearMonth: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const response = await fetch(`/api/report-types`);
      setMasterReportList(response.ok ? await response.json() : []);
    };
    loadPendingData();
    loadData();
  }, []);

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

  const handleSyncClick = () => {
    if (selectedItems.size === 0) {
      alert('Please select items to sync');
      return;
    }
    setCredentialsDialog(true);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === pendingData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(pendingData.map(item => item.id)));
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
      const selectedData = pendingData.filter(item => selectedItems.has(item.id));
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...credentials, selectedItems: Array.from(selectedItems) }),
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
      setCredentials({ username: "", password: "", yearMonth: "" });
    }
  };

  const handlePreview = async (item: ReportDownload) => {
    try {
      const reportName =
        masterReportList?.find((k) => k.kenyaEmrReportUuid === item.kenyaEmrReportUuid)
          ?.name || "Unknown Report";

      let data: any[] = [];
      if (Array.isArray(item.csvContent)) {
        data = item.csvContent;
      } else if (typeof item.csvContent === "string") {
        data = JSON.parse(item.csvContent);
      }

      setPreviewDialog({ open: true, data, reportName });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout 
      title="Pending Data" 
      subtitle="Data waiting to be synchronized"
    >
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Data</h2>
          <p className="text-gray-600">Records waiting to be synchronized</p>
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
            onClick={handleSyncClick}
            disabled={loading || selectedItems.size === 0}
            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
          >
            {loading ? "🔄 Syncing..." : `🚀 Sync Selected (${selectedItems.size})`}
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
                    <input
                      type="checkbox"
                      checked={selectedItems.size === pendingData.length && pendingData.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {masterReportList?.find(
                        (k) => k.kenyaEmrReportUuid === item.kenyaEmrReportUuid
                      )?.name || "Unknown Report"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {masterReportList?.find(
                        (k) => k.kenyaEmrReportUuid === item.kenyaEmrReportUuid
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
                value={credentials.yearMonth || ''}
                onChange={(e) =>
                  setCredentials({ ...credentials, yearMonth: e.target.value })
                }
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
                disabled={!credentials.username || !credentials.password}
                className="bg-green-600 hover:bg-green-700"
              >
                Sync
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}