/**
 * API Route: Agent State
 * Server-side endpoint for fetching and updating agent states
 */

import { NextResponse } from "next/server";
import { getAgentTracker } from "@/lib/state/agent-tracker";

/**
 * GET /api/agents/state
 * Returns all agent states or filtered by query params
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    const tracker = getAgentTracker();

    // Get specific agent
    if (id) {
      const agent = tracker.getAgent(id);
      if (!agent) {
        return NextResponse.json(
          { success: false, error: "Agent not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: agent,
        timestamp: new Date().toISOString(),
      });
    }

    // Filter by status
    if (status) {
      const agents = tracker.getAgentsByStatus(status as any);
      return NextResponse.json({
        success: true,
        data: agents,
        count: agents.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Filter by role
    if (role) {
      const agents = tracker.getAgentsByRole(role);
      return NextResponse.json({
        success: true,
        data: agents,
        count: agents.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all agents
    const agents = tracker.getAllAgents();
    const stats = tracker.getStats();

    return NextResponse.json({
      success: true,
      data: agents,
      stats,
      count: agents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch agent states:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Failed to fetch agent states",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/state
 * Register or update agent state
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tracker = getAgentTracker();

    // Handle different actions
    switch (body.action) {
      case "register": {
        const { id, role, heartbeatInterval, heartbeatTimeout } = body;
        if (!id || !role) {
          return NextResponse.json(
            { success: false, error: "Missing required fields: id, role" },
            { status: 400 }
          );
        }
        const agent = tracker.registerAgent(id, {
          role,
          heartbeatInterval,
          heartbeatTimeout,
        });
        return NextResponse.json({
          success: true,
          data: agent,
          message: "Agent registered successfully",
          timestamp: new Date().toISOString(),
        });
      }

      case "unregister": {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "Missing required field: id" },
            { status: 400 }
          );
        }
        tracker.unregisterAgent(id);
        return NextResponse.json({
          success: true,
          message: "Agent unregistered successfully",
          timestamp: new Date().toISOString(),
        });
      }

      case "heartbeat": {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "Missing required field: id" },
            { status: 400 }
          );
        }
        const success = tracker.heartbeat(id);
        if (!success) {
          return NextResponse.json(
            { success: false, error: "Agent not found" },
            { status: 404 }
          );
        }
        const agent = tracker.getAgent(id);
        return NextResponse.json({
          success: true,
          data: agent,
          message: "Heartbeat recorded",
          timestamp: new Date().toISOString(),
        });
      }

      case "setStatus": {
        const { id, status } = body;
        if (!id || !status) {
          return NextResponse.json(
            { success: false, error: "Missing required fields: id, status" },
            { status: 400 }
          );
        }
        const success = tracker.setAgentStatus(id, status);
        if (!success) {
          return NextResponse.json(
            { success: false, error: "Agent not found" },
            { status: 404 }
          );
        }
        const agent = tracker.getAgent(id);
        return NextResponse.json({
          success: true,
          data: agent,
          message: "Status updated",
          timestamp: new Date().toISOString(),
        });
      }

      case "assignTask": {
        const { id, taskId, description } = body;
        if (!id || !taskId || !description) {
          return NextResponse.json(
            { success: false, error: "Missing required fields: id, taskId, description" },
            { status: 400 }
          );
        }
        const success = tracker.assignTask(id, taskId, description);
        if (!success) {
          return NextResponse.json(
            { success: false, error: "Agent not found" },
            { status: 404 }
          );
        }
        const agent = tracker.getAgent(id);
        return NextResponse.json({
          success: true,
          data: agent,
          message: "Task assigned",
          timestamp: new Date().toISOString(),
        });
      }

      case "completeTask": {
        const { id, success = true } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "Missing required field: id" },
            { status: 400 }
          );
        }
        const result = tracker.completeTask(id, success);
        if (!result) {
          return NextResponse.json(
            { success: false, error: "Agent not found" },
            { status: 404 }
          );
        }
        const agent = tracker.getAgent(id);
        return NextResponse.json({
          success: true,
          data: agent,
          message: "Task completed",
          timestamp: new Date().toISOString(),
        });
      }

      case "updateResources": {
        const { id, tokensUsed, apiCalls, cpuPercent, memoryMB } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: "Missing required field: id" },
            { status: 400 }
          );
        }
        const result = tracker.updateResourceUsage(id, {
          tokensUsed,
          apiCalls,
          cpuPercent,
          memoryMB,
        });
        if (!result) {
          return NextResponse.json(
            { success: false, error: "Agent not found" },
            { status: 404 }
          );
        }
        const agent = tracker.getAgent(id);
        return NextResponse.json({
          success: true,
          data: agent,
          message: "Resource usage updated",
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
    console.error("Failed to update agent state:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update agent state",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
