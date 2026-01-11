/**
 * Alerting Types
 * Type definitions for alert system
 */

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertStatus = "pending" | "sent" | "failed" | "acknowledged";

export type AlertChannelType = "slack" | "webhook" | "email" | "log";

export interface AlertChannel {
  type: AlertChannelType;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface SlackChannelConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
  severity?: AlertSeverity[];
}

export interface WebhookChannelConfig {
  url: string;
  method?: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  severity?: AlertSeverity[];
}

export interface EmailChannelConfig {
  address: string;
  subject?: string;
  severity?: AlertSeverity[];
}

export interface LogChannelConfig {
  level?: "debug" | "info" | "warn" | "error";
  path?: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  source: string;
  timestamp: string;
  sentAt?: string;
  failedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  channels: AlertChannelType[];
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: AlertCondition;
  actions: AlertAction[];
  cooldownSeconds?: number;
  lastTriggered?: string;
}

export interface AlertCondition {
  type: "threshold" | "rate" | "pattern" | "circuit" | "agent_stale";
  metric?: string;
  operator?: ">" | "<" | ">=" | "<=" | "==" | "!=";
  threshold?: number;
  windowSeconds?: number;
}

export interface AlertAction {
  type: "notify" | "webhook" | "terminate" | "pause";
  channels: AlertChannelType[];
  message?: string;
}

export interface AlertConfig {
  enabled: boolean;
  globalCooldown: number;
  channels: Record<AlertChannelType, AlertChannel>;
  rules: AlertRule[];
  severityRouting: Record<AlertSeverity, AlertChannelType[]>;
}

export interface AlertStats {
  total: number;
  byStatus: Record<AlertStatus, number>;
  bySeverity: Record<AlertSeverity, number>;
  byChannel: Record<AlertChannelType, number>;
  last24h: number;
  lastAlert?: Alert;
}

export interface NotificationPayload {
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  source?: string;
}

export interface ChannelResult {
  channel: AlertChannelType;
  success: boolean;
  error?: string;
  sentAt?: string;
}

export interface AlertResult {
  alertId: string;
  success: boolean;
  results: ChannelResult[];
  timestamp: string;
}
