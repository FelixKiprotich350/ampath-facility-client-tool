"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { IndicatorTypesPage } from "@/components/indicator-types-page";

interface DataSummary {
  indicators: { total: number; unsynced: number };
  lineList: { total: number; unsynced: number };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);

  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSummary = async () => {
    try {
      const response = await fetch("/api/status");
      const data = await response.json();
      setSummary(data);
    } catch {
      setStatus("Failed to load data summary");
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
        loadSummary();
      } else {
        setStatus("❌ Sync failed");
      }
    } catch {
      setStatus("❌ Sync failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (source: string) => {
    setLoading(true);
    setStatus(`🔍 Collecting from ${source}...`);
    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        body: JSON.stringify({ source, apiUrl: "", dataType: "indicators" }),
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
      loadSummary();
    } catch (error) {
      console.log(error);
      setStatus("❌ Collection failed");
    } finally {
      setLoading(false);
    }
  };

  const startCron = async () => {
    try {
      const response = await fetch("/api/cron/start", { method: "POST" });
      const result = await response.json();
      setStatus(`⏰ ${result.message}`);
      setSchedulerRunning(true);
    } catch {
      setStatus("❌ Failed to start scheduler");
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
                {summary ? (
                  <>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-blue-800">
                            <span className="text-2xl">📊</span> Indicators
                          </span>
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-blue-700">
                              {summary.indicators.total}
                            </span>
                            <span className="text-sm text-blue-600 mb-1">
                              total
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Pending sync:</span>
                            <span className="font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                              {summary.indicators.unsynced}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-blue-800">
                            <span className="text-2xl">📋</span> Line List
                          </span>
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-blue-700">
                              {summary.lineList.total}
                            </span>
                            <span className="text-sm text-blue-600 mb-1">
                              total
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Pending sync:</span>
                            <span className="font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                              {summary.lineList.unsynced}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <span className="text-2xl">⚡</span> Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Scheduler:
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                schedulerRunning
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {schedulerRunning ? "🟢 Running" : "⚪ Stopped"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Last sync:
                            </span>
                            <span className="text-xs text-gray-500">Never</span>
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
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                      onClick={() => handleCollect("api")}
                      disabled={loading}
                      className="h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <span className="mr-2">🔍</span> Collect Data
                    </Button>
                    <Button
                      onClick={handleSync}
                      disabled={loading}
                      className="h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      <span className="mr-2">🔄</span> Sync Now
                    </Button>
                    <Button
                      onClick={startCron}
                      disabled={loading || schedulerRunning}
                      variant="outline"
                      className="h-12"
                    >
                      <span className="mr-2">⏰</span>{" "}
                      {schedulerRunning ? "Running" : "Start Scheduler"}
                    </Button>
                    <Button
                      onClick={loadSummary}
                      disabled={loading}
                      variant="ghost"
                      className="h-12"
                    >
                      <span className="mr-2">🔄</span> Refresh
                    </Button>
                  </div>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">⏳</span> Pending Data to Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📊</span>
                          <span className="font-medium">
                            Indicators pending sync
                          </span>
                        </div>
                        <span className="font-bold text-orange-700 bg-orange-200 px-3 py-1 rounded-full">
                          {summary.indicators.unsynced}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📋</span>
                          <span className="font-medium">
                            Line list records pending sync
                          </span>
                        </div>
                        <span className="font-bold text-orange-700 bg-orange-200 px-3 py-1 rounded-full">
                          {summary.lineList.unsynced}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleSync}
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      <span className="mr-2">🚀</span> Sync All Pending Data
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full mx-auto mb-4"></div>
                    <div className="text-gray-600">Loading pending data...</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "history" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">📜</span> Sync History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <div className="text-gray-500 text-lg mb-2">
                    No sync history yet
                  </div>
                  <div className="text-gray-400 text-sm">
                    Sync history will appear here after your first sync
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
