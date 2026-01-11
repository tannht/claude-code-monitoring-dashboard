/**
 * API Route: Queries
 * Server-side endpoint for query tracking (Kanban board)
 */

import { NextResponse } from "next/server";
import { getQueryTracker } from "@/lib/monitoring/query-tracker";

/**
 * GET /api/queries
 * Returns queries with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const id = searchParams.get("id");
    const agentId = searchParams.get("agentId");
    const stats = searchParams.get("stats") === "true";
    const kanban = searchParams.get("kanban") === "true";

    const tracker = getQueryTracker();

    // Get specific query
    if (id) {
      const query = tracker.getQuery(id);
      if (!query) {
        return NextResponse.json(
          { success: false, error: "Query not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: query,
        timestamp: new Date().toISOString(),
      });
    }

    // Get statistics
    if (stats) {
      return NextResponse.json({
        success: true,
        data: tracker.getStats(),
        timestamp: new Date().toISOString(),
      });
    }

    // Get Kanban data
    if (kanban) {
      return NextResponse.json({
        success: true,
        data: tracker.getKanbanData(),
        timestamp: new Date().toISOString(),
      });
    }

    // Filter by status
    if (status) {
      const queries = tracker.getQueriesByStatus(status as any);
      return NextResponse.json({
        success: true,
        data: queries,
        count: queries.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Filter by agent
    if (agentId) {
      const queries = tracker.filterQueries({ agentId });
      return NextResponse.json({
        success: true,
        data: queries,
        count: queries.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all queries
    const queries = tracker.getAllQueries();
    return NextResponse.json({
      success: true,
      data: queries,
      count: queries.length,
      stats: tracker.getStats(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch queries:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Failed to fetch queries",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/queries
 * Create or update queries
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tracker = getQueryTracker();

    switch (body.action) {
      case "create": {
        const { title, options } = body;
        if (!title) {
          return NextResponse.json(
            { success: false, error: "Missing required field: title" },
            { status: 400 }
          );
        }
        const query = tracker.createQuery(title, options);
        return NextResponse.json({
          success: true,
          data: query,
          message: "Query created",
          timestamp: new Date().toISOString(),
        });
      }

      case "updateStatus": {
        const { id, status } = body;
        if (!id || !status) {
          return NextResponse.json(
            { success: false, error: "Missing required fields: id, status" },
            { status: 400 }
          );
        }
        const query = tracker.updateStatus(id, status);
        if (!query) {
          return NextResponse.json(
            { success: false, error: "Query not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: query,
          message: "Status updated",
          timestamp: new Date().toISOString(),
        });
      }

      case "recordFailure": {
        const { id, error } = body;
        if (!id || !error) {
          return NextResponse.json(
            { success: false, error: "Missing required fields: id, error" },
            { status: 400 }
          );
        }
        const query = tracker.recordFailure(id, error);
        if (!query) {
          return NextResponse.json(
            { success: false, error: "Query not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: query,
          message: "Failure recorded",
          timestamp: new Date().toISOString(),
        });
      }

      case "update": {
        const { id, updates } = body;
        if (!id || !updates) {
          return NextResponse.json(
            { success: false, error: "Missing required fields: id, updates" },
            { status: 400 }
          );
        }
        const query = tracker.updateQuery(id, updates);
        if (!query) {
          return NextResponse.json(
            { success: false, error: "Query not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: query,
          message: "Query updated",
          timestamp: new Date().toISOString(),
        });
      }

      case "delete": {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "Missing required field: id" },
            { status: 400 }
          );
        }
        const deleted = tracker.deleteQuery(id);
        if (!deleted) {
          return NextResponse.json(
            { success: false, error: "Query not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          message: "Query deleted",
          timestamp: new Date().toISOString(),
        });
      }

      case "clearOld": {
        const { keepLast = 100, daysOld = 7 } = body;
        if (body.keepLast !== undefined) {
          tracker.clearOldQueries(keepLast);
        } else {
          tracker.clearOldCompletedQueries(daysOld);
        }
        return NextResponse.json({
          success: true,
          message: "Old queries cleared",
          stats: tracker.getStats(),
          timestamp: new Date().toISOString(),
        });
      }

      case "clear": {
        tracker.clear();
        return NextResponse.json({
          success: true,
          message: "All queries cleared",
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Failed to process query action:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process query action",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/queries
 * Clear queries
 */
export async function DELETE() {
  try {
    const tracker = getQueryTracker();
    tracker.clear();
    return NextResponse.json({
      success: true,
      message: "All queries cleared",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to clear queries:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear queries",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
