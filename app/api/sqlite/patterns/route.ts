/**
 * API Route: SQLite Pattern Data
 * Server-side endpoint for fetching pattern data from SQLite
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit");
    const type = searchParams.get("type");

    const client = getSqliteClient();

    let patterns;
    if (type) {
      patterns = client.getPatternsByType(type, limit ? parseInt(limit, 10) : 10);
    } else {
      patterns = client.getTopPatterns(limit ? parseInt(limit, 10) : 20);
    }

    return NextResponse.json({
      success: true,
      data: patterns,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch pattern data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch pattern data",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
