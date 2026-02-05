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

type Indicator = {
  code: string;
  name: string;
  datasetId: string;
  datasetName: string;
  datasetSectionId: string;
  datasetSectionName: string;
};

export default function GenerateIndicatorsPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [warningDialog, setWarningDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [hasReportingPeriod, setHasReportingPeriod] = useState<boolean | null>(
    null,
  );
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);

  useEffect(() => {
    checkReportingPeriod();
    fetchIndicators();
  }, []);

  const checkReportingPeriod = async () => {
    try {
      const response = await fetch("/api/reporting-periods/active");
      if (response.ok) {
        const result = await response.json();
        setHasReportingPeriod(true);
        setCurrentPeriod(result.data);
      } else {
        setHasReportingPeriod(false);
      }
    } catch {
      setHasReportingPeriod(false);
    }
  };

  const fetchIndicators = async () => {
    try {
      const response = await fetch("/api/indicators");
      const data = await response.json();
      setIndicators(data);
    } catch {}
  };

  const handleGenerate = async () => {
    if (selectedIndicators.length === 0) {
      alert("Please select at least one indicator.");
      return;
    }

    const filteredIndicators = getFilteredIndicators();
    if (
      selectedIndicators.length !== filteredIndicators.length &&
      filteredIndicators.length > 0
    ) {
      setWarningDialog(true);
      return;
    }

    await handleCollect();
  };

  const proceedWithPartialSelection = async () => {
    setWarningDialog(false);
    await handleCollect();
  };

  const handleCollect = async () => {
    if (!currentPeriod) return;

    setLoading(true);
    const reportPeriod = `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, "0")}`;
    setStatus(
      `🔍 Scheduling ${selectedIndicators.length} indicators for ${reportPeriod}...`,
    );
    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        body: JSON.stringify({
          reportType: "indicators",
          reportPeriod: reportPeriod,
          selectedIndicators: selectedIndicators,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (result.indicators !== undefined) {
        setStatus(
          `✅ Collected ${result.indicators} indicators, ${result.lineList} line list records`,
        );
      } else {
        setStatus(
          `✅ Scheduled ${result.scheduled || selectedIndicators.length} indicators`,
        );
      }
      setSelectedIndicators([]);
    } catch (error) {
      setStatus("❌ Collection failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections((prev) => {
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
    const sectionIndicators = indicators
      .filter((i) => i.datasetSectionId === sectionId)
      .map((i) => i.code);
    const allSelected = sectionIndicators.every((code) =>
      selectedIndicators.includes(code),
    );

    if (allSelected) {
      setSelectedIndicators((prev) =>
        prev.filter((code) => !sectionIndicators.includes(code)),
      );
    } else {
      setSelectedIndicators((prev) => [
        ...new Set([...prev, ...sectionIndicators]),
      ]);
    }
  };

  const getFilteredIndicators = () => {
    return indicators.filter((indicator) => {
      const matchesSearch =
        searchTerm === "" ||
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPeriod =
        periodFilter === "" ||
        indicator.datasetSectionName
          .toLowerCase()
          .includes(periodFilter.toLowerCase());

      return matchesSearch && matchesPeriod;
    });
  };

  const getGroupedIndicators = () => {
    const filteredIndicators = getFilteredIndicators();
    const grouped = filteredIndicators.reduce(
      (acc, indicator) => {
        const sectionKey = indicator.datasetSectionId || "unknown";
        if (!acc[sectionKey]) {
          acc[sectionKey] = {
            sectionName: indicator.datasetSectionName || "Unknown Section",
            indicators: [],
          };
        }
        acc[sectionKey].indicators.push(indicator);
        return acc;
      },
      {} as Record<string, { sectionName: string; indicators: Indicator[] }>,
    );

    return grouped;
  };

  const toggleIndicators = (uuid: string) => {
    setSelectedIndicators((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    );
  };

  const toggleAll = () => {
    if (selectedIndicators.length === indicators.length) {
      setSelectedIndicators([]);
    } else {
      setSelectedIndicators(indicators.map((r) => r.code));
    }
  };

  return (
    <AppLayout
      title="Generate Indicators"
      subtitle="Collect data for a specific period"
    >
      {hasReportingPeriod === false ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Reporting Period
            </h3>
            <p className="text-gray-500">
              Please create a reporting period in the dashboard before
              generating indicators.
            </p>
          </CardContent>
        </Card>
      ) : hasReportingPeriod === null ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <div className="text-gray-600">Checking reporting period...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Indicators for the Period - [{currentPeriod?.fullName}]</span>
                <Button size="sm" variant="outline" onClick={toggleAll}>
                  {selectedIndicators.length === indicators.length
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
                  {[
                    ...new Set(indicators.map((i) => i.datasetSectionName)),
                  ].map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
              {indicators.length === 0 ? (
                <div className="text-gray-500">Loading indicators...</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.entries(getGroupedIndicators()).map(
                    ([sectionId, section]) => {
                      const sectionIndicators = section.indicators.map(
                        (i) => i.code,
                      );
                      const allSectionIndicatorsSelected =
                        sectionIndicators.every((code) =>
                          selectedIndicators.includes(code),
                        );
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
                              <span className="font-medium text-gray-900">
                                {section.sectionName}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({section.indicators.length} indicators)
                              </span>
                            </label>
                            <button
                              onClick={() => toggleSectionExpansion(sectionId)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {isExpanded ? "▼" : "▶"}
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
                                    checked={selectedIndicators.includes(
                                      indicator.code,
                                    )}
                                    onChange={() =>
                                      toggleIndicators(indicator.code)
                                    }
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm">
                                    {indicator.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={selectedIndicators.length === 0}
            className="w-full"
          >
            Generate Indicators ({selectedIndicators.length} Indicator
            {selectedIndicators.length !== 1 ? "s" : ""})
          </Button>

          <Dialog open={warningDialog} onOpenChange={setWarningDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Not All Indicators Selected</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-600">
                  You have selected {selectedIndicators.length} out of{" "}
                  {getFilteredIndicators().length} available indicators. Are you
                  sure you want to proceed with only the selected indicators?
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setWarningDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={proceedWithPartialSelection}>Proceed</Button>
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
      )}
    </AppLayout>
  );
}
