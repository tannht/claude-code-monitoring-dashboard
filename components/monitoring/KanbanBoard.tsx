/**
 * KanbanBoard Component
 * Displays queries in a Kanban-style board with 4 columns
 */

"use client";

import { useEffect, useState } from "react";
import { QueryTask, QueryStatus } from "@/lib/monitoring/types";
import { QueryCard } from "./QueryCard";

export interface KanbanBoardProps {
  pollInterval?: number;
  showStats?: boolean;
}

interface KanbanColumn {
  id: QueryStatus;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
}

const COLUMNS: KanbanColumn[] = [
  { id: "pending", title: "Pending", icon: "📋", color: "border-slate-300 dark:border-slate-600", bgColor: "bg-slate-50 dark:bg-slate-800/50" },
  { id: "running", title: "Running", icon: "⚡", color: "border-blue-300 dark:border-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "completed", title: "Completed", icon: "✓", color: "border-green-300 dark:border-green-600", bgColor: "bg-green-50 dark:bg-green-900/20" },
  { id: "failed", title: "Failed", icon: "✗", color: "border-red-300 dark:border-red-600", bgColor: "bg-red-50 dark:bg-red-900/20" },
];

export function KanbanBoard({ pollInterval = 5000, showStats = true }: KanbanBoardProps) {
  const [queries, setQueries] = useState<Record<QueryStatus, QueryTask[]>>({
    pending: [],
    running: [],
    completed: [],
    failed: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchQueries = async () => {
      try {
        const response = await fetch("/api/queries?kanban=true");
        const result = await response.json();

        if (mounted) {
          if (result.success) {
            setQueries(result.data);
            setError(null);
          } else {
            setError(result.error || "Failed to fetch queries");
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

    fetchQueries();

    if (pollInterval > 0) {
      const interval = setInterval(fetchQueries, pollInterval);
      return () => {
        clearInterval(interval);
        mounted = false;
      };
    }
  }, [pollInterval]);

  const totalQueries = Object.values(queries).flat().length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2 mb-4" />
            <div className="space-y-2">
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {showStats && (
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Total: <span className="font-semibold text-slate-900 dark:text-white">{totalQueries}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Running: <span className="font-semibold text-blue-600 dark:text-blue-400">{queries.running.length}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Completed: <span className="font-semibold text-green-600 dark:text-green-400">{queries.completed.length}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Failed: <span className="font-semibold text-red-600 dark:text-red-400">{queries.failed.length}</span>
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-xs bg-slate-800 dark:bg-slate-700 text-white rounded hover:bg-slate-700 dark:hover:bg-slate-600"
          >
            🔄 Refresh
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border ${column.color} flex flex-col max-h-[calc(100vh-300px)]`}
          >
            {/* Column Header */}
            <div className={`px-4 py-3 border-b ${column.color} flex items-center justify-between sticky top-0 ${column.bgColor} rounded-t-lg`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{column.icon}</span>
                <h3 className="font-semibold text-slate-900 dark:text-white">{column.title}</h3>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                column.id === "pending" ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" :
                column.id === "running" ? "bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                column.id === "completed" ? "bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-300" :
                "bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}>
                {queries[column.id].length}
              </span>
            </div>

            {/* Column Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {queries[column.id].length === 0 ? (
                <div className="flex items-center justify-center h-24 text-slate-400 dark:text-slate-600 text-sm">
                  No queries
                </div>
              ) : (
                queries[column.id].map((query) => (
                  <QueryCard key={query.id} query={query} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
