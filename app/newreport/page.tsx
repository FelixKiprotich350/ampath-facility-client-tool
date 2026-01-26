"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/app-layout";

type Indicator = {
  code: string;
  name: string;
  datasetId: string;
  datasetName: string;
  datasetSectionId: string;
  datasetSectionName: string;
};

export default function NewReportPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [periodDialog, setPeriodDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/indicators");
      const data = await response.json();
      setIndicators(data);
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

  const handleSelectPeriod = () => {
    if (selectedReports.length === 0) {
      alert("Please select at least one indicator.");
      return;
    }
    setPeriodDialog(true);
  };

  const handleCollect = async () => {
    setPeriodDialog(false);
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

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleSection = (sectionId: string) => {
    const sectionIndicators = indicators.filter(i => i.datasetSectionId === sectionId).map(i => i.code);
    const allSelected = sectionIndicators.every(code => selectedReports.includes(code));
    
    if (allSelected) {
      setSelectedReports(prev => prev.filter(code => !sectionIndicators.includes(code)));
    } else {
      setSelectedReports(prev => [...new Set([...prev, ...sectionIndicators])]);
    }
  };

  const getFilteredIndicators = () => {
    return indicators.filter(indicator => {
      const matchesSearch = searchTerm === "" || 
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPeriod = periodFilter === "" || 
        indicator.datasetSectionName.toLowerCase().includes(periodFilter.toLowerCase());
      
      return matchesSearch && matchesPeriod;
    });
  };

  const getGroupedIndicators = () => {
    const filteredIndicators = getFilteredIndicators();
    const grouped = filteredIndicators.reduce((acc, indicator) => {
      const sectionKey = indicator.datasetSectionId || 'unknown';
      if (!acc[sectionKey]) {
        acc[sectionKey] = {
          sectionName: indicator.datasetSectionName || 'Unknown Section',
          indicators: []
        };
      }
      acc[sectionKey].indicators.push(indicator);
      return acc;
    }, {} as Record<string, { sectionName: string; indicators: Indicator[] }>);
    
    return grouped;
  };

  const toggleReport = (uuid: string) => {
    setSelectedReports((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const toggleAll = () => {
    if (selectedReports.length === indicators.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(indicators.map((r) => r.code));
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
            <CardTitle className="flex items-center justify-between">
              <span>Select Indicators to Generate</span>
              <Button size="sm" variant="outline" onClick={toggleAll}>
                {selectedReports.length === indicators.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <input
                type="text"
                placeholder="Search indicators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All sections</option>
                {[...new Set(indicators.map(i => i.datasetSectionName))].map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            {indicators.length === 0 ? (
              <div className="text-gray-500">Loading indicators...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(getGroupedIndicators()).map(([sectionId, section]) => {
                  const sectionIndicators = section.indicators.map(i => i.code);
                  const allSectionIndicatorsSelected = sectionIndicators.every(code => selectedReports.includes(code));
                  const isExpanded = expandedSections.has(sectionId);
                  
                  return (
                    <div key={sectionId} className="border rounded-lg">
                      <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={allSectionIndicatorsSelected}
                            onChange={() => toggleSection(sectionId)}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-gray-900">{section.sectionName}</span>
                          <span className="text-sm text-gray-500">({section.indicators.length} indicators)</span>
                        </label>
                        <button
                          onClick={() => toggleSectionExpansion(sectionId)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="p-2 space-y-1">
                          {section.indicators.map((indicator) => (
                            <label
                              key={indicator.code}
                              className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer ml-4"
                            >
                              <input
                                type="checkbox"
                                checked={selectedReports.includes(indicator.code)}
                                onChange={() => toggleReport(indicator.code)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{indicator.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleSelectPeriod}
          disabled={selectedReports.length === 0}
          className="w-full"
        >
          Select Period ({selectedReports.length} Indicator{selectedReports.length !== 1 ? 's' : ''})
        </Button>

        <Dialog open={periodDialog} onOpenChange={setPeriodDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Report Period</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setPeriodDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCollect}
                  disabled={!selectedMonth || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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