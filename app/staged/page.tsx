"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";

type Report = {
  id: number;
  indicatorCode: string;
  rawResult: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  syncedToAmepAt: string | null;
  syncedToAmpathAt: string | null;
};

export default function ReportsQueuePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports/staged");
      const data = await response.json();
      setReports(data);
    } catch {}
    setLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === reports.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(reports.map(item => item.id)));
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
    if (selectedItems.size === 0) {
      alert('Please select items to sync');
      return;
    }
    // TODO: Implement sync logic
    console.log('Syncing items:', Array.from(selectedItems));
  };

  const getStatusBadge = (report: Report) => {
    const synced = report.syncedToAmepAt || report.syncedToAmpathAt;
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

  // const pending = reports.filter((r) => r.status === "PENDING").length;
  // const processing = reports.filter((r) => r.status === "PROCESSING").length;
  // const failed = reports.filter((r) => r.status === "FAILED").length;

  return (
    <AppLayout title="Staged Reports" subtitle="Reports ready for synchronization">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Staged Reports</h2>
            <p className="text-gray-600">Reports waiting to be synchronized</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchReports}
              disabled={loading}
              variant="outline"
            >
              {loading ? "🔄 Loading..." : "🔄 Refresh"}
            </Button>
            <Button
              onClick={handleSync}
              disabled={selectedItems.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
            >
              🚀 Sync Selected ({selectedItems.size})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              {/* <div className="text-2xl font-bold">{pending}</div> */}
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              {/* <div className="text-2xl font-bold">{processing}</div> */}
              <div className="text-sm text-gray-600">Processing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              {/* <div className="text-2xl font-bold">{failed}</div> */}
              <div className="text-sm text-gray-600">Failed</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading staged reports...</p>
          </div>
        ) : reports.length === 0 ? (
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
                        checked={selectedItems.size === reports.length && reports.length > 0}
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
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
                        {report.indicatorCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(report)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.syncedToAmpathAt ? new Date(report.syncedToAmpathAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
