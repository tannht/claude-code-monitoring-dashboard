/**
 * API Route: SQLite Agent Data
 * Server-side endpoint for fetching agent statistics from SQLite
 */

import { NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET() {
  try {
    const client = getSqliteClient();
    const stats = client.getAgentStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch agent stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch agent stats",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
