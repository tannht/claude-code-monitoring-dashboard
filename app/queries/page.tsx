/**
 * Queries Page
 * Kanban-style query board (Loki Mode pattern)
 */

"use client";

import { useEffect } from "react";
import { KanbanBoard } from "@/components/monitoring";

export default function QueriesPage() {
  useEffect(() => {
    document.title = "Queries - Claude Code Monitoring";
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            📊 Query Board
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track all queries in real-time with Kanban-style organization
          </p>
        </header>

        {/* Quick Actions */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => fetch("/api/queries", { method: "DELETE" }).then(() => window.location.reload())}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            🗑️ Clear All
          </button>
          <button
            onClick={() => fetch("/api/queries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "create", title: "Test Query", options: { priority: "medium" } })
            }).then(() => window.location.reload())}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            ➕ Add Test Query
          </button>
        </div>

        {/* Kanban Board */}
        <KanbanBoard pollInterval={3000} showStats={true} />

        {/* Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ About Query Board
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            This Kanban board displays all queries tracked by the monitoring system.
            Queries automatically move between columns as their status changes.
            Use the API to create, update, and manage queries programmatically.
          </p>
        </div>
      </div>
    </main>
  );
}
