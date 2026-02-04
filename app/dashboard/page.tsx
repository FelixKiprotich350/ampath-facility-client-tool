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

interface ReportingPeriod {
  id: number;
  year: number;
  month: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [facilityDetails, setFacilityDetails] = useState<{
    facilityName: string;
    lastSync: string;
    pendingData: number;
    syncedData: number;
  }>({ facilityName: "", lastSync: "", pendingData: 0, syncedData: 0 });

  const [currentPeriod, setCurrentPeriod] = useState<ReportingPeriod | null>(
    null,
  );
  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  useEffect(() => {
    fetchDashboard();
    fetchCurrentPeriod();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard", { method: "GET" });
      const result = await response.json();
      setFacilityDetails(result);
    } catch {}
  };

  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch("/api/reporting-periods/active");
      const result = await response.json();
      setCurrentPeriod(result.data || null);
    } catch {}
  };

  const addPeriod = async () => {
    try {
      await fetch("/api/reporting-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPeriod),
      });
      setShowDialog(false);
      fetchCurrentPeriod();
    } catch {}
  };

  const disableCurrentPeriod = async () => {
    if (currentPeriod) {
      try {
        await fetch(`/api/reporting-periods/${currentPeriod.id}`, {
          method: "DELETE",
        });
        setShowConfirmDialog(false);
        fetchCurrentPeriod();
      } catch {}
    }
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Current Reporting Period</CardTitle>
              <div className="flex gap-2">
                <Button disabled={!!currentPeriod} onClick={() => setShowDialog(true)}>Add Period</Button>
                {currentPeriod && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    Disable Current
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentPeriod ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">
                      {monthNames[currentPeriod.month - 1]} {currentPeriod.year}
                    </h3>
                    <p className="text-sm text-blue-600">
                      Created:{" "}
                      {new Date(currentPeriod.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Active
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No active reporting period</p>
                <p className="text-sm">Click "Add Period" to create one</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reporting Period</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input
                  type="number"
                  value={newPeriod.year}
                  onChange={(e) =>
                    setNewPeriod({
                      ...newPeriod,
                      year: parseInt(e.target.value),
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <select
                  value={newPeriod.month}
                  onChange={(e) =>
                    setNewPeriod({
                      ...newPeriod,
                      month: parseInt(e.target.value),
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  {monthNames.map((name, index) => (
                    <option key={index} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addPeriod}>Add Period</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Reporting Period</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to disable the current reporting period?
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={disableCurrentPeriod}>
                  Disable
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
