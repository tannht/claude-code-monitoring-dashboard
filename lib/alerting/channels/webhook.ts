/**
 * Webhook Alert Channel
 * Send alerts to generic webhooks
 */

import type { WebhookChannelConfig, NotificationPayload, ChannelResult } from "../types";

export interface WebhookPayload {
  alert: {
    severity: string;
    title: string;
    message: string;
    timestamp: string;
    source?: string;
  };
  metadata?: Record<string, unknown>;
  sentAt: string;
}

export class WebhookChannel {
  private config: WebhookChannelConfig;

  constructor(config: WebhookChannelConfig) {
    this.config = config;
  }

  /**
   * Send notification to webhook
   */
  async send(payload: NotificationPayload): Promise<ChannelResult> {
    const startTime = Date.now();

    try {
      if (!this.config.url) {
        throw new Error("Webhook URL is not configured");
      }

      const webhookPayload = this.formatMessage(payload);
      const response = await fetch(this.config.url, {
        method: this.config.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers,
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return {
        channel: "webhook",
        success: true,
        sentAt: new Date(startTime).toISOString(),
      };
    } catch (error) {
      return {
        channel: "webhook",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Format notification payload for webhook
   */
  private formatMessage(payload: NotificationPayload): WebhookPayload {
    return {
      alert: {
        severity: payload.severity,
        title: payload.title,
        message: payload.message,
        timestamp: payload.timestamp,
        source: payload.source,
      },
      metadata: payload.metadata,
      sentAt: new Date().toISOString(),
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
    if (!this.config.url) {
      return { valid: false, error: "Webhook URL is required" };
    }

    try {
      new URL(this.config.url);
    } catch {
      return { valid: false, error: "Invalid webhook URL" };
    }

    return { valid: true };
  }
}

/**
 * Create webhook channel from config
 */
export function createWebhookChannel(config: WebhookChannelConfig): WebhookChannel {
  return new WebhookChannel(config);
}
