/**
 * Multi-Swarm Comparison Page
 * Side-by-side comparison of multiple swarms with performance metrics
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Text,
  Badge,
  Button,
  MultiSelect,
  Alert,
  Table,
  Progress,
  Stack,
} from "@mantine/core";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { LineChart } from "@/components/ui/LineChart";

interface Swarm {
  id: string;
  name: string;
  objective?: string;
  status: string;
  queenType: string;
  topology: string;
  maxAgents: number;
  createdAt: string;
  updatedAt: string;
}

interface SwarmComparisonData {
  id: string;
  name: string;
  objective?: string;
  status: string;
  queenType: string;
  topology: string;
  maxAgents: number;
  createdAt: string;
  updatedAt: string;
  metrics: {
    agentCount: number;
    activeAgents: number;
    avgPerformance: number;
    totalTasks: number;
    completedTasks: number;
    messageCount: number;
  };
  agents: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    performanceScore: number;
    taskCount: number;
    successRate: number;
  }>;
}

export default function SwarmComparisonPage() {
  const [allSwarms, setAllSwarms] = useState<Swarm[]>([]);
  const [selectedSwarmIds, setSelectedSwarmIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<SwarmComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  // Fetch all available swarms
  useEffect(() => {
    fetchSwarms();
  }, []);

  // Fetch comparison data when selection changes
  useEffect(() => {
    if (selectedSwarmIds.length >= 2) {
      fetchComparisonData();
    } else {
      setComparisonData([]);
    }
  }, [selectedSwarmIds]);

  async function fetchSwarms() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/swarms");
      const result = await response.json();
      if (result.success) {
        setAllSwarms(result.data.swarms);
      } else {
        setError(result.error || "Failed to fetch swarms");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch swarms");
    } finally {
      setLoading(false);
    }
  }

  async function fetchComparisonData() {
    setComparing(true);
    setError(null);
    try {
      const ids = selectedSwarmIds.join(",");
      const response = await fetch(`/api/swarms?ids=${ids}`);
      const result = await response.json();
      if (result.success) {
        setComparisonData(result.data.swarms);
      } else {
        setError(result.error || "Failed to fetch comparison data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch comparison data");
    } finally {
      setComparing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Text>Loading swarms...</Text>
        </div>
      </main>
    );
  }

  if (error && allSwarms.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        </div>
      </main>
    );
  }

  const swarmOptions = allSwarms.map((s) => ({ value: s.id, label: s.name }));

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            🔄 Multi-Swarm Comparison
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Compare multiple swarms side-by-side
          </p>
        </header>

        {/* Swarm Selection */}
        <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
          <Text size="lg" fw={500} mb="md" className="text-slate-900 dark:text-white">
            Select Swarms to Compare (minimum 2)
          </Text>
          <MultiSelect
            data={swarmOptions}
            value={selectedSwarmIds}
            onChange={setSelectedSwarmIds}
            placeholder="Choose swarms to compare..."
            searchable
            nothingFoundMessage="No swarms found"
            maxValues={4}
            classNames={{
              input: "min-h-[44px]",
            }}
          />
          {selectedSwarmIds.length > 0 && selectedSwarmIds.length < 2 && (
            <Text size="sm" c="orange" mt="sm">
              Select at least 2 swarms to compare
            </Text>
          )}
        </Card>

        {/* Comparison Results */}
        {comparisonData.length >= 2 && (
          <>
            {/* Metrics Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {comparisonData.map((swarm) => (
                <Card
                  key={swarm.id}
                  withBorder
                  padding="lg"
                  className="bg-white dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Text size="lg" fw={500} className="text-slate-900 dark:text-white">
                      {swarm.name}
                    </Text>
                    <Badge
                      color={swarm.status === "active" ? "green" : "gray"}
                      variant="light"
                    >
                      {swarm.status}
                    </Badge>
                  </div>

                  <Stack gap="sm">
                    <div>
                      <Text size="xs" c="dimmed">Agents</Text>
                      <Text size="lg" fw={500} className="text-slate-900 dark:text-white">
                        {swarm.metrics.activeAgents} / {swarm.metrics.agentCount} active
                      </Text>
                    </div>

                    <div>
                      <Text size="xs" c="dimmed">Performance</Text>
                      <Progress
                        value={swarm.metrics.avgPerformance}
                        color={swarm.metrics.avgPerformance >= 70 ? "green" : swarm.metrics.avgPerformance >= 50 ? "yellow" : "red"}
                        size="sm"
                      />
                      <Text size="xs" c="dimmed" mt={2}>
                        {swarm.metrics.avgPerformance}% average
                      </Text>
                    </div>

                    <div>
                      <Text size="xs" c="dimmed">Tasks</Text>
                      <Text size="md" className="text-slate-900 dark:text-white">
                        {swarm.metrics.totalTasks} total / {swarm.metrics.completedTasks.toFixed(0)} completed
                      </Text>
                    </div>

                    <div>
                      <Text size="xs" c="dimmed">Topology</Text>
                      <Text size="sm" className="text-slate-900 dark:text-white">
                        {swarm.topology}
                      </Text>
                    </div>

                    <div>
                      <Text size="xs" c="dimmed">Queen Type</Text>
                      <Text size="sm" className="text-slate-900 dark:text-white">
                        {swarm.queenType}
                      </Text>
                    </div>
                  </Stack>
                </Card>
              ))}
            </div>

            {/* Side-by-side Charts */}
            <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Performance Comparison
              </h3>
              <LineChart
                series={[
                  {
                    name: "Agent Count",
                    data: comparisonData.map((s) => s.metrics.agentCount),
                  },
                  {
                    name: "Active Agents",
                    data: comparisonData.map((s) => s.metrics.activeAgents),
                  },
                ]}
                categories={comparisonData.map((s) => s.name)}
                height={300}
                colors={["#3b82f6", "#10b981"]}
              />
            </Card>

            <Card withBorder padding="lg" className="mb-8 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Task Completion Comparison
              </h3>
              <LineChart
                series={[
                  {
                    name: "Total Tasks",
                    data: comparisonData.map((s) => s.metrics.totalTasks),
                  },
                  {
                    name: "Completed Tasks",
                    data: comparisonData.map((s) => s.metrics.completedTasks),
                  },
                ]}
                categories={comparisonData.map((s) => s.name)}
                height={300}
                colors={["#8b5cf6", "#06b6d4"]}
              />
            </Card>

            {/* Agent Comparison Table */}
            <Card withBorder padding="lg" className="bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Agent Comparison
              </h3>
              <div className="overflow-x-auto">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Swarm</Table.Th>
                      <Table.Th>Agent</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Performance</Table.Th>
                      <Table.Th>Tasks</Table.Th>
                      <Table.Th>Success Rate</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {comparisonData.flatMap((swarm) =>
                      swarm.agents.map((agent) => (
                        <Table.Tr key={`${swarm.id}-${agent.id}`}>
                          <Table.Td>
                            <Text fw={500} size="sm">{swarm.name}</Text>
                          </Table.Td>
                          <Table.Td>{agent.name}</Table.Td>
                          <Table.Td>{agent.type}</Table.Td>
                          <Table.Td>
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
                          </Table.Td>
                          <Table.Td>{agent.performanceScore}%</Table.Td>
                          <Table.Td>{agent.taskCount}</Table.Td>
                          <Table.Td>{agent.successRate.toFixed(0)}%</Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </div>
            </Card>
          </>
        )}

        {selectedSwarmIds.length >= 2 && comparisonData.length === 0 && !comparing && (
          <Alert icon={<IconAlertCircle size={16} />} color="yellow" title="No Data">
            Could not fetch comparison data for selected swarms. They may not exist or have no agents.
          </Alert>
        )}

        {allSwarms.length === 0 && (
          <Card withBorder padding="lg" className="bg-white dark:bg-slate-800">
            <Text c="dimmed">No swarms available for comparison.</Text>
          </Card>
        )}
      </div>
    </main>
  );
}
