/**
 * TaskDurationDistribution Component
 * Shows task duration distribution with histogram
 */

"use client";

import { useMemo } from "react";
import { useTaskStats } from "@/hooks/useSqliteData";

export interface TaskDurationDistributionProps {
  days?: number;
  status?: string;
}

export function TaskDurationDistribution({ days = 7, status }: TaskDurationDistributionProps) {
  // Use task stats which include average duration
  const { data: taskStats, loading } = useTaskStats(days);

  // For a proper distribution, we'd need individual task records
  // For now, we'll show summary stats from taskStats
  const stats = useMemo(() => {
    if (!taskStats) return null;

    return {
      total: taskStats.total,
      completed: taskStats.completed,
      avgDuration: taskStats.avgDuration,
      successRate: taskStats.successRate,
    };
  }, [taskStats]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Task Duration Distribution</h3>
        <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-600">
          Loading...
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Task Duration Distribution</h3>
        <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-600">
          No task data available for the last {days} days
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Task Duration Summary
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {stats.total} tasks in the last {days} days
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.avgDuration.toFixed(2)}s
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Average Duration</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.successRate.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Success Rate</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.completed}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Completed Tasks</div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Note: Full duration distribution histogram requires individual task records
      </div>
    </div>
  );
}

export default TaskDurationDistribution;
