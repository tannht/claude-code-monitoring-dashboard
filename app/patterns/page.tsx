/**
 * Patterns Page
 * View discovered patterns with confidence scores and usage frequency
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useTopPatterns } from "@/hooks/useSqliteData";

type PatternFilters = {
  type: string;
  minConfidence: number;
  searchQuery: string;
  sortBy: "confidence" | "usage" | "recent";
};

export default function PatternsPage() {
  const { data: patterns, loading, error, refetch } = useTopPatterns(100);
  const [filters, setFilters] = useState<PatternFilters>({
    type: "all",
    minConfidence: 0,
    searchQuery: "",
    sortBy: "confidence",
  });

  useEffect(() => {
    document.title = "Patterns - Claude Code Monitoring";
  }, []);

  // Get unique pattern types
  const patternTypes = useMemo(() => {
    const types = new Set<string>();
    patterns.forEach((p) => types.add(p.type));
    return Array.from(types).sort();
  }, [patterns]);

  // Parse pattern data
  const parsedPatterns = useMemo(() => {
    return patterns.map((p) => ({
      ...p,
      data: typeof p.pattern_data === "string" ? JSON.parse(p.pattern_data) : p.pattern_data,
    }));
  }, [patterns]);

  // Filter and sort patterns
  const filteredPatterns = useMemo(() => {
    let result = parsedPatterns.filter((p) => {
      if (filters.type !== "all" && p.type !== filters.type) {
        return false;
      }
      if (p.confidence < filters.minConfidence) {
        return false;
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const typeMatch = p.type.toLowerCase().includes(query);
        const dataStr = JSON.stringify(p.data).toLowerCase();
        return typeMatch || dataStr.includes(query);
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "confidence":
          return b.confidence - a.confidence;
        case "usage":
          return b.usage_count - a.usage_count;
        case "recent":
          return new Date(b.last_used || b.created_at).getTime() - new Date(a.last_used || a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [parsedPatterns, filters]);

  // Calculate stats
  const patternStats = useMemo(() => {
    const totalPatterns = patterns.length;
    const avgConfidence =
      totalPatterns > 0 ? patterns.reduce((sum, p) => sum + p.confidence, 0) / totalPatterns : 0;
    const highConfidence = patterns.filter((p) => p.confidence >= 0.8).length;
    const totalUsage = patterns.reduce((sum, p) => sum + p.usage_count, 0);

    return { totalPatterns, avgConfidence, highConfidence, totalUsage };
  }, [patterns]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (confidence >= 0.4) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    if (confidence >= 0.4) return "Low";
    return "Very Low";
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              🔮 Pattern Discovery
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Discovered patterns with confidence scores and usage metrics
            </p>
          </div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {patternStats.totalPatterns}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Patterns</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {(patternStats.avgConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Avg Confidence</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {patternStats.highConfidence}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">High Confidence</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {patternStats.totalUsage}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Usage</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pattern Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {patternTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Min Confidence
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minConfidence * 100}
                onChange={(e) => setFilters({ ...filters, minConfidence: Number(e.target.value) / 100 })}
                className="w-full"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {(filters.minConfidence * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search patterns..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as PatternFilters["sortBy"] })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="confidence">Confidence</option>
                <option value="usage">Usage Count</option>
                <option value="recent">Recently Used</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patterns Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Loading patterns...
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : filteredPatterns.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <span className="text-6xl mb-4 block">🔮</span>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No Patterns Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filters.type !== "all" || filters.minConfidence > 0 || filters.searchQuery
                ? "Try adjusting your filters"
                : "Patterns will be discovered as the system learns from tasks"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {pattern.type}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                      Pattern #{pattern.id.slice(0, 8)}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${getConfidenceColor(pattern.confidence)}`}
                  >
                    {getConfidenceLabel(pattern.confidence)}
                  </span>
                </div>

                {/* Confidence Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Confidence</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {(pattern.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${pattern.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Pattern Data */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {JSON.stringify(pattern.data, null, 2)}
                  </pre>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="text-slate-600 dark:text-slate-400">
                    Used <span className="font-semibold text-slate-900 dark:text-white">{pattern.usage_count}</span> times
                  </div>
                  <div className="text-slate-500 dark:text-slate-500">
                    {pattern.last_used
                      ? `Last: ${new Date(pattern.last_used).toLocaleDateString()}`
                      : `Created: ${new Date(pattern.created_at).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
