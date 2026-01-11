/**
 * ConnectionStatus Component
 * Displays connection status with visual indicators
 */

"use client";

import { useState, useEffect } from "react";

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

export interface ConnectionStatusProps {
  status?: ConnectionStatus;
  source?: string;
  lastUpdate?: Date;
  showLabel?: boolean;
  onReconnect?: () => void;
}

export function ConnectionStatus({
  status: externalStatus,
  source = "API",
  lastUpdate,
  showLabel = true,
  onReconnect,
}: ConnectionStatusProps) {
  const [internalStatus, setInternalStatus] = useState<ConnectionStatus>("connecting");
  const status = externalStatus ?? internalStatus;

  useEffect(() => {
    if (!externalStatus) {
      // Auto-detect status based on fetch health
      const checkConnection = async () => {
        try {
          const response = await fetch("/api/sqlite/health");
          const data = await response.json();
          setInternalStatus(data.success ? "connected" : "error");
        } catch {
          setInternalStatus("disconnected");
        }
      };

      checkConnection();
      const interval = setInterval(checkConnection, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [externalStatus]);

  const statusConfig = {
    connected: {
      color: "bg-green-500",
      textColor: "text-green-700 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      label: "Connected",
      icon: "🟢",
    },
    connecting: {
      color: "bg-yellow-500 animate-pulse",
      textColor: "text-yellow-700 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      label: "Connecting...",
      icon: "🟡",
    },
    disconnected: {
      color: "bg-slate-400",
      textColor: "text-slate-700 dark:text-slate-400",
      bgColor: "bg-slate-100 dark:bg-slate-700",
      label: "Disconnected",
      icon: "⚪",
    },
    error: {
      color: "bg-red-500",
      textColor: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      label: "Error",
      icon: "🔴",
    },
  };

  const config = statusConfig[status];

  const timeSinceUpdate = lastUpdate
    ? Math.round((Date.now() - lastUpdate.getTime()) / 1000)
    : null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border border-current ${config.textColor}`}>
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      {showLabel && (
        <>
          <span className="text-sm font-medium">{config.label}</span>
          {source && <span className="text-xs opacity-75">({source})</span>}
          {timeSinceUpdate !== null && timeSinceUpdate < 60 && (
            <span className="text-xs opacity-75">{timeSinceUpdate}s ago</span>
          )}
          {status !== "connected" && onReconnect && (
            <button
              onClick={onReconnect}
              className="ml-1 text-xs underline hover:opacity-75"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * DataFreshnessBadge Component
 * Shows how fresh the data is with visual indicator
 */
export interface DataFreshnessProps {
  lastUpdate: Date;
  threshold?: {
    fresh?: number; // seconds, default 30
    stale?: number; // seconds, default 120
  };
  showLabel?: boolean;
}

export function DataFreshnessBadge({
  lastUpdate,
  threshold = { fresh: 30, stale: 120 },
  showLabel = true,
}: DataFreshnessProps) {
  const [age, setAge] = useState(0);

  useEffect(() => {
    const updateAge = () => {
      setAge(Math.round((Date.now() - lastUpdate.getTime()) / 1000));
    };

    updateAge();
    const interval = setInterval(updateAge, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getFreshness = () => {
    if (age < threshold.fresh!) return { level: "fresh", color: "green", label: "Fresh" };
    if (age < threshold.stale!) return { level: "aging", color: "yellow", label: "Aging" };
    return { level: "stale", color: "red", label: "Stale" };
  };

  const freshness = getFreshness();
  const colorClasses = {
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700",
  };

  const formatAge = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClasses[freshness.color as keyof typeof colorClasses]}`}>
      <span
        className={`w-2 h-2 rounded-full ${
          freshness.level === "fresh"
            ? "bg-green-500"
            : freshness.level === "aging"
              ? "bg-yellow-500"
              : "bg-red-500"
        } ${freshness.level !== "fresh" ? "animate-pulse" : ""}`}
      />
      {showLabel && (
        <>
          <span className="text-sm font-medium">{freshness.label}</span>
          <span className="text-xs opacity-75">Updated {formatAge(age)} ago</span>
        </>
      )}
    </div>
  );
}

export default ConnectionStatus;
