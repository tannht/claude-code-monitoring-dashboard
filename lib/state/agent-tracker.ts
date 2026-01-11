/**
 * Agent Tracker
 * Manages agent state tracking with heartbeats (Loki Mode pattern)
 */

import { getAgentStateStore } from "./store";
import { AgentState, AgentStatus, HeartbeatConfig } from "./types";

export interface RegisterAgentOptions {
  role: string;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

const DEFAULT_CONFIG: HeartbeatConfig = {
  interval: 60, // 60 seconds
  timeout: 300, // 5 minutes
};

class AgentTracker {
  private config: HeartbeatConfig;
  private store = getAgentStateStore();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<HeartbeatConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a new agent
   */
  registerAgent(id: string, options: RegisterAgentOptions): AgentState {
    const agent: AgentState = {
      id,
      role: options.role,
      status: "idle",
      tasksCompleted: 0,
      tasksFailed: 0,
      lastHeartbeat: new Date().toISOString(),
      heartbeatInterval: options.heartbeatInterval || this.config.interval,
      heartbeatTimeout: options.heartbeatTimeout || this.config.timeout,
      resourceUsage: {
        tokensUsed: 0,
        apiCalls: 0,
      },
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    };

    this.store.upsertAgent(agent);
    return agent;
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(id: string): void {
    this.store.removeAgent(id);
  }

  /**
   * Record agent heartbeat
   */
  heartbeat(id: string): boolean {
    const agent = this.store.getAgent(id);
    if (!agent) {
      return false;
    }

    this.store.updateHeartbeat(id);
    return true;
  }

  /**
   * Update agent status
   */
  setAgentStatus(id: string, status: AgentStatus): boolean {
    const agent = this.store.getAgent(id);
    if (!agent) {
      return false;
    }

    this.store.updateStatus(id, status);
    return true;
  }

  /**
   * Assign task to agent
   */
  assignTask(id: string, taskId: string, description: string): boolean {
    const agent = this.store.getAgent(id);
    if (!agent) {
      return false;
    }

    this.store.setCurrentTask(id, { id: taskId, description });
    return true;
  }

  /**
   * Complete current task for agent
   */
  completeTask(id: string, success: boolean = true): boolean {
    const agent = this.store.getAgent(id);
    if (!agent) {
      return false;
    }

    this.store.incrementTaskCount(id, success ? "completed" : "failed");
    this.store.setCurrentTask(id, null);
    return true;
  }

  /**
   * Update resource usage
   */
  updateResourceUsage(
    id: string,
    usage: { tokensUsed?: number; apiCalls?: number; cpuPercent?: number; memoryMB?: number }
  ): boolean {
    const agent = this.store.getAgent(id);
    if (!agent) {
      return false;
    }

    this.store.updateResourceUsage(id, usage);
    return true;
  }

  /**
   * Get agent state
   */
  getAgent(id: string): AgentState | null {
    return this.store.getAgent(id);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentState[] {
    return this.store.getAllAgents();
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentStatus): AgentState[] {
    return this.store.getAgentsByStatus(status);
  }

  /**
   * Get agents by role
   */
  getAgentsByRole(role: string): AgentState[] {
    return this.store.getAgentsByRole(role);
  }

  /**
   * Get stale agents
   */
  getStaleAgents(): AgentState[] {
    const now = new Date();
    return this.store.getAllAgents().filter((agent: AgentState) => {
      const lastHeartbeat = new Date(agent.lastHeartbeat);
      const elapsed = (now.getTime() - lastHeartbeat.getTime()) / 1000;
      return elapsed > agent.heartbeatTimeout;
    });
  }

  /**
   * Start automatic heartbeat monitoring
   */
  startHeartbeatMonitor(checkInterval: number = 30000): void {
    if (this.heartbeatInterval) {
      return; // Already running
    }

    this.heartbeatInterval = setInterval(() => {
      const staleAgents = this.store.markStaleAgents(this.config.timeout);

      if (staleAgents.length > 0) {
        console.warn(`[AgentTracker] Marked ${staleAgents.length} agents as stale:`);
        staleAgents.forEach((agent: AgentState) => {
          console.warn(`  - ${agent.id} (${agent.role}): last heartbeat ${agent.lastHeartbeat}`);
        });
      }
    }, checkInterval);
  }

  /**
   * Stop automatic heartbeat monitoring
   */
  stopHeartbeatMonitor(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get tracker statistics
   */
  getStats() {
    return this.store.getStats();
  }
}

// Singleton instance
let trackerInstance: AgentTracker | null = null;

export function getAgentTracker(config?: Partial<HeartbeatConfig>): AgentTracker {
  if (!trackerInstance) {
    trackerInstance = new AgentTracker(config);
  }
  return trackerInstance;
}

export { AgentTracker };
