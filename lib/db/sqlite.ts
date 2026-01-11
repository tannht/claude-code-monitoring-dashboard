/**
 * SQLite Client
 * Direct access to .swarm/memory.db and .hive-mind/hive.db
 */

import Database from "better-sqlite3";
import type {
  SwarmRecord,
  AgentRecord,
  TaskRecord,
  MessageRecord,
  PerformanceMetricRecord,
  PatternRecord,
  TaskTrajectoryRecord,
  MemoryEntryRecord,
  TaskStats,
  AgentStats,
  DailyMetrics,
} from "./schema";

export class SqliteClient {
  private swarmDb: Database.Database;
  private hiveDb: Database.Database;

  constructor(swarmDbPath: string, hiveDbPath: string) {
    this.swarmDb = new Database(swarmDbPath, { readonly: true });
    this.hiveDb = new Database(hiveDbPath, { readonly: true });

    // Enable WAL mode for better concurrent read performance
    this.swarmDb.pragma("journal_mode = WAL");
    this.hiveDb.pragma("journal_mode = WAL");
  }

  close() {
    this.swarmDb.close();
    this.hiveDb.close();
  }

  // ============ SWARM QUERIES ============

  /**
   * Get all active swarms
   */
  getActiveSwarms(): SwarmRecord[] {
    const stmt = this.swarmDb.prepare(`
      SELECT * FROM swarms
      WHERE status = 'active'
      ORDER BY updated_at DESC
    `);
    return stmt.all() as SwarmRecord[];
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status?: string): AgentRecord[] {
    let query = "SELECT * FROM agents";
    const params: unknown[] = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY last_active DESC";

    const stmt = this.swarmDb.prepare(query);
    return stmt.all(...params) as AgentRecord[];
  }

  /**
   * Get agent stats for dashboard
   */
  getAgentStats(): AgentStats[] {
    const stmt = this.swarmDb.prepare(`
      SELECT
        a.id as agentId,
        a.name as agentName,
        a.type as agentType,
        a.status as status,
        COUNT(t.id) as totalTasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
        SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failedTasks,
        a.success_rate as successRate,
        a.performance_score as performanceScore,
        AVG(t.actual_time) as avgDuration,
        a.last_active as lastActive
      FROM agents a
      LEFT JOIN tasks t ON a.id = t.agent_id
      GROUP BY a.id
      ORDER BY a.last_active DESC
    `);
    return stmt.all() as AgentStats[];
  }

  /**
   * Get task statistics for a time period
   */
  getTaskStats(days = 7): TaskStats {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const stmt = this.swarmDb.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        AVG(actual_time) as avgDuration
      FROM tasks
      WHERE created_at > ?
    `);

    const result = stmt.get(since) as {
      total: number;
      completed: number;
      failed: number;
      pending: number;
      inProgress: number;
      avgDuration: number;
    };

    const successRate = result.total > 0
      ? ((result.completed || 0) / result.total) * 100
      : 0;

    return {
      total: result.total || 0,
      completed: result.completed || 0,
      failed: result.failed || 0,
      pending: result.pending || 0,
      inProgress: result.inProgress || 0,
      avgDuration: result.avgDuration || 0,
      successRate,
    };
  }

  /**
   * Get tasks with pagination
   */
  getTasks(limit = 50, offset = 0, status?: string): TaskRecord[] {
    let query = "SELECT * FROM tasks";
    const params: unknown[] = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const stmt = this.swarmDb.prepare(query);
    return stmt.all(...params) as TaskRecord[];
  }

  /**
   * Get recent tasks for dashboard
   */
  getRecentTasks(limit = 10): TaskRecord[] {
    const stmt = this.swarmDb.prepare(`
      SELECT * FROM tasks
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as TaskRecord[];
  }

  /**
   * Get performance metrics for an agent
   */
  getAgentMetrics(agentId: string, hours = 24): PerformanceMetricRecord[] {
    const since = new Date(Date.now() - hours * 3600000).toISOString();

    const stmt = this.swarmDb.prepare(`
      SELECT * FROM performance_metrics
      WHERE (agent_id = ? OR agent_id IS NULL)
        AND timestamp > ?
      ORDER BY timestamp DESC
    `);
    return stmt.all(agentId, since) as PerformanceMetricRecord[];
  }

  /**
   * Get all performance metrics with optional filtering
   */
  getPerformanceMetrics(agentId?: string, metricName?: string, hours = 24): PerformanceMetricRecord[] {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    let query = "SELECT * FROM performance_metrics WHERE timestamp > ?";
    const params: unknown[] = [since];

    if (agentId) {
      query += " AND agent_id = ?";
      params.push(agentId);
    }

    if (metricName) {
      query += " AND metricName = ?";
      params.push(metricName);
    }

    query += " ORDER BY timestamp DESC";

    const stmt = this.swarmDb.prepare(query);
    return stmt.all(...params) as PerformanceMetricRecord[];
  }

  /**
   * Get messages between agents or from a specific agent
   */
  getMessages(fromAgentId?: string, toAgentId?: string, messageType?: string, limit = 100): MessageRecord[] {
    let query = "SELECT * FROM messages WHERE 1=1";
    const params: unknown[] = [];

    if (fromAgentId) {
      query += " AND fromAgentId = ?";
      params.push(fromAgentId);
    }

    if (toAgentId) {
      query += " AND toAgentId = ?";
      params.push(toAgentId);
    }

    if (messageType) {
      query += " AND messageType = ?";
      params.push(messageType);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    const stmt = this.swarmDb.prepare(query);
    return stmt.all(...params) as MessageRecord[];
  }

  /**
   * Get recent messages across all agents
   */
  getRecentMessages(limit = 50): MessageRecord[] {
    const stmt = this.swarmDb.prepare(`
      SELECT * FROM messages
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit) as MessageRecord[];
  }

  /**
   * Get daily metrics for charts
   */
  getDailyMetrics(days = 30): DailyMetrics[] {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const stmt = this.swarmDb.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as tasksCompleted,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as tasksFailed,
        AVG(actual_time) as avgDuration
      FROM tasks
      WHERE created_at > ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    return stmt.all(since) as DailyMetrics[];
  }

  // ============ HIVE MIND QUERIES ============

  /**
   * Get top patterns by confidence and usage
   */
  getTopPatterns(limit = 20): PatternRecord[] {
    const stmt = this.hiveDb.prepare(`
      SELECT * FROM patterns
      ORDER BY confidence DESC, usage_count DESC
      LIMIT ?
    `);
    return stmt.all(limit) as PatternRecord[];
  }

  /**
   * Get patterns by type
   */
  getPatternsByType(type: string, limit = 10): PatternRecord[] {
    const stmt = this.hiveDb.prepare(`
      SELECT * FROM patterns
      WHERE type = ?
      ORDER BY confidence DESC
      LIMIT ?
    `);
    return stmt.all(type, limit) as PatternRecord[];
  }

  /**
   * Get task trajectories for learning insights
   */
  getTaskTrajectories(taskId?: string, limit = 50): TaskTrajectoryRecord[] {
    let query = "SELECT * FROM task_trajectories";
    const params: unknown[] = [];

    if (taskId) {
      query += " WHERE task_id = ?";
      params.push(taskId);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const stmt = this.hiveDb.prepare(query);
    return stmt.all(...params) as TaskTrajectoryRecord[];
  }

  /**
   * Get memory entries by namespace
   */
  getMemoryEntries(namespace: string, limit = 100): MemoryEntryRecord[] {
    const stmt = this.hiveDb.prepare(`
      SELECT * FROM memory_entries
      WHERE namespace = ?
        AND (expires_at IS NULL OR expires_at > strftime('%s', 'now'))
      ORDER BY accessed_at DESC
      LIMIT ?
    `);
    return stmt.all(namespace, limit) as MemoryEntryRecord[];
  }

  /**
   * Search memory entries by key pattern
   */
  searchMemory(pattern: string, limit = 50): MemoryEntryRecord[] {
    const stmt = this.hiveDb.prepare(`
      SELECT * FROM memory_entries
      WHERE key LIKE ?
        AND (expires_at IS NULL OR expires_at > strftime('%s', 'now'))
      ORDER BY accessed_at DESC
      LIMIT ?
    `);
    return stmt.all(`%${pattern}%`, limit) as MemoryEntryRecord[];
  }

  // ============ UTILITIES ============

  /**
   * Check database health
   */
  checkHealth(): { swarmDb: boolean; hiveDb: boolean } {
    try {
      this.swarmDb.prepare("SELECT 1").get();
      this.hiveDb.prepare("SELECT 1").get();
      return { swarmDb: true, hiveDb: true };
    } catch {
      return { swarmDb: false, hiveDb: false };
    }
  }

  /**
   * Get database info
   */
  getDbInfo(): {
    swarmDb: { tables: number; size: number };
    hiveDb: { tables: number; size: number };
  } {
    const getTableCount = (db: Database.Database) => {
      const result = db
        .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
        .get() as { count: number };
      return result.count;
    };

    return {
      swarmDb: {
        tables: getTableCount(this.swarmDb),
        size: 0, // Would need file system check
      },
      hiveDb: {
        tables: getTableCount(this.hiveDb),
        size: 0,
      },
    };
  }
}

// Singleton instance (lazy initialization)
let sqliteClientInstance: SqliteClient | null = null;

export function getSqliteClient(swarmDbPath?: string, hiveDbPath?: string): SqliteClient {
  if (!sqliteClientInstance) {
    const swarmPath =
      swarmDbPath || process.env.SWARM_DB_PATH || "/Users/tannguyen/.swarm/memory.db";
    const hivePath =
      hiveDbPath || process.env.HIVE_DB_PATH || "/Users/tannguyen/.hive-mind/hive.db";

    sqliteClientInstance = new SqliteClient(swarmPath, hivePath);
  }
  return sqliteClientInstance;
}
