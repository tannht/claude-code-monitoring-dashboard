/**
 * Query Tracking Types
 * For Kanban-style query board
 */

/**
 * Query Status - corresponds to Kanban columns
 */
export type QueryStatus = "pending" | "running" | "completed" | "failed";

/**
 * Query Priority
 */
export type QueryPriority = "low" | "medium" | "high" | "critical";

/**
 * Query Task - represents a single query/task
 */
export interface QueryTask {
  id: string;
  title: string;
  description?: string;
  status: QueryStatus;
  priority: QueryPriority;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  duration?: number; // ms
  error?: string;
  agentId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Query Board State
 */
export interface QueryBoardState {
  queries: QueryTask[];
  lastUpdate: string;
  version: number;
}

/**
 * Query Filter Options
 */
export interface QueryFilterOptions {
  status?: QueryStatus[];
  priority?: QueryPriority[];
  agentId?: string;
  tags?: string[];
  search?: string; // Search in title/description
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Query Statistics
 */
export interface QueryStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  avgDuration?: number;
  successRate: number;
  byPriority: Record<QueryPriority, number>;
}
