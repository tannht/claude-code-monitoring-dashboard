/**
 * Alerts Management Page
 * Comprehensive alert history, filtering, trends, and resolution tracking
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { AlertsFeed } from "@/components/monitoring";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import type { RealTimeEvent } from "@/lib/mcp/types";

export interface Alert {
  id: string;
  type: string;
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  timestamp: string;
  source?: string;
  status: "active" | "acknowledged" | "resolved";
  resolvedAt?: string;
  metadata?: RealTimeEvent;
}

export default function AlertsPage() {
  const { events, connected } = useRealTimeUpdates({ enabled: true });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "error" | "critical">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "acknowledged" | "resolved">("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Convert events to alerts and persist them
  useEffect(() => {
    const newAlerts: Alert[] = events
      .slice(0, 100)
      .map((event): Alert => {
        let alertSeverity: Alert["severity"] = "info";
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
          status: "active",
          metadata: event,
        };
      });

    // Merge with existing alerts, avoiding duplicates
    setAlerts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const uniqueNewAlerts = newAlerts.filter((a) => !existingIds.has(a.id));
      return [...uniqueNewAlerts, ...prev].slice(0, 500); // Keep last 500
    });
  }, [events]);

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "acknowledged" as const } : a))
    );
  };

  // Resolve alert
  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, status: "resolved" as const, resolvedAt: new Date().toISOString() }
          : a
      )
    );
  };

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filter !== "all" && alert.severity !== filter) return false;
      if (statusFilter !== "all" && alert.status !== statusFilter) return false;
      return true;
    });
  }, [alerts, filter, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = alerts.length;
    const active = alerts.filter((a) => a.status === "active").length;
    const acknowledged = alerts.filter((a) => a.status === "acknowledged").length;
    const resolved = alerts.filter((a) => a.status === "resolved").length;

    const severityBreakdown = {
      critical: alerts.filter((a) => a.severity === "critical").length,
      error: alerts.filter((a) => a.severity === "error").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
    };

    return { total, active, acknowledged, resolved, severityBreakdown };
  }, [alerts]);

  // Trend data (alerts per hour)
  const trendData = useMemo(() => {
    const now = Date.now();
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hourStart = now - (23 - i) * 3600000;
      const hourEnd = hourStart + 3600000;
      const count = alerts.filter(
        (a) => new Date(a.timestamp).getTime() >= hourStart && new Date(a.timestamp).getTime() < hourEnd
      ).length;
      return { hour: i, label: `${new Date(hourStart).getHours()}:00`, count };
    });
    return hours;
  }, [alerts]);

  const severityColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    critical: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
  };

  const statusColors: Record<string, string> = {
    active: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    acknowledged: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              🔔 Alerts Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Alert history, trends, and resolution tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 bg-slate-400 rounded-full" />
                Polling
              </span>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Alerts</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.active}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Active</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.acknowledged}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Acknowledged</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Resolved</div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Severity Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.severityBreakdown.critical}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.severityBreakdown.error}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Error</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.severityBreakdown.warning}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.severityBreakdown.info}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Info</div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            📈 Alert Trends (Last 24 Hours)
          </h2>
          <div className="flex items-end gap-1 h-40">
            {trendData.map((data) => (
              <div
                key={data.hour}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${data.label}: ${data.count} alerts`}
              >
                <div
                  className="w-full bg-primary-600 hover:bg-primary-500 transition-colors rounded-t"
                  style={{
                    height: `${Math.max(2, (data.count / Math.max(...trendData.map((d) => d.count))) * 100)}%`,
                  }}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 -rotate-45 origin-top-left">
                  {data.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Severity Filter
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alert History Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Alert History ({filteredAlerts.length} alerts)
            </h2>
          </div>
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No alerts found matching the current filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredAlerts.slice(0, 50).map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[alert.severity]}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {alert.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-md truncate">
                        {alert.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[alert.status]}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            View
                          </button>
                          {alert.status === "active" && (
                            <>
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                              >
                                Acknowledge
                              </button>
                              <button
                                onClick={() => resolveAlert(alert.id)}
                                className="text-green-600 hover:text-green-700 dark:text-green-400"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alert Details Modal */}
        {selectedAlert && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {selectedAlert.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(selectedAlert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Severity
                    </label>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${severityColors[selectedAlert.severity]}`}>
                      {selectedAlert.severity.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[selectedAlert.status]}`}>
                      {selectedAlert.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Message
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 rounded p-3">
                      {selectedAlert.message}
                    </p>
                  </div>

                  {selectedAlert.source && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Source
                      </label>
                      <p className="text-sm text-slate-900 dark:text-white">{selectedAlert.source}</p>
                    </div>
                  )}

                  {selectedAlert.resolvedAt && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Resolved At
                      </label>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {new Date(selectedAlert.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedAlert.status === "active" && (
                    <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          acknowledgeAlert(selectedAlert.id);
                          setSelectedAlert({ ...selectedAlert, status: "acknowledged" });
                        }}
                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => {
                          resolveAlert(selectedAlert.id);
                          setSelectedAlert({
                            ...selectedAlert,
                            status: "resolved",
                            resolvedAt: new Date().toISOString(),
                          });
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
