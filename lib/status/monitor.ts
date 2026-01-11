/**
 * Status Monitor
 * Manages the STATUS.txt file pattern from Loki Mode
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { SystemStatus, formatStatusFile, parseStatusFile, SystemPhase, CircuitBreakerState } from "./types";

export interface MonitorConfig {
  statusDir: string;
  statusFileName: string;
  updateInterval: number; // milliseconds
}

const DEFAULT_CONFIG: MonitorConfig = {
  statusDir: ".claude-monitor",
  statusFileName: "STATUS.txt",
  updateInterval: 5000, // 5 seconds
};

class StatusMonitor {
  private config: MonitorConfig;
  private status: SystemStatus;
  private startTime: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = Date.now();

    // Initialize status
    this.status = this.getInitialStatus();

    // Ensure directory exists
    this.ensureStatusDir();
  }

  private getInitialStatus(): SystemStatus {
    // Try to load existing status
    const existing = this.loadFromFile();
    if (existing) {
      return existing;
    }

    return {
      updated: new Date().toISOString(),
      phase: "IDLE",
      queries: {
        active: 0,
        pending: 0,
        completed: 0,
        failed: 0,
      },
      circuitBreakers: {
        state: "CLOSED",
        failureCount: 0,
        failureThreshold: 5,
      },
      uptime: 0,
    };
  }

  private ensureStatusDir(): void {
    const dir = join(process.cwd(), this.config.statusDir);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private getStatusFilePath(): string {
    return join(process.cwd(), this.config.statusDir, this.config.statusFileName);
  }

  /**
   * Write current status to STATUS.txt file
   */
  writeToFile(): boolean {
    try {
      this.status.updated = new Date().toISOString();
      this.status.uptime = Math.floor((Date.now() - this.startTime) / 1000);

      const content = formatStatusFile(this.status);
      writeFileSync(this.getStatusFilePath(), content, "utf-8");
      return true;
    } catch (error) {
      console.error("Failed to write status file:", error);
      return false;
    }
  }

  /**
   * Read and parse STATUS.txt file
   */
  loadFromFile(): SystemStatus | null {
    try {
      const filePath = this.getStatusFilePath();
      if (!existsSync(filePath)) {
        return null;
      }

      const content = readFileSync(filePath, "utf-8");
      return parseStatusFile(content);
    } catch {
      return null;
    }
  }

  /**
   * Get current status
   */
  getStatus(): SystemStatus {
    return { ...this.status };
  }

  /**
   * Update system phase
   */
  setPhase(phase: SystemPhase): void {
    this.status.phase = phase;
    this.writeToFile();
  }

  /**
   * Update query stats
   */
  updateQueryStats(updates: Partial<SystemStatus["queries"]>): void {
    this.status.queries = { ...this.status.queries, ...updates };
    this.writeToFile();
  }

  /**
   * Increment query counter
   */
  incrementQuery(type: keyof SystemStatus["queries"]): void {
    this.status.queries[type]++;
    this.writeToFile();
  }

  /**
   * Update circuit breaker state
   */
  setCircuitBreaker(state: CircuitBreakerState, failureCount?: number): void {
    this.status.circuitBreakers.state = state;
    if (failureCount !== undefined) {
      this.status.circuitBreakers.failureCount = failureCount;
    }
    this.writeToFile();
  }

  /**
   * Set circuit breaker cooldown
   */
  setCircuitBreakerCooldown(cooldownUntil: Date): void {
    this.status.circuitBreakers.cooldownUntil = cooldownUntil.toISOString();
    this.writeToFile();
  }

  /**
   * Clear circuit breaker cooldown
   */
  clearCircuitBreakerCooldown(): void {
    delete this.status.circuitBreakers.cooldownUntil;
    this.writeToFile();
  }

  /**
   * Record last activity
   */
  setLastActivity(description: string): void {
    this.status.lastActivity = {
      timestamp: new Date().toISOString(),
      description,
    };
    this.writeToFile();
  }

  /**
   * Start auto-refresh interval
   */
  startAutoRefresh(): void {
    if (this.intervalId) {
      return; // Already running
    }

    this.intervalId = setInterval(() => {
      this.writeToFile();
    }, this.config.updateInterval);

    this.status.phase = "MONITORING";
    this.writeToFile();
  }

  /**
   * Stop auto-refresh interval
   */
  stopAutoRefresh(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status.phase = "IDLE";
    this.writeToFile();
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.stopAutoRefresh();
    this.status = {
      updated: new Date().toISOString(),
      phase: "IDLE",
      queries: {
        active: 0,
        pending: 0,
        completed: 0,
        failed: 0,
      },
      circuitBreakers: {
        state: "CLOSED",
        failureCount: 0,
        failureThreshold: 5,
      },
      uptime: 0,
    };
    this.startTime = Date.now();
    this.writeToFile();
  }
}

// Singleton instance
let monitorInstance: StatusMonitor | null = null;

export function getStatusMonitor(config?: Partial<MonitorConfig>): StatusMonitor {
  if (!monitorInstance) {
    monitorInstance = new StatusMonitor(config);
  }
  return monitorInstance;
}

export { StatusMonitor };
