/**
 * Home Page - Dashboard Overview
 * Comprehensive landing page with real-time monitoring
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MetricsCard } from "@/components/ui";
import {
  MemoryNamespaceBreakdown,
  SwarmOverview,
  AlertsFeed,
  StatusBar,
} from "@/components/monitoring";
import { MobileNav } from "@/components/layout";
import { useMcpOverview, useMcpMemory } from "@/hooks/useMcpApi";
import { useAgentStats, useRecentMessages, useTaskStats } from "@/hooks/useSqliteData";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

const navItems = [
  { href: "/status", icon: "🔴", label: "Status", desc: "System monitoring status" },
  { href: "/agents", icon: "👥", label: "Agents", desc: "Monitor agent performance" },
  { href: "/queries", icon: "📊", label: "Queries", desc: "Kanban query board" },
  { href: "/swarms", icon: "🐝", label: "Swarms", desc: "View swarm status" },
  { href: "/tasks", icon: "📋", label: "Tasks", desc: "Track task progress" },
  { href: "/metrics", icon: "📈", label: "Metrics", desc: "Performance analytics" },
  { href: "/messages", icon: "💬", label: "Messages", desc: "Agent communication" },
  { href: "/patterns", icon: "🔮", label: "Patterns", desc: "Discovered patterns" },
  { href: "/settings", icon: "⚙️", label: "Settings", desc: "Alert configuration" },
];

export default function HomePage() {
  // MCP data
  const { data: overviewData, loading: overviewLoading } = useMcpOverview(5000);
  const { data: memoryData } = useMcpMemory(10000);

  // SQLite data
  const { data: agents } = useAgentStats();
  const { data: messages } = useRecentMessages(10);
  const { data: taskStats } = useTaskStats(7);

  // Real-time updates
  const { events, connected } = useRealTimeUpdates({ enabled: true });

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.title = "Claude Code Monitoring Dashboard";
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Calculate metrics from SQLite data
  const activeAgents = useMemo(() => {
    return agents?.filter((a) => a.status === "active" || a.status === "busy" || a.status === "running").length || 0;
  }, [agents]);

  const totalAgents = agents?.length || 0;
  const totalTasks = taskStats?.total || 0;
  const completedTasks = taskStats?.completed || 0;
  const pendingTasks = taskStats?.pending || 0;
  const inProgressTasks = taskStats?.inProgress || 0;
  const failedTasks = taskStats?.failed || 0;
  const successRate = taskStats?.successRate || 0;
  const avgDuration = taskStats?.avgDuration || 0;

  const totalMemoryEntries = memoryData?.stats?.total || 0;

  // Agent status breakdown
  const agentStatusBreakdown = useMemo(() => {
    if (!agents) return null;
    const breakdown = {
      active: 0,
      idle: 0,
      busy: 0,
      offline: 0,
      pending: 0,
      running: 0,
    };
    agents.forEach((a) => {
      const status = a.status as keyof typeof breakdown;
      if (status in breakdown) {
        breakdown[status]++;
      }
    });
    return breakdown;
  }, [agents]);

  // Recent activity from messages
  const recentActivity = useMemo(() => {
    return messages?.slice(0, 5).map((msg) => ({
      id: msg.id,
      type: msg.messageType,
      from: msg.fromAgentId,
      to: msg.toAgentId || "broadcast",
      timestamp: msg.timestamp,
      content: msg.content.slice(0, 100) + (msg.content.length > 100 ? "..." : ""),
    })) || [];
  }, [messages]);

  return (
    <>
      <MobileNav items={navItems} />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {/* Header with Dark Mode Toggle */}
          <header className="mb-6 lg:mb-8 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                📊 Claude Code Monitoring
              </h1>
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400">
                Real-time monitoring for agents, swarms, and tasks
              </p>
              <div className="flex items-center gap-2 mt-2">
                {connected ? (
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <span className="w-2 h-2 bg-slate-400 rounded-full" />
                    Polling
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-3 lg:p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle dark mode"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
        </header>

        {/* Real-Time Status Bar */}
        <div className="mb-8">
          <StatusBar pollInterval={5000} />
        </div>

        {/* Primary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricsCard title="Active Agents" value={activeAgents} icon="⚡" />
          <MetricsCard title="Total Tasks" value={totalTasks} icon="📋" />
          <MetricsCard title="Completed" value={completedTasks} icon="✅" />
          <MetricsCard title="Memory Entries" value={totalMemoryEntries.toLocaleString()} icon="🧠" />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            title="Success Rate"
            value={`${successRate.toFixed(1)}%`}
            icon="📈"
            changeType={successRate >= 90 ? "positive" : successRate >= 70 ? "neutral" : "negative"}
          />
          <MetricsCard title="Pending" value={pendingTasks} icon="⏳" />
          <MetricsCard title="In Progress" value={inProgressTasks} icon="🔄" />
          <MetricsCard title="Failed" value={failedTasks} icon="❌" changeType="negative" />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Alerts & Activity */}
          <div className="space-y-8">
            {/* Real-Time Alerts Feed */}
            <div>
              <AlertsFeed maxItems={5} autoScroll={false} showTimestamp={true} />
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                📡 Recent Activity
              </h2>
              {recentActivity.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-xl">
                        {activity.type === "coordination" ? "🔄" :
                         activity.type === "result" ? "✅" :
                         activity.type === "error" ? "❌" : "📊"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white">
                          <span className="font-medium">{activity.from}</span>
                          {" → "}
                          <span className="font-medium">{activity.to}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Agent Status & Swarm Overview */}
          <div className="space-y-8">
            {/* Agent Status Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                👥 Agent Status ({totalAgents} total)
              </h2>
              {agentStatusBreakdown ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{agentStatusBreakdown.active}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Active</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{agentStatusBreakdown.idle}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Idle</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{agentStatusBreakdown.busy}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Busy</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{agentStatusBreakdown.running}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Running</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{agentStatusBreakdown.offline}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Offline</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{agentStatusBreakdown.pending}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Pending</div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Loading agent status...</p>
              )}
            </div>

            {/* Performance Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                ⚡ Performance
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Avg Task Duration</span>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {avgDuration.toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Success Rate</span>
                  <span className={`text-lg font-semibold ${
                    successRate >= 90 ? "text-green-600 dark:text-green-400" :
                    successRate >= 70 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400"
                  }`}>
                    {successRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Namespace Breakdown */}
        {memoryData?.stats && (
          <div className="mb-8">
            <MemoryNamespaceBreakdown
              byNamespace={memoryData.stats.byNamespace}
              total={memoryData.stats.total}
            />
          </div>
        )}

        {/* Swarm Overview */}
        <div className="mb-8">
          <SwarmOverview
            swarms={overviewData?.swarms || null}
            agents={overviewData?.agents || null}
            tasks={overviewData?.tasks || null}
            loading={overviewLoading}
          />
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            >
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                {item.label}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Data Source Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 Data Source
          </h2>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            This dashboard displays real data from your local MCP server and SQLite databases:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">SQLite Databases</h3>
              <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1 text-sm">
                <li><code>.hive-mind/hive.db</code>: Swarms, Agents, Tasks, Messages, Performance Metrics</li>
                <li><code>.swarm/memory.db</code>: Patterns, Trajectories, Memory Entries</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Real-Time Updates</h3>
              <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1 text-sm">
                <li>SSE (Server-Sent Events) when available</li>
                <li>Fallback to 5-second polling</li>
                <li>Live connection status indicator</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
