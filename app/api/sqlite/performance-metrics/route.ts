/**
 * API Route: SQLite Performance Metrics Data
 * Server-side endpoint for fetching agent performance metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");
    const metricName = searchParams.get("metricName");
    const hours = searchParams.get("hours");

    const client = getSqliteClient();

    const metrics = client.getPerformanceMetrics(
      agentId || undefined,
      metricName || undefined,
      hours ? parseInt(hours, 10) : 24
    );

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch performance metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch performance metrics",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
