"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";

export default function DashboardPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [facilityDetails, setFacilityDetails] = useState<{
    facilityName: string;
    lastSync: string;
    pendingData: number;
    syncedData: number;
  }>({ facilityName: "", lastSync: "", pendingData: 0, syncedData: 0 });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard", { method: "GET" });
      const result = await response.json();
      setFacilityDetails(result);
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

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle="Overview of data collection and sync status"
    >
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
                    <span className="text-sm text-gray-600">Name :</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {facilityDetails?.facilityName || "--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last sync:</span>
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
              <div className="text-gray-600">Loading data summary...</div>
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