/**
 * Swarms Page
 * View and manage swarms
 * Uses MCP API for data consistency with home page
 */

"use client";

import { useEffect, useMemo } from "react";
import { MetricsCard } from "@/components/ui";
import { useMcpSwarms, useMcpAgents } from "@/hooks/useMcpApi";

export default function SwarmsPage() {
  const { data: swarmsData, loading: swarmsLoading, error: swarmsError, refetch: refetchSwarms } = useMcpSwarms(5000);
  const { data: agentsData, loading: agentsLoading } = useMcpAgents(5000);

  useEffect(() => {
    document.title = "Swarms - Claude Code Monitoring";
  }, []);

  // Group agents by swarmId for display
  const swarmsWithAgents = useMemo(() => {
    if (!swarmsData?.items) return [];

    return swarmsData.items.map((swarm) => {
      const swarmAgents = agentsData?.items.filter(
        (agent) => agent.swarmId === swarm.swarmId || agent.swarmId === null
      ) || [];

      return {
        ...swarm,
        agents: swarmAgents,
        activeAgents: swarmAgents.filter((a) => a.status === "active" || a.status === "busy").length,
      };
    });
  }, [swarmsData, agentsData]);

  // Calculate totals
  const totalSwarms = swarmsData?.total || 0;
  const activeSwarms = swarmsData?.active || 0;
  const totalAgents = agentsData?.total || 0;
  const maxCapacity = swarmsData?.items.reduce((sum, s) => sum + (s.maxAgents || 0), 0) || 0;

  const loading = swarmsLoading || agentsLoading;
  const error = swarmsError;

  const topologyIcons: Record<string, string> = {
    mesh: "🕸️",
    hierarchical: "🌳",
    ring: "⭕",
    star: "⭐",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    initializing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    stopped: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              🐝 Swarm Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor and manage active swarms
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refetchSwarms}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + New Swarm
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricsCard
            title="Active Swarms"
            value={activeSwarms}
            icon="🐝"
          />
          <MetricsCard
            title="Total Agents"
            value={totalAgents}
            icon="🤖"
          />
          <MetricsCard
            title="Max Capacity"
            value={maxCapacity}
            icon="📊"
          />
        </div>

        {/* Swarms Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Loading swarms...
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              Note: Make sure the MCP HTTP Wrapper is running on port 8900.
              <br />
              Run: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">node mcp-server/http-wrapper.ts</code>
            </p>
          </div>
        ) : swarmsWithAgents.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <span className="text-6xl mb-4 block">🐝</span>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No Active Swarms
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create a swarm to start monitoring agents and tasks.
            </p>
            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Create Your First Swarm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {swarmsWithAgents.map((swarm) => (
              <div
                key={swarm.swarmId}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Swarm Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{topologyIcons[swarm.topology] || "🐝"}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {swarm.name || swarm.swarmId}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {swarm.topology} topology
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[swarm.status] || statusColors.stopped}`}
                  >
                    {swarm.status}
                  </span>
                </div>

                {/* Swarm Stats */}
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {swarm.activeAgents}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Active Agents
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {swarm.maxAgents || 0}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Max Capacity
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {swarm.maxAgents ? Math.round((swarm.activeAgents / swarm.maxAgents) * 100) : 0}%
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Utilization
                    </div>
                  </div>
                </div>

                {/* Swarm Objective */}
                {swarm.objective && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Objective:</span> {swarm.objective.substring(0, 100)}
                      {swarm.objective.length > 100 ? "..." : ""}
                    </p>
                  </div>
                )}

                {/* Agents List */}
                <div className="px-6 pb-6">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Agents ({swarm.agents?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {swarm.agents && swarm.agents.length > 0 ? (
                      swarm.agents.slice(0, 5).map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                agent.status === "active" || agent.status === "busy"
                                  ? "bg-green-500"
                                  : agent.status === "idle"
                                    ? "bg-yellow-500"
                                    : "bg-slate-400"
                              }`}
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {agent.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {agent.type || agent.role}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              agent.status === "active" || agent.status === "busy"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : agent.status === "idle"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {agent.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                        No agents assigned to this swarm
                      </p>
                    )}
                    {swarm.agents && swarm.agents.length > 5 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                        +{swarm.agents.length - 5} more agents
                      </p>
                    )}
                  </div>
                </div>

                {/* Swarm Actions */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                  <button className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Add Agent
                  </button>
                  <button className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto">
                    Destroy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
