"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";

export default function NewReportPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

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
    setLoading(true);
    setStatus(`🔍 Collecting data for ${selectedMonth}...`);
    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        body: JSON.stringify({
          source: "api",
          apiUrl: "",
          dataType: "indicators",
          reportPeriod: selectedMonth,
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
      setSelectedMonth("");
    } catch (error) {
      setStatus("❌ Collection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Generate Report" subtitle="Collect data for a specific period">
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
            <Button
              onClick={handleCollect}
              disabled={!selectedMonth || loading}
              className="w-full"
            >
              {loading ? "Collecting..." : "Collect Data"}
            </Button>
          </CardContent>
        </Card>

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
