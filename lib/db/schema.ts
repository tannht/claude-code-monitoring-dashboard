/**
 * SQLite Database Schema Types
 * Interfaces for .swarm/memory.db and .hive-mind/hive.db
 */

// ============ HIVE DATABASE (.hive-mind/hive.db) ============
// Note: This database contains swarms, agents, tasks tables

export interface SwarmRecord {
  id: string;
  name: string;
  objective?: string;
  status: "active" | "stopped" | "initializing";
  queenType: string;
  topology: "mesh" | "hierarchical" | "ring" | "star";
  maxAgents: number;
  created_at: string;
  updated_at: string;
  metadata: string; // JSON string
}

export interface AgentRecord {
  id: string;
  swarm_id?: string;
  name: string;
  type: string;
  role?: string;
  capabilities: string; // JSON string
  status: "idle" | "busy" | "active" | "offline" | "pending" | "running";
  performance_score: number;
  task_count: number;
  success_rate: number;
  last_active: string;
  created_at: string;
  metadata: string; // JSON string
}

export interface TaskRecord {
  id: string;
  swarm_id?: string;
  agent_id?: string;
  name: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: number; // 1-4 scale in database
  complexity?: number;
  estimated_time?: number;
  actual_time?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  metadata: string; // JSON string
}

export interface MessageRecord {
  id: string;
  fromAgentId: string;
  toAgentId?: string;
  content: string;
  messageType: "coordination" | "result" | "error" | "status";
  timestamp: string;
}

export interface PerformanceMetricRecord {
  id: string;
  agent_id?: string;
  metricName: string;
  metricValue: number;
  unit: string;
  timestamp: string;
  metadata?: string; // JSON string
}

// ============ MEMORY DATABASE (.swarm/memory.db) ============
// Note: This database contains patterns, memory_entries, task_trajectories tables

export interface PatternRecord {
  id: string;
  type: string;
  pattern_data: string; // JSON string
  confidence: number;
  usage_count: number;
  created_at: string;
  last_used?: string;
}

export interface TaskTrajectoryRecord {
  task_id: string; // Primary key
  agent_id: string;
  query: string;
  trajectory_json: string; // JSON array
  started_at?: string;
  ended_at?: string;
  judge_label?: string;
  judge_conf?: number;
  judge_reasons?: string;
  matts_run_id?: string;
  created_at: string;
}

export interface MemoryEntryRecord {
  id: number;
  key: string;
  value: string; // JSON string
  namespace: string;
  metadata?: string;
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
  accessed_at: number; // Unix timestamp
  access_count: number;
  ttl?: number;
  expires_at?: number; // Unix timestamp
}

// ============ AGGREGATION TYPES ============

export interface TaskStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  inProgress: number;
  avgDuration: number;
  successRate: number;
}

export interface AgentStats {
  agentId: string;
  agentName: string;
  agentType: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  performanceScore: number;
  avgDuration: number;
  lastActive: string;
}

export interface DailyMetrics {
  date: string;
  tasksCompleted: number;
  tasksFailed: number;
  avgDuration: number;
  totalTokens: number;
  estimatedCost: number;
}
