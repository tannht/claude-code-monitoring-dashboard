/**
 * AlertConfigForm Component
 * Configure alert channels and rules
 */

"use client";

import { useState, useEffect } from "react";
import type { AlertConfig, AlertChannelType, AlertSeverity } from "@/lib/alerting";

const CHANNELS: { type: AlertChannelType; label: string; icon: string }[] = [
  { type: "slack", label: "Slack", icon: "💬" },
  { type: "webhook", label: "Webhook", icon: "🔗" },
  { type: "email", label: "Email", icon: "📧" },
  { type: "log", label: "Log", icon: "📝" },
];

const SEVERITIES: { value: AlertSeverity; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "text-red-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "low", label: "Low", color: "text-blue-600" },
  { value: "info", label: "Info", color: "text-gray-600" },
];

export interface AlertConfigFormProps {
  onSave?: (config: AlertConfig) => void;
}

export function AlertConfigForm({ onSave }: AlertConfigFormProps) {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"channels" | "rules" | "routing">("channels");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/alerts?action=config");
      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateConfig", config }),
      });
      const result = await response.json();
      if (result.success) {
        onSave?.(result.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config) return;
    setTestResult(null);
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const result = await response.json();
      if (result.success) {
        const { success, results } = result.data;
        setTestResult({
          success: success || results.some((r: any) => r.success),
          message: success
            ? "Test alert sent successfully!"
            : `Partial success: ${results.filter((r: any) => r.success).length}/${results.length} channels`,
        });
      }
    } catch (error) {
      setTestResult({ success: false, message: "Failed to send test alert" });
    }
  };

  const toggleChannel = (type: AlertChannelType) => {
    if (!config) return;
    setConfig({
      ...config,
      channels: {
        ...config.channels,
        [type]: {
          ...config.channels[type],
          enabled: !config.channels[type].enabled,
        },
      },
    });
  };

  const toggleSeverity = (channelType: AlertChannelType, severity: AlertSeverity) => {
    if (!config) return;
    const currentSeverities = (config.channels[channelType].config.severity as AlertSeverity[]) || [];
    const newSeverities = currentSeverities.includes(severity)
      ? currentSeverities.filter((s) => s !== severity)
      : [...currentSeverities, severity];
    setConfig({
      ...config,
      channels: {
        ...config.channels,
        [channelType]: {
          ...config.channels[channelType],
          config: {
            ...config.channels[channelType].config,
            severity: newSeverities,
          },
        },
      },
    });
  };

  const updateChannelConfig = (type: AlertChannelType, key: string, value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      channels: {
        ...config.channels,
        [type]: {
          ...config.channels[type],
          config: {
            ...config.channels[type].config,
            [key]: value,
          },
        },
      },
    });
  };

  if (loading) {
    return <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-64 rounded-lg" />;
  }

  if (!config) {
    return <div className="text-red-600">Failed to load configuration</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            🔔 Alert Configuration
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure notification channels and alert rules
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            🧪 Test Alert
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save Config"}
          </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-3 rounded-lg ${testResult.success ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200" : "bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200"}`}>
          {testResult.message}
        </div>
      )}

      {/* Global Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white">Enable Alerts</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              When disabled, no alerts will be sent
            </p>
          </div>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`w-12 h-6 rounded-full transition-colors ${
              config.enabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                config.enabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4">
          {(["channels", "rules", "routing"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Channels Tab */}
      {activeTab === "channels" && (
        <div className="space-y-4">
          {CHANNELS.map((channel) => {
            const channelConfig = config.channels[channel.type];
            const isEnabled = channelConfig.enabled;

            return (
              <div
                key={channel.type}
                className={`bg-white dark:bg-slate-800 rounded-lg border ${
                  isEnabled ? "border-slate-200 dark:border-slate-700" : "border-slate-100 dark:border-slate-800 opacity-60"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{channel.icon}</span>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {channel.label}
                      </h3>
                    </div>
                    <button
                      onClick={() => toggleChannel(channel.type)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        isEnabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isEnabled ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Channel-specific config */}
                  {isEnabled && (
                    <div className="space-y-3">
                      {channel.type === "slack" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Webhook URL
                            </label>
                            <input
                              type="url"
                              value={(channelConfig.config.webhookUrl as string) || ""}
                              onChange={(e) => updateChannelConfig(channel.type, "webhookUrl", e.target.value)}
                              placeholder="https://hooks.slack.com/services/..."
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Channel (optional)
                            </label>
                            <input
                              type="text"
                              value={(channelConfig.config.channel as string) || ""}
                              onChange={(e) => updateChannelConfig(channel.type, "channel", e.target.value)}
                              placeholder="#alerts"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                            />
                          </div>
                        </>
                      )}

                      {channel.type === "webhook" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Webhook URL
                            </label>
                            <input
                              type="url"
                              value={(channelConfig.config.url as string) || ""}
                              onChange={(e) => updateChannelConfig(channel.type, "url", e.target.value)}
                              placeholder="https://your-webhook-url.com/alerts"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                            />
                          </div>
                        </>
                      )}

                      {channel.type === "email" && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={(channelConfig.config.address as string) || ""}
                            onChange={(e) => updateChannelConfig(channel.type, "address", e.target.value)}
                            placeholder="alerts@example.com"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                          />
                        </div>
                      )}

                      {/* Severity selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Alert Severities
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {SEVERITIES.map((severity) => {
                            const selected = (channelConfig.config.severity as AlertSeverity[])?.includes(severity.value);
                            return (
                              <button
                                key={severity.value}
                                onClick={() => toggleSeverity(channel.type, severity.value)}
                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                                  selected
                                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                                }`}
                              >
                                {severity.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {config.rules.map((rule, index) => (
            <div
              key={rule.id}
              className={`bg-white dark:bg-slate-800 rounded-lg border ${
                rule.enabled ? "border-slate-200 dark:border-slate-700" : "border-slate-100 dark:border-slate-800 opacity-60"
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{rule.name}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Condition: {rule.condition.type} | Cooldown: {rule.cooldownSeconds}s
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newRules = [...config.rules];
                      newRules[index].enabled = !newRules[index].enabled;
                      setConfig({ ...config, rules: newRules });
                    }}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      rule.enabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        rule.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Actions: {rule.actions.map((a) => a.type).join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Routing Tab */}
      {activeTab === "routing" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure which channels receive alerts based on severity level.
          </p>
          {SEVERITIES.map((severity) => {
            const channels = config.severityRouting[severity.value] || [];
            return (
              <div
                key={severity.value}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${severity.color}`}>
                    {severity.label} Alerts
                  </span>
                  <div className="flex gap-2">
                    {CHANNELS.map((channel) => {
                      const isSelected = channels.includes(channel.type);
                      return (
                        <button
                          key={channel.type}
                          onClick={() => {
                            const newChannels = isSelected
                              ? channels.filter((c) => c !== channel.type)
                              : [...channels, channel.type];
                            setConfig({
                              ...config,
                              severityRouting: {
                                ...config.severityRouting,
                                [severity.value]: newChannels,
                              },
                            });
                          }}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            isSelected
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {channel.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
