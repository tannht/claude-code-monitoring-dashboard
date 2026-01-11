/**
 * useMemoryData Hook
 * Custom hook for fetching memory and coordination data from SQLite
 */

"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api/sqlite";

export interface MemoryStats {
  name: string;
  count: number;
}

export interface CoordinationData {
  activeAgents: number;
  agents: Array<{ id: string; type: string; lastActive: string }>;
  totalCommands: number;
  successRate: number;
  coordinationEntries: number;
  performanceEntries: number;
  lastActivity: string | null;
}

export interface MemoryData {
  entries: Array<{
    key: string;
    namespace: string;
    createdAt: string;
    accessedAt: string;
    accessCount: number;
    size: number;
  }>;
  stats: MemoryStats[];
  total: number;
}

/**
 * Fetch memory entries with namespace filtering
 */
export function useMemoryData(namespace?: string, limit = 100) {
  const [data, setData] = useState<MemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (namespace) params.set("namespace", namespace);
      params.set("limit", limit.toString());

      const response = await globalThis.fetch(`${API_BASE}/memory?${params}`);
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
  }, [namespace, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Fetch coordination stats (active agents, commands, etc.)
 */
export function useCoordinationData(pollInterval = 5000) {
  const [data, setData] = useState<CoordinationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await globalThis.fetch(`${API_BASE}/coordination`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch coordination data");
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
