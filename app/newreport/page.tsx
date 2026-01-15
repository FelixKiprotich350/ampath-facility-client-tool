"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";

type Report = {
  code: string;
  name: string;
};

export default function NewReportPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/report-types");
      const data = await response.json();
      setReports(data);
    } catch {}
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

  const handleCollect = async () => {
    if (!selectedMonth) {
      alert("Please select a month and year to proceed.");
      return;
    }
    if (selectedReports.length === 0) {
      alert("Please select at least one report.");
      return;
    }
    setLoading(true);
    setStatus(
      `🔍 Scheduling ${selectedReports.length} reports for ${selectedMonth}...`
    );
    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        body: JSON.stringify({ 
          reportType: "indicators",
          reportPeriod: selectedMonth,
          selectedIndicators: selectedReports,
        }),
        headers: { "Content-Type": "application/json" },
      });

     

      const result = await response.json();
      if (result.indicators !== undefined) {
        setStatus(
          `✅ Collected ${result.indicators} indicators, ${result.lineList} line list records`
        );
      } else {
        setStatus(
          `✅ Scheduled ${result.scheduled || selectedReports.length} reports`
        );
      }
      setSelectedMonth("");
      setSelectedReports([]);
    } catch (error) {
      setStatus("❌ Collection failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleReport = (uuid: string) => {
    setSelectedReports((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const toggleAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r) => r.code));
    }
  };

  return (
    <AppLayout
      title="Generate Report"
      subtitle="Collect data for a specific period"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Report Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month and Year
              </label>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Select Indicators to Generate</span>
              <Button size="sm" variant="outline" onClick={toggleAll}>
                {selectedReports.length === reports.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-gray-500">Loading reports...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reports.map((report) => (
                  <label
                    key={report.code}
                    className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.code)}
                      onChange={() => toggleReport(report.code)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{report.name}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleCollect}
          disabled={!selectedMonth || selectedReports.length === 0 || loading}
          className="w-full"
        >
          {loading
            ? "Scheduling..."
            : `Schedule ${selectedReports.length} Report(s)`}
        </Button>

        {status && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{loading ? "⏳" : "💬"}</div>
                <div className="flex-1">
                  <div className="text-gray-800 font-medium">{status}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
