/**
 * MemoryNamespaceBreakdown Component
 * Displays memory entries breakdown by namespace
 */

"use client";

import { useMemo } from "react";

interface MemoryNamespaceBreakdownProps {
  byNamespace: Record<string, number>;
  total: number;
}

const NAMESPACE_COLORS: Record<string, string> = {
  "hooks:pre-bash": "bg-blue-500",
  "hooks:post-bash": "bg-blue-400",
  "hooks:pre-edit": "bg-purple-500",
  "hooks:post-edit": "bg-purple-400",
  "command-results": "bg-green-500",
  "command-history": "bg-green-400",
  "performance-metrics": "bg-yellow-500",
  "coordination": "bg-orange-500",
  "file-history": "bg-pink-500",
  "agent-assignments": "bg-red-500",
  "sessions": "bg-indigo-500",
  "default": "bg-slate-500",
};

const NAMESPACE_ICONS: Record<string, string> = {
  "hooks:pre-bash": "⚡",
  "hooks:post-bash": "✅",
  "hooks:pre-edit": "✏️",
  "hooks:post-edit": "📝",
  "command-results": "📤",
  "command-history": "📜",
  "performance-metrics": "📊",
  "coordination": "🔄",
  "file-history": "📁",
  "agent-assignments": "👥",
  "sessions": "💼",
  "default": "📦",
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function MemoryNamespaceBreakdown({ byNamespace, total }: MemoryNamespaceBreakdownProps) {
  const sortedNamespaces = useMemo(() => {
    return Object.entries(byNamespace)
      .map(([name, count]) => ({ name, count, percentage: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [byNamespace, total]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          🗂️ Memory Breakdown by Namespace
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {total.toLocaleString()} total entries
        </span>
      </div>

      {/* Visual bar chart */}
      <div className="mb-4">
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          {sortedNamespaces.slice(0, 8).map(({ name, percentage }, idx) => (
            <div
              key={name}
              className={NAMESPACE_COLORS[name] || NAMESPACE_COLORS.default}
              style={{ width: `${percentage}%` }}
              title={`${name}: ${percentage.toFixed(1)}%`}
            />
          ))}
        </div>
      </div>

      {/* Grid of namespace cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedNamespaces.map(({ name, count, percentage }) => (
          <NamespaceCard
            key={name}
            name={name}
            count={count}
            percentage={percentage}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          💡 Data from <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">.swarm/memory.db</code>
        </p>
      </div>
    </div>
  );
}

function NamespaceCard({ name, count, percentage }: { name: string; count: number; percentage: number }) {
  const color = NAMESPACE_COLORS[name] || NAMESPACE_COLORS.default;
  const icon = NAMESPACE_ICONS[name] || NAMESPACE_ICONS.default;

  return (
    <div className="group relative p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg" title={name}>
          {icon}
        </span>
        <span className={`w-2 h-2 rounded-full ${color}`} />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={name}>
          {name.replace("hooks:", "")}
        </p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">
          {formatNumber(count)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {percentage.toFixed(1)}%
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Compact version for sidebar
 */
export function MemoryNamespaceCompact({ byNamespace, total }: MemoryNamespaceBreakdownProps) {
  const topNamespaces = useMemo(() => {
    return Object.entries(byNamespace)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [byNamespace]);

  return (
    <div className="space-y-2">
      {topNamespaces.map(({ name, count }) => {
        const percentage = (count / total) * 100;
        return (
          <div key={name} className="flex items-center gap-2">
            <span className="text-xs flex-1 truncate text-slate-600 dark:text-slate-400">
              {name}
            </span>
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-900 dark:text-white w-12 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
