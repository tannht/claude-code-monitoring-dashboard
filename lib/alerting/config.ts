/**
 * Alerting Configuration
 * Default configurations and presets
 */

import type { AlertConfig, AlertSeverity, AlertChannelType } from "./types";

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: true,
  globalCooldown: 60, // seconds
  channels: {
    slack: {
      type: "slack",
      enabled: false,
      config: {
        webhookUrl: "",
        channel: "#alerts",
        username: "Claude Monitor",
        iconEmoji: ":robot_face:",
        severity: ["critical", "high"],
      },
    },
    webhook: {
      type: "webhook",
      enabled: false,
      config: {
        url: "",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        severity: ["critical", "high", "medium"],
      },
    },
    email: {
      type: "email",
      enabled: false,
      config: {
        address: "",
        subject: "[Claude Monitor Alert]",
        severity: ["critical"],
      },
    },
    log: {
      type: "log",
      enabled: true,
      config: {
        level: "info",
        path: ".claude-monitor/logs/alerts.log",
      },
    },
  },
  rules: [
    {
      id: "circuit-open",
      name: "Circuit Breaker Opened",
      enabled: true,
      condition: {
        type: "circuit",
      },
      actions: [
        {
          type: "notify",
          channels: ["slack", "log"],
          message: "Circuit breaker '{circuit}' has opened due to {failureCount} failures",
        },
      ],
      cooldownSeconds: 300,
    },
    {
      id: "agent-stale",
      name: "Agent Stale Detection",
      enabled: true,
      condition: {
        type: "agent_stale",
      },
      actions: [
        {
          type: "notify",
          channels: ["slack", "log"],
          message: "Agent '{agentId}' has not sent heartbeat in {timeout} seconds",
        },
      ],
      cooldownSeconds: 600,
    },
    {
      id: "high-failure-rate",
      name: "High Query Failure Rate",
      enabled: true,
      condition: {
        type: "rate",
        metric: "query_failure_rate",
        operator: ">",
        threshold: 0.5,
        windowSeconds: 300,
      },
      actions: [
        {
          type: "notify",
          channels: ["slack", "log"],
          message: "Query failure rate is {rate}% over the last 5 minutes",
        },
      ],
      cooldownSeconds: 300,
    },
    {
      id: "stuck-queries",
      name: "Stuck Queries Detected",
      enabled: true,
      condition: {
        type: "threshold",
        metric: "stuck_query_count",
        operator: ">",
        threshold: 3,
      },
      actions: [
        {
          type: "notify",
          channels: ["slack", "log"],
          message: "{count} queries have been running longer than {timeout} seconds",
        },
      ],
      cooldownSeconds: 180,
    },
  ],
  severityRouting: {
    critical: ["slack", "webhook", "email", "log"],
    high: ["slack", "webhook", "log"],
    medium: ["slack", "log"],
    low: ["log"],
    info: ["log"],
  },
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: "#DC2626", // red-600
  high: "#EA580C", // orange-600
  medium: "#CA8A04", // yellow-600
  low: "#2563EB", // blue-600
  info: "#4B5563", // gray-600
};

export const SEVERITY_ICONS: Record<AlertSeverity, string> = {
  critical: "🚨",
  high: "⚠️",
  medium: "⚡",
  low: "ℹ️",
  info: "📝",
};

export const SEVERITY_ORDER: AlertSeverity[] = ["critical", "high", "medium", "low", "info"];

export function getDefaultChannelsForSeverity(severity: AlertSeverity): AlertChannelType[] {
  return DEFAULT_ALERT_CONFIG.severityRouting[severity] || ["log"];
}

export function getSeverityColor(severity: AlertSeverity): string {
  return SEVERITY_COLORS[severity];
}

export function getSeverityIcon(severity: AlertSeverity): string {
  return SEVERITY_ICONS[severity];
}

export function isSeverityEnabled(
  severity: AlertSeverity,
  channelType: AlertChannelType,
  config: AlertConfig = DEFAULT_ALERT_CONFIG
): boolean {
  const routing = config.severityRouting[severity] || [];
  return routing.includes(channelType);
}
