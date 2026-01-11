/**
 * RealTimeFeed Component
 * Displays live event stream for real-time monitoring
 */

"use client";

import { useEffect, useRef } from "react";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import type { RealTimeEvent } from "@/lib/mcp/types";

export interface RealTimeFeedProps {
  enabled?: boolean;
  swarmId?: string;
  maxEvents?: number;
  showConnectionStatus?: boolean;
}

export function RealTimeFeed({
  enabled = true,
  swarmId,
  maxEvents = 50,
  showConnectionStatus = true,
}: RealTimeFeedProps) {
  const { connected, connecting, error, events, reconnect, clearEvents } = useRealTimeUpdates({
    enabled,
    swarmId,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const displayedEvents = events.slice(0, maxEvents);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (scrollRef.current && events.length > 0) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const getEventIcon = (event: RealTimeEvent): string => {
    switch (event.type) {
      case "task_started":
        return "🔄";
      case "task_completed":
        return "✅";
      case "task_failed":
        return "❌";
      case "agent_spawned":
        return "🤖";
      case "agent_terminated":
        return "👋";
      case "swarm_initialized":
        return "🐝";
      case "error":
        return "⚠️";
      default:
        return "📡";
    }
  };

  const getEventColor = (event: RealTimeEvent): string => {
    switch (event.type) {
      case "task_completed":
        return "text-green-600 dark:text-green-400";
      case "task_failed":
      case "error":
        return "text-red-600 dark:text-red-400";
      case "task_started":
        return "text-blue-600 dark:text-blue-400";
      case "agent_spawned":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour12: false });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <h3 className="font-semibold text-slate-900 dark:text-white">Live Event Feed</h3>
        </div>

        {showConnectionStatus && (
          <div className="flex items-center gap-2">
            <ConnectionBadge connected={connected} connecting={connecting} error={error} />
            <button
              onClick={reconnect}
              className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              🔄 Reconnect
            </button>
            <button
              onClick={clearEvents}
              className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              🗑️ Clear
            </button>
          </div>
        )}
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        className="h-96 overflow-y-auto p-4 space-y-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <span className="text-4xl mb-2">📭</span>
            <p className="text-sm">No events yet. Waiting for updates...</p>
            {!enabled && (
              <p className="text-xs mt-1">Real-time updates are disabled.</p>
            )}
            {connecting && (
              <p className="text-xs mt-1">Connecting to event stream...</p>
            )}
            {error && (
              <p className="text-xs mt-1 text-red-500">Using polling fallback</p>
            )}
          </div>
        ) : (
          displayedEvents.map((event, index) => (
            <EventItem
              key={event.taskId || event.timestamp || index}
              event={event}
              icon={getEventIcon(event)}
              colorClass={getEventColor(event)}
              timestamp={formatTimestamp(event.timestamp)}
            />
          ))
        )}
      </div>

      {/* Footer with event count */}
      {displayedEvents.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {displayedEvents.length} of {events.length} events
          </p>
        </div>
      )}
    </div>
  );
}

function ConnectionBadge({
  connected,
  connecting,
  error,
}: {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}) {
  if (connecting) {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full">
        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        Connecting...
      </span>
    );
  }

  if (error) {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        Polling
      </span>
    );
  }

  if (connected) {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        Live
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      Disconnected
    </span>
  );
}

function EventItem({
  event,
  icon,
  colorClass,
  timestamp,
}: {
  event: RealTimeEvent;
  icon: string;
  colorClass: string;
  timestamp: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${colorClass} truncate`}>
          {event.description || event.type || "Unknown event"}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
          {event.taskId && (
            <span className="font-mono">ID: {event.taskId.slice(0, 8)}...</span>
          )}
          {event.assignedAgent && (
            <span>Agent: {event.assignedAgent}</span>
          )}
          {event.duration && (
            <span>{(event.duration / 1000).toFixed(1)}s</span>
          )}
          <span>{timestamp}</span>
        </div>
        {event.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate">
            Error: {event.error}
          </p>
        )}
      </div>
      {event.priority && (
        <PriorityBadge priority={event.priority} />
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
  };

  const priorityValue = priority || "low";

  return (
    <span
      className={`text-xs px-2 py-1 rounded font-medium ${
        colors[priorityValue]
      }`}
    >
      {priorityValue.toUpperCase()}
    </span>
  );
}
