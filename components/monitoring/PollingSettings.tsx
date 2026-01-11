/**
 * PollingSettings Component
 * User-configurable polling settings for real-time updates
 */

"use client";

import { useState, useEffect } from "react";

export interface PollingSettingsProps {
  defaultInterval?: number; // milliseconds
  onIntervalChange?: (interval: number) => void;
  onToggle?: (enabled: boolean) => void;
}

export function PollingSettings({
  defaultInterval = 5000,
  onIntervalChange,
  onToggle,
}: PollingSettingsProps) {
  const [enabled, setEnabled] = useState(true);
  const [interval, setInterval] = useState(defaultInterval);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("polling-settings");
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        setEnabled(settings.enabled ?? true);
        setInterval(settings.interval ?? defaultInterval);
      } catch {
        // Ignore parse errors
      }
    }
  }, [defaultInterval]);

  // Save settings to localStorage and notify parent
  useEffect(() => {
    const settings = { enabled, interval };
    localStorage.setItem("polling-settings", JSON.stringify(settings));
    onIntervalChange?.(interval);
    onToggle?.(enabled);
  }, [enabled, interval, onIntervalChange, onToggle]);

  const presets = [
    { label: "Real-time", value: 1000, description: "1 second" },
    { label: "Fast", value: 3000, description: "3 seconds" },
    { label: "Normal", value: 5000, description: "5 seconds" },
    { label: "Slow", value: 10000, description: "10 seconds" },
    { label: "Manual", value: 0, description: "No polling" },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Real-time Updates</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
        >
          {showAdvanced ? "Hide" : "Advanced"}
        </button>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {enabled ? "🟢" : "⚪"} Auto-refresh
          </span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Presets */}
      {enabled && (
        <div className="space-y-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Refresh Rate</label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setInterval(preset.value)}
                className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                  interval === preset.value
                    ? "bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                }`}
              >
                <div className="font-medium">{preset.label}</div>
                <div className="opacity-75">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced: Custom Interval */}
      {showAdvanced && enabled && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-2">
            Custom Interval (milliseconds)
          </label>
          <input
            type="number"
            min="500"
            max="60000"
            step="500"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Recommended: 1000-10000ms. Lower values may impact performance.
          </p>
        </div>
      )}

      {/* Current Status */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Current refresh:</span>
          <span className="font-mono font-medium">
            {enabled && interval > 0 ? `${interval}ms` : "Manual only"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PollingSettings;
