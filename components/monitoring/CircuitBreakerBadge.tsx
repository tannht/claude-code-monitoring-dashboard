/**
 * CircuitBreakerBadge Component
 * Displays circuit breaker state with visual indicator
 */

"use client";

import { useEffect, useState } from "react";
import { CircuitBreakerState, CircuitState } from "@/lib/circuit-breaker/types";

export interface CircuitBreakerBadgeProps {
  circuitName?: string;
  pollInterval?: number;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

interface CircuitStateWithBadge {
  state: CircuitState;
  color: string;
  bgClass: string;
  textClass: string;
  icon: string;
}

const STATE_STYLES: Record<CircuitState, CircuitStateWithBadge> = {
  CLOSED: {
    state: "CLOSED",
    color: "#22c55e",
    bgClass: "bg-green-500",
    textClass: "text-green-600 dark:text-green-400",
    icon: "✓",
  },
  OPEN: {
    state: "OPEN",
    color: "#ef4444",
    bgClass: "bg-red-500",
    textClass: "text-red-600 dark:text-red-400",
    icon: "⚠",
  },
  HALF_OPEN: {
    state: "HALF_OPEN",
    color: "#f59e0b",
    bgClass: "bg-yellow-500",
    textClass: "text-yellow-600 dark:text-yellow-400",
    icon: "⟳",
  },
};

export function CircuitBreakerBadge({
  circuitName,
  pollInterval = 5000,
  showDetails = false,
  size = "md",
}: CircuitBreakerBadgeProps) {
  const [circuits, setCircuits] = useState<CircuitBreakerState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchCircuits = async () => {
      try {
        const params = circuitName ? `?name=${circuitName}` : "";
        const response = await fetch(`/api/circuit-breaker${params}`);
        const result = await response.json();

        if (mounted) {
          if (result.success) {
            setCircuits(Array.isArray(result.data) ? result.data : [result.data]);
            setError(null);
          } else {
            setError(result.error || "Failed to fetch circuit states");
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

    fetchCircuits();

    if (pollInterval > 0) {
      const interval = setInterval(fetchCircuits, pollInterval);
      return () => {
        clearInterval(interval);
        mounted = false;
      };
    }
  }, [circuitName, pollInterval]);

  if (loading) {
    return <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded" style={{ width: size === "sm" ? "60px" : size === "lg" ? "120px" : "80px", height: size === "sm" ? "20px" : "24px" }} />;
  }

  if (error || circuits.length === 0) {
    return null;
  }

  const circuit = circuits[0]; // Show first circuit if multiple
  const style = STATE_STYLES[circuit.state];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  if (!showDetails) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${style.bgClass} ${style.textClass} bg-opacity-20`}
        title={`Circuit: ${circuit.name} - ${style.state}`}
      >
        <span className={`${style.bgClass} w-2 h-2 rounded-full ${circuit.state === "CLOSED" ? "animate-pulse" : ""}`} />
        {style.icon}
      </span>
    );
  }

  const timeRemaining = circuit.cooldownUntil
    ? Math.max(0, Math.floor((new Date(circuit.cooldownUntil).getTime() - Date.now()) / 1000))
    : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg`}>{style.icon}</span>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{circuit.name}</h3>
            <p className={`text-xs font-medium uppercase ${style.textClass}`}>{style.state}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${style.bgClass} ${circuit.state === "CLOSED" ? "animate-pulse" : ""}`} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-slate-600 dark:text-slate-400">Failures:</span>
          <span className="ml-2 font-mono text-slate-900 dark:text-white">{circuit.failureCount}</span>
        </div>
        <div>
          <span className="text-slate-600 dark:text-slate-400">Successes:</span>
          <span className="ml-2 font-mono text-slate-900 dark:text-white">{circuit.successCount}</span>
        </div>
      </div>

      {/* Cooldown info */}
      {circuit.state === "OPEN" && timeRemaining > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 text-xs">
          <p className="text-yellow-800 dark:text-yellow-200">
            Cooldown: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")} remaining
          </p>
        </div>
      )}

      {/* HALF_OPEN progress */}
      {circuit.state === "HALF_OPEN" && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-blue-800 dark:text-blue-200">Recovery Test</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono">
              {circuit.consecutiveSuccesses}/3
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(circuit.consecutiveSuccesses / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Last activity */}
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        {circuit.lastFailureTime && (
          <p>Last failure: {new Date(circuit.lastFailureTime).toLocaleString()}</p>
        )}
        {circuit.lastSuccessTime && (
          <p>Last success: {new Date(circuit.lastSuccessTime).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline badge for circuit state
 */
export function CircuitStateDot({ state, size = "sm" }: { state: CircuitState; size?: "sm" | "md" | "lg" }) {
  const style = STATE_STYLES[state];
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-block rounded-full ${sizeClasses[size]} ${style.bgClass} ${state === "CLOSED" ? "animate-pulse" : ""}`}
      title={`Circuit State: ${state}`}
    />
  );
}
