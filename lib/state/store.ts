/**
 * Agent State Store
 * Persistent storage for agent states using JSON file
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { AgentStateData, AgentState } from "./types";

const STATE_DIR = ".claude-monitor";
const STATE_FILE = "agents.json";

export class AgentStateStore {
  private statePath: string;
  private store: AgentStateData;

  constructor() {
    this.statePath = join(process.cwd(), STATE_DIR, STATE_FILE);
    this.store = this.load();
  }

  private ensureStateDir(): void {
    const dir = join(process.cwd(), STATE_DIR);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private load(): AgentStateData {
    this.ensureStateDir();

    if (existsSync(this.statePath)) {
      try {
        const content = readFileSync(this.statePath, "utf-8");
        return JSON.parse(content);
      } catch (error) {
        console.error("Failed to load agent state store:", error);
      }
    }

    return {
      agents: {},
      lastUpdate: new Date().toISOString(),
      version: 1,
    };
  }

  private save(): void {
    this.ensureStateDir();
    this.store.lastUpdate = new Date().toISOString();
    writeFileSync(this.statePath, JSON.stringify(this.store, null, 2), "utf-8");
  }

  /**
   * Get all agent states
   */
  getAllAgents(): AgentState[] {
    return Object.values(this.store.agents);
  }

  /**
   * Get a specific agent state
   */
  getAgent(id: string): AgentState | null {
    return this.store.agents[id] || null;
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentState["status"]): AgentState[] {
    return this.getAllAgents().filter((a) => a.status === status);
  }

  /**
   * Get agents by role
   */
  getAgentsByRole(role: string): AgentState[] {
    return this.getAllAgents().filter((a) => a.role === role);
  }

  /**
   * Add or update an agent
   */
  upsertAgent(agent: AgentState): void {
    const existing = this.store.agents[agent.id];

    if (existing) {
      // Preserve some fields on update
      this.store.agents[agent.id] = {
        ...existing,
        ...agent,
        tasksCompleted: agent.tasksCompleted ?? existing.tasksCompleted,
        tasksFailed: agent.tasksFailed ?? existing.tasksFailed,
        createdAt: existing.createdAt,
        lastUpdate: new Date().toISOString(),
      };
    } else {
      this.store.agents[agent.id] = {
        ...agent,
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
      };
    }

    this.save();
  }

  /**
   * Update agent heartbeat
   */
  updateHeartbeat(id: string): void {
    const agent = this.store.agents[id];
    if (agent) {
      agent.lastHeartbeat = new Date().toISOString();
      agent.lastUpdate = new Date().toISOString();

      // If agent was stale or failed, mark as idle when heartbeat received
      if (agent.status === "failed") {
        agent.status = "idle";
      }

      this.save();
    }
  }

  /**
   * Update agent status
   */
  updateStatus(id: string, status: AgentState["status"]): void {
    const agent = this.store.agents[id];
    if (agent) {
      agent.status = status;
      agent.lastUpdate = new Date().toISOString();
      this.save();
    }
  }

  /**
   * Increment task counter
   */
  incrementTaskCount(id: string, type: "completed" | "failed"): void {
    const agent = this.store.agents[id];
    if (agent) {
      if (type === "completed") {
        agent.tasksCompleted++;
      } else {
        agent.tasksFailed++;
      }
      agent.lastUpdate = new Date().toISOString();
      this.save();
    }
  }

  /**
   * Set current task for agent
   */
  setCurrentTask(id: string, task: { id: string; description: string } | null): void {
    const agent = this.store.agents[id];
    if (agent) {
      if (task) {
        agent.currentTask = {
          ...task,
          startedAt: new Date().toISOString(),
        };
        agent.status = "active";
      } else {
        delete agent.currentTask;
        agent.status = "idle";
      }
      agent.lastUpdate = new Date().toISOString();
      this.save();
    }
  }

  /**
   * Update resource usage
   */
  updateResourceUsage(id: string, usage: Partial<AgentState["resourceUsage"]>): void {
    const agent = this.store.agents[id];
    if (agent) {
      agent.resourceUsage = {
        ...agent.resourceUsage,
        ...usage,
      };
      agent.lastUpdate = new Date().toISOString();
      this.save();
    }
  }

  /**
   * Remove an agent
   */
  removeAgent(id: string): void {
    delete this.store.agents[id];
    this.save();
  }

  /**
   * Mark stale agents as failed
   */
  markStaleAgents(timeoutSeconds: number): AgentState[] {
    const now = new Date();
    const staleAgents: AgentState[] = [];

    for (const agent of Object.values(this.store.agents)) {
      const lastHeartbeat = new Date(agent.lastHeartbeat);
      const elapsed = (now.getTime() - lastHeartbeat.getTime()) / 1000;

      if (elapsed > timeoutSeconds && agent.status === "active") {
        agent.status = "failed";
        agent.lastUpdate = now.toISOString();
        staleAgents.push(agent);
      }
    }

    if (staleAgents.length > 0) {
      this.save();
    }

    return staleAgents;
  }

  /**
   * Clear all agent states
   */
  clear(): void {
    this.store.agents = {};
    this.store.lastUpdate = new Date().toISOString();
    this.save();
  }

  /**
   * Get store statistics
   */
  getStats() {
    const agents = this.getAllAgents();
    return {
      total: agents.length,
      active: agents.filter((a) => a.status === "active").length,
      idle: agents.filter((a) => a.status === "idle").length,
      failed: agents.filter((a) => a.status === "failed").length,
      terminated: agents.filter((a) => a.status === "terminated").length,
      tasksCompleted: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
      tasksFailed: agents.reduce((sum, a) => sum + a.tasksFailed, 0),
    };
  }
}

// Singleton instance
let storeInstance: AgentStateStore | null = null;

export function getAgentStateStore(): AgentStateStore {
  if (!storeInstance) {
    storeInstance = new AgentStateStore();
  }
  return storeInstance;
}
