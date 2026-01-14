/**
 * ExportButton Component
 * Reusable export button with format selection and date range filtering
 */

"use client";

import { useState } from "react";
import { objectsToCSV, downloadCSV, toJSON, downloadJSON, type CSVColumn } from "@/lib/export";

export type ExportFormat = "csv" | "json";

export interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: CSVColumn[];
  filename: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: string;
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  label = "Export",
  variant = "secondary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  icon = "📥",
}: ExportButtonProps<T>) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (selectedFormat: ExportFormat) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const fullFilename = `${filename}-${timestamp}`;

    if (selectedFormat === "csv") {
      const csv = objectsToCSV(data, columns);
      downloadCSV(csv, fullFilename);
    } else {
      const json = toJSON(data, { pretty: true });
      downloadJSON(json, fullFilename);
    }

    setShowMenu(false);
  };

  const variantClasses: Record<string, string> = {
    primary: "bg-primary-600 text-white hover:bg-primary-700",
    secondary: "bg-slate-600 text-white hover:bg-slate-700",
    outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
  };

  const sizeClasses: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => handleExport(format)}
        disabled={disabled || loading || data.length === 0}
        className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
      >
        {loading ? "⏳" : icon}
        <span>{loading ? "Exporting..." : label}</span>
      </button>

      {/* Format Selector Dropdown */}
      <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10 min-w-[150px]">
        <button
          onClick={() => setFormat("csv")}
          className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 ${
            format === "csv" ? "bg-slate-50 dark:bg-slate-700" : ""
          }`}
        >
          <span className={format === "csv" ? "✓" : ""}>CSV</span>
        </button>
        <button
          onClick={() => setFormat("json")}
          className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 ${
            format === "json" ? "bg-slate-50 dark:bg-slate-700" : ""
          }`}
        >
          <span className={format === "json" ? "✓" : ""}>JSON</span>
        </button>
      </div>
    </div>
  );
}

export default ExportButton;
