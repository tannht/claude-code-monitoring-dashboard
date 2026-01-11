/**
 * AlertsFeed Component
 * Real-time alerts feed with filtering and severity levels
 */

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import type { RealTimeEvent } from "@/lib/mcp/types";

export interface AlertsFeedProps {
  maxItems?: number;
  severity?: "all" | "info" | "warning" | "error" | "critical";
  autoScroll?: boolean;
  showTimestamp?: boolean;
}

export interface AlertItem {
  id: string;
  type: string;
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  timestamp: string;
  source?: string;
  metadata?: RealTimeEvent;
}

export function AlertsFeed({
  maxItems = 50,
  severity = "all",
  autoScroll = true,
  showTimestamp = true,
}: AlertsFeedProps) {
  const { events, connected } = useRealTimeUpdates({ enabled: true });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<string>("all");

  // Convert real-time events to alerts
  useEffect(() => {
    const newAlerts: AlertItem[] = events
      .slice(0, maxItems)
      .map((event): AlertItem => {
        let alertSeverity: AlertItem["severity"] = "info";
        let alertTitle: string = event.type;
        let message = event.description || "";
        const source = event.assignedAgent || "system";

        // Determine severity based on event type
        if (event.type === "task_failed" || event.type === "error") {
          alertSeverity = "error";
          alertTitle = "Task Failed";
          message = event.error || message;
        } else if (event.type === "task_completed") {
          alertSeverity = "info";
          alertTitle = "Task Completed";
          message = `Task ${event.taskId?.slice(0, 8)} completed successfully`;
        } else if (event.type === "task_started") {
          alertSeverity = "info";
          alertTitle = "Task Started";
          message = `Task ${event.taskId?.slice(0, 8)} started`;
        } else if (event.priority === "critical") {
          alertSeverity = "critical";
          alertTitle = "Critical Task";
        } else if (event.priority === "high") {
          alertSeverity = "warning";
          alertTitle = "High Priority Task";
        }

        return {
          id: event.taskId || event.timestamp || Math.random().toString(),
          type: event.type,
          severity: alertSeverity,
          title: alertTitle,
          message,
          timestamp: event.timestamp || new Date().toISOString(),
          source,
          metadata: event,
        };
      });

    setAlerts(newAlerts);
  }, [events, maxItems]);

  // Filter alerts by severity
  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    return alerts.filter((alert) => alert.severity === filter);
  }, [alerts, filter]);

  const severityColors: Record<string, string> = {
    info: "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700",
    warning: "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700",
    error: "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700",
    critical: "bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700",
  };

  const severityIcons: Record<string, string> = {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
    critical: "🚨",
  };

  // Auto-scroll to bottom when new alerts arrive
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredAlerts, autoScroll]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-semibold text-slate-900 dark:text-white">Alerts Feed</h3>
            {connected && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div ref={scrollRef} className="p-4 space-y-2 max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <span className="text-4xl mb-2 block">🔔</span>
            <p className="text-sm">No alerts yet</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-l-4 ${severityColors[alert.severity]} transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{severityIcons[alert.severity]}</span>
                  <span className="font-medium text-slate-900 dark:text-white text-sm">{alert.title}</span>
                </div>
                {showTimestamp && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{alert.message}</p>
              {alert.source && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Source: <span className="font-mono">{alert.source}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{filteredAlerts.length} alert(s)</span>
          {connected ? (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 bg-slate-400 rounded-full" />
              Disconnected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertsFeed;
