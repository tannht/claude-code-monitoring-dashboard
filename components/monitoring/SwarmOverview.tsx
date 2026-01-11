/**
 * SwarmOverview Component
 * Displays overview of swarms, agents, and tasks from MCP API
 */

"use client";

// Individual item types
type SwarmItem = {
  swarmId: string;
  name: string;
  objective: string;
  status: string;
  topology: string;
  maxAgents: number;
  activeAgents: number;
  createdAt: string;
  lastActivity: string;
};

type AgentItem = {
  id: string;
  name: string;
  type: string;
  role: string;
  status: string;
  swarmId: string | null;
  capabilities: string[];
};

type TaskItem = {
  taskId: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
};

interface SwarmOverviewProps {
  swarms: {
    total: number;
    active: number;
    items: SwarmItem[];
  } | null;
  agents: {
    total: number;
    active: number;
    items: AgentItem[];
  } | null;
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
    items: TaskItem[];
  } | null;
  loading?: boolean;
}

const STATUS_COLORS = {
  active: "bg-green-500",
  idle: "bg-yellow-500",
  busy: "bg-blue-500",
  offline: "bg-slate-500",
  completed: "bg-green-500",
  in_progress: "bg-blue-500",
  pending: "bg-yellow-500",
  failed: "bg-red-500",
};

const STATUS_LABELS = {
  active: "Active",
  idle: "Idle",
  busy: "Busy",
  offline: "Offline",
  completed: "Done",
  in_progress: "Running",
  pending: "Pending",
  failed: "Failed",
};

const PRIORITY_ICONS = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

export function SwarmOverview({ swarms, agents, tasks, loading }: SwarmOverviewProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Swarms"
          total={swarms?.total || 0}
          active={swarms?.active || 0}
          icon="🐝"
          color="blue"
        />
        <SummaryCard
          title="Agents"
          total={agents?.total || 0}
          active={agents?.active || 0}
          icon="👥"
          color="purple"
        />
        <SummaryCard
          title="Tasks"
          total={tasks?.total || 0}
          active={tasks?.inProgress || 0}
          completed={tasks?.completed || 0}
          icon="📋"
          color="green"
        />
      </div>

      {/* Swarms List */}
      {swarms && swarms.items.length > 0 && (
        <SectionCard title="🐝 Active Swarms">
          <div className="space-y-2">
            {swarms.items.map((swarm) => (
              <SwarmItem key={swarm.swarmId} swarm={swarm} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Agents List */}
      {agents && agents.items.length > 0 && (
        <SectionCard title="👥 Agents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.items.map((agent) => (
              <AgentItem key={agent.id} agent={agent} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Tasks List */}
      {tasks && tasks.items.length > 0 && (
        <SectionCard title="📋 Recent Tasks">
          <div className="space-y-2">
            {tasks.items.map((task) => (
              <TaskItem key={task.taskId} task={task} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Empty State */}
      {(!swarms || swarms.items.length === 0) &&
       (!agents || agents.items.length === 0) &&
       (!tasks || tasks.items.length === 0) && (
        <EmptyState />
      )}
    </div>
  );
}

function SummaryCard({
  title,
  total,
  active,
  completed,
  icon,
  color,
}: {
  title: string;
  total: number;
  active?: number;
  completed?: number;
  icon: string;
  color: "blue" | "purple" | "green";
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          active ? active > 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-slate-100 text-slate-800"
          : "bg-slate-100 text-slate-800"
        }`}>
          {active !== undefined ? `${active} active` : `${completed || 0} done`}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

function SwarmItem({ swarm }: { swarm: SwarmItem }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[swarm.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.idle}`} />
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{swarm.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{swarm.topology} • {swarm.objective?.substring(0, 40)}{swarm.objective?.length > 40 ? "..." : ""}</p>
        </div>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {new Date(swarm.createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}

function AgentItem({ agent }: { agent: AgentItem }) {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[agent.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.idle}`} />
          <p className="font-medium text-slate-900 dark:text-white">{agent.name}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          {agent.type}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {agent.capabilities?.slice(0, 3).map((cap) => (
          <span key={cap} className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: TaskItem }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span>{PRIORITY_ICONS[task.priority as keyof typeof PRIORITY_ICONS] || "⚪"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">{task.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]
                ? `${STATUS_COLORS[task.status as keyof typeof STATUS_COLORS].replace("bg-", "bg-").replace("500", "100")} text-${task.status === "failed" ? "red" : task.status === "completed" ? "green" : "blue"}-800`
                : "bg-slate-200 text-slate-700"
            }`}>
              {STATUS_LABELS[task.status as keyof typeof STATUS_LABELS] || task.status}
            </span>
          </div>
        </div>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
        {new Date(task.createdAt).toLocaleTimeString()}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
      <span className="text-4xl mb-4 block">🐝</span>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Swarm Data Yet</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Swarms, agents, and tasks will appear here when you use Claude Code with MCP tools.
      </p>
      <div className="text-sm text-slate-500 dark:text-slate-500 space-y-1">
        <p>💡 Use <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">claude-flow swarm init</code> to create a swarm</p>
        <p>💡 Use <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">claude-flow agent spawn</code> to spawn agents</p>
      </div>
    </div>
  );
}
