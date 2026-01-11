/**
 * API Route: Circuit Breaker
 * Server-side endpoint for circuit breaker state management
 */

import { NextResponse } from "next/server";
import { getCircuitRegistry } from "@/lib/circuit-breaker/breaker";

/**
 * GET /api/circuit-breaker
 * Returns circuit breaker states
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const stats = searchParams.get("stats") === "true";

    const registry = getCircuitRegistry();

    // Get specific circuit
    if (name) {
      const circuit = registry.get(name);
      if (stats) {
        return NextResponse.json({
          success: true,
          data: circuit.getStats(),
          timestamp: new Date().toISOString(),
        });
      }
      return NextResponse.json({
        success: true,
        data: circuit.getState(),
        timestamp: new Date().toISOString(),
      });
    }

    // Get all circuits
    if (stats) {
      const allStats = registry.getAllStats();
      return NextResponse.json({
        success: true,
        data: allStats,
        count: allStats.length,
        summary: registry.getCountByState(),
        timestamp: new Date().toISOString(),
      });
    }

    const allStates = registry.getAllStates();
    return NextResponse.json({
      success: true,
      data: allStates,
      count: allStates.length,
      summary: registry.getCountByState(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch circuit breaker states:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Failed to fetch circuit breaker states",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/circuit-breaker
 * Control circuit breaker (reset, force open, etc.)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const registry = getCircuitRegistry();
    const { name, action } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const circuit = registry.get(name);

    switch (action) {
      case "reset": {
        circuit.reset();
        return NextResponse.json({
          success: true,
          data: circuit.getState(),
          message: "Circuit breaker reset to CLOSED",
          timestamp: new Date().toISOString(),
        });
      }

      case "forceOpen": {
        const reason = body.reason || "Manually opened via API";
        circuit.forceOpen(reason);
        return NextResponse.json({
          success: true,
          data: circuit.getState(),
          message: "Circuit breaker forced to OPEN",
          timestamp: new Date().toISOString(),
        });
      }

      case "recordSuccess": {
        circuit.recordSuccess();
        return NextResponse.json({
          success: true,
          data: circuit.getState(),
          message: "Success recorded",
          timestamp: new Date().toISOString(),
        });
      }

      case "recordFailure": {
        const error = body.error;
        circuit.recordFailure(error);
        return NextResponse.json({
          success: true,
          data: circuit.getState(),
          message: "Failure recorded",
          timestamp: new Date().toISOString(),
        });
      }

      case "remove": {
        const removed = registry.remove(name);
        return NextResponse.json({
          success: removed,
          message: removed ? "Circuit breaker removed" : "Circuit breaker not found",
          timestamp: new Date().toISOString(),
        });
      }

      case "resetAll": {
        registry.resetAll();
        return NextResponse.json({
          success: true,
          message: "All circuit breakers reset",
          data: registry.getAllStates(),
          timestamp: new Date().toISOString(),
        });
      }

      case "clearAll": {
        registry.clear();
        return NextResponse.json({
          success: true,
          message: "All circuit breakers cleared",
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Unknown action. Valid actions: reset, forceOpen, recordSuccess, recordFailure, remove, resetAll, clearAll",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Failed to control circuit breaker:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to control circuit breaker",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
