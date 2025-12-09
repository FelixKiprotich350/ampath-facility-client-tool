"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";

export default function DashboardPage() {
  const [facilityDetails, setFacilityDetails] = useState<{
    facilityName: string;
    lastSync: string;
    pendingData: number;
    syncedData: number;
  }>({ facilityName: "", lastSync: "", pendingData: 0, syncedData: 0 });

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


      </div>
    </AppLayout>
  );
}
