/**
 * API Route: SQLite Task Trajectories Data
 * Server-side endpoint for fetching task execution paths
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get("taskId");
    const limit = searchParams.get("limit");

    const client = getSqliteClient();

    const trajectories = client.getTaskTrajectories(
      taskId || undefined,
      limit ? parseInt(limit, 10) : 50
    );

    return NextResponse.json({
      success: true,
      data: trajectories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch task trajectories:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch task trajectories",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
