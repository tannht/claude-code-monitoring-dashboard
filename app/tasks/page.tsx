/**
 * Tasks Page
 * Track task progress and execution
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricsCard, LineChart, ExportButton } from "@/components/ui";
import type { CSVColumn } from "@/lib/export";
import { useTaskStatus, useDailyMetrics, useDbHealth } from "@/hooks";
import type { TaskInfo } from "@/lib/mcp/types";
import type { DailyMetrics as DailyMetricsType } from "@/lib/db/schema";

export default function TasksPage() {
  const { data: tasks, loading, error, refetch } = useTaskStatus(undefined, 0);
  const { data: dailyMetrics } = useDailyMetrics(7);
  const { healthy } = useDbHealth();

  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "failed">("all");
  const [filteredTasks, setFilteredTasks] = useState<TaskInfo[]>([]);

  useEffect(() => {
    document.title = "Tasks - Claude Code Monitoring";
  }, []);

  useEffect(() => {
    if (tasks) {
      if (filter === "all") {
        setFilteredTasks(tasks);
      } else {
        setFilteredTasks(tasks.filter((t) => t.status === filter));
      }
    }
  }, [tasks, filter]);

  // Export columns definition
  const exportColumns = useMemo<CSVColumn[]>(
    () => [
      { key: "taskId", label: "Task ID" },
      {
        key: "description",
        label: "Description",
        formatter: (v) => (v ? String(v).slice(0, 200) : ""),
      },
      {
        key: "status",
        label: "Status",
        formatter: (v) => (v ? String(v).replace("_", " ") : ""),
      },
      {
        key: "priority",
        label: "Priority",
        formatter: (v) => (v ? String(v).toUpperCase() : ""),
      },
      {
        key: "assignedAgent",
        label: "Assigned Agent",
        formatter: (v) => (v ? String(v) : "Unassigned"),
      },
      {
        key: "createdAt",
        label: "Created At",
        formatter: (v) => (v ? new Date(v as string).toLocaleString() : ""),
      },
      {
        key: "completedAt",
        label: "Completed At",
        formatter: (v) => (v ? new Date(v as string).toLocaleString() : ""),
      },
      {
        key: "duration",
        label: "Duration (s)",
        formatter: (v) => (v ? `${(Number(v) / 1000).toFixed(1)}s` : ""),
      },
      {
        key: "error",
        label: "Error",
        formatter: (v) => (v ? String(v).slice(0, 500) : ""),
      },
    ],
    []
  );

  const statusColors: Record<string, string> = {
    pending: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const priorityColors: Record<string, string> = {
    low: "text-slate-600 dark:text-slate-400",
    medium: "text-yellow-600 dark:text-yellow-400",
    high: "text-orange-600 dark:text-orange-400",
    critical: "text-red-600 dark:text-red-400",
  };

  if (!healthy) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              Database Connection Error
            </h1>
            <p className="text-red-800 dark:text-red-200">
              Cannot connect to the SQLite database. Please check your configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              📋 Task Tracking
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor task execution and progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton
              data={filteredTasks as unknown as Record<string, unknown>[]}
              columns={exportColumns}
              filename="tasks"
              label="Export"
              disabled={!tasks || tasks.length === 0}
              loading={loading}
            />
            <button
              onClick={refetch}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            title="Total Tasks"
            value={tasks?.length || 0}
            icon="📋"
          />
          <MetricsCard
            title="In Progress"
            value={tasks?.filter((t) => t.status === "in_progress").length || 0}
            icon="🔄"
          />
          <MetricsCard
            title="Completed"
            value={tasks?.filter((t) => t.status === "completed").length || 0}
            icon="✅"
            changeType="positive"
          />
          <MetricsCard
            title="Failed"
            value={tasks?.filter((t) => t.status === "failed").length || 0}
            icon="❌"
            changeType="negative"
          />
        </div>

        {/* Chart */}
        {dailyMetrics && dailyMetrics.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <LineChart
              title="Task Completion (Last 7 Days)"
              series={[
                {
                  name: "Completed",
                  data: dailyMetrics.slice(0, 7).reverse().map((d) => d.tasksCompleted || 0),
                },
                {
                  name: "Failed",
                  data: dailyMetrics.slice(0, 7).reverse().map((d) => d.tasksFailed || 0),
                },
              ]}
              categories={dailyMetrics.slice(0, 7).reverse().map((d) => new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }))}
              colors={["#22c55e", "#ef4444"]}
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              All ({tasks?.length || 0})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "pending"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              Pending ({tasks?.filter((t) => t.status === "pending").length || 0})
            </button>
            <button
              onClick={() => setFilter("in_progress")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "in_progress"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              In Progress ({tasks?.filter((t) => t.status === "in_progress").length || 0})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "completed"
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              Completed ({tasks?.filter((t) => t.status === "completed").length || 0})
            </button>
            <button
              onClick={() => setFilter("failed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "failed"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              Failed ({tasks?.filter((t) => t.status === "failed").length || 0})
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Loading tasks...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No tasks found.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTasks.map((task) => (
                <div key={task.taskId} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {task.description}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                        <span
                          className={`text-xs font-medium ${priorityColors[task.priority]}`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span>ID: {task.taskId}</span>
                        {task.assignedAgent && <span>Agent: {task.assignedAgent}</span>}
                        <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                        {task.completedAt && (
                          <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
                        )}
                        {task.duration && <span>Duration: {(task.duration / 1000).toFixed(1)}s</span>}
                      </div>
                      {task.error && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                          Error: {task.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
