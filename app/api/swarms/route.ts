/**
 * Swarms API
 * Provides swarm data for comparison view
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];

    const client = getSqliteClient();

    // Get all swarms for selection
    const allSwarms = client.getActiveSwarms();

    // If specific swarm IDs requested, filter and get detailed comparison data
    if (ids.length > 0) {
      const comparisonData = ids.map((swarmId) => {
        const swarm = allSwarms.find((s) => s.id === swarmId);
        if (!swarm) return null;

        // Get agents for this swarm
        const swarmAgents = client.getAgentsByStatus().filter((a) => a.swarm_id === swarmId);

        // Calculate swarm metrics
        const activeAgents = swarmAgents.filter((a) => a.status === "active" || a.status === "busy").length;
        const avgPerformance = swarmAgents.length > 0
          ? swarmAgents.reduce((sum, a) => sum + (a.performance_score || 0), 0) / swarmAgents.length
          : 0;
        const totalTasks = swarmAgents.reduce((sum, a) => sum + (a.task_count || 0), 0);

        // Get recent messages for this swarm
        const swarmMessages = client.getMessages().filter((m) => {
          const agentIds = swarmAgents.map((a) => a.id);
          return agentIds.includes(m.fromAgentId) || agentIds.includes(m.toAgentId || "");
        });

        return {
          id: swarm.id,
          name: swarm.name,
          objective: swarm.objective,
          status: swarm.status,
          queenType: swarm.queenType,
          topology: swarm.topology,
          maxAgents: swarm.maxAgents,
          createdAt: swarm.created_at,
          updatedAt: swarm.updated_at,
          metrics: {
            agentCount: swarmAgents.length,
            activeAgents,
            avgPerformance: Math.round(avgPerformance),
            totalTasks,
            completedTasks: swarmAgents.reduce((sum, a) => sum + (a.success_rate || 0) * (a.task_count || 0) / 100, 0),
            messageCount: swarmMessages.length,
          },
          agents: swarmAgents.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            status: a.status,
            performanceScore: a.performance_score,
            taskCount: a.task_count,
            successRate: a.success_rate,
          })),
        };
      }).filter(Boolean);

      return NextResponse.json({
        success: true,
        data: {
          swarms: comparisonData,
        },
      });
    }

    // Return all swarms for selection
    return NextResponse.json({
      success: true,
      data: {
        swarms: allSwarms.map((s) => ({
          id: s.id,
          name: s.name,
          objective: s.objective,
          status: s.status,
          queenType: s.queenType,
          topology: s.topology,
          maxAgents: s.maxAgents,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error("Swarms API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch swarms data",
      },
      { status: 500 }
    );
  }
}
