/**
 * API Route: SQLite Messages Data
 * Server-side endpoint for fetching inter-agent communication data
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit");
    const fromAgentId = searchParams.get("fromAgentId");
    const toAgentId = searchParams.get("toAgentId");
    const messageType = searchParams.get("messageType");
    const recent = searchParams.get("recent");

    const client = getSqliteClient();

    let messages;
    if (recent === "true") {
      messages = client.getRecentMessages(limit ? parseInt(limit, 10) : 50);
    } else {
      messages = client.getMessages(
        fromAgentId || undefined,
        toAgentId || undefined,
        messageType || undefined,
        limit ? parseInt(limit, 10) : 100
      );
    }

    return NextResponse.json({
      success: true,
      data: messages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch messages",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
