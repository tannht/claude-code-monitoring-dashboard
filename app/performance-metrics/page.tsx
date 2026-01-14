/**
 * Performance Metrics Page
 * View agent performance trends with filtering and visualization
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { ExportButton } from "@/components/ui";
import type { CSVColumn } from "@/lib/export";
import { usePerformanceMetrics, useAgentStats } from "@/hooks/useSqliteData";
import { LineChart } from "@/components/ui";

type MetricFilters = {
  agentId: string;
  metricName: string;
  hours: number;
};

export default function PerformanceMetricsPage() {
  const { data: metrics, loading, error, refetch } = usePerformanceMetrics(undefined, undefined, 24);
  const { data: agents } = useAgentStats();
  const [filters, setFilters] = useState<MetricFilters>({
    agentId: "all",
    metricName: "all",
    hours: 24,
  });

  useEffect(() => {
    document.title = "Performance Metrics - Claude Code Monitoring";
  }, []);

  // Get unique metric names
  const metricNames = useMemo(() => {
    const names = new Set<string>();
    metrics.forEach((m) => names.add(m.metricName));
    return Array.from(names).sort();
  }, [metrics]);

  // Filter metrics
  const filteredMetrics = useMemo(() => {
    return metrics.filter((m) => {
      if (filters.agentId !== "all" && m.agent_id !== filters.agentId) {
        return false;
      }
      if (filters.metricName !== "all" && m.metricName !== filters.metricName) {
        return false;
      }
      return true;
    });
  }, [metrics, filters]);

  // Prepare chart data for a specific metric
  const chartData = useMemo(() => {
    if (filters.metricName === "all" || filters.agentId === "all") {
      return null; // Only show chart when specific filter is selected
    }

    const metricData = filteredMetrics
      .filter((m) => m.metricName === filters.metricName)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((m) => ({
        x: new Date(m.timestamp).getTime(),
        y: m.metricValue,
      }));

    return [
      {
        name: filters.metricName,
        data: metricData,
      },
    ];
  }, [filteredMetrics, filters]);

  // Calculate stats
  const metricStats = useMemo(() => {
    if (filteredMetrics.length === 0) return null;

    const values = filteredMetrics.map((m) => m.metricValue);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }, [filteredMetrics]);

  // Export columns definition
  const exportColumns = useMemo<CSVColumn[]>(
    () => [
      {
        key: "timestamp",
        label: "Timestamp",
        formatter: (v) => (v ? new Date(v as string).toLocaleString() : ""),
      },
      { key: "agent_id", label: "Agent ID" },
      { key: "metricName", label: "Metric Name" },
      {
        key: "metricValue",
        label: "Value",
        formatter: (v) => (typeof v === "number" ? v.toFixed(2) : String(v)),
      },
      { key: "unit", label: "Unit" },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              📊 Performance Metrics
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Agent performance trends and metric analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton
              data={filteredMetrics as unknown as Record<string, unknown>[]}
              columns={exportColumns}
              filename="performance-metrics"
              label="Export"
              disabled={filteredMetrics.length === 0}
              loading={loading}
            />
            <button
              onClick={refetch}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Agent
              </label>
              <select
                value={filters.agentId}
                onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Agents</option>
                {agents?.map((agent) => (
                  <option key={agent.agentId} value={agent.agentId}>
                    {agent.agentName} ({agent.agentType})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Metric Name
              </label>
              <select
                value={filters.metricName}
                onChange={(e) => setFilters({ ...filters, metricName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Metrics</option>
                {metricNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:w-40">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Time Range
              </label>
              <select
                value={filters.hours}
                onChange={(e) => setFilters({ ...filters, hours: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="1">1 Hour</option>
                <option value="6">6 Hours</option>
                <option value="24">24 Hours</option>
                <option value="168">7 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        {metricStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Average</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metricStats.avg.toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Minimum</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metricStats.min.toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Maximum</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metricStats.max.toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Data Points</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metricStats.count}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData && chartData[0].data.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {filters.metricName} Over Time
            </h3>
            <LineChart series={chartData} height={300} />
          </div>
        )}

        {/* Metrics List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Loading metrics...
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No Metrics Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filters.agentId !== "all" || filters.metricName !== "all"
                ? "Try adjusting your filters"
                : "Performance metrics will appear here as agents work"}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredMetrics.map((metric) => {
                  const agent = agents?.find((a) => a.agentId === metric.agent_id);
                  return (
                    <tr key={metric.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {new Date(metric.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {agent?.agentName || metric.agent_id || "System"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {metric.metricName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-mono">
                        {metric.metricValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {metric.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
