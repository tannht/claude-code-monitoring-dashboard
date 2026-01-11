/**
 * API Route: Memory Entries
 * Server-side endpoint for fetching memory entries from SQLite
 */

import { NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get("namespace") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    const client = getSqliteClient();

    // Get memory entries by namespace or all
    const entries = namespace
      ? client.getMemoryEntries(namespace, limit)
      : client.searchMemory("", limit);

    // Get namespace stats
    const namespaceStats = client.getMemoryEntries("", 1000);
    const stats = namespaceStats.reduce((acc, entry) => {
      acc[entry.namespace] = (acc[entry.namespace] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        entries: entries.map((e) => ({
          key: e.key,
          namespace: e.namespace,
          createdAt: new Date(e.created_at * 1000).toISOString(),
          accessedAt: new Date(e.accessed_at * 1000).toISOString(),
          accessCount: e.access_count,
          size: e.value.length,
        })),
        stats: Object.entries(stats)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        total: Object.values(stats).reduce((sum, c) => sum + c, 0),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch memory entries:", error);
    return NextResponse.json(
      {
        success: false,
        data: { entries: [], stats: [], total: 0 },
        error: error instanceof Error ? error.message : "Failed to fetch memory entries",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
