/**
 * Cost Optimization API
 * Provides token usage analysis, cost projections, and optimization recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

// Cost configuration (can be moved to env vars in production)
const COST_PER_1K_TOKENS = {
  input: 0.003,  // $0.003 per 1K input tokens
  output: 0.015, // $0.015 per 1K output tokens
};

const DEFAULT_BUDGET = 100; // $100 default monthly budget

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "30"; // days
    const budget = Number(searchParams.get("budget")) || DEFAULT_BUDGET;

    const client = getSqliteClient();

    // Get agent stats for cost analysis
    const agentStats = client.getAgentStats();

    // Calculate token usage and cost per agent
    const agentCosts = agentStats.map((agent) => {
      // Estimate tokens based on task count and performance
      const avgTokensPerTask = 2000; // Estimated average
      const totalTasks = agent.totalTasks || 0;
      const estimatedTokens = totalTasks * avgTokensPerTask;

      // Calculate efficiency score
      const efficiencyScore = agent.successRate || 0;
      const performanceScore = agent.performanceScore || 0;
      const combinedScore = (efficiencyScore + performanceScore) / 2;

      return {
        agentId: agent.agentId,
        agentName: agent.agentName,
        agentType: agent.agentType,
        totalTasks,
        completedTasks: agent.completedTasks || 0,
        successRate: agent.successRate || 0,
        performanceScore: agent.performanceScore || 0,
        estimatedTokens,
        estimatedCost: (estimatedTokens / 1000) * COST_PER_1K_TOKENS.input,
        efficiencyScore: combinedScore,
        status: agent.status,
      };
    });

    // Sort by cost (highest first)
    agentCosts.sort((a, b) => b.estimatedCost - a.estimatedCost);

    // Calculate total costs
    const totalEstimatedTokens = agentCosts.reduce((sum, a) => sum + a.estimatedTokens, 0);
    const totalEstimatedCost = agentCosts.reduce((sum, a) => sum + a.estimatedCost, 0);

    // Get daily metrics for trend analysis
    const days = Number(timeframe);
    const dailyMetrics = client.getDailyMetrics(days);

    // Enhance daily metrics with cost estimates
    const dailyCosts = dailyMetrics.map((day) => {
      const estimatedTokens = (day.tasksCompleted || 0) * 2000;
      const estimatedCost = (estimatedTokens / 1000) * COST_PER_1K_TOKENS.input;

      return {
        date: day.date,
        tasksCompleted: day.tasksCompleted || 0,
        tasksFailed: day.tasksFailed || 0,
        avgDuration: day.avgDuration || 0,
        estimatedTokens,
        estimatedCost,
      };
    }).reverse(); // Reverse for chronological order

    // Calculate projections
    const avgDailyCost = dailyCosts.length > 0
      ? dailyCosts.reduce((sum, d) => sum + d.estimatedCost, 0) / dailyCosts.length
      : 0;

    const daysInMonth = 30;
    const projectedMonthlyCost = avgDailyCost * daysInMonth;
    const budgetUtilization = (projectedMonthlyCost / budget) * 100;
    const remainingBudget = Math.max(0, budget - projectedMonthlyCost);

    // Generate optimization recommendations
    const recommendations: string[] = [];

    // Check for low-efficiency agents
    const lowEfficiencyAgents = agentCosts.filter(
      (a) => a.efficiencyScore < 50 && a.totalTasks > 5
    );
    if (lowEfficiencyAgents.length > 0) {
      const names = lowEfficiencyAgents.slice(0, 3).map((a) => a.agentName).join(", ");
      recommendations.push(
        lowEfficiencyAgents.length + " agent(s) with low efficiency detected. Consider reviewing performance patterns for: " + names
      );
    }

    // Check for high-cost agents
    const highCostAgents = agentCosts.filter((a) => a.estimatedCost > totalEstimatedCost * 0.3);
    if (highCostAgents.length > 0) {
      const names = highCostAgents.map((a) => a.agentName).join(", ");
      recommendations.push(
        "High cost concentration: " + names + " account for more than 30% of total costs"
      );
    }

    // Budget alert
    if (budgetUtilization > 90) {
      recommendations.push(
        "URGENT: Projected cost ($" + projectedMonthlyCost.toFixed(2) + ") is " + budgetUtilization.toFixed(0) + "% of budget. Consider reducing task frequency."
      );
    } else if (budgetUtilization > 75) {
      recommendations.push(
        "WARNING: Projected cost ($" + projectedMonthlyCost.toFixed(2) + ") is " + budgetUtilization.toFixed(0) + "% of budget. Monitor usage closely."
      );
    }

    // Task failure optimization
    const totalTasks = dailyCosts.reduce((sum, d) => sum + d.tasksCompleted + d.tasksFailed, 0);
    const totalFailed = dailyCosts.reduce((sum, d) => sum + d.tasksFailed, 0);
    const failureRate = totalTasks > 0 ? (totalFailed / totalTasks) * 100 : 0;

    if (failureRate > 20) {
      recommendations.push(
        "High failure rate (" + failureRate.toFixed(1) + "%). Review error patterns and consider adjusting task complexity or agent selection."
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        timeframe: days,
        budget,
        summary: {
          totalEstimatedTokens,
          totalEstimatedCost,
          projectedMonthlyCost,
          budgetUtilization,
          remainingBudget,
          avgDailyCost,
          failureRate,
        },
        agentCosts,
        dailyCosts,
        recommendations,
        budgetAlert: budgetUtilization > 75 ? {
          level: budgetUtilization > 90 ? "critical" : "warning",
          utilization: budgetUtilization,
          message: budgetUtilization > 90
            ? "Budget nearly exhausted: " + budgetUtilization.toFixed(0) + "% used"
            : "Budget usage elevated: " + budgetUtilization.toFixed(0) + "% used",
        } : null,
      },
    });
  } catch (error) {
    console.error("Cost API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch cost data",
      },
      { status: 500 }
    );
  }
}
