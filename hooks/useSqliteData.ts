/**
 * useSqliteData Hook
 * Custom hook for fetching data from SQLite databases via API routes
 * This hook fetches from server-side API routes to avoid importing better-sqlite3 in client code
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  AgentStats,
  TaskStats,
  DailyMetrics,
  PatternRecord,
  MessageRecord,
  PerformanceMetricRecord,
  TaskTrajectoryRecord,
} from "@/lib/db/schema";

// Base URL for API routes
const API_BASE = "/api/sqlite";

/**
 * Fetch agent statistics from SQLite via API
 */
export function useAgentStats() {
  const [data, setData] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await globalThis.fetch(`${API_BASE}/agents`);
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch agent stats");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agent stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Fetch task statistics from SQLite via API
 */
export function useTaskStats(days = 7) {
  const [data, setData] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await globalThis.fetch(`${API_BASE}/tasks?days=${days}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || "Failed to fetch task stats");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch task stats");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  return { data, loading, error };
}

/**
 * Fetch daily metrics from SQLite via API
 */
export function useDailyMetrics(days = 30) {
  const [data, setData] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await globalThis.fetch(`${API_BASE}/metrics?days=${days}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data || []);
          setError(null);
        } else {
          setError(result.error || "Failed to fetch daily metrics");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch daily metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  return { data, loading, error };
}

/**
 * Fetch top patterns from SQLite via API
 */
export function useTopPatterns(limit = 20) {
  const [data, setData] = useState<PatternRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await globalThis.fetch(`${API_BASE}/patterns?limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch patterns");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch patterns");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Check SQLite database health via API
 */
export function useDbHealth() {
  const [healthy, setHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await globalThis.fetch(`${API_BASE}/health`);
        const result = await response.json();

        if (result.success) {
          setHealthy(result.data?.healthy || false);
        } else {
          setHealthy(false);
        }
      } catch {
        setHealthy(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return { healthy, loading };
}

/**
 * Fetch messages from SQLite via API
 */
export function useMessages(
  fromAgentId?: string,
  toAgentId?: string,
  messageType?: string,
  limit = 100,
  recent = false
) {
  const [data, setData] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fromAgentId) params.append("fromAgentId", fromAgentId);
      if (toAgentId) params.append("toAgentId", toAgentId);
      if (messageType) params.append("messageType", messageType);
      if (limit) params.append("limit", limit.toString());
      if (recent) params.append("recent", "true");

      const response = await globalThis.fetch(`${API_BASE}/messages?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch messages");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, [fromAgentId, toAgentId, messageType, limit, recent]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Fetch recent messages from SQLite via API
 */
export function useRecentMessages(limit = 50) {
  return useMessages(undefined, undefined, undefined, limit, true);
}

/**
 * Fetch performance metrics from SQLite via API
 */
export function usePerformanceMetrics(agentId?: string, metricName?: string, hours = 24) {
  const [data, setData] = useState<PerformanceMetricRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (agentId) params.append("agentId", agentId);
      if (metricName) params.append("metricName", metricName);
      params.append("hours", hours.toString());

      const response = await globalThis.fetch(`${API_BASE}/performance-metrics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch performance metrics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch performance metrics");
    } finally {
      setLoading(false);
    }
  }, [agentId, metricName, hours]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Fetch task trajectories from SQLite via API
 */
export function useTaskTrajectories(taskId?: string, limit = 50) {
  const [data, setData] = useState<TaskTrajectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (taskId) params.append("taskId", taskId);
      if (limit) params.append("limit", limit.toString());

      const response = await globalThis.fetch(`${API_BASE}/trajectories?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch task trajectories");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch task trajectories");
    } finally {
      setLoading(false);
    }
  }, [taskId, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
