/**
 * Status Page
 * Dedicated page for system monitoring status (Loki Mode pattern)
 */

"use client";

import { StatusBar } from "@/components/ui";
import Link from "next/link";
import { MetricsCard } from "@/components/ui";

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="font-medium">Status</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            📊 System Status
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time monitoring status following Loki Mode patterns
          </p>
        </header>

        {/* Status Bar */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Current Status
            </h2>
            <Link
              href="/"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Back to Dashboard
            </Link>
          </div>
          <StatusBar showFileContent pollInterval={5000} />
        </section>

        {/* Quick Stats */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Quick Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricsCard
              title="Status Directory"
              value=".claude-monitor"
              icon="📁"
            />
            <MetricsCard
              title="Status File"
              value="STATUS.txt"
              icon="📄"
            />
            <MetricsCard
              title="Update Interval"
              value="5s"
              icon="🔄"
            />
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            About Status Monitoring
          </h2>
          <div className="prose dark:prose-invert text-sm text-slate-700 dark:text-slate-300">
            <p>
              This page displays the real-time system status following the <strong>Loki Mode</strong> pattern.
              The status is maintained in a <code>STATUS.txt</code> file that updates every 5 seconds.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>IDLE</strong>: System is idle, no active monitoring</li>
              <li><strong>MONITORING</strong>: Active monitoring in progress</li>
              <li><strong>ALERT</strong>: Alert condition detected</li>
            </ul>
            <p className="mt-3">
              The status file is located at <code>.claude-monitor/STATUS.txt</code> in your project root.
            </p>
          </div>
        </section>

        {/* Status API Info */}
        <section className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            API Endpoints
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">GET /api/status</code>
              <p className="text-blue-800 dark:text-blue-200 mt-1">Fetch current system status</p>
            </div>
            <div>
              <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">POST /api/status</code>
              <p className="text-blue-800 dark:text-blue-200 mt-1">Update system status (for external systems)</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
