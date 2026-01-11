/**
 * AgentStateCard Component
 * Displays agent state with heartbeat status (Loki Mode pattern)
 */

"use client";

import { useEffect, useState } from "react";
import { AgentState, getAgentHealth, isAgentStale } from "@/lib/state/types";

export interface AgentStateCardProps {
  agentId?: string;
  pollInterval?: number;
  showDetails?: boolean;
}

interface AgentStateWithHealth extends AgentState {
  health: "healthy" | "stale" | "failed" | "terminated";
}

export function AgentStateCard({ agentId, pollInterval = 5000, showDetails = false }: AgentStateCardProps) {
  const [agents, setAgents] = useState<AgentStateWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAgents = async () => {
      try {
        const params = agentId ? `?id=${agentId}` : "";
        const response = await fetch(`/api/agents/state${params}`);
        const result = await response.json();

        if (mounted) {
          if (result.success) {
            const agentList = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
            const agentsWithHealth = agentList.map((agent: AgentState) => ({
              ...agent,
              health: getAgentHealth(agent),
            }));
            setAgents(agentsWithHealth);
            setError(null);
          } else {
            setError(result.error || "Failed to fetch agent states");
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

    fetchAgents();

    if (pollInterval > 0) {
      const interval = setInterval(fetchAgents, pollInterval);
      return () => {
        clearInterval(interval);
        mounted = false;
      };
    }
  }, [agentId, pollInterval]);

  if (loading) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
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

  if (agents.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          No agents registered. Use Claude Code MCP tools to create agents.
        </p>
      </div>
    );
  }

  const healthColors: Record<string, string> = {
    healthy: "bg-green-500",
    stale: "bg-yellow-500",
    failed: "bg-red-500",
    terminated: "bg-slate-500",
  };

  const statusColors: Record<string, string> = {
    active: "text-green-600 dark:text-green-400",
    idle: "text-slate-600 dark:text-slate-400",
    failed: "text-red-600 dark:text-red-400",
    terminated: "text-slate-500 dark:text-slate-500",
  };

  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${healthColors[agent.health]} ${
                agent.health === "healthy" ? "animate-pulse" : ""
              }`} />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {agent.role}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {agent.id.slice(0, 12)}...
                </p>
              </div>
            </div>
            <span className={`text-xs font-medium uppercase ${statusColors[agent.status]}`}>
              {agent.status}
            </span>
          </div>

          {/* Task Info */}
          {agent.currentTask && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                Current Task:
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 truncate">
                {agent.currentTask.description}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center mb-2">
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {agent.tasksCompleted}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Done</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {agent.tasksFailed}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Failed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {agent.resourceUsage.tokensUsed.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Tokens</div>
            </div>
          </div>

          {/* Last Heartbeat */}
          <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
            <span>Last heartbeat: {new Date(agent.lastHeartbeat).toLocaleString()}</span>
            {agent.health === "stale" && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                (Stale)
              </span>
            )}
          </div>

          {/* Detailed Info */}
          {showDetails && (
            <details className="mt-3">
              <summary className="text-xs cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                View Details
              </summary>
              <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">API Calls:</span>
                  <span className="font-mono">{agent.resourceUsage.apiCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Heartbeat Interval:</span>
                  <span className="font-mono">{agent.heartbeatInterval}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Heartbeat Timeout:</span>
                  <span className="font-mono">{agent.heartbeatTimeout}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Created:</span>
                  <span className="font-mono">{new Date(agent.createdAt).toLocaleString()}</span>
                </div>
                {agent.resourceUsage.cpuPercent !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">CPU:</span>
                    <span className="font-mono">{agent.resourceUsage.cpuPercent}%</span>
                  </div>
                )}
                {agent.resourceUsage.memoryMB !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Memory:</span>
                    <span className="font-mono">{agent.resourceUsage.memoryMB} MB</span>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Compact agent badge for inline use
 */
export function AgentBadge({ agentId }: { agentId: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs">
      <AgentStateCard agentId={agentId} pollInterval={0} />
    </div>
  );
}
