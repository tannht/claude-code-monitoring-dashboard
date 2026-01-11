/**
 * QueryCard Component
 * Displays a single query in the Kanban board
 */

"use client";

import { QueryTask, QueryPriority } from "@/lib/monitoring/types";

export interface QueryCardProps {
  query: QueryTask;
  onStatusChange?: (id: string, status: QueryTask["status"]) => void;
}

const PRIORITY_STYLES: Record<QueryPriority, { color: string; bgClass: string; label: string }> = {
  critical: { color: "text-purple-600 dark:text-purple-400", bgClass: "bg-purple-100 dark:bg-purple-900/30", label: "!" },
  high: { color: "text-red-600 dark:text-red-400", bgClass: "bg-red-100 dark:bg-red-900/30", label: "High" },
  medium: { color: "text-yellow-600 dark:text-yellow-400", bgClass: "bg-yellow-100 dark:bg-yellow-900/30", label: "Med" },
  low: { color: "text-slate-600 dark:text-slate-400", bgClass: "bg-slate-100 dark:bg-slate-700", label: "Low" },
};

const STATUS_STYLES: Record<QueryTask["status"], { bgClass: string; icon: string }> = {
  pending: { bgClass: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700", icon: "📋" },
  running: { bgClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", icon: "⚡" },
  completed: { bgClass: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800", icon: "✓" },
  failed: { bgClass: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", icon: "✗" },
};

export function QueryCard({ query }: QueryCardProps) {
  const priorityStyle = PRIORITY_STYLES[query.priority];
  const statusStyle = STATUS_STYLES[query.status];

  const formatDuration = (ms?: number): string => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (isoString?: string): string => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`p-3 rounded-lg border ${statusStyle.bgClass} hover:shadow-md transition-shadow cursor-pointer`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm">{statusStyle.icon}</span>
          <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate">
            {query.title}
          </h4>
        </div>
        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${priorityStyle.bgClass} ${priorityStyle.color} flex-shrink-0`}>
          {priorityStyle.label === "!" ? "!" : priorityStyle.label}
        </span>
      </div>

      {/* Description */}
      {query.description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
          {query.description}
        </p>
      )}

      {/* Error Message */}
      {query.error && (
        <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-800 dark:text-red-200">
          <span className="font-medium">Error:</span> {query.error}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {/* Duration */}
          {query.duration && (
            <span className="font-mono">
              {formatDuration(query.duration)}
            </span>
          )}

          {/* Time */}
          <span>
            {formatTime(query.completedAt || query.failedAt || query.startedAt || query.createdAt)}
          </span>
        </div>

        {/* Agent Badge */}
        {query.agentId && (
          <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
            {query.agentId.slice(0, 8)}...
          </span>
        )}
      </div>

      {/* Tags */}
      {query.tags && query.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {query.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
            >
              {tag}
            </span>
          ))}
          {query.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              +{query.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Running Indicator */}
      {query.status === "running" && (
        <div className="mt-2 h-1 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse w-full" />
        </div>
      )}
    </div>
  );
}
