/**
 * Data Retention API
 * Configure retention policies, generate compliance reports, and storage optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";
import { readFileSync, statSync } from "fs";
import { join } from "path";

interface RetentionConfig {
  tasks: { days: number; archive: boolean };
  messages: { days: number; archive: boolean };
  metrics: { days: number; archive: boolean };
  patterns: { days: number; archive: boolean };
  trajectories: { days: number; archive: boolean };
}

const DEFAULT_CONFIG: RetentionConfig = {
  tasks: { days: 90, archive: true },
  messages: { days: 60, archive: true },
  metrics: { days: 30, archive: true },
  patterns: { days: 180, archive: true },
  trajectories: { days: 365, archive: true },
};

async function getDbSize(dbPath: string): Promise<number> {
  try {
    const stats = statSync(dbPath);
    return stats.size;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "config";
  const configPath = process.env.SWARM_DB_PATH || "/Users/tannguyen/.swarm/memory.db";
  const hivePath = process.env.HIVE_DB_PATH || "/Users/tannguyen/.hive-mind/hive.db";

  try {
    const client = getSqliteClient();

    if (action === "config") {
      return NextResponse.json({
        success: true,
        data: DEFAULT_CONFIG,
      });
    }

    if (action === "report") {
      const swarmDbSize = await getDbSize(configPath);
      const hiveDbSize = await getDbSize(hivePath);
      const totalSize = swarmDbSize + hiveDbSize;

      const agents = client.getAgentsByStatus();
      const tasks = client.getTasks(100000);
      const messages = client.getRecentMessages(100000);
      const metrics = client.getPerformanceMetrics(undefined, undefined, 365);

      return NextResponse.json({
        success: true,
        data: {
          storage: {
            swarmDb: {
              path: configPath,
              size: swarmDbSize,
              sizeMB: (swarmDbSize / 1024 / 1024).toFixed(2),
            },
            hiveDb: {
              path: hivePath,
              size: hiveDbSize,
              sizeMB: (hiveDbSize / 1024 / 1024).toFixed(2),
            },
            total: {
              size: totalSize,
              sizeMB: (totalSize / 1024 / 1024).toFixed(2),
            },
          },
          dataCounts: {
            agents: agents.length,
            tasks: tasks.length,
            messages: messages.length,
            metrics: metrics.length,
          },
          retention: DEFAULT_CONFIG,
          estimatedSavings: {
            tasks: Math.round(tasks.length * 0.3), // Assuming 30% could be purged
            messages: Math.round(messages.length * 0.5), // Assuming 50% could be purged
            metrics: Math.round(metrics.length * 0.7), // Assuming 70% could be purged
          },
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Retention API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch retention data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    if (action === "update") {
      // In a real implementation, this would save to a config file or database
      // For now, we'll just return success
      return NextResponse.json({
        success: true,
        data: { ...DEFAULT_CONFIG, ...(config || {}) },
        message: "Retention policy updated (configuration not persisted in demo)",
      });
    }

    if (action === "purge") {
      // In a real implementation, this would trigger the actual purge
      return NextResponse.json({
        success: true,
        message: "Purge scheduled (not implemented in demo - database is read-only)",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Retention API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
