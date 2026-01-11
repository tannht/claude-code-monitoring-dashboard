/**
 * API Route: SQLite Task Data
 * Server-side endpoint for fetching task statistics from SQLite
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get("days");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const status = searchParams.get("status");

    const client = getSqliteClient();

    // Return task stats if days parameter is provided
    if (days !== null) {
      const stats = client.getTaskStats(parseInt(days, 10));
      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    }

    // Return tasks list otherwise
    const tasks = client.getTasks(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
      status || undefined
    );

    return NextResponse.json({
      success: true,
      data: tasks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch task data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch task data",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
