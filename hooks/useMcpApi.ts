/**
 * useMcpApi Hook
 * Fetch real data from MCP HTTP Wrapper (port 8900)
 * Connects to pay-per-post SQLite databases
 */

"use client";

import { useState, useEffect, useCallback } from "react";

const MCP_API_BASE = "http://localhost:8900/api";

// Memory namespace breakdown
export interface MemoryNamespace {
  name: string;
  count: number;
  percentage: number;
}

// Overview data structure
export interface OverviewData {
  swarms: {
    total: number;
    active: number;
    items: Array<{
      swarmId: string;
      name: string;
      objective: string;
      status: string;
      topology: string;
      maxAgents: number;
      activeAgents: number;
      createdAt: string;
      lastActivity: string;
    }>;
  };
  agents: {
    total: number;
    active: number;
    items: Array<{
      id: string;
      name: string;
      type: string;
      role: string;
      status: string;
      swarmId: string | null;
      capabilities: string[];
    }>;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
    items: Array<{
      taskId: string;
      description: string;
      status: string;
      priority: string;
      createdAt: string;
    }>;
  };
  memory: {
    total: number;
    byNamespace: Record<string, number>;
  };
}

// Memory entries detail
export interface MemoryEntry {
  id: number;
  key: string;
  value: unknown;
  namespace: string;
  accessCount: number;
  createdAt: string;
  accessedAt: string;
}

/**
 * Fetch overview data from MCP API
 */
export function useMcpOverview(pollInterval = 5000) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${MCP_API_BASE}/overview`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch overview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

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
 * Fetch memory data with namespace breakdown
 */
export function useMcpMemory(pollInterval = 10000) {
  const [data, setData] = useState<{
    entries: MemoryEntry[];
    stats: { total: number; byNamespace: Record<string, number> };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${MCP_API_BASE}/memory?limit=50`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch memory data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

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
 * Fetch swarms data
 */
export function useMcpSwarms(pollInterval = 5000) {
  const [data, setData] = useState<OverviewData["swarms"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${MCP_API_BASE}/swarms`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        const items = Array.isArray(result.data) ? result.data : [];
        setData({
          total: items.length,
          active: items.filter((s: any) => s.status === "active").length,
          items,
        });
        setError(null);
      } else {
        setError(result.error || "Failed to fetch swarms");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

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
 * Fetch agents data
 */
export function useMcpAgents(pollInterval = 5000) {
  const [data, setData] = useState<OverviewData["agents"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${MCP_API_BASE}/agents`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        const items = Array.isArray(result.data) ? result.data : [];
        setData({
          total: items.length,
          active: items.filter((a: any) => a.status === "active").length,
          items,
        });
        setError(null);
      } else {
        setError(result.error || "Failed to fetch agents");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

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
 * Fetch tasks data
 */
export function useMcpTasks(pollInterval = 3000) {
  const [data, setData] = useState<OverviewData["tasks"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${MCP_API_BASE}/tasks`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        const items = Array.isArray(result.data) ? result.data : [];
        setData({
          total: items.length,
          completed: items.filter((t: any) => t.status === "completed").length,
          inProgress: items.filter((t: any) => t.status === "in_progress").length,
          pending: items.filter((t: any) => t.status === "pending").length,
          failed: items.filter((t: any) => t.status === "failed").length,
          items,
        });
        setError(null);
      } else {
        setError(result.error || "Failed to fetch tasks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

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
 * Fetch messages data
 */
export function useMcpMessages(pollInterval = 5000) {
  const [data, setData] = useState<{
    messages: Array<{
      id: string;
      swarmId: string;
      senderId: string;
      receiverId: string;
      messageType: string;
      timestamp: string;
    }>;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${MCP_API_BASE}/messages?limit=100`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch messages");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

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
 * Fetch performance metrics
 */
export function useMcpMetrics(timeframe: "24h" | "7d" | "30d" = "24h", pollInterval = 10000) {
  const [data, setData] = useState<Array<{
    metricName: string;
    value: number;
    metadata: Record<string, unknown>;
    timestamp: string;
  }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${MCP_API_BASE}/metrics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        setData(Array.isArray(result.data) ? result.data : []);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch metrics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchData();
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  return { data, loading, error, refetch: fetchData };
}
