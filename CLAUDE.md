# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 dashboard for monitoring Claude Code multi-agent systems (swarms). It reads directly from SQLite databases created by MCP servers (claude-flow, ruv-swarm) and visualizes agent states, tasks, swarms, and performance metrics in real-time.

## Development Commands

```bash
# Development server (with Turbopack)
npm run dev          # Runs on port 8800

# Build and type checking
npm run build
npm run type-check   # TypeScript type check without emitting
npm run lint

# MCP HTTP wrapper (for direct DB access via HTTP)
npm run mcp-server   # Runs via bun on port 8900
npm run mcp-server:ts # Runs via tsx instead
```

## Architecture

### Database Layer (`lib/db/`)

The dashboard reads from **two SQLite databases** created by external MCP servers:

**IMPORTANT:** Database paths are counter-intuitive due to schema naming:
- `SWARM_DB_PATH` → points to `.hive-mind/hive.db` (contains swarms, agents, tasks, messages, performance_metrics tables)
- `HIVE_DB_PATH` → points to `.swarm/memory.db` (contains patterns, memory_entries, task_trajectories tables)

Key types in `lib/db/schema.ts`:
- `SwarmRecord`, `AgentRecord`, `TaskRecord` - from hive.db
- `PatternRecord`, `TaskTrajectoryRecord`, `MemoryEntryRecord` - from memory.db
- Aggregation types: `TaskStats`, `AgentStats`, `DailyMetrics`

`lib/db/sqlite.ts` provides the `SqliteClient` class with read-only queries for all dashboard data.

### State Management (`lib/state/`)

- `AgentStateStore` - JSON-file backed persistent store (`.claude-monitor/agents.json`) for tracking agent heartbeats, task assignments, and resource usage
- `getAgentStateStore()` - Singleton accessor

### Circuit Breaker (`lib/circuit-breaker/`)

Implements the circuit breaker pattern for protecting against stuck/dead queries:
- `CircuitBreaker` class with states: CLOSED, OPEN, HALF_OPEN
- `CircuitBreakerRegistry` for managing multiple circuits
- Used for fault tolerance in monitoring operations

### Alerting System (`lib/alerting/`)

Multi-channel alerting with:
- Channels: log, Slack, webhook
- `Notifier` class for sending alerts
- Configurable thresholds in `lib/alerting/config.ts`

### MCP HTTP Wrapper (`mcp-server/http-wrapper.ts`)

Standalone server that:
1. Spawns ruv-swarm and claude-flow MCP processes
2. Exposes their data via HTTP on port 8900
3. Provides direct `/api/*` endpoints for swarms, agents, tasks, messages, memory, metrics
4. Falls back to reading agent definitions from `.claude/agents/*.md` files when DB is empty

### Real-Time Updates (`hooks/useRealTimeUpdates.ts`)

Dual-mode real-time data fetching:
1. **SSE (Server-Sent Events)** - Primary, via EventSource to MCP stream endpoint
2. **Polling fallback** - 3-second interval if SSE fails
- Provides `useRealTimeUpdates`, `useSwarmUpdates`, `useTaskUpdates` hooks

### Pages Structure

- `app/page.tsx` - Main dashboard overview
- `app/agents/page.tsx` - Agent monitoring with kanban board
- `app/metrics/page.tsx` - Performance charts and metrics
- `app/swarms/page.tsx` - Swarm management view
- `app/queries/page.tsx` - Query tracking and debugging
- `app/status/page.tsx` - System health status
- `app/settings/page.tsx` - Alert configuration

### Monitoring Components (`components/monitoring/`)

- `AgentStateCard` - Individual agent status display
- `CircuitBreakerBadge` - Visual circuit state indicator
- `KanbanBoard` - Task board by status (pending/in_progress/completed/failed)
- `QueryCard` - Query execution tracking
- `RealTimeFeed` - Live event stream
- `StatusBar` - System health bar

## Environment Configuration

Key environment variables (see `.env.example`):

```bash
# Database paths (absolute paths required)
SWARM_DB_PATH="path/to/.hive-mind/hive.db"
HIVE_DB_PATH="path/to/.swarm/memory.db"

PORT=8800
POLLING_INTERVAL_MS=5000
REALTIME_ENABLED=true
DEFAULT_TIMEFRAME="24h"
```

## Type System

- Path alias: `@/*` maps to project root (configured in `tsconfig.json`)
- Server-only packages: `better-sqlite3` excluded from client bundle via `next.config.js`

## UI Framework

- **Next.js 15** with App Router
- **Mantine 7** for UI components (with auto color scheme)
- **React 19** with strict mode
- **ApexCharts** for data visualization (via `components/ui/LineChart.tsx`)
- **Tailwind CSS** for additional styling

## MCP Integration Notes

The dashboard does NOT use MCP client protocol directly. Instead:
1. MCP servers (claude-flow, ruv-swarm) write to SQLite databases
2. Dashboard reads directly from those databases via `SqliteClient`
3. Optional HTTP wrapper (`mcp-server/http-wrapper.ts`) provides REST API access

The external MCP servers use **stdio transport**, not HTTP. The HTTP wrapper is a separate convenience layer.
