/**
 * Status Types
 * Type definitions for the monitoring status system (Loki Mode pattern)
 */

export type SystemPhase = "IDLE" | "MONITORING" | "ALERT";
export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface QueryStats {
  active: number;
  pending: number;
  completed: number;
  failed: number;
}

export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  failureThreshold: number;
  cooldownUntil?: string;
}

export interface LastActivity {
  timestamp: string;
  description: string;
}

export interface SystemStatus {
  updated: string;
  phase: SystemPhase;
  queries: QueryStats;
  circuitBreakers: CircuitBreakerStatus;
  lastActivity?: LastActivity;
  uptime?: number; // seconds since start
  // Optional extra fields from API response
  statusFile?: string;
  statusFilePath?: string;
}

export interface StatusFileConfig {
  path: string;
  updateInterval: number; // milliseconds
  autoRefresh: boolean;
}

/**
 * Format status as ASCII art for STATUS.txt file
 */
export function formatStatusFile(status: SystemStatus): string {
  const updated = new Date(status.updated).toLocaleString();
  const queries = status.queries;
  const cb = status.circuitBreakers;

  const lines = [
    "╔════════════════════════════════════════════════════════════════╗",
    "║          CLAUDE CODE MONITORING DASHBOARD                     ║",
    "╚════════════════════════════════════════════════════════════════╝",
    "",
    `Updated: ${updated}`,
    "",
    `Status: ${status.phase}`,
    "",
    "Queries:",
    `  ├─ Active:     ${queries.active}`,
    `  ├─ Pending:    ${queries.pending}`,
    `  ├─ Completed:  ${queries.completed}`,
    `  └─ Failed:     ${queries.failed}`,
    "",
    `Circuit Breaker: ${cb.state} (${cb.failureCount}/${cb.failureThreshold} failures)`,
    cb.cooldownUntil ? `  └─ Cooldown until: ${new Date(cb.cooldownUntil).toLocaleString()}` : "",
    "",
    status.lastActivity
      ? `Last Activity: ${new Date(status.lastActivity.timestamp).toLocaleTimeString()} - ${status.lastActivity.description}`
      : "Last Activity: None",
    status.uptime ? `Uptime: ${Math.floor(status.uptime / 60)}m ${status.uptime % 60}s` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

/**
 * Parse status from STATUS.txt file content
 */
export function parseStatusFile(content: string): SystemStatus | null {
  try {
    const lines = content.split("\n");
    const status: Partial<SystemStatus> = {};

    for (const line of lines) {
      const updatedMatch = line.match(/Updated:\s*(.+)/);
      if (updatedMatch) status.updated = updatedMatch[1];

      const phaseMatch = line.match(/Status:\s*(IDLE|MONITORING|ALERT)/);
      if (phaseMatch) status.phase = phaseMatch[1] as SystemPhase;

      const activeMatch = line.match(/Active:\s*(\d+)/);
      if (activeMatch && !status.queries) status.queries = { active: 0, pending: 0, completed: 0, failed: 0 };
      if (activeMatch && status.queries) status.queries.active = parseInt(activeMatch[1]);

      const pendingMatch = line.match(/Pending:\s*(\d+)/);
      if (pendingMatch && !status.queries) status.queries = { active: 0, pending: 0, completed: 0, failed: 0 };
      if (pendingMatch && status.queries) status.queries.pending = parseInt(pendingMatch[1]);

      const completedMatch = line.match(/Completed:\s*(\d+)/);
      if (completedMatch && !status.queries) status.queries = { active: 0, pending: 0, completed: 0, failed: 0 };
      if (completedMatch && status.queries) status.queries.completed = parseInt(completedMatch[1]);

      const failedMatch = line.match(/Failed:\s*(\d+)/);
      if (failedMatch && !status.queries) status.queries = { active: 0, pending: 0, completed: 0, failed: 0 };
      if (failedMatch && status.queries) status.queries.failed = parseInt(failedMatch[1]);

      const cbMatch = line.match(/Circuit Breaker:\s*(CLOSED|OPEN|HALF_OPEN)\s+\((\d+)\/(\d+)/);
      if (cbMatch) {
        status.circuitBreakers = {
          state: cbMatch[1] as CircuitBreakerState,
          failureCount: parseInt(cbMatch[2]),
          failureThreshold: parseInt(cbMatch[3]),
        };
      }
    }

    if (!status.updated || !status.phase || !status.queries || !status.circuitBreakers) {
      return null;
    }

    return status as SystemStatus;
  } catch {
    return null;
  }
}
