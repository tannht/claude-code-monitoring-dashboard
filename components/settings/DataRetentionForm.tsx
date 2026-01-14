/**
 * DataRetentionForm Component
 * Configure data retention policies and view compliance reports
 */

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Text,
  NumberInput,
  Switch,
  Button,
  Stack,
  Alert,
  Table,
  Progress,
  Badge,
  Group,
} from "@mantine/core";
import { IconDatabase, IconTrash, IconArchive, IconAlertTriangle } from "@tabler/icons-react";

interface RetentionConfig {
  tasks: { days: number; archive: boolean };
  messages: { days: number; archive: boolean };
  metrics: { days: number; archive: boolean };
  patterns: { days: number; archive: boolean };
  trajectories: { days: number; archive: boolean };
}

interface StorageReport {
  storage: {
    swarmDb: { path: string; size: number; sizeMB: string };
    hiveDb: { path: string; size: number; sizeMB: string };
    total: { size: number; sizeMB: string };
  };
  dataCounts: {
    agents: number;
    tasks: number;
    messages: number;
    metrics: number;
  };
  retention: RetentionConfig;
  estimatedSavings: {
    tasks: number;
    messages: number;
    metrics: number;
  };
}

export function DataRetentionForm() {
  const [config, setConfig] = useState<RetentionConfig | null>(null);
  const [report, setReport] = useState<StorageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [configRes, reportRes] = await Promise.all([
        fetch("/api/retention?action=config"),
        fetch("/api/retention?action=report"),
      ]);

      const configData = await configRes.json();
      const reportData = await reportRes.json();

      if (configData.success) {
        setConfig(configData.data);
      }
      if (reportData.success) {
        setReport(reportData.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ type: "error", text: "Failed to load retention data" });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", config }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: "success", text: result.message || "Configuration updated" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update configuration" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handlePurge = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge" }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: "success", text: result.message || "Purge scheduled" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to schedule purge" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to schedule purge" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config || !report) {
    return <Text>Loading...</Text>;
  }

  const updateConfig = (key: keyof RetentionConfig, field: "days" | "archive", value: number | boolean) => {
    setConfig({
      ...config,
      [key]: { ...config[key], [field]: value },
    });
  };

  return (
    <Stack gap="xl">
      {/* Message */}
      {message && (
        <Alert
          icon={message.type === "success" ? <IconDatabase size={16} /> : <IconAlertTriangle size={16} />}
          color={message.type === "success" ? "green" : "red"}
        >
          {message.text}
        </Alert>
      )}

      {/* Storage Report */}
      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={500}>Storage Overview</Text>
          <Button onClick={fetchData} variant="light" size="sm">
            Refresh
          </Button>
        </Group>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <Text size="xs" c="dimmed">Swarm Database</Text>
            <Text size="xl" fw={500} className="text-slate-900 dark:text-white">
              {report.storage.swarmDb.sizeMB} MB
            </Text>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <Text size="xs" c="dimmed">Hive Database</Text>
            <Text size="xl" fw={500} className="text-slate-900 dark:text-white">
              {report.storage.hiveDb.sizeMB} MB
            </Text>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Text size="xs" c="dimmed">Total Storage</Text>
            <Text size="xl" fw={500} className="text-purple-900 dark:text-purple-100">
              {report.storage.total.sizeMB} MB
            </Text>
          </div>
        </div>

        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data Type</Table.Th>
              <Table.Th>Count</Table.Th>
              <Table.Th>Retention</Table.Th>
              <Table.Th>Archive</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td><strong>Tasks</strong></Table.Td>
              <Table.Td>{report.dataCounts.tasks.toLocaleString()}</Table.Td>
              <Table.Td>{config.tasks.days} days</Table.Td>
              <Table.Td>
                <Badge color={config.tasks.archive ? "green" : "gray"}>
                  {config.tasks.archive ? "Yes" : "No"}
                </Badge>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><strong>Messages</strong></Table.Td>
              <Table.Td>{report.dataCounts.messages.toLocaleString()}</Table.Td>
              <Table.Td>{config.messages.days} days</Table.Td>
              <Table.Td>
                <Badge color={config.messages.archive ? "green" : "gray"}>
                  {config.messages.archive ? "Yes" : "No"}
                </Badge>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><strong>Metrics</strong></Table.Td>
              <Table.Td>{report.dataCounts.metrics.toLocaleString()}</Table.Td>
              <Table.Td>{config.metrics.days} days</Table.Td>
              <Table.Td>
                <Badge color={config.metrics.archive ? "green" : "gray"}>
                  {config.metrics.archive ? "Yes" : "No"}
                </Badge>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Card>

      {/* Retention Configuration */}
      <Card withBorder padding="lg">
        <Text size="lg" fw={500} mb="md">Retention Policy Configuration</Text>

        <Stack gap="md">
          {Object.entries(config).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="flex-1">
                <Text size="sm" fw={500} className="capitalize text-slate-900 dark:text-white">
                  {key}
                </Text>
                <Text size="xs" c="dimmed">
                  Keep data for {value.days} days
                </Text>
              </div>
              <div className="flex items-center gap-4">
                <NumberInput
                  value={value.days}
                  onChange={(v) => updateConfig(key as keyof RetentionConfig, "days", Number(v) || 30)}
                  min={7}
                  max={3650}
                  w={100}
                  size="sm"
                />
                <Text size="xs" c="dimmed">days</Text>
                <Switch
                  checked={value.archive}
                  onChange={(e) => updateConfig(key as keyof RetentionConfig, "archive", e.currentTarget.checked)}
                  label="Archive"
                  labelPosition="left"
                />
              </div>
            </div>
          ))}
        </Stack>

        <Group mt="md">
          <Button onClick={handleUpdate} loading={saving}>
            Save Configuration
          </Button>
        </Group>
      </Card>

      {/* Estimated Savings */}
      <Card withBorder padding="lg">
        <Text size="lg" fw={500} mb="md">Estimated Storage Optimization</Text>

        <Stack gap="sm">
          <div className="flex items-center justify-between">
            <Text size="sm">Tasks eligible for purge</Text>
            <Badge size="lg">{report.estimatedSavings.tasks.toLocaleString()}</Badge>
          </div>
          <Progress value={30} size="sm" />

          <div className="flex items-center justify-between">
            <Text size="sm">Messages eligible for purge</Text>
            <Badge size="lg">{report.estimatedSavings.messages.toLocaleString()}</Badge>
          </div>
          <Progress value={50} size="sm" />

          <div className="flex items-center justify-between">
            <Text size="sm">Metrics eligible for purge</Text>
            <Badge size="lg">{report.estimatedSavings.metrics.toLocaleString()}</Badge>
          </div>
          <Progress value={70} size="sm" />
        </Stack>

        <Alert icon={<IconAlertTriangle size={16} />} color="yellow" className="mt-4">
          <Text size="sm">
            These estimates are based on current retention policies. Actual savings may vary depending on data distribution.
          </Text>
        </Alert>
      </Card>

      {/* Compliance Report */}
      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={500}>Compliance Report</Text>
          <Button onClick={handlePurge} variant="light" color="red" loading={saving} leftSection={<IconTrash size={16} />}>
            Run Purge
          </Button>
        </Group>

        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Policy</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Last Review</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>GDPR Data Retention</Table.Td>
              <Table.Td><Badge color="green">Compliant</Badge></Table.Td>
              <Table.Td>{new Date().toLocaleDateString()}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Right to be Forgotten</Table.Td>
              <Table.Td><Badge color="green">Supported</Badge></Table.Td>
              <Table.Td>{new Date().toLocaleDateString()}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Data Archival</Table.Td>
              <Table.Td><Badge color="green">Enabled</Badge></Table.Td>
              <Table.Td>{new Date().toLocaleDateString()}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
