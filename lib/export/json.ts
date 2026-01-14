/**
 * JSON Export Utility
 * Client-side JSON generation and download
 */

export interface JSONExportOptions {
  filename?: string;
  pretty?: boolean;
  indent?: number;
}

/**
 * Convert data to JSON string
 */
export function toJSON<T>(data: T, options: JSONExportOptions = {}): string {
  const { pretty = true, indent = 2 } = options;

  try {
    return JSON.stringify(data, null, pretty ? indent : 0);
  } catch (error) {
    console.error("Failed to serialize to JSON:", error);
    return JSON.stringify({ error: "Failed to serialize data" }, null, indent);
  }
}

/**
 * Trigger JSON download
 */
export function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", ensureJSONExtension(filename));
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Ensure filename has .json extension
 */
function ensureJSONExtension(filename: string): string {
  return filename.toLowerCase().endsWith(".json") ? filename : `${filename}.json`;
}
