/**
 * Agent State Types
 * Type definitions for agent tracking (Loki Mode pattern)
 */

export type AgentStatus = "active" | "idle" | "failed" | "terminated";

export interface ResourceUsage {
  tokensUsed: number;
  apiCalls: number;
  cpuPercent?: number;
  memoryMB?: number;
}

export interface AgentTask {
  id: string;
  description: string;
  startedAt: string;
}

export interface AgentState {
  id: string;
  role: string;
  status: AgentStatus;
  currentTask?: AgentTask;
  tasksCompleted: number;
  tasksFailed: number;
  lastHeartbeat: string;
  heartbeatInterval: number; // seconds
  heartbeatTimeout: number; // seconds before considered stale
  resourceUsage: ResourceUsage;
  createdAt: string;
  lastUpdate: string;
}

export interface AgentStateData {
  agents: Record<string, AgentState>;
  lastUpdate: string;
  version: number;
}

export interface HeartbeatConfig {
  interval: number; // default: 60 seconds
  timeout: number; // default: 300 seconds (5 minutes)
}

/**
 * Check if an agent is considered stale (no recent heartbeat)
 */
export function isAgentStale(agent: AgentState, now: Date = new Date()): boolean {
  const lastHeartbeat = new Date(agent.lastHeartbeat);
  const elapsed = (now.getTime() - lastHeartbeat.getTime()) / 1000;
  return elapsed > agent.heartbeatTimeout;
}

/**
 * Check if an agent is considered active (recent activity)
 */
export function isAgentActive(agent: AgentState, now: Date = new Date()): boolean {
  if (agent.status === "terminated" || agent.status === "failed") {
    return false;
  }
  return !isAgentStale(agent, now);
}

/**
 * Get agent health status
 */
export function getAgentHealth(agent: AgentState): "healthy" | "stale" | "failed" | "terminated" {
  if (agent.status === "terminated") return "terminated";
  if (agent.status === "failed") return "failed";
  if (isAgentStale(agent)) return "stale";
  return "healthy";
}
