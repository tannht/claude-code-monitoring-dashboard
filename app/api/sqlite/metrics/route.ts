/**
 * API Route: SQLite Daily Metrics
 * Server-side endpoint for fetching daily metrics from SQLite
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get("days");

    const client = getSqliteClient();
    const metrics = client.getDailyMetrics(days ? parseInt(days, 10) : 30);

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch daily metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch daily metrics",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
