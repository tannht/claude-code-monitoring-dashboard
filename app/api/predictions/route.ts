/**
 * Predictions API
 * Provides failure prediction, anomaly detection, and risk scoring for agents and tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { getSqliteClient } from "@/lib/db/sqlite";

// Statistical functions for anomaly detection
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

function detectAnomalies(values: number[]): { indices: number[]; threshold: number } {
  if (values.length < 3) return { indices: [], threshold: 2 };

  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values, mean);
  const threshold = 2; // 2 standard deviations

  const anomalies: number[] = [];
  values.forEach((v, i) => {
    const zScore = Math.abs(calculateZScore(v, mean, stdDev));
    if (zScore > threshold) {
      anomalies.push(i);
    }
  });

  return { indices: anomalies, threshold };
}

function calculateTrend(values: number[]): { trend: "increasing" | "decreasing" | "stable"; strength: number } {
  if (values.length < 2) return { trend: "stable", strength: 0 };

  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);

  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const meanY = sumY / n;
  const ssRes = values.reduce((sum, y, i) => sum + Math.pow(y - (slope * i + meanY), 2), 0);
  const ssTot = values.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  let trend: "increasing" | "decreasing" | "stable" = "stable";
  if (Math.abs(slope) > 0.01) {
    trend = slope > 0 ? "increasing" : "decreasing";
  }

  return { trend, strength: Math.abs(r2) };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days") || "30");

    const client = getSqliteClient();

    // Get agent stats
    const agentStats = client.getAgentStats();

    // Get daily metrics for trend analysis
    const dailyMetrics = client.getDailyMetrics(days);

    // Get recent tasks for failure analysis
    const recentTasks = client.getTasks(1000, 0);

    // Calculate failure rate over time
    const failureRates = dailyMetrics.map((d) => {
      const total = d.tasksCompleted + d.tasksFailed;
      return total > 0 ? (d.tasksFailed / total) * 100 : 0;
    });

    // Detect anomalies in failure rates
    const failureAnomalies = detectAnomalies(failureRates);

    // Calculate failure trend
    const failureTrend = calculateTrend(failureRates);

    // Calculate agent risk scores
    const agentRiskScores = agentStats.map((agent) => {
      const failureRate = 100 - (agent.successRate || 0);
      const performanceScore = 100 - (agent.performanceScore || 0);
      const avgDuration = agent.avgDuration || 0;

      // Normalize duration (assuming > 60 seconds is concerning)
      const durationRisk = Math.min(avgDuration / 60, 1) * 20;

      // Calculate overall risk (0-100)
      const riskScore = (failureRate * 0.5) + (performanceScore * 0.3) + durationRisk;

      let riskLevel: "low" | "medium" | "high" | "critical";
      if (riskScore < 25) riskLevel = "low";
      else if (riskScore < 50) riskLevel = "medium";
      else if (riskScore < 75) riskLevel = "high";
      else riskLevel = "critical";

      return {
        agentId: agent.agentId,
        agentName: agent.agentName,
        agentType: agent.agentType,
        riskScore: Math.round(riskScore * 100) / 100,
        riskLevel,
        factors: {
          failureRate: Math.round(failureRate),
          performanceRisk: Math.round(performanceScore),
          durationRisk: Math.round(durationRisk),
        },
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    // Generate system-wide predictions
    const avgFailureRate = calculateMean(failureRates);
    const systemRiskLevel = avgFailureRate > 30 ? "critical" : avgFailureRate > 20 ? "high" : avgFailureRate > 10 ? "medium" : "low";

    // Generate alerts based on predictions
    const alerts: string[] = [];

    if (failureTrend.trend === "increasing" && failureTrend.strength > 0.5) {
      alerts.push("WARNING: Failure rate is trending upward. Investigate recent changes.");
    }

    if (failureAnomalies.indices.length > 0) {
      alerts.push("ANOMALY: Detected " + failureAnomalies.indices.length + " anomalous failure rate spikes in the past " + days + " days.");
    }

    const highRiskAgents = agentRiskScores.filter((a) => a.riskLevel === "critical" || a.riskLevel === "high");
    if (highRiskAgents.length > 0) {
      alerts.push("RISK: " + highRiskAgents.length + " agent(s) at elevated risk: " + highRiskAgents.slice(0, 3).map((a) => a.agentName).join(", "));
    }

    // Predictive maintenance alerts
    agentRiskScores.forEach((agent) => {
      if (agent.riskLevel === "critical") {
        alerts.push("MAINTENANCE: Agent '" + agent.agentName + "' requires immediate attention. Risk score: " + agent.riskScore.toFixed(0) + "%");
      }
    });

    // Trend analysis for charts
    const trendLabels = dailyMetrics.map((d) => new Date(d.date).toLocaleDateString());
    const failureRateSeries = failureRates;
    const taskVolumeSeries = dailyMetrics.map((d) => d.tasksCompleted + d.tasksFailed);

    return NextResponse.json({
      success: true,
      data: {
        timeframe: days,
        systemRisk: {
          level: systemRiskLevel,
          avgFailureRate: Math.round(avgFailureRate * 10) / 10,
          trend: failureTrend,
        },
        agentRiskScores,
        alerts,
        trendAnalysis: {
          labels: trendLabels,
          failureRateSeries,
          taskVolumeSeries,
        },
        anomalies: {
          failureRate: {
            indices: failureAnomalies.indices,
            dates: failureAnomalies.indices.map((i) => trendLabels[i]),
          },
        },
        predictions: {
          expectedFailureRate: Math.round(avgFailureRate * 10) / 10,
          confidence: failureTrend.strength > 0.5 ? "high" : failureTrend.strength > 0.2 ? "medium" : "low",
          recommendation: avgFailureRate > 20 ? "Review agent performance and task complexity" : "System operating within normal parameters",
        },
      },
    });
  } catch (error) {
    console.error("Predictions API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch predictions",
      },
      { status: 500 }
    );
  }
}
