/**
 * Task Trajectories Page
 * View task execution paths with judge labels and success patterns
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useTaskTrajectories } from "@/hooks/useSqliteData";
import { useAgentStats } from "@/hooks/useSqliteData";

type TrajectoryFilters = {
  agentId: string;
  judgeLabel: string;
  searchQuery: string;
};

export default function TrajectoriesPage() {
  const { data: trajectories, loading, error, refetch } = useTaskTrajectories(undefined, 100);
  const { data: agents } = useAgentStats();
  const [filters, setFilters] = useState<TrajectoryFilters>({
    agentId: "all",
    judgeLabel: "all",
    searchQuery: "",
  });
  const [selectedTrajectory, setSelectedTrajectory] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Task Trajectories - Claude Code Monitoring";
  }, []);

  // Get unique judge labels
  const judgeLabels = useMemo(() => {
    const labels = new Set<string>();
    trajectories.forEach((t) => {
      if (t.judge_label) labels.add(t.judge_label);
    });
    return Array.from(labels).sort();
  }, [trajectories]);

  // Create agent lookup map
  const agentMap = useMemo(() => {
    const map = new Map<string, string>();
    agents?.forEach((agent) => {
      map.set(agent.agentId, agent.agentName);
    });
    return map;
  }, [agents]);

  // Filter trajectories
  const filteredTrajectories = useMemo(() => {
    return trajectories.filter((t) => {
      if (filters.agentId !== "all" && t.agent_id !== filters.agentId) {
        return false;
      }
      if (filters.judgeLabel !== "all" && t.judge_label !== filters.judgeLabel) {
        return false;
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const agent = agentMap.get(t.agent_id) || t.agent_id;
        const matchQuery = t.query.toLowerCase();
        const reasons = t.judge_reasons?.toLowerCase() || "";

        return (
          agent.toLowerCase().includes(query) ||
          matchQuery.includes(query) ||
          reasons.includes(query)
        );
      }
      return true;
    });
  }, [trajectories, filters, agentMap]);

  // Parse trajectory JSON
  const parsedTrajectories = useMemo(() => {
    return filteredTrajectories.map((t) => ({
      ...t,
      trajectory: typeof t.trajectory_json === "string" ? JSON.parse(t.trajectory_json) : t.trajectory_json,
    }));
  }, [filteredTrajectories]);

  // Calculate stats
  const trajectoryStats = useMemo(() => {
    const total = trajectories.length;
    const withJudge = trajectories.filter((t) => t.judge_label).length;
    const highConf = trajectories.filter((t) => t.judge_conf && t.judge_conf >= 0.8).length;
    const avgConf =
      trajectories.filter((t) => t.judge_conf).reduce((sum, t) => sum + (t.judge_conf || 0), 0) / withJudge || 0;

    // Judge label distribution
    const labelCounts = new Map<string, number>();
    trajectories.forEach((t) => {
      if (t.judge_label) {
        labelCounts.set(t.judge_label, (labelCounts.get(t.judge_label) || 0) + 1);
      }
    });

    return { total, withJudge, highConf, avgConf, labelCounts };
  }, [trajectories]);

  const getJudgeLabelColor = (label?: string) => {
    switch (label?.toLowerCase()) {
      case "success":
      case "correct":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failure":
      case "incorrect":
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "partial":
      case "incomplete":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getJudgeLabelIcon = (label?: string) => {
    switch (label?.toLowerCase()) {
      case "success":
      case "correct":
        return "✅";
      case "failure":
      case "incorrect":
      case "error":
        return "❌";
      case "partial":
      case "incomplete":
        return "⚠️";
      default:
        return "📝";
    }
  };

  const selectedTrajectoryData = parsedTrajectories.find((t) => t.task_id === selectedTrajectory);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              🛤️ Task Trajectories
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Execution paths with judge labels and success patterns
            </p>
          </div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {trajectoryStats.total}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Trajectories</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {trajectoryStats.withJudge}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">With Judge Labels</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {trajectoryStats.highConf}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">High Confidence</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {trajectoryStats.avgConf > 0 ? (trajectoryStats.avgConf * 100).toFixed(1) + "%" : "N/A"}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Avg Confidence</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Agent
              </label>
              <select
                value={filters.agentId}
                onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Agents</option>
                {agents?.map((agent) => (
                  <option key={agent.agentId} value={agent.agentId}>
                    {agent.agentName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Judge Label
              </label>
              <select
                value={filters.judgeLabel}
                onChange={(e) => setFilters({ ...filters, judgeLabel: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Labels</option>
                {judgeLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search query or reasons..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trajectories List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                Loading trajectories...
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            ) : parsedTrajectories.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                <span className="text-6xl mb-4 block">🛤️</span>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No Trajectories Found
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {filters.agentId !== "all" || filters.judgeLabel !== "all" || filters.searchQuery
                    ? "Try adjusting your filters"
                    : "Task trajectories will appear here as agents complete tasks"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {parsedTrajectories.map((trajectory) => {
                  const agentName = agentMap.get(trajectory.agent_id) || trajectory.agent_id;

                  return (
                    <div
                      key={trajectory.task_id}
                      className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                        selectedTrajectory === trajectory.task_id
                          ? "border-primary-500 dark:border-primary-500"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                      onClick={() => setSelectedTrajectory(trajectory.task_id)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{getJudgeLabelIcon(trajectory.judge_label)}</span>
                              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                {agentName}
                              </h3>
                              {trajectory.judge_label && (
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getJudgeLabelColor(
                                    trajectory.judge_label
                                  )}`}
                                >
                                  {trajectory.judge_label}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                              {trajectory.query}
                            </p>
                          </div>
                          {trajectory.judge_conf && (
                            <div className="ml-4 text-right">
                              <div className="text-sm text-slate-500 dark:text-slate-400">Confidence</div>
                              <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {(trajectory.judge_conf * 100).toFixed(0)}%
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {trajectory.trajectory.length} steps
                            {trajectory.started_at && (
                              <span className="ml-2">
                                ({new Date(trajectory.started_at).toLocaleDateString()})
                              </span>
                            )}
                          </span>
                          <span>{trajectory.task_id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trajectory Detail Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              {selectedTrajectoryData ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Trajectory Details
                    </h3>
                    <button
                      onClick={() => setSelectedTrajectory(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Query */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Query
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 rounded p-2">
                      {selectedTrajectoryData.query}
                    </p>
                  </div>

                  {/* Judge Info */}
                  {selectedTrajectoryData.judge_label && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Judge Assessment
                      </label>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getJudgeLabelColor(
                            selectedTrajectoryData.judge_label
                          )}`}
                        >
                          {getJudgeLabelIcon(selectedTrajectoryData.judge_label)} {selectedTrajectoryData.judge_label}
                        </span>
                        {selectedTrajectoryData.judge_conf && (
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {(selectedTrajectoryData.judge_conf * 100).toFixed(1)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Judge Reasons */}
                  {selectedTrajectoryData.judge_reasons && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Reasons
                      </label>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded p-2">
                        {selectedTrajectoryData.judge_reasons}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Execution Timeline
                    </label>
                    <div className="space-y-1 text-xs">
                      {selectedTrajectoryData.started_at && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Started:</span>
                          <span className="text-slate-900 dark:text-white">
                            {new Date(selectedTrajectoryData.started_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedTrajectoryData.ended_at && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Ended:</span>
                          <span className="text-slate-900 dark:text-white">
                            {new Date(selectedTrajectoryData.ended_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedTrajectoryData.started_at && selectedTrajectoryData.ended_at && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                          <span className="text-slate-900 dark:text-white">
                            {Math.round(
                                  (new Date(selectedTrajectoryData.ended_at).getTime() -
                                    new Date(selectedTrajectoryData.started_at).getTime()) /
                                    1000
                                )}{" "}
                            seconds
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trajectory Steps */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Execution Steps ({selectedTrajectoryData.trajectory.length})
                    </label>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {selectedTrajectoryData.trajectory.map((step: unknown, index: number) => (
                        <div
                          key={index}
                          className="text-xs bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-slate-500 dark:text-slate-400">#{index + 1}</span>
                            <span className="text-slate-900 dark:text-white">
                              {(step as { action?: string }).action || "step"}
                            </span>
                          </div>
                          {typeof step === "object" && step !== null && (
                            <pre className="text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto">
                              {JSON.stringify(step, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
                  <span className="text-4xl mb-3 block">👆</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Select a trajectory to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
