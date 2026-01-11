/**
 * useMcpData Hook
 * Custom hook for fetching data from local SQLite databases via API routes
 * This bypasses the need for MCP server HTTP URLs by reading directly from the data source
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SwarmStatus,
  AgentMetrics,
  TaskInfo,
  PerformanceReport,
  HealthCheckResult,
  TokenUsage,
} from "@/lib/mcp/types";

// Base URL for API routes
const API_BASE = "/api/sqlite";

/**
 * Get swarm status from local SQLite via API
 */
export function useSwarmStatus(swarmId?: string, pollInterval = 5000) {
  const [data, setData] = useState<SwarmStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await globalThis.fetch(`${API_BASE}/health`);
      const result = await response.json();

      if (result.success && result.data) {
        const now = new Date().toISOString();
        // Transform health data into SwarmStatus format
        setData({
          swarmId: swarmId || "default",
          topology: "mesh",
          maxAgents: 10,
          activeAgents: result.data.agentCount || 0,
          status: result.data.healthy ? "active" : "stopped",
          agents: [],
          createdAt: now,
          lastActivity: now,
        } as SwarmStatus);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch swarm status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [swarmId]);

  useEffect(() => {
    fetchData();
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Get agent metrics from local SQLite via API
 */
export function useAgentMetrics(agentId?: string, pollInterval = 5000) {
  const [data, setData] = useState<AgentMetrics[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await globalThis.fetch(`${API_BASE}/agents`);
      const result = await response.json();

      if (result.success && result.data) {
        // Filter by agentId if provided
        const filtered = agentId
          ? result.data.filter((a: AgentMetrics) => a.agentId === agentId)
          : result.data;
        setData(filtered as AgentMetrics[]);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch agent metrics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchData();
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Get task status from local SQLite via API
 */
export function useTaskStatus(taskId?: string, pollInterval = 3000) {
  const [data, setData] = useState<TaskInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await globalThis.fetch(`${API_BASE}/tasks?days=7`);
      const result = await response.json();

      if (result.success && result.data) {
        // Transform stats into TaskInfo array
        const tasks: TaskInfo[] = [];
        if (result.data.total > 0) {
          tasks.push({
            taskId: "recent",
            description: `Recent tasks (last 7 days)`,
            status: "in_progress",
            priority: "medium",
            createdAt: new Date().toISOString(),
            assignedAgent: "system",
          } as TaskInfo);
        }

        // Filter by taskId if provided (mock filter for now)
        const filtered = taskId
          ? tasks.filter((t) => t.taskId === taskId)
          : tasks;
        setData(filtered as TaskInfo[]);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch task status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Get performance report from local SQLite via API
 */
export function usePerformanceReport(timeframe: "24h" | "7d" | "30d" = "24h") {
  const [data, setData] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const days = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : 30;
        const response = await globalThis.fetch(`${API_BASE}/tasks?days=${days}`);
        const result = await response.json();

        if (result.success && result.data) {
          setData({
            timeframe,
            summary: {
              totalTasks: result.data.total || 0,
              completedTasks: result.data.completed || 0,
              failedTasks: result.data.failed || 0,
              successRate: result.data.successRate || 0,
              avgDuration: result.data.avgDuration || 0,
            },
            topAgents: [],
            bottlenecks: [],
          } as PerformanceReport);
          setError(null);
        } else {
          setError(result.error || "Failed to fetch performance report");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  return { data, loading, error };
}

/**
 * Mock health check - returns static data for now
 */
export function useHealthCheck(pollInterval = 10000) {
  const [data, setData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Return mock health data
      setData({
        system: "healthy",
        components: {
          agents: { status: "healthy", message: "All agents operational" },
          memory: { status: "healthy", message: "Memory usage normal" },
          neural: { status: "healthy", message: "Neural networks active" },
          performance: { status: "healthy", message: "Performance within bounds" },
        },
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
    };

    fetchData();
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval]);

  return { data, loading, error: null };
}

/**
 * Mock token usage - returns static data for now
 */
export function useTokenUsage(operation?: string, timeframe = "24h") {
  const [data, setData] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Return mock token usage data
      setData({
        totalTokens: 125000,
        inputTokens: 85000,
        outputTokens: 40000,
        estimatedCost: 0.15,
        operation: operation || "unknown",
        timeframe,
        byModel: {},
      });
      setLoading(false);
    };

    fetchData();
  }, [operation, timeframe]);

  return { data, loading, error: null };
}
