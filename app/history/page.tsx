"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StagedIndicator } from "@/lib/prisma/client";
import { AppLayout } from "@/components/layout/app-layout";

export default function HistoryPage() {
  const [syncHistory, setSyncHistory] = useState<StagedIndicator[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadSyncHistory();
  }, []);

  const loadSyncHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/synchistory");
      const data = await response.json();
      setSyncHistory(data);
    } catch {
      console.error("Failed to load sync history");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <AppLayout title="Sync History" subtitle="Previously synchronized records">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sync History</h2>
            <p className="text-gray-600">Previously synchronized records</p>
          </div>
          <Button
            onClick={loadSyncHistory}
            disabled={historyLoading}
            variant="outline"
          >
            {historyLoading ? "🔄 Loading..." : "🔄 Refresh"}
          </Button>
        </div>

        {historyLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sync history...</p>
          </div>
        ) : syncHistory.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indicator Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indicator Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Synced At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {syncHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.indicatorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.indicatorCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.startDate ? new Date(item.startDate).toDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.endDate ? new Date(item.endDate).toDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.syncedToAmpathAt
                          ? new Date(item.syncedToAmpathAt).toLocaleString()
                          : "N/A"}
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
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Sync History
              </h3>
              <p className="text-gray-500">
                Sync history will appear here after your first sync.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
