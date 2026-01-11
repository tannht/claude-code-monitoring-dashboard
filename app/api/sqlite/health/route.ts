/**
 * API Route: SQLite Health Check
 * Server-side endpoint for checking SQLite database health
 */

import { NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET() {
  try {
    const client = getSqliteClient();
    const health = client.checkHealth();
    const info = client.getDbInfo();

    return NextResponse.json({
      success: true,
      data: {
        healthy: health.swarmDb && health.hiveDb,
        swarmDb: health.swarmDb,
        hiveDb: health.hiveDb,
        tables: info,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to check database health:", error);
    return NextResponse.json(
      {
        success: false,
        data: {
          healthy: false,
          swarmDb: false,
          hiveDb: false,
        },
        error: error instanceof Error ? error.message : "Database health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
