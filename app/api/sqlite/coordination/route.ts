/**
 * API Route: Coordination Stats
 * Server-side endpoint for fetching coordination/memory metrics
 */

import { NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET() {
  try {
    const client = getSqliteClient();

    // Get memory entries with coordination namespace
    const coordinationEntries = client.getMemoryEntries("coordination", 100);
    const commandHistory = client.getMemoryEntries("command-history", 100);
    const performanceMetrics = client.getMemoryEntries("performance-metrics", 100);

    // Parse coordination data
    const activeAgents = coordinationEntries
      .filter((e) => {
        try {
          const data = JSON.parse(e.value);
          return data.active === true;
        } catch {
          return false;
        }
      })
      .map((e) => {
        try {
          const data = JSON.parse(e.value);
          return {
            id: e.key.split(":")[1] || e.key,
            type: data.type || "unknown",
            lastActive: new Date(e.accessed_at * 1000).toISOString(),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Get command metrics
    let totalCommands = 0;
    let successRate = 1;
    commandHistory.forEach((entry) => {
      try {
        const data = JSON.parse(entry.value);
        if (entry.key === "command-metrics-summary") {
          totalCommands = data.totalCommands || 0;
          successRate = data.successRate || 1;
        }
      } catch {}
    });

    return NextResponse.json({
      success: true,
      data: {
        activeAgents: activeAgents.length,
        agents: activeAgents,
        totalCommands,
        successRate: successRate * 100,
        coordinationEntries: coordinationEntries.length,
        performanceEntries: performanceMetrics.length,
        lastActivity: coordinationEntries[0]
          ? new Date(coordinationEntries[0].accessed_at * 1000).toISOString()
          : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch coordination stats:", error);
    return NextResponse.json(
      {
        success: false,
        data: {
          activeAgents: 0,
          agents: [],
          totalCommands: 0,
          successRate: 0,
          coordinationEntries: 0,
          performanceEntries: 0,
        },
        error: error instanceof Error ? error.message : "Failed to fetch coordination stats",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
