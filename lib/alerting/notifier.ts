/**
 * Alert Notifier
 * Central dispatcher for alerts across all channels
 */

import type {
  Alert,
  AlertConfig,
  AlertSeverity,
  AlertChannelType,
  NotificationPayload,
  AlertResult,
  AlertStats,
  ChannelResult,
} from "./types";
import { DEFAULT_ALERT_CONFIG, getDefaultChannelsForSeverity } from "./config";
import { SlackChannel, createSlackChannel } from "./channels/slack";
import { WebhookChannel, createWebhookChannel } from "./channels/webhook";
import { LogChannel, createLogChannel } from "./channels/log";
import { promises } from "fs";
import { join } from "path";

// State file path for alert persistence
const ALERTS_STATE_PATH = join(process.cwd(), ".claude-monitor", "alerts.json");

interface AlertsState {
  alerts: Alert[];
  stats: AlertStats;
  config: AlertConfig;
  lastUpdate: string;
}

/**
 * Alert Notifier class
 */
export class AlertNotifier {
  private state: AlertsState;
  private statePath: string;

  constructor(config?: Partial<AlertConfig>, statePath?: string) {
    this.statePath = statePath || ALERTS_STATE_PATH;
    this.state = this.loadState();
    if (config) {
      this.state.config = { ...this.state.config, ...config };
    }
  }

  /**
   * Load state from file
   */
  private loadState(): AlertsState {
    try {
      const data = require(this.statePath);
      return data;
    } catch {
      return {
        alerts: [],
        stats: this.emptyStats(),
        config: DEFAULT_ALERT_CONFIG,
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  /**
   * Save state to file
   */
  private async saveState(): Promise<void> {
    try {
      const dir = this.statePath.substring(0, this.statePath.lastIndexOf("/"));
      await promises.mkdir(dir, { recursive: true });
      await promises.writeFile(this.statePath, JSON.stringify(this.state, null, 2));
      this.state.lastUpdate = new Date().toISOString();
    } catch (error) {
      console.error("Failed to save alert state:", error);
    }
  }

  /**
   * Get empty stats
   */
  private emptyStats(): AlertStats {
    return {
      total: 0,
      byStatus: {
        pending: 0,
        sent: 0,
        failed: 0,
        acknowledged: 0,
      },
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
      byChannel: {
        slack: 0,
        webhook: 0,
        email: 0,
        log: 0,
      },
      last24h: 0,
    };
  }

  /**
   * Create and send an alert
   */
  async sendAlert(
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    source?: string
  ): Promise<AlertResult> {
    if (!this.state.config.enabled) {
      return {
        alertId: "disabled",
        success: false,
        results: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Create alert
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      status: "pending",
      title,
      message,
      source: source || "monitor",
      timestamp: new Date().toISOString(),
      metadata,
      channels: this.getChannelsForSeverity(severity),
    };

    this.state.alerts.push(alert);
    await this.saveState();

    // Send to channels
    const payload: NotificationPayload = {
      severity,
      title,
      message,
      timestamp: alert.timestamp,
      metadata,
      source,
    };

    const results: ChannelResult[] = [];

    for (const channelType of alert.channels) {
      const channel = this.getChannel(channelType);
      if (channel) {
        const result = await this.sendToChannel(channel, channelType, payload);
        results.push(result);
      }
    }

    // Update alert status
    const allSuccess = results.every((r) => r.success);
    const anySuccess = results.some((r) => r.success);

    alert.status = allSuccess ? "sent" : anySuccess ? "sent" : "failed";

    if (alert.status === "sent") {
      alert.sentAt = new Date().toISOString();
    } else {
      alert.failedAt = new Date().toISOString();
      alert.error = results.find((r) => !r.success)?.error;
    }

    // Update stats
    this.updateStats(alert, results);
    await this.saveState();

    return {
      alertId: alert.id,
      success: alert.status === "sent",
      results,
      timestamp: alert.timestamp,
    };
  }

  /**
   * Get channels for a severity level
   */
  private getChannelsForSeverity(severity: AlertSeverity): AlertChannelType[] {
    // Filter enabled channels that accept this severity
    const enabledChannels = Object.entries(this.state.config.channels)
      .filter(([_, ch]) => ch.enabled)
      .map(([type, _]) => type as AlertChannelType);

    const routingChannels = this.state.config.severityRouting[severity] || ["log"];

    return routingChannels.filter((c) => enabledChannels.includes(c));
  }

  /**
   * Get channel instance
   */
  private getChannel(type: AlertChannelType): SlackChannel | WebhookChannel | LogChannel | null {
    const channelConfig = this.state.config.channels[type];
    if (!channelConfig?.enabled) return null;

    switch (type) {
      case "slack":
        return createSlackChannel(channelConfig.config as any);
      case "webhook":
        return createWebhookChannel(channelConfig.config as any);
      case "log":
        return createLogChannel(channelConfig.config as any);
      case "email":
        // Email not implemented yet
        return null;
      default:
        return null;
    }
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(
    channel: SlackChannel | WebhookChannel | LogChannel,
    type: AlertChannelType,
    payload: NotificationPayload
  ): Promise<ChannelResult> {
    try {
      return await channel.send(payload);
    } catch (error) {
      return {
        channel: type,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update statistics
   */
  private updateStats(alert: Alert, results: ChannelResult[]): void {
    const stats = this.state.stats;

    // Update totals
    stats.total++;
    stats.byStatus[alert.status]++;
    stats.bySeverity[alert.severity]++;

    // Update channel stats
    results.forEach((result) => {
      if (result.success) {
        stats.byChannel[result.channel]++;
      }
    });

    // Update last 24h
    const dayAgo = Date.now() - 86400000;
    stats.last24h = this.state.alerts.filter(
      (a) => new Date(a.timestamp).getTime() > dayAgo
    ).length;

    // Update last alert
    if (alert.status === "sent") {
      stats.lastAlert = alert;
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(limit?: number): Alert[] {
    let alerts = [...this.state.alerts].reverse();
    if (limit) {
      alerts = alerts.slice(0, limit);
    }
    return alerts;
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    return { ...this.state.stats };
  }

  /**
   * Get configuration
   */
  getConfig(): AlertConfig {
    return { ...this.state.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(config: Partial<AlertConfig>): Promise<void> {
    this.state.config = { ...this.state.config, ...config };
    await this.saveState();
  }

  /**
   * Clear old alerts
   */
  async clearOldAlerts(olderThanDays: number = 7): Promise<number> {
    const cutoff = Date.now() - olderThanDays * 86400000;
    const originalLength = this.state.alerts.length;
    this.state.alerts = this.state.alerts.filter(
      (a) => new Date(a.timestamp).getTime() > cutoff
    );
    const cleared = originalLength - this.state.alerts.length;
    if (cleared > 0) {
      await this.saveState();
    }
    return cleared;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.state.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = "acknowledged";
      await this.saveState();
      return true;
    }
    return false;
  }

  /**
   * Test alert configuration
   */
  async testAlert(): Promise<AlertResult> {
    return this.sendAlert(
      "info",
      "Test Alert",
      "This is a test alert to verify your notification configuration is working correctly.",
      { test: true },
      "monitor"
    );
  }
}

/**
 * Singleton instance
 */
let notifierInstance: AlertNotifier | null = null;

/**
 * Get or create the singleton notifier instance
 */
export function getNotifier(config?: Partial<AlertConfig>): AlertNotifier {
  if (!notifierInstance) {
    notifierInstance = new AlertNotifier(config);
  }
  return notifierInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetNotifier(): void {
  notifierInstance = null;
}

/**
 * Convenience function to send an alert
 */
export async function sendAlert(
  severity: AlertSeverity,
  title: string,
  message: string,
  metadata?: Record<string, unknown>,
  source?: string
): Promise<AlertResult> {
  const notifier = getNotifier();
  return notifier.sendAlert(severity, title, message, metadata, source);
}
