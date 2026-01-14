/**
 * CSV Export Utility
 * Client-side CSV generation and download
 */

export interface CSVColumn {
  key: string;
  label: string;
  formatter?: (value: unknown, data?: Record<string, unknown>) => string;
}

export interface CSVExportOptions {
  filename?: string;
  dateFormat?: "iso" | "locale";
}

/**
 * Convert array of objects to CSV string
 */
export function objectsToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn[],
  options: CSVExportOptions = {}
): string {
  if (data.length === 0) return "";

  const { dateFormat = "iso" } = options;

  // Header row
  const headers = columns.map((col) => escapeCSVValue(col.label));

  // Data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        const formattedValue = col.formatter ? col.formatter(value, item) : formatValue(value, dateFormat);
        return escapeCSVValue(formattedValue);
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Escape CSV value (wrap in quotes if contains comma, quote, or newline)
 */
function escapeCSVValue(value: string): string {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Format value for CSV
 */
function formatValue(value: unknown, dateFormat: "iso" | "locale"): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    return dateFormat === "iso" ? value.toISOString() : value.toLocaleString();
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Trigger CSV download
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", ensureCSVExtension(filename));
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Ensure filename has .csv extension
 */
function ensureCSVExtension(filename: string): string {
  return filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
}
