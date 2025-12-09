"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";

export default function SystemStatusPage() {
  const [loading, setLoading] = useState(false);
  const [facilityDetails, setFacilityDetails] = useState<{
    facilityName: string;
    lastSync: string;
    pendingData: number;
    syncedData: number;
  }>({ facilityName: "", lastSync: "", pendingData: 0, syncedData: 0 });
  const [schedulerRunning, setSchedulerRunning] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchSchedulerStatus();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard", { method: "GET" });
      const result = await response.json();
      setFacilityDetails(result);
    } catch {}
  };

  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch("/api/scheduler/status");
      const result = await response.json();
      setSchedulerRunning(result.running);
    } catch {}
  };

  const handleSchedulerToggle = async () => {
    setLoading(true);
    try {
      const action = schedulerRunning ? "stop" : "start";
      await fetch(`/api/scheduler/${action}`, { method: "POST" });
      setSchedulerRunning(!schedulerRunning);
    } catch {}
    setLoading(false);
  };

  return (
    <AppLayout title="System Statuses" subtitle="Overview of system  status">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Facility Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Facility:</strong> {facilityDetails.facilityName}</div>
            <div><strong>Last Sync:</strong> {facilityDetails.lastSync}</div>
            <div><strong>Pending Data:</strong> {facilityDetails.pendingData}</div>
            <div><strong>Synced Data:</strong> {facilityDetails.syncedData}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Download Scheduler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <strong>Status:</strong> {schedulerRunning ? "🟢 Running" : "🔴 Stopped"}
              </div>
              <Button onClick={handleSchedulerToggle} disabled={loading}>
                {schedulerRunning ? "Stop" : "Start"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
