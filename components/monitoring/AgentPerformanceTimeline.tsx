/**
 * AgentPerformanceTimeline Component
 * Visualizes agent performance over time with trend indicators
 */

"use client";

import { useMemo } from "react";
import { usePerformanceMetrics, useAgentStats } from "@/hooks/useSqliteData";
import { LineChart } from "@/components/ui";

export interface AgentPerformanceTimelineProps {
  agentId?: string;
  metricName?: string;
  hours?: number;
  height?: number;
}

export function AgentPerformanceTimeline({
  agentId,
  metricName = "response_time",
  hours = 24,
  height = 200,
}: AgentPerformanceTimelineProps) {
  const { data: metrics, loading } = usePerformanceMetrics(agentId, metricName, hours);
  const { data: agents } = useAgentStats();

  // Get agent info
  const agent = useMemo(() => {
    if (!agentId) return null;
    return agents?.find((a) => a.agentId === agentId);
  }, [agents, agentId]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return null;

    // Group by agent if not specified
    const groupedData = new Map<string, Array<{ x: number; y: number }>>();

    metrics.forEach((m) => {
      const aid = m.agent_id || "system";
      if (!groupedData.has(aid)) {
        groupedData.set(aid, []);
      }
      groupedData.get(aid)?.push({
        x: new Date(m.timestamp).getTime(),
        y: m.metricValue,
      });
    });

    // Convert to chart format
    return Array.from(groupedData.entries()).map(([aid, data]) => {
      const a = agents?.find((ag) => ag.agentId === aid);
      return {
        name: a?.agentName || aid,
        data: data.sort((a, b) => a.x - b.x),
      };
    });
  }, [metrics, agents]);

  // Calculate trend
  const trend = useMemo(() => {
    if (!metrics || metrics.length < 2) return null;
    const recent = metrics.slice(0, 10);
    const avg = recent.reduce((sum, m) => sum + m.metricValue, 0) / recent.length;
    const older = metrics.slice(10, 20);
    if (older.length === 0) return null;
    const oldAvg = older.reduce((sum, m) => sum + m.metricValue, 0) / older.length;

    const change = ((avg - oldAvg) / oldAvg) * 100;
    return {
      value: change,
      direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
    };
  }, [metrics]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
          <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {agent ? `${agent.agentName}'s Performance` : "Agent Performance Timeline"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {metricName.replace(/_/g, " ")} over the last {hours} hours
          </p>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              trend.direction === "up"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : trend.direction === "down"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            <span>{trend.direction === "up" ? "📈" : trend.direction === "down" ? "📉" : "➡️"}</span>
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData && chartData.length > 0 && chartData[0].data.length > 0 ? (
        <LineChart series={chartData} height={height} />
      ) : (
        <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-600">
          No data available
        </div>
      )}
    </div>
  );
}

export default AgentPerformanceTimeline;
