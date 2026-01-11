/**
 * Slack Alert Channel
 * Send alerts to Slack via webhook
 */

import type { SlackChannelConfig, NotificationPayload, ChannelResult } from "../types";

export interface SlackMessage {
  text?: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
  username?: string;
  icon_emoji?: string;
  channel?: string;
}

export interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields?: SlackField[];
  footer?: string;
  ts?: number;
}

export interface SlackBlock {
  type: string;
  text?: SlackText;
  fields?: SlackField[];
}

export interface SlackText {
  type: string;
  text: string;
  emoji?: boolean;
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#CA8A04",
  low: "#2563EB",
  info: "#4B5563",
};

export class SlackChannel {
  private config: SlackChannelConfig;

  constructor(config: SlackChannelConfig) {
    this.config = config;
  }

  /**
   * Send notification to Slack
   */
  async send(payload: NotificationPayload): Promise<ChannelResult> {
    const startTime = Date.now();

    try {
      if (!this.config.webhookUrl) {
        throw new Error("Slack webhook URL is not configured");
      }

      const message = this.formatMessage(payload);
      const response = await fetch(this.config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return {
        channel: "slack",
        success: true,
        sentAt: new Date(startTime).toISOString(),
      };
    } catch (error) {
      return {
        channel: "slack",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Format notification payload as Slack message
   */
  private formatMessage(payload: NotificationPayload): SlackMessage {
    const { severity, title, message, timestamp, metadata, source } = payload;
    const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;

    const fields: SlackField[] = [
      {
        title: "Severity",
        value: severity.toUpperCase(),
        short: true,
      },
      {
        title: "Time",
        value: new Date(timestamp).toLocaleString(),
        short: true,
      },
    ];

    if (source) {
      fields.push({
        title: "Source",
        value: source,
        short: true,
      });
    }

    // Add metadata fields
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (fields.length < 6) {
          // Slack allows up to 6 fields max in compact view
          fields.push({
            title: key,
            value: String(value),
            short: true,
          });
        }
      });
    }

    return {
      username: this.config.username || "Claude Monitor",
      icon_emoji: this.config.iconEmoji || ":robot_face:",
      channel: this.config.channel,
      attachments: [
        {
          color,
          title,
          text: message,
          fields,
          footer: "Claude Code Monitoring Dashboard",
          ts: Math.floor(new Date(timestamp).getTime() / 1000),
        },
      ],
    };
  }

  /**
   * Test webhook connection
   */
  async test(): Promise<boolean> {
    try {
      const result = await this.send({
        severity: "info",
        title: "Test Alert",
        message: "This is a test notification from Claude Code Monitoring Dashboard",
        timestamp: new Date().toISOString(),
      });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; error?: string } {
    if (!this.config.webhookUrl) {
      return { valid: false, error: "Webhook URL is required" };
    }

    try {
      new URL(this.config.webhookUrl);
    } catch {
      return { valid: false, error: "Invalid webhook URL" };
    }

    return { valid: true };
  }
}

/**
 * Create Slack channel from config
 */
export function createSlackChannel(config: SlackChannelConfig): SlackChannel {
  return new SlackChannel(config);
}
