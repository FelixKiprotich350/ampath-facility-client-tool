"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";

type Report = {
  id: number;
  kenyaEmrReportUuid: string;
  reportPeriod: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  processedAt?: string;
  error?: string;
};

export default function ReportsQueuePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports/queue-list");
      const data = await response.json();
      setReports(data);
    } catch {}
    setLoading(false);
  };

  const handleRetry = async (id: number) => {
    try {
      await fetch("/api/reports/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchReports();
    } catch {}
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const pending = reports.filter((r) => r.status === "PENDING").length;
  const processing = reports.filter((r) => r.status === "PROCESSING").length;
  const failed = reports.filter((r) => r.status === "FAILED").length;

  return (
    <AppLayout title="Reports Queue" subtitle="Scheduled reports status">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-gray-500">No reports in queue</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Report UUID</th>
                      <th className="text-left p-2">Period</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Processed</th>
                      <th className="text-left p-2">Error</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-sm font-mono">{report.kenyaEmrReportUuid.slice(0, 8)}...</td>
                        <td className="p-2">{report.reportPeriod}</td>
                        <td className="p-2">{getStatusBadge(report.status)}</td>
                        <td className="p-2 text-sm">{new Date(report.createdAt).toLocaleString()}</td>
                        <td className="p-2 text-sm">{report.processedAt ? new Date(report.processedAt).toLocaleString() : "-"}</td>
                        <td className="p-2 text-sm text-red-600">{report.error || "-"}</td>
                        <td className="p-2">
                          {(report.status === "FAILED" || report.status === "PROCESSING") && (
                            <Button size="sm" variant="outline" onClick={() => handleRetry(report.id)}>
                              Retry
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
