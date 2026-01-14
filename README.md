# Claude Code Monitoring Dashboard

Real-time monitoring dashboard for Claude Code multi-agent swarm systems. Provides complete observability into agent states, task execution, system performance, and operational metrics.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Real-Time Monitoring**: Sub-second updates via Server-Sent Events (SSE) with polling fallback
- **Agent Tracking**: Monitor agent status, performance metrics, and task assignments
- **Task Management**: Kanban-style task tracking with status filtering and export
- **Swarm Orchestration**: View swarm topology, agent relationships, and communication flow
- **Performance Analytics**: Interactive charts for metrics, trends, and patterns
- **Alert System**: Configurable alerts with severity levels and notification channels
- **Mobile Responsive**: Touch-optimized interface for monitoring on the go
- **Data Export**: Export data as CSV or JSON for further analysis

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- SQLite databases from MCP servers (claude-flow, ruv-swarm)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-code-monitoring-dashboard.git
cd claude-code-monitoring-dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and set your database paths
# SWARM_DB_PATH=/path/to/.hive-mind/hive.db
# HIVE_DB_PATH=/path/to/.swarm/memory.db
```

### Development

```bash
# Start development server (runs on port 8800)
npm run dev

# Or with Turbopack for faster builds
npm run dev -- --turbo
```

Visit [http://localhost:8800](http://localhost:8800) to view the dashboard.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Configuration

### Environment Variables

```bash
# Database Configuration
SWARM_DB_PATH=/absolute/path/to/.hive-mind/hive.db
HIVE_DB_PATH=/absolute/path/to/.swarm/memory.db

# Server Configuration
PORT=8800

# Real-Time Updates
POLLING_INTERVAL_MS=5000
REALTIME_ENABLED=true

# Default Time Range
DEFAULT_TIMEFRAME=24h
```

### Database Paths

The dashboard reads from two SQLite databases created by external MCP servers:

| Database | Path | Tables |
|----------|------|--------|
| Hive DB | `.hive-mind/hive.db` | swarms, agents, tasks, messages, performance_metrics |
| Memory DB | `.swarm/memory.db` | patterns, task_trajectories, memory_entries |

> **Important**: Use absolute paths for database locations to avoid path resolution issues.

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview with quick stats and activity feed |
| Agents | `/agents` | Agent performance monitoring |
| Swarms | `/swarms` | Swarm status and topology |
| Tasks | `/tasks` | Task tracking with filters |
| Messages | `/messages` | Inter-agent communication |
| Metrics | `/metrics` | Performance analytics |
| Patterns | `/patterns` | Discovered patterns |
| Trajectories | `/trajectories` | Task execution paths |
| Queries | `/queries` | Query tracking |
| Alerts | `/alerts` | Alert management |
| Status | `/status` | System health |
| Settings | `/settings` | Configuration |

## Development

### Project Structure

```
claude-code-monitoring-dashboard/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard home
│   ├── agents/            # Agent monitoring
│   ├── tasks/             # Task tracking
│   ├── alerts/            # Alert management
│   └── ...
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components (MobileNav, DashboardLayout)
│   └── monitoring/        # Monitoring-specific components
├── lib/
│   ├── db/                # Database client and schema
│   ├── export/            # CSV/JSON export utilities
│   ├── hooks/             # React hooks
│   └── state/             # State management
├── .loki/                 # Loki Mode session state
└── CLAUDE.md              # Claude Code AI assistant instructions
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type check

# MCP HTTP Wrapper (optional)
npm run mcp-server       # Run via bun on port 8900
npm run mcp-server:ts    # Run via tsx instead
```

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: Mantine 7 with auto color scheme
- **Database**: better-sqlite3 (read-only)
- **Charts**: ApexCharts
- **Styling**: Tailwind CSS
- **Real-Time**: Server-Sent Events (SSE)

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t claude-monitor-dashboard .

# Run container
docker run -p 8800:8800 \
  -e SWARM_DB_PATH=/data/.hive-mind/hive.db \
  -e HIVE_DB_PATH=/data/.swarm/memory.db \
  -v $(pwd)/data:/data \
  claude-monitor-dashboard
```

### Manual Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment options
- [API Documentation](docs/API.md) - REST API endpoints
- [User Guide](docs/USER_GUIDE.md) - How to use the dashboard
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

Built for monitoring Claude Code multi-agent systems powered by MCP servers (claude-flow, ruv-swarm).
