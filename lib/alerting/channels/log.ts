/**
 * Log Alert Channel
 * Log alerts to file or console
 */

import type { LogChannelConfig, NotificationPayload, ChannelResult } from "../types";
import { promises } from "fs";
import { join } from "path";

export class LogChannel {
  private config: LogChannelConfig;
  private logPath: string | null;

  constructor(config: LogChannelConfig) {
    this.config = config;
    this.logPath = config.path ? join(process.cwd(), config.path) : null;
  }

  /**
   * Log notification
   */
  async send(payload: NotificationPayload): Promise<ChannelResult> {
    const timestamp = new Date().toISOString();
    const level = this.config.level || "info";
    const logLine = this.formatLogLine(payload, timestamp);

    try {
      // Console logging
      this.logToConsole(level, logLine, payload);

      // File logging (optional)
      if (this.logPath) {
        await this.logToFile(logLine);
      }

      return {
        channel: "log",
        success: true,
        sentAt: timestamp,
      };
    } catch (error) {
      return {
        channel: "log",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Format log line
   */
  private formatLogLine(payload: NotificationPayload, timestamp: string): string {
    const { severity, title, message, source } = payload;
    const metadataStr = payload.metadata
      ? ` | ${JSON.stringify(payload.metadata)}`
      : "";

    return `[${timestamp}] [${severity.toUpperCase()}] ${title}: ${message}${source ? ` (${source})` : ""}${metadataStr}`;
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(level: string, logLine: string, payload: NotificationPayload): void {
    const { severity } = payload;
    const consoleMethod =
      severity === "critical" || severity === "high"
        ? console.error
        : severity === "medium"
        ? console.warn
        : console.log;

    // Add emoji for better visibility
    const emoji = this.getSeverityEmoji(severity);
    consoleMethod(`${emoji} ${logLine}`);
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: "🚨",
      high: "⚠️",
      medium: "⚡",
      low: "ℹ️",
      info: "📝",
    };
    return emojis[severity] || "📋";
  }

  /**
   * Append log to file
   */
  private async logToFile(logLine: string): Promise<void> {
    if (!this.logPath) return;

    try {
      // Ensure directory exists
      const logDir = this.logPath.substring(0, this.logPath.lastIndexOf("/"));
      await promises.mkdir(logDir, { recursive: true });

      // Append to log file
      await promises.appendFile(this.logPath, logLine + "\n");
    } catch (error) {
      // If file logging fails, still consider the log successful (console worked)
      console.warn(`Failed to write to log file ${this.logPath}:`, error);
    }
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; error?: string } {
    return { valid: true };
  }
}

/**
 * Create log channel from config
 */
export function createLogChannel(config: LogChannelConfig): LogChannel {
  return new LogChannel(config);
}
