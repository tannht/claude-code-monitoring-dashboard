/**
 * StatusBar Component
 * Real-time status bar displaying system monitoring state (Loki Mode pattern)
 */

"use client";

import { useEffect, useState } from "react";
import { SystemStatus } from "@/lib/status/types";

export interface StatusBarProps {
  pollInterval?: number;
  showFileContent?: boolean;
  compact?: boolean;
}

export function StatusBar({ pollInterval = 5000, showFileContent = false, compact = false }: StatusBarProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/status?refresh=true");
        const result = await response.json();

        if (mounted) {
          if (result.success) {
            setStatus(result.data);
            setError(null);
          } else {
            setError(result.error || "Failed to fetch status");
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    };

    fetchStatus();

    if (pollInterval > 0) {
      const interval = setInterval(fetchStatus, pollInterval);
      return () => {
        clearInterval(interval);
        mounted = false;
      };
    }
  }, [pollInterval]);

  if (loading) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">
          Status unavailable: {error || "Unknown error"}
        </p>
      </div>
    );
  }

  const phaseColors: Record<SystemStatus["phase"], string> = {
    IDLE: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600",
    MONITORING: "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-300 dark:border-green-700",
    ALERT: "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-300 dark:border-red-700",
  };

  const cbColors: Record<string, string> = {
    CLOSED: "text-green-600 dark:text-green-400",
    OPEN: "text-red-600 dark:text-red-400",
    "HALF_OPEN": "text-yellow-600 dark:text-yellow-400",
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 px-3 py-2 rounded-full border ${phaseColors[status.phase]}`}>
        <span className={`w-2 h-2 rounded-full ${
          status.phase === "MONITORING" ? "bg-green-500 animate-pulse" :
          status.phase === "ALERT" ? "bg-red-500 animate-pulse" :
          "bg-slate-400"
        }`} />
        <span className="text-sm font-medium">{status.phase}</span>
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {status.queries.active} active
        </span>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${phaseColors[status.phase]}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              status.phase === "MONITORING" ? "bg-green-500 animate-pulse" :
              status.phase === "ALERT" ? "bg-red-500 animate-pulse" :
              "bg-slate-400"
            }`} />
            System Status: {status.phase}
          </h3>
          <p className="text-xs opacity-70 mt-1">
            Updated: {new Date(status.updated).toLocaleString()}
            {status.uptime && ` • Uptime: ${Math.floor(status.uptime / 60)}m ${status.uptime % 60}s`}
          </p>
        </div>
      </div>

      {/* Query Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold">{status.queries.active}</div>
          <div className="text-xs opacity-70">Active</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{status.queries.pending}</div>
          <div className="text-xs opacity-70">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{status.queries.completed}</div>
          <div className="text-xs opacity-70">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{status.queries.failed}</div>
          <div className="text-xs opacity-70">Failed</div>
        </div>
      </div>

      {/* Circuit Breaker */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-current/20">
        <span>Circuit Breaker:</span>
        <span className={`font-semibold ${cbColors[status.circuitBreakers.state]}`}>
          {status.circuitBreakers.state} ({status.circuitBreakers.failureCount}/{status.circuitBreakers.failureThreshold})
        </span>
      </div>

      {status.circuitBreakers.cooldownUntil && (
        <div className="text-xs opacity-70 mt-1">
          Cooldown until: {new Date(status.circuitBreakers.cooldownUntil).toLocaleString()}
        </div>
      )}

      {/* Last Activity */}
      {status.lastActivity && (
        <div className="text-xs mt-2 pt-2 border-t border-current/20 opacity-80">
          Last: {new Date(status.lastActivity.timestamp).toLocaleTimeString()} - {status.lastActivity.description}
        </div>
      )}

      {/* Raw Status File Content */}
      {showFileContent && status.statusFile && (
        <details className="mt-3">
          <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100">
            View STATUS.txt
          </summary>
          <pre className="mt-2 text-xs bg-black/5 dark:bg-black/20 p-2 rounded overflow-x-auto">
            {status.statusFile}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Compact status badge for inline use
 */
export function StatusBadge() {
  return <StatusBar compact pollInterval={0} />;
}
