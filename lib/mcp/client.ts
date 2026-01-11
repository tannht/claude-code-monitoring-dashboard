/**
 * MCP Client Wrapper
 * Handles communication with local MCP servers
 */

import type {
  McpResponse,
  SwarmStatus,
  AgentInfo,
  AgentMetrics,
  TaskInfo,
  TaskListResult,
  PerformanceReport,
  HealthCheckResult,
  MemoryUsage,
  TokenUsage,
  RealTimeEvent,
} from "./types";

export class McpClient {
  private baseUrl: string;
  private readonly servers = {
    claudeFlow: process.env.MCP_CLAUDE_FLOW_URL || "http://localhost:3000/mcp/claude-flow",
    ruvSwarm: process.env.MCP_RUV_SWARM_URL || "http://localhost:3000/mcp/ruv-swarm",
    flowNexus: process.env.MCP_FLOW_NEXUS_URL || "http://localhost:3000/mcp/flow-nexus",
  };

  constructor() {
    this.baseUrl = this.servers.claudeFlow;
  }

  /**
   * Generic MCP tool call via HTTP
   * Note: This is a simplified implementation. Real MCP requires SDK integration.
   */
  private async callTool<T>(
    server: keyof typeof this.servers,
    tool: string,
    params?: Record<string, unknown>
  ): Promise<McpResponse<T>> {
    try {
      const url = `${this.servers[server]}/${tool}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
      });

      if (!response.ok) {
        throw new Error(`MCP call failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data as T,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============ SWARM METHODS ============

  async getSwarmStatus(swarmId?: string): Promise<McpResponse<SwarmStatus>> {
    return this.callTool("claudeFlow", "swarm_status", { swarmId });
  }

  async initSwarm(
    topology: "mesh" | "hierarchical" | "ring" | "star",
    maxAgents = 8
  ): Promise<McpResponse<{ swarmId: string }>> {
    return this.callTool("claudeFlow", "swarm_init", { topology, maxAgents });
  }

  async destroySwarm(swarmId: string): Promise<McpResponse<void>> {
    return this.callTool("claudeFlow", "swarm_destroy", { swarmId });
  }

  // ============ AGENT METHODS ============

  async listAgents(filter?: "all" | "active" | "idle" | "busy"): Promise<
    McpResponse<{ agents: AgentInfo[] }>
  > {
    return this.callTool("ruvSwarm", "agent_list", { filter });
  }

  async spawnAgent(
    type: "coder" | "researcher" | "analyst" | "optimizer" | "coordinator",
    name?: string,
    capabilities?: string[]
  ): Promise<McpResponse<{ agentId: string }>> {
    return this.callTool("ruvSwarm", "agent_spawn", { type, name, capabilities });
  }

  async getAgentMetrics(agentId?: string): Promise<McpResponse<AgentMetrics[]>> {
    return this.callTool("claudeFlow", "agent_metrics", { agentId });
  }

  // ============ TASK METHODS ============

  async getTaskStatus(taskId?: string): Promise<McpResponse<TaskInfo[]>> {
    return this.callTool("claudeFlow", "task_status", { taskId });
  }

  async orchestrateTask(
    task: string,
    strategy: "parallel" | "sequential" | "adaptive" = "adaptive",
    priority: "low" | "medium" | "high" | "critical" = "medium"
  ): Promise<McpResponse<{ taskId: string }>> {
    return this.callTool("claudeFlow", "task_orchestrate", { task, strategy, priority });
  }

  async getTaskResults(taskId: string): Promise<McpResponse<unknown>> {
    return this.callTool("claudeFlow", "task_results", { taskId });
  }

  // ============ PERFORMANCE & HEALTH ============

  async getPerformanceReport(
    timeframe: "24h" | "7d" | "30d" = "24h"
  ): Promise<McpResponse<PerformanceReport>> {
    return this.callTool("claudeFlow", "performance_report", { timeframe });
  }

  async getHealthCheck(): Promise<McpResponse<HealthCheckResult>> {
    return this.callTool("claudeFlow", "health_check", {});
  }

  async getMemoryUsage(detail: "summary" | "detailed" | "by-agent" = "summary"): Promise<
    McpResponse<MemoryUsage>
  > {
    return this.callTool("ruvSwarm", "memory_usage", { detail });
  }

  async getTokenUsage(operation?: string, timeframe = "24h"): Promise<McpResponse<TokenUsage>> {
    return this.callTool("claudeFlow", "token_usage", { operation, timeframe });
  }

  // ============ REAL-TIME MONITORING ============

  /**
   * Subscribe to swarm monitoring updates
   * This would use WebSocket/SSE in production
   */
  async monitorSwarm(
    swarmId: string,
    duration = 10,
    interval = 1
  ): Promise<McpAsyncIterator<RealTimeEvent>> {
    // Placeholder for SSE/WebSocket implementation
    const events: RealTimeEvent[] = [];
    let index = 0;

    const iterator = {
      async next(): Promise<IteratorResult<RealTimeEvent>> {
        if (index < events.length) {
          return { done: false, value: events[index++] };
        }
        return { done: true, value: undefined as never };
      },
      [Symbol.asyncIterator]() {
        return iterator;
      },
    };
    return iterator as McpAsyncIterator<RealTimeEvent>;
  }
}

// Async iterator interface for real-time events
interface McpAsyncIterator<T> extends AsyncIterator<T> {
  [Symbol.asyncIterator](): McpAsyncIterator<T>;
}

// Singleton instance
export const mcpClient = new McpClient();
