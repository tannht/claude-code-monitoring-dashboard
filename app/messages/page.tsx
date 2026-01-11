/**
 * Messages Page
 * View inter-agent communication flow with filtering and visualization
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRecentMessages, useAgentStats } from "@/hooks/useSqliteData";

type MessageFilters = {
  messageType: string;
  searchQuery: string;
};

export default function MessagesPage() {
  const { data: messages, loading, error, refetch } = useRecentMessages(100);
  const { data: agents } = useAgentStats();
  const [filters, setFilters] = useState<MessageFilters>({
    messageType: "all",
    searchQuery: "",
  });

  useEffect(() => {
    document.title = "Messages - Claude Code Monitoring";
  }, []);

  // Create agent lookup map
  const agentMap = useMemo(() => {
    const map = new Map<string, string>();
    agents?.forEach((agent) => {
      map.set(agent.agentId, agent.agentName);
    });
    return map;
  }, [agents]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (filters.messageType !== "all" && msg.messageType !== filters.messageType) {
        return false;
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const fromAgent = agentMap.get(msg.fromAgentId) || msg.fromAgentId;
        const toAgent = msg.toAgentId ? agentMap.get(msg.toAgentId) || msg.toAgentId : "broadcast";
        const content = msg.content.toLowerCase();

        return (
          fromAgent.toLowerCase().includes(query) ||
          toAgent.toLowerCase().includes(query) ||
          content.includes(query)
        );
      }
      return true;
    });
  }, [messages, filters, agentMap]);

  // Get message type stats
  const messageStats = useMemo(() => {
    const stats = {
      coordination: 0,
      result: 0,
      error: 0,
      status: 0,
      total: messages.length,
    };
    messages.forEach((msg) => {
      if (msg.messageType in stats) {
        stats[msg.messageType as keyof typeof stats]++;
      }
    });
    return stats;
  }, [messages]);

  const messageTypeColors: Record<string, string> = {
    coordination: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    result: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    status: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  const messageTypeIcons: Record<string, string> = {
    coordination: "🔄",
    result: "✅",
    error: "❌",
    status: "📊",
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              💬 Agent Messages
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Inter-agent communication flow and message history
            </p>
          </div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {messageStats.total}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Messages</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {messageStats.coordination}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">🔄 Coordination</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {messageStats.result}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">✅ Results</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {messageStats.error}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">❌ Errors</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {messageStats.status}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">📊 Status</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Search Messages
              </label>
              <input
                type="text"
                placeholder="Search by content, agent name..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-64">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message Type
              </label>
              <select
                value={filters.messageType}
                onChange={(e) => setFilters({ ...filters, messageType: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="coordination">Coordination</option>
                <option value="result">Result</option>
                <option value="error">Error</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Loading messages...
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <span className="text-6xl mb-4 block">💬</span>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No Messages Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filters.searchQuery || filters.messageType !== "all"
                ? "Try adjusting your filters"
                : "Messages will appear here when agents communicate"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => {
              const fromAgent = agentMap.get(msg.fromAgentId) || msg.fromAgentId;
              const toAgent = msg.toAgentId ? agentMap.get(msg.toAgentId) || msg.toAgentId : "broadcast";

              return (
                <div
                  key={msg.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{messageTypeIcons[msg.messageType] || "💬"}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900 dark:text-white">{fromAgent}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-medium text-slate-900 dark:text-white">{toAgent}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(msg.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        messageTypeColors[msg.messageType] || messageTypeColors.status
                      }`}
                    >
                      {msg.messageType}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
