/**
 * Predictive Failure Detection Page
 * ML-based anomaly detection, risk scoring, and predictive alerts
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Text,
  Badge,
  Button,
  NumberInput,
  Alert,
  Table,
  Progress,
  Stack,
} from "@mantine/core";
import { IconAlertTriangle, IconTrendingUp, IconTrendingDown, IconActivity, IconBrain } from "@tabler/icons-react";
import { LineChart } from "@/components/ui/LineChart";

interface AgentRiskScore {
  agentId: string;
  agentName: string;
  agentType: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: {
    failureRate: number;
    performanceRisk: number;
    durationRisk: number;
  };
}

interface TrendData {
  trend: "increasing" | "decreasing" | "stable";
  strength: number;
}

interface PredictionsData {
  timeframe: number;
  systemRisk: {
    level: "low" | "medium" | "high" | "critical";
    avgFailureRate: number;
    trend: TrendData;
  };
  agentRiskScores: AgentRiskScore[];
  alerts: string[];
  trendAnalysis: {
    labels: string[];
    failureRateSeries: number[];
    taskVolumeSeries: number[];
  };
  anomalies: {
    failureRate: {
      indices: number[];
      dates: string[];
    };
  };
  predictions: {
    expectedFailureRate: number;
    confidence: "low" | "medium" | "high";
    recommendation: string;
  };
}

export default function PredictionsPage() {
  const [data, setData] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchPredictions();
  }, [days]);

  async function fetchPredictions() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/predictions?days=${days}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to fetch predictions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch predictions");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Text>Loading predictions...</Text>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Error">
            {error || "Failed to load predictions"}
          </Alert>
        </div>
      </main>
    );
  }

  const { systemRisk, agentRiskScores, alerts, trendAnalysis, predictions } = data;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "red";
      case "high": return "orange";
      case "medium": return "yellow";
      case "low": return "green";
      default: return "gray";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <IconBrain size={32} className="text-purple-500" />
              Predictive Failure Detection
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              AI-powered anomaly detection and risk assessment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NumberInput
              label="Days"
              value={days}
              onChange={(v) => setDays(Number(v) || 30)}
              min={7}
              max={90}
              w={80}
            />
            <Button onClick={fetchPredictions} variant="light">
              Refresh
            </Button>
          </div>
        </header>

        {/* System Risk Overview */}
        <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              System Risk Overview
            </h3>
            <Badge
              color={getRiskColor(systemRisk.level)}
              size="lg"
              variant="filled"
            >
              {systemRisk.level.toUpperCase()} RISK
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Text size="xs" c="dimmed">Average Failure Rate</Text>
              <Text size="2xl" fw={500} className="text-slate-900 dark:text-white">
                {systemRisk.avgFailureRate}%
              </Text>
            </div>

            <div>
              <Text size="xs" c="dimmed">Trend</Text>
              <div className="flex items-center gap-2 mt-1">
                {systemRisk.trend.trend === "increasing" ? (
                  <IconTrendingUp size={24} className="text-red-500" />
                ) : systemRisk.trend.trend === "decreasing" ? (
                  <IconTrendingDown size={24} className="text-green-500" />
                ) : (
                  <IconActivity size={24} className="text-gray-500" />
                )}
                <Text size="lg" fw={500} className="text-slate-900 dark:text-white capitalize">
                  {systemRisk.trend.trend}
                </Text>
              </div>
              <Text size="xs" c="dimmed" mt={2}>
                Confidence: {systemRisk.trend.strength.toFixed(2)}
              </Text>
            </div>

            <div>
              <Text size="xs" c="dimmed">Expected Failure Rate</Text>
              <Text size="2xl" fw={500} className="text-slate-900 dark:text-white">
                {predictions.expectedFailureRate}%
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                Prediction confidence: {predictions.confidence}
              </Text>
            </div>
          </div>

          {predictions.recommendation && (
            <Alert
              icon={<IconBrain size={16} />}
              color={systemRisk.level === "critical" || systemRisk.level === "high" ? "red" : "blue"}
              title="Recommendation"
              className="mt-4"
            >
              {predictions.recommendation}
            </Alert>
          )}
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Active Alerts & Warnings
            </h3>
            <Stack gap="sm">
              {alerts.map((alert, idx) => (
                <Alert
                  key={idx}
                  icon={<IconAlertTriangle size={16} />}
                  color={alert.includes("CRITICAL") || alert.includes("MAINTENANCE") ? "red" : alert.includes("WARNING") ? "yellow" : "blue"}
                  title={alert.includes("CRITICAL") ? "Critical" : alert.includes("WARNING") ? "Warning" : alert.includes("MAINTENANCE") ? "Maintenance Required" : "Notice"}
                >
                  {alert}
                </Alert>
              ))}
            </Stack>
          </Card>
        )}

        {/* Failure Rate Trend */}
        <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Failure Rate Trend
          </h3>
          <LineChart
            series={[{ name: "Failure Rate", data: trendAnalysis.failureRateSeries }]}
            categories={trendAnalysis.labels}
            height={300}
            colors={["#ef4444"]}
          />
        </Card>

        {/* Task Volume Trend */}
        <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Task Volume Trend
          </h3>
          <LineChart
            series={[{ name: "Task Volume", data: trendAnalysis.taskVolumeSeries }]}
            categories={trendAnalysis.labels}
            height={300}
            colors={["#3b82f6"]}
          />
        </Card>

        {/* Agent Risk Scores */}
        <Card withBorder padding="lg" className="bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Agent Risk Assessment
          </h3>
          <div className="overflow-x-auto">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Agent</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Risk Level</Table.Th>
                  <Table.Th>Risk Score</Table.Th>
                  <Table.Th>Failure Rate</Table.Th>
                  <Table.Th>Performance Risk</Table.Th>
                  <Table.Th>Duration Risk</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {agentRiskScores.map((agent) => (
                  <Table.Tr key={agent.agentId}>
                    <Table.Td>
                      <Text fw={500}>{agent.agentName}</Text>
                    </Table.Td>
                    <Table.Td>{agent.agentType}</Table.Td>
                    <Table.Td>
                      <Badge color={getRiskColor(agent.riskLevel)} variant="filled">
                        {agent.riskLevel.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Progress
                        value={agent.riskScore}
                        color={agent.riskScore > 75 ? "red" : agent.riskScore > 50 ? "orange" : agent.riskScore > 25 ? "yellow" : "green"}
                        size="sm"
                      />
                      <Text size="xs" c="dimmed" mt={2}>
                        {agent.riskScore.toFixed(0)}%
                      </Text>
                    </Table.Td>
                    <Table.Td>{agent.factors.failureRate}%</Table.Td>
                    <Table.Td>{agent.factors.performanceRisk}%</Table.Td>
                    <Table.Td>{agent.factors.durationRisk}%</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Card>
      </div>
    </main>
  );
}
