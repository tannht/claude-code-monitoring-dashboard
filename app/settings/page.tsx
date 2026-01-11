/**
 * Settings Page
 * Configure monitoring dashboard settings
 */

"use client";

import { useEffect } from "react";
import { AlertConfigForm } from "@/components/settings";

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Settings - Claude Code Monitoring";
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            ⚙️ Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure monitoring, alerts, and notification channels
          </p>
        </header>

        {/* Settings Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <AlertConfigForm />
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ About Alert Configuration
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Slack</strong>: Send alerts to Slack channels using webhooks</li>
            <li>• <strong>Webhook</strong>: Send alerts to any generic webhook endpoint</li>
            <li>• <strong>Email</strong>: Email notifications (coming soon)</li>
            <li>• <strong>Log</strong>: Always enabled, logs to .claude-monitor/logs/alerts.log</li>
          </ul>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
            💡 Tip: Use the Test Alert button to verify your configuration before saving
          </p>
        </div>
      </div>
    </main>
  );
}
