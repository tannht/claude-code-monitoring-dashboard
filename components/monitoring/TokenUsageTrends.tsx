/**
 * TokenUsageTrends Component
 * Visualizes token usage trends over time
 */

"use client";

import { useMemo } from "react";
import { useDailyMetrics } from "@/hooks/useSqliteData";
import { LineChart } from "@/components/ui";

export interface TokenUsageTrendsProps {
  days?: number;
  height?: number;
}

export function TokenUsageTrends({ days = 30, height = 250 }: TokenUsageTrendsProps) {
  const { data: dailyMetrics, loading } = useDailyMetrics(days);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!dailyMetrics || dailyMetrics.length === 0) return null;

    // Reverse to show oldest to newest
    const sortedData = [...dailyMetrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Note: The DailyMetrics type doesn't include totalTokens directly
    // We'll simulate token data based on task completion for now
    // In a real implementation, you'd want to add token tracking to the database

    return [
      {
        name: "Tasks Completed",
        data: sortedData.map((d) => ({
          x: new Date(d.date).getTime(),
          y: d.tasksCompleted || 0,
        })),
      },
      {
        name: "Tasks Failed",
        data: sortedData.map((d) => ({
          x: new Date(d.date).getTime(),
          y: d.tasksFailed || 0,
        })),
      },
      {
        name: "Avg Duration (s)",
        data: sortedData.map((d) => ({
          x: new Date(d.date).getTime(),
          y: d.avgDuration || 0,
        })),
      },
    ];
  }, [dailyMetrics]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!dailyMetrics || dailyMetrics.length === 0) return null;

    const totalTasks = dailyMetrics.reduce((sum, d) => sum + (d.tasksCompleted || 0), 0);
    const totalFailed = dailyMetrics.reduce((sum, d) => sum + (d.tasksFailed || 0), 0);
    const avgDuration =
      dailyMetrics.reduce((sum, d) => sum + (d.avgDuration || 0), 0) / dailyMetrics.length;

    // Simulate token usage (approximate: 1000 tokens per task)
    const estimatedTokens = totalTasks * 1000;
    const estimatedCost = estimatedTokens * 0.00001; // Approximate cost calculation

    return {
      totalTasks,
      totalFailed,
      avgDuration: avgDuration || 0,
      estimatedTokens,
      estimatedCost,
    };
  }, [dailyMetrics]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Usage Trends ({days} days)
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Task completion and performance metrics over time
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Tasks</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalTasks}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Failed</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{stats.totalFailed}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Duration</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.avgDuration.toFixed(1)}s
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Est. Tokens</div>
            <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {(stats.estimatedTokens / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData && chartData.length > 0 && chartData[0].data.length > 0 ? (
        <LineChart series={chartData} height={height} />
      ) : (
        <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-600">
          No data available for the selected time period
        </div>
      )}

      {/* Footer */}
      {stats && stats.estimatedCost > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span>Estimated cost based on task completion:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              ${stats.estimatedCost.toFixed(4)}
            </span>
          </div>
          <p className="mt-1 opacity-75">
            * Token usage is estimated. Actual usage may vary based on model and task complexity.
          </p>
        </div>
      )}
    </div>
  );
}

export default TokenUsageTrends;
