/**
 * Agents Page
 * Monitor agent performance and status (Loki Mode pattern)
 */

"use client";

import { useEffect, useMemo } from "react";
import { MetricsCard, ExportButton } from "@/components/ui";
import type { CSVColumn } from "@/lib/export";
import { useAgentStats, useDbHealth } from "@/hooks";
import { AgentStateCard } from "@/components/monitoring";

export default function AgentsPage() {
  const { data: agents, loading, error, refetch } = useAgentStats();
  const { healthy } = useDbHealth();

  useEffect(() => {
    document.title = "Agents - Claude Code Monitoring";
  }, []);

  // Export columns definition
  const exportColumns = useMemo<CSVColumn[]>(
    () => [
      { key: "agentId", label: "Agent ID" },
      { key: "agentName", label: "Agent Name" },
      { key: "agentType", label: "Agent Type" },
      { key: "totalTasks", label: "Total Tasks", formatter: (v) => String(v || 0) },
      { key: "completedTasks", label: "Completed", formatter: (v) => String(v || 0) },
      { key: "failedTasks", label: "Failed", formatter: (v) => String(v || 0) },
      {
        key: "successRate",
        label: "Success Rate",
        formatter: (v) => (v ? `${Number(v).toFixed(1)}%` : "0%"),
      },
      {
        key: "avgDuration",
        label: "Avg Duration",
        formatter: (v) => (v ? `${Math.round(Number(v) / 1000)}s` : "-"),
      },
      {
        key: "lastActive",
        label: "Last Active",
        formatter: (v) => (v ? new Date(v as string).toLocaleString() : "Never"),
      },
      {
        key: "status",
        label: "Status",
        formatter: (_v, _data) => {
          const agent = _data as unknown as { lastActive?: string };
          const isActive = agent?.lastActive && new Date(agent.lastActive) > new Date(Date.now() - 3600000);
          return isActive ? "Active" : "Idle";
        },
      },
    ],
    []
  );

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
              👥 Agent Performance
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor all agent performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton
              data={(agents || []) as unknown as Record<string, unknown>[]}
              columns={exportColumns}
              filename="agents"
              label="Export"
              disabled={!agents || agents.length === 0}
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
            title="Total Agents"
            value={agents.length || 0}
            icon="🤖"
          />
          <MetricsCard
            title="Active Agents"
            value={agents.filter((a) => a.lastActive && new Date(a.lastActive) > new Date(Date.now() - 3600000)).length}
            icon="⚡"
          />
          <MetricsCard
            title="Total Tasks"
            value={agents.reduce((sum, a) => sum + (a.totalTasks || 0), 0)}
            icon="📋"
          />
          <MetricsCard
            title="Avg Success Rate"
            value={`${agents.length ? Math.round(agents.reduce((sum, a) => sum + (a.successRate || 0), 0) / agents.length) : 0}%`}
            icon="📈"
          />
        </div>

        {/* Loki Mode Agent State Tracking */}
        <div className="mb-8">
          <div className="px-6 py-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  📍 Agent State Tracking (Loki Mode)
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Real-time agent states with heartbeat monitoring
                </p>
              </div>
            </div>
          </div>
          <AgentStateCard pollInterval={5000} showDetails={false} />
        </div>

        {/* Agents Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              All Agents
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Loading agents...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : agents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No agents found. Start a swarm to begin monitoring.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Failed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Avg Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {agents.map((agent) => {
                    const isActive = agent.lastActive && new Date(agent.lastActive) > new Date(Date.now() - 3600000);
                    return (
                      <tr key={agent.agentId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                              <span className="text-lg">🤖</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {agent.agentName}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {agent.agentId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {agent.totalTasks || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                          {agent.completedTasks || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                          {agent.failedTasks || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {agent.successRate?.toFixed(1) || 0}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {agent.avgDuration ? `${Math.round(agent.avgDuration / 1000)}s` : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {isActive ? "Active" : "Idle"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
