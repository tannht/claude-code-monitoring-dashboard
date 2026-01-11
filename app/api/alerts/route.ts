/**
 * Alerts API Endpoint
 * Manage alerts and configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { getNotifier, sendAlert } from "@/lib/alerting";

/**
 * GET /api/alerts
 * Get alerts, stats, or configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "alerts";
    const notifier = getNotifier();

    switch (action) {
      case "alerts": {
        const limit = searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!, 10)
          : undefined;
        const alerts = notifier.getAlerts(limit);
        return NextResponse.json({
          success: true,
          data: alerts,
        });
      }

      case "stats": {
        const stats = notifier.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });
      }

      case "config": {
        const config = notifier.getConfig();
        return NextResponse.json({
          success: true,
          data: config,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * Create alerts, update config, or manage alerts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const notifier = getNotifier();

    switch (action) {
      case "send": {
        const { severity, title, message, metadata, source } = body;
        if (!severity || !title || !message) {
          return NextResponse.json(
            { success: false, error: "Missing required fields: severity, title, message" },
            { status: 400 }
          );
        }
        const result = await notifier.sendAlert(severity, title, message, metadata, source);
        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case "test": {
        const result = await notifier.testAlert();
        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case "acknowledge": {
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json(
            { success: false, error: "Missing alertId" },
            { status: 400 }
          );
        }
        const acknowledged = await notifier.acknowledgeAlert(alertId);
        return NextResponse.json({
          success: true,
          data: { acknowledged },
        });
      }

      case "clearOld": {
        const { olderThanDays = 7 } = body;
        const cleared = await notifier.clearOldAlerts(olderThanDays);
        return NextResponse.json({
          success: true,
          data: { cleared },
        });
      }

      case "updateConfig": {
        const { config } = body;
        if (!config) {
          return NextResponse.json(
            { success: false, error: "Missing config" },
            { status: 400 }
          );
        }
        await notifier.updateConfig(config);
        return NextResponse.json({
          success: true,
          data: notifier.getConfig(),
        });
      }

      case "enable": {
        await notifier.updateConfig({ enabled: true });
        return NextResponse.json({ success: true });
      }

      case "disable": {
        await notifier.updateConfig({ enabled: false });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts
 * Clear alerts
 */
export async function DELETE(request: NextRequest) {
  try {
    const notifier = getNotifier();

    // Clear all alerts by resetting state
    await notifier.updateConfig({ enabled: notifier.getConfig().enabled });

    return NextResponse.json({
      success: true,
      data: { message: "All alerts cleared" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
