/**
 * MCP Response Types
 * TypeScript interfaces for MCP server responses
 */

// Base MCP response structure
export interface McpResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Swarm status types
export interface SwarmStatus {
  swarmId: string;
  topology: "mesh" | "hierarchical" | "ring" | "star";
  maxAgents: number;
  activeAgents: number;
  status: "active" | "initializing" | "stopped";
  agents: AgentInfo[];
  createdAt: string;
  lastActivity: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  type: "coder" | "researcher" | "analyst" | "optimizer" | "coordinator" | "specialist";
  status: "idle" | "busy" | "active" | "offline";
  capabilities: string[];
  currentTask?: string;
}

// Agent metrics
export interface AgentMetrics {
  agentId: string;
  agentName: string;
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    taskCount: number;
    successRate: number;
    avgTaskDuration: number;
  };
  status: string;
  lastActive: string;
}

// Task tracking
export interface TaskInfo {
  taskId: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  assignedAgent?: string;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

export interface TaskListResult {
  tasks: TaskInfo[];
  total: number;
  byStatus: {
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  };
}

// Performance report
export interface PerformanceReport {
  timeframe: "24h" | "7d" | "30d";
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    successRate: number;
    avgDuration: number;
  };
  topAgents: {
    agentId: string;
    taskCount: number;
    successRate: number;
  }[];
  bottlenecks: {
    component: string;
    issue: string;
    recommendation: string;
  }[];
}

// Health check
export interface HealthCheckResult {
  system: "healthy" | "degraded" | "unhealthy";
  components: {
    agents: { status: string; message: string };
    memory: { status: string; message: string };
    neural: { status: string; message: string };
    performance: { status: string; message: string };
  };
  timestamp: string;
}

// Memory usage
export interface MemoryUsage {
  total: number;
  used: number;
  free: number;
  byNamespace: Record<string, number>;
  byAgent: Record<string, number>;
}

// Token usage
export interface TokenUsage {
  operation: string;
  timeframe: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  byModel: Record<string, { tokens: number; cost: number }>;
}

// Real-time monitoring
export interface RealTimeEvent {
  // Core event properties
  type: "agent_status" | "task_update" | "swarm_status" | "error" |
        "task_started" | "task_completed" | "task_failed" |
        "agent_spawned" | "agent_terminated" | "swarm_initialized";
  timestamp: string;
  data?: unknown;

  // Task-related properties (from TaskInfo)
  taskId?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "failed";
  assignedAgent?: string;
  priority?: "low" | "medium" | "high" | "critical";
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;

  // Error handling
  error?: string;
}

// Neural patterns
export interface NeuralPattern {
  patternId: string;
  type: string;
  confidence: number;
  usageCount: number;
  lastUsed: string;
}
