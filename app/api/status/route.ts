/**
 * API Route: System Status
 * Server-side endpoint for fetching current system monitoring status
 */

import { NextResponse } from "next/server";
import { getStatusMonitor } from "@/lib/status/monitor";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const STATUS_DIR = ".claude-monitor";
const STATUS_FILE = "STATUS.txt";

/**
 * GET /api/status
 * Returns current system status from STATUS.txt file
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    // Get monitor instance
    const monitor = getStatusMonitor();

    // If refresh requested, trigger a write
    if (refresh) {
      monitor.writeToFile();
    }

    // Read status file directly for most up-to-date data
    const statusPath = join(process.cwd(), STATUS_DIR, STATUS_FILE);

    if (!existsSync(statusPath)) {
      // Initialize status file if it doesn't exist
      monitor.writeToFile();
    }

    const content = readFileSync(statusPath, "utf-8");

    // Parse and return status
    const status = monitor.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        statusFile: content, // Include raw content for display
        statusFilePath: statusPath,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch system status:", error);

    return NextResponse.json(
      {
        success: false,
        data: {
          updated: new Date().toISOString(),
          phase: "IDLE",
          queries: { active: 0, pending: 0, completed: 0, failed: 0 },
          circuitBreakers: {
            state: "CLOSED",
            failureCount: 0,
            failureThreshold: 5,
          },
          statusFile: "",
        },
        error: error instanceof Error ? error.message : "Failed to fetch system status",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/status
 * Update system status (for external updates)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const monitor = getStatusMonitor();

    // Update based on request body
    if (body.phase) {
      monitor.setPhase(body.phase);
    }

    if (body.queries) {
      monitor.updateQueryStats(body.queries);
    }

    if (body.circuitBreaker) {
      if (body.circuitBreaker.state) {
        monitor.setCircuitBreaker(
          body.circuitBreaker.state,
          body.circuitBreaker.failureCount
        );
      }
      if (body.circuitBreaker.cooldownUntil) {
        monitor.setCircuitBreakerCooldown(new Date(body.circuitBreaker.cooldownUntil));
      }
    }

    if (body.lastActivity) {
      monitor.setLastActivity(body.lastActivity);
    }

    // Handle increment operations
    if (body.increment) {
      monitor.incrementQuery(body.increment);
    }

    // Handle auto-refresh toggle
    if (body.autoRefresh === true) {
      monitor.startAutoRefresh();
    } else if (body.autoRefresh === false) {
      monitor.stopAutoRefresh();
    }

    // Handle reset
    if (body.reset === true) {
      monitor.reset();
    }

    const status = monitor.getStatus();

    return NextResponse.json({
      success: true,
      data: status,
      message: "Status updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to update system status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update system status",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
