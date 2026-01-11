/**
 * Home Page - Dashboard Overview
 * Main landing page with real data from MCP API (port 8900)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MetricsCard } from "@/components/ui";
import { MemoryNamespaceBreakdown, SwarmOverview } from "@/components/monitoring";
import { useMcpOverview, useMcpMemory } from "@/hooks/useMcpApi";
import { StatusBar } from "@/components/monitoring";

export default function HomePage() {
  const { data: overviewData, loading: overviewLoading } = useMcpOverview(5000);
  const { data: memoryData, loading: memoryLoading } = useMcpMemory(10000);

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

  const activeAgents = overviewData?.agents?.active || overviewData?.agents?.total || 0;
  const totalTasks = overviewData?.tasks?.total || 0;
  const completedTasks = overviewData?.tasks?.completed || 0;
  const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalMemoryEntries = memoryData?.stats?.total || overviewData?.memory?.total || 0;

  const navItems = [
    { href: "/status", icon: "🔴", label: "Status", desc: "System monitoring status" },
    { href: "/agents", icon: "👥", label: "Agents", desc: "Monitor agent performance" },
    { href: "/queries", icon: "📊", label: "Queries", desc: "Kanban query board" },
    { href: "/swarms", icon: "🐝", label: "Swarms", desc: "View swarm status" },
    { href: "/tasks", icon: "📋", label: "Tasks", desc: "Track task progress" },
    { href: "/metrics", icon: "📈", label: "Metrics", desc: "Performance analytics" },
    { href: "/settings", icon: "⚙️", label: "Settings", desc: "Alert configuration" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Dark Mode Toggle */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              📊 Claude Code Monitoring
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time monitoring for Claude Code agents, swarms, and tasks
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </header>

        {/* Real-Time Status Bar */}
        <div className="mb-8">
          <StatusBar pollInterval={5000} />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            title="Active Agents"
            value={activeAgents}
            icon="⚡"
          />
          <MetricsCard
            title="Total Tasks"
            value={totalTasks}
            icon="📋"
          />
          <MetricsCard
            title="Completed"
            value={completedTasks}
            icon="✅"
          />
          <MetricsCard
            title="Memory Entries"
            value={totalMemoryEntries.toLocaleString()}
            icon="🧠"
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricsCard
            title="Success Rate"
            value={`${successRate.toFixed(1)}%`}
            icon="📈"
            changeType={successRate >= 90 ? "positive" : successRate >= 70 ? "neutral" : "negative"}
          />
          <MetricsCard
            title="Total Swarms"
            value={overviewData?.swarms?.total || 0}
            icon="🐝"
          />
          <MetricsCard
            title="In Progress"
            value={overviewData?.tasks?.inProgress || 0}
            icon="🔄"
          />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
            This dashboard displays real data from your local MCP server:
          </p>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1 text-sm">
            <li><strong>Memory Entries</strong>: {totalMemoryEntries.toLocaleString()} records from <code>.swarm/memory.db</code></li>
            <li><strong>Swarms</strong>: {overviewData?.swarms?.total || 0} swarms from <code>.hive-mind/hive.db</code></li>
            <li><strong>Agents</strong>: {overviewData?.agents?.total || 0} agents from <code>.hive-mind/hive.db</code></li>
            <li><strong>Tasks</strong>: {overviewData?.tasks?.total || 0} tasks from <code>.hive-mind/hive.db</code></li>
          </ul>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
            💡 Tip: Use Claude Code with MCP tools (claude-flow, ruv-swarm) to populate swarms/agents/tasks data
          </p>
        </div>
      </div>
    </main>
  );
}
