/**
 * Settings Page
 * Configure monitoring dashboard settings
 */

"use client";

import { useEffect } from "react";
import { AlertConfigForm, DataRetentionForm } from "@/components/settings";
import { IconDatabase } from "@tabler/icons-react";

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
            Configure monitoring, alerts, and data retention
          </p>
        </header>

        {/* Settings Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <AlertConfigForm />
        </div>

        {/* Data Retention */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <IconDatabase size={24} className="text-purple-500" />
            Data Retention Policies
          </h2>
          <DataRetentionForm />
        </div>
      </div>
    </main>
  );
}
