/**
 * Cost Optimization Page
 * Displays token usage analysis, cost projections, and optimization recommendations
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
} from "@mantine/core";
import { IconAlertCircle, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { LineChart } from "@/components/ui/LineChart";

interface CostData {
  timeframe: number;
  budget: number;
  summary: {
    totalEstimatedTokens: number;
    totalEstimatedCost: number;
    projectedMonthlyCost: number;
    budgetUtilization: number;
    remainingBudget: number;
    avgDailyCost: number;
    failureRate: number;
  };
  agentCosts: Array<{
    agentId: string;
    agentName: string;
    agentType: string;
    totalTasks: number;
    completedTasks: number;
    successRate: number;
    performanceScore: number;
    estimatedTokens: number;
    estimatedCost: number;
    efficiencyScore: number;
    status: string;
  }>;
  dailyCosts: Array<{
    date: string;
    tasksCompleted: number;
    tasksFailed: number;
    avgDuration: number;
    estimatedTokens: number;
    estimatedCost: number;
  }>;
  recommendations: string[];
  budgetAlert: {
    level: string;
    utilization: number;
    message: string;
  } | null;
}

export default function CostOptimizationPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState(30);
  const [budget, setBudget] = useState(100);

  useEffect(() => {
    fetchCostData();
  }, [timeframe, budget]);

  async function fetchCostData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cost?timeframe=${timeframe}&budget=${budget}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to fetch cost data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cost data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Text>Loading cost data...</Text>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 24 }}>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          {error || "Failed to load cost data"}
        </Alert>
      </div>
    );
  }

  const { summary, agentCosts, dailyCosts, recommendations, budgetAlert } = data;

  // Prepare chart data for LineChart component
  const costCategories = dailyCosts.map((d) => new Date(d.date).toLocaleDateString());
  const costSeriesData = dailyCosts.map((d) => d.estimatedCost);
  const tokensSeriesData = dailyCosts.map((d) => d.estimatedTokens);

  const costChartData = {
    series: [{ name: "Daily Cost", data: costSeriesData }],
    categories: costCategories,
  };

  const tokensChartData = {
    series: [{ name: "Token Usage", data: tokensSeriesData }],
    categories: costCategories,
  };

  // Efficiency color
  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              💰 Cost Optimization
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Token usage analysis and cost projections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NumberInput
              label="Days"
              value={timeframe}
              onChange={(v) => setTimeframe(Number(v) || 30)}
              min={7}
              max={90}
              w={80}
            />
            <NumberInput
              label="Budget ($)"
              value={budget}
              onChange={(v) => setBudget(Number(v) || 100)}
              min={10}
              w={100}
            />
            <Button onClick={fetchCostData} variant="light">
              Refresh
            </Button>
          </div>
        </header>

        {budgetAlert && (
          <Alert
            icon={budgetAlert.level === "critical" ? <IconAlertCircle size={16} /> : <IconTrendingUp size={16} />}
            color={budgetAlert.level === "critical" ? "red" : "yellow"}
            title={budgetAlert.level === "critical" ? "Budget Alert" : "Budget Warning"}
            className="mb-8"
          >
            {budgetAlert.message}
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card withBorder padding="lg" className="bg-white dark:bg-slate-800">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Projected Monthly Cost
            </Text>
            <div className="flex items-end gap-2">
              <Text size="xl" fw={500} className="text-2xl">
                ${summary.projectedMonthlyCost.toFixed(2)}
              </Text>
            </div>
            <Progress
              value={Math.min(summary.budgetUtilization, 100)}
              color={summary.budgetUtilization > 90 ? "red" : summary.budgetUtilization > 75 ? "yellow" : "green"}
              size="sm"
              mt="md"
            />
            <Text size="xs" c="dimmed" mt={4}>
              {summary.budgetUtilization.toFixed(0)}% of ${budget} budget
            </Text>
          </Card>

          <Card withBorder padding="lg" className="bg-white dark:bg-slate-800">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Estimated Tokens
            </Text>
            <Text size="xl" fw={500} mt="sm" className="text-2xl">
              {(summary.totalEstimatedTokens / 1000).toFixed(0)}K
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Total across all agents
            </Text>
          </Card>

          <Card withBorder padding="lg" className="bg-white dark:bg-slate-800">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Average Daily Cost
            </Text>
            <Text size="xl" fw={500} mt="sm" className="text-2xl">
              ${summary.avgDailyCost.toFixed(2)}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Based on {timeframe} day history
            </Text>
          </Card>

          <Card withBorder padding="lg" className="bg-white dark:bg-slate-800">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Failure Rate
            </Text>
            <div className="flex items-end gap-2">
              <Text size="xl" fw={500} className="text-2xl">
                {summary.failureRate.toFixed(1)}%
              </Text>
              {summary.failureRate > 20 ? (
                <IconTrendingUp size={20} className="text-red-500" />
              ) : (
                <IconTrendingDown size={20} className="text-green-500" />
              )}
            </div>
            <Text size="xs" c="dimmed" mt={4}>
              Failed tasks / Total tasks
            </Text>
          </Card>
        </div>

        {/* Cost Trend Chart */}
        <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
          <LineChart
            series={costChartData.series}
            categories={costChartData.categories}
            title="Daily Cost Over Time"
            colors={["#10b981"]}
            height={300}
          />
        </Card>

        {/* Token Usage Chart */}
        <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
          <LineChart
            series={tokensChartData.series}
            categories={tokensChartData.categories}
            title="Daily Token Usage"
            colors={["#8b5cf6"]}
            height={300}
          />
        </Card>

        {/* Agent Cost Table */}
        <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Agent Cost Breakdown
          </h3>
          <div className="overflow-x-auto">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Agent</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Tasks</Table.Th>
                  <Table.Th>Success Rate</Table.Th>
                  <Table.Th>Efficiency</Table.Th>
                  <Table.Th>Tokens</Table.Th>
                  <Table.Th>Cost</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {agentCosts.map((agent) => (
                  <Table.Tr key={agent.agentId}>
                    <Table.Td>
                      <div className="flex items-center gap-2">
                        <Text fw={500}>{agent.agentName}</Text>
                        <Badge
                          color={
                            agent.status === "active" ? "green" :
                            agent.status === "busy" ? "yellow" :
                            agent.status === "offline" ? "gray" : "blue"
                          }
                          size="xs"
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </Table.Td>
                    <Table.Td>{agent.agentType}</Table.Td>
                    <Table.Td>{agent.totalTasks}</Table.Td>
                    <Table.Td>{agent.successRate.toFixed(0)}%</Table.Td>
                    <Table.Td>
                      <Badge color={getEfficiencyColor(agent.efficiencyScore)} variant="light">
                        {agent.efficiencyScore.toFixed(0)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{(agent.estimatedTokens / 1000).toFixed(0)}K</Table.Td>
                    <Table.Td>${agent.estimatedCost.toFixed(3)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Card>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card withBorder padding="lg" className="bg-white dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Optimization Recommendations
            </h3>
            <div className="flex flex-col gap-3">
              {recommendations.map((rec, idx) => (
                <Alert
                  key={idx}
                  icon={<IconTrendingUp size={16} />}
                  color={rec.includes("URGENT") ? "red" : rec.includes("WARNING") ? "yellow" : "blue"}
                  title={rec.includes("URGENT") ? "Critical" : rec.includes("WARNING") ? "Warning" : "Suggestion"}
                >
                  {rec}
                </Alert>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
