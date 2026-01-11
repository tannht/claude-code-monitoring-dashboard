/**
 * Query Tracker
 * Manages query lifecycle for Kanban board
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { QueryTask, QueryStatus, QueryBoardState, QueryFilterOptions, QueryStats } from "./types";

const STATE_DIR = ".claude-monitor";
const STATE_FILE = "queries.json";

/**
 * Query Tracker Class
 */
export class QueryTracker {
  private statePath: string;
  private state: QueryBoardState;

  constructor() {
    this.statePath = join(process.cwd(), STATE_DIR, STATE_FILE);
    this.state = this.load();
  }

  private ensureDir(): void {
    const dir = join(process.cwd(), STATE_DIR);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private load(): QueryBoardState {
    this.ensureDir();

    if (existsSync(this.statePath)) {
      try {
        const content = readFileSync(this.statePath, "utf-8");
        return JSON.parse(content);
      } catch (error) {
        console.error("Failed to load query state:", error);
      }
    }

    return {
      queries: [],
      lastUpdate: new Date().toISOString(),
      version: 1,
    };
  }

  private save(): void {
    this.ensureDir();
    this.state.lastUpdate = new Date().toISOString();
    writeFileSync(this.statePath, JSON.stringify(this.state, null, 2), "utf-8");
  }

  /**
   * Get all queries
   */
  getAllQueries(): QueryTask[] {
    return [...this.state.queries];
  }

  /**
   * Get queries by status
   */
  getQueriesByStatus(status: QueryStatus): QueryTask[] {
    return this.state.queries.filter(q => q.status === status);
  }

  /**
   * Get a specific query
   */
  getQuery(id: string): QueryTask | null {
    return this.state.queries.find(q => q.id === id) || null;
  }

  /**
   * Create a new query
   */
  createQuery(
    title: string,
    options: Partial<QueryTask> = {}
  ): QueryTask {
    const query: QueryTask = {
      id: options.id || `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: options.description,
      status: options.status || "pending",
      priority: options.priority || "medium",
      createdAt: new Date().toISOString(),
      tags: options.tags || [],
      agentId: options.agentId,
      metadata: options.metadata || {},
    };

    this.state.queries.push(query);
    this.save();
    return query;
  }

  /**
   * Update query status
   */
  updateStatus(id: string, status: QueryStatus): QueryTask | null {
    const query = this.state.queries.find(q => q.id === id);
    if (!query) return null;

    query.status = status;

    const now = new Date().toISOString();
    if (status === "running" && !query.startedAt) {
      query.startedAt = now;
    } else if (status === "completed") {
      query.completedAt = now;
      if (query.startedAt) {
        query.duration = Date.now() - new Date(query.startedAt).getTime();
      }
    } else if (status === "failed") {
      query.failedAt = now;
      if (query.startedAt) {
        query.duration = Date.now() - new Date(query.startedAt).getTime();
      }
    }

    this.save();
    return query;
  }

  /**
   * Record query failure
   */
  recordFailure(id: string, error: string): QueryTask | null {
    const query = this.state.queries.find(q => q.id === id);
    if (!query) return null;

    query.status = "failed";
    query.error = error;
    query.failedAt = new Date().toISOString();
    if (query.startedAt) {
      query.duration = Date.now() - new Date(query.startedAt).getTime();
    }

    this.save();
    return query;
  }

  /**
   * Update query metadata
   */
  updateQuery(id: string, updates: Partial<QueryTask>): QueryTask | null {
    const index = this.state.queries.findIndex(q => q.id === id);
    if (index === -1) return null;

    this.state.queries[index] = {
      ...this.state.queries[index],
      ...updates,
      id: this.state.queries[index].id, // Preserve ID
      createdAt: this.state.queries[index].createdAt, // Preserve created date
    };

    this.save();
    return this.state.queries[index];
  }

  /**
   * Delete a query
   */
  deleteQuery(id: string): boolean {
    const index = this.state.queries.findIndex(q => q.id === id);
    if (index === -1) return false;

    this.state.queries.splice(index, 1);
    this.save();
    return true;
  }

  /**
   * Clear old queries (keep last N)
   */
  clearOldQueries(keepLast: number = 100): void {
    if (this.state.queries.length > keepLast) {
      // Sort by createdAt desc, keep first N
      this.state.queries = this.state.queries
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, keepLast);
      this.save();
    }
  }

  /**
   * Clear completed/failed queries older than specified days
   */
  clearOldCompletedQueries(daysOld: number = 7): void {
    const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    this.state.queries = this.state.queries.filter(q => {
      if (q.status === "pending" || q.status === "running") return true;
      const end_time = q.completedAt || q.failedAt || q.createdAt;
      return new Date(end_time).getTime() > cutoff;
    });
    this.save();
  }

  /**
   * Filter queries
   */
  filterQueries(options: QueryFilterOptions): QueryTask[] {
    let filtered = [...this.state.queries];

    if (options.status && options.status.length > 0) {
      filtered = filtered.filter(q => options.status!.includes(q.status));
    }

    if (options.priority && options.priority.length > 0) {
      filtered = filtered.filter(q => options.priority!.includes(q.priority));
    }

    if (options.agentId) {
      filtered = filtered.filter(q => q.agentId === options.agentId);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(q =>
        q.tags?.some(t => options.tags!.includes(t))
      );
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(search) ||
        q.description?.toLowerCase().includes(search)
      );
    }

    if (options.dateFrom) {
      filtered = filtered.filter(q => new Date(q.createdAt) >= new Date(options.dateFrom!));
    }

    if (options.dateTo) {
      filtered = filtered.filter(q => new Date(q.createdAt) <= new Date(options.dateTo!));
    }

    return filtered;
  }

  /**
   * Get query statistics
   */
  getStats(): QueryStats {
    const queries = this.state.queries;
    const completed = queries.filter(q => q.status === "completed");
    const failed = queries.filter(q => q.status === "failed");

    const avgDuration = completed.length > 0
      ? completed.reduce((sum, q) => sum + (q.duration || 0), 0) / completed.length
      : undefined;

    const finishedCount = completed.length + failed.length;
    const successRate = finishedCount > 0
      ? (completed.length / finishedCount) * 100
      : 100;

    return {
      total: queries.length,
      pending: queries.filter(q => q.status === "pending").length,
      running: queries.filter(q => q.status === "running").length,
      completed: completed.length,
      failed: failed.length,
      avgDuration,
      successRate,
      byPriority: {
        low: queries.filter(q => q.priority === "low").length,
        medium: queries.filter(q => q.priority === "medium").length,
        high: queries.filter(q => q.priority === "high").length,
        critical: queries.filter(q => q.priority === "critical").length,
      },
    };
  }

  /**
   * Get queries grouped by status (for Kanban)
   */
  getKanbanData(): Record<QueryStatus, QueryTask[]> {
    return {
      pending: this.getQueriesByStatus("pending"),
      running: this.getQueriesByStatus("running"),
      completed: this.getQueriesByStatus("completed"),
      failed: this.getQueriesByStatus("failed"),
    };
  }

  /**
   * Reset all queries
   */
  clear(): void {
    this.state.queries = [];
    this.state.lastUpdate = new Date().toISOString();
    this.save();
  }
}

// Singleton instance
let trackerInstance: QueryTracker | null = null;

export function getQueryTracker(): QueryTracker {
  if (!trackerInstance) {
    trackerInstance = new QueryTracker();
  }
  return trackerInstance;
}
