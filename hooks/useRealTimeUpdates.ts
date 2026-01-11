/**
 * useRealTimeUpdates Hook
 * Handles WebSocket/SSE connections for real-time monitoring updates
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { mcpClient } from "@/lib/mcp/client";
import type { RealTimeEvent } from "@/lib/mcp/types";

export interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  swarmId?: string;
  onEvent?: (event: RealTimeEvent) => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
}

export interface RealTimeState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  events: RealTimeEvent[];
  lastEvent: RealTimeEvent | null;
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const {
    enabled = true,
    swarmId,
    onEvent,
    onError,
    reconnectInterval = 5000,
  } = options;

  const [state, setState] = useState<RealTimeState>({
    connected: false,
    connecting: false,
    error: null,
    events: [],
    lastEvent: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Add new event to state
  const addEvent = useCallback((event: RealTimeEvent) => {
    setState((prev) => ({
      ...prev,
      events: [event, ...prev.events].slice(0, 100), // Keep last 100 events
      lastEvent: event,
    }));
    onEvent?.(event);
  }, [onEvent]);

  // Fallback polling mechanism
  const startPolling = useCallback(async () => {
    if (!enabled) return;

    clearTimers();

    const poll = async () => {
      try {
        const response = await mcpClient.getTaskStatus();
        if (response.success && response.data) {
          const tasks = response.data as unknown[];
          tasks.forEach((task: unknown) => {
            const taskInfo = task as {
              taskId?: string;
              description?: string;
              status?: string;
              assignedAgent?: string;
              priority?: string;
              createdAt?: string;
              startedAt?: string;
              completedAt?: string;
              duration?: number;
              error?: string;
            };
            if (taskInfo.taskId && taskInfo.taskId !== lastEventIdRef.current) {
              lastEventIdRef.current = taskInfo.taskId;
              addEvent({
                taskId: taskInfo.taskId,
                description: taskInfo.description,
                status: taskInfo.status as "pending" | "in_progress" | "completed" | "failed",
                assignedAgent: taskInfo.assignedAgent,
                priority: taskInfo.priority as "low" | "medium" | "high" | "critical",
                createdAt: taskInfo.createdAt,
                startedAt: taskInfo.startedAt,
                completedAt: taskInfo.completedAt,
                duration: taskInfo.duration,
                error: taskInfo.error,
                timestamp: taskInfo.createdAt || new Date().toISOString(),
                type: taskInfo.status === "completed" ? "task_completed" :
                      taskInfo.status === "failed" ? "task_failed" :
                      taskInfo.status === "in_progress" ? "task_started" :
                      "task_update",
              } as RealTimeEvent);
            }
          });
        }
        setState((prev) => ({ ...prev, connected: true, error: null }));
      } catch (err) {
        const error = err instanceof Error ? err.message : "Polling failed";
        setState((prev) => ({ ...prev, connected: false, error }));
        onError?.(new Error(error));
      }
    };

    // Initial poll
    await poll();
    // Set up interval
    pollingIntervalRef.current = setInterval(poll, 3000);
  }, [enabled, addEvent, onError, clearTimers]);

  // SSE connection
  const connectSSE = useCallback(async () => {
    if (!enabled || eventSourceRef.current) return;

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      // Try to use swarm_monitor for real-time updates
      const mcpUrl = process.env.MCP_CLAUDE_FLOW_URL || "http://localhost:3000/mcp/claude-flow";

      // Create EventSource for SSE
      const eventSource = new EventSource(`${mcpUrl}/stream?swarmId=${swarmId || "default"}`);

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setState((prev) => ({ ...prev, connected: true, connecting: false, error: null }));
        clearTimers(); // Stop polling if SSE connects
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealTimeEvent;
          addEvent({
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        } catch (err) {
          console.error("Failed to parse SSE event:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE error:", err);
        eventSource.close();
        eventSourceRef.current = null;

        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: "SSE connection failed, falling back to polling",
        }));

        // Fallback to polling
        startPolling();
      };

      // Set up reconnect timeout
      reconnectTimeoutRef.current = setTimeout(() => {
        if (eventSource.readyState === EventSource.CONNECTING) {
          eventSource.close();
          eventSourceRef.current = null;
          startPolling();
        }
      }, 10000); // 10 second timeout for SSE connection

    } catch (err) {
      const error = err instanceof Error ? err.message : "SSE connection failed";
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
        error,
      }));
      onError?.(new Error(error));

      // Fallback to polling
      startPolling();
    }
  }, [enabled, swarmId, addEvent, onError, startPolling, clearTimers]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    clearTimers();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    connectSSE();
  }, [clearTimers, connectSSE]);

  // Clear events
  const clearEvents = useCallback(() => {
    setState((prev) => ({ ...prev, events: [], lastEvent: null }));
  }, []);

  // Connect on mount
  useEffect(() => {
    connectSSE();

    return () => {
      clearTimers();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connectSSE, clearTimers]);

  return {
    ...state,
    reconnect,
    clearEvents,
  };
}

/**
 * Hook for subscribing to swarm-specific updates
 */
export function useSwarmUpdates(swarmId?: string, enabled = true) {
  return useRealTimeUpdates({
    enabled,
    swarmId,
    onEvent: (event) => {
      console.log("Swarm event:", event);
    },
  });
}

/**
 * Hook for task status updates
 */
export function useTaskUpdates(enabled = true) {
  const [taskUpdates, setTaskUpdates] = useState<Map<string, RealTimeEvent>>(new Map());

  return useRealTimeUpdates({
    enabled,
    onEvent: (event) => {
      if (event.type === "task_update" || event.taskId) {
        const taskId = event.taskId || event.timestamp || "unknown";
        setTaskUpdates((prev) => new Map(prev).set(taskId, event));
      }
    },
  });
}
