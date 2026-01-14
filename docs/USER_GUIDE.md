# User Guide

This guide helps you navigate and use the Claude Code Monitoring Dashboard effectively.

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Page Navigation](#page-navigation)
- [Mobile Usage](#mobile-usage)
- [Data Export](#data-export)
- [Alerts](#alerts)
- [Settings](#settings)

## Getting Started

### First Time Access

1. Open your browser and navigate to `http://localhost:8800` (or your deployed URL)
2. The Dashboard page loads with an overview of your system
3. If databases are not connected, you'll see a connection error message

### Understanding the Layout

- **Desktop**: Navigation bar at the top with links to all pages
- **Mobile**: Hamburger menu button (bottom-right) for navigation

## Dashboard Overview

The home page (`/`) provides a comprehensive overview:

### Quick Stats Cards

| Metric | Description |
|--------|-------------|
| Total Agents | Number of agents in the system |
| Active Swarms | Number of currently active swarms |
| Tasks Today | Tasks completed today |
| Success Rate | Overall task success percentage |

### Recent Activity

A timeline showing recent system events:
- Task completions
- Agent status changes
- Swarm initialization
- Alert triggers

### Agent Status Summary

Six-panel breakdown of agent statuses:
- Idle agents
- Busy agents
- Active agents
- Offline agents
- Pending agents
- Running agents

## Page Navigation

### Desktop Navigation

Use the top navigation bar to access pages:

- **Dashboard** (`/`) - Home overview
- **Agents** (`/agents`) - Agent monitoring
- **Swarms** (`/swarms`) - Swarm management
- **Tasks** (`/tasks`) - Task tracking
- **Messages** (`/messages`) - Communication feed
- **Metrics** (`/metrics`) - Performance analytics
- **Patterns** (`/patterns`) - Discovered patterns
- **Trajectories** (`/trajectories`) - Task execution paths
- **Queries** (`/queries`) - Query tracking
- **Alerts** (`/alerts`) - Alert management
- **Status** (`/status`) - System health
- **Settings** (`/settings`) - Configuration

### Mobile Navigation

1. Tap the hamburger menu button (bottom-right corner)
2. The navigation menu slides in from the right
3. Tap any page to navigate
4. Tap the X button or outside the menu to close

## Agents Page

Monitor individual agent performance:

### Agent Table

| Column | Description |
|--------|-------------|
| Agent | Agent name and ID |
| Total Tasks | Total number of tasks assigned |
| Completed | Successfully completed tasks |
| Failed | Failed tasks |
| Success Rate | Percentage of successful tasks |
| Avg Duration | Average task completion time |
| Status | Current agent status (Active/Idle) |

### Agent Details

Click any agent to view detailed information including:
- Performance timeline
- Recent tasks
- Communication history

## Swarms Page

View swarm orchestration:

### Swarm Cards

Each swarm card displays:
- Swarm objective
- Topology type (mesh, hierarchical, ring, star)
- Number of agents
- Current status

### Communication Diagram

Visual representation of inter-agent communication within swarms.

## Tasks Page

Track task execution:

### Filter Tasks

Use filter buttons to view tasks by status:
- All
- Pending
- In Progress
- Completed
- Failed

### Task List

Each task shows:
- Task description
- Status badge
- Priority level (LOW, MEDIUM, HIGH, CRITICAL)
- Assigned agent
- Creation time
- Completion time (if completed)
- Duration

### Export Tasks

Click the **Export** button to download task data as CSV or JSON.

## Messages Page

View inter-agent communication:

### Message Statistics

Quick stats showing:
- Total messages
- Coordination messages
- Result messages
- Error messages
- Status updates

### Message Filtering

1. **Search**: Enter text to search by content or agent name
2. **Message Type**: Filter by type (All, Coordination, Result, Error, Status)

### Message Cards

Each message displays:
- Sender agent
- Recipient agent (or "broadcast")
- Message type with icon
- Timestamp
- Message content

## Metrics Page

View performance analytics:

### Timeframe Selection

Choose between:
- 24 Hours
- 7 Days
- 30 Days

### Key Metrics

- Total Agents
- Memory Entries
- Tasks
- Success Rate

### Charts

- **Memory Growth**: Timeline of memory entry growth
- **Memory by Namespace**: Breakdown by namespace type
- **Agent Status**: Current status of all agents
- **Hook Performance**: Performance of pre/post hooks

## Alerts Page

Manage system alerts:

### Alert Statistics

Summary of alerts by severity:
- Total alerts
- Critical
- Error
- Warning
- Info

### Alert Filtering

Click severity buttons to filter alerts.

### Alert List

Each alert shows:
- Severity badge
- Message
- Source
- Timestamp
- Resolution status

### Alert Actions

- **Acknowledge**: Mark alert as acknowledged
- **Resolve**: Mark alert as resolved
- **View Details**: View full alert information

## Patterns Page

View discovered patterns:

### Pattern List

Each pattern displays:
- Pattern type
- Description
- Confidence score
- Usage count
- Last used timestamp

## Settings Page

Configure dashboard settings:

### Display Settings

- Theme (Light/Dark/Auto)
- Data refresh interval
- Default timeframe

### Alert Settings

- Enable/disable alerts
- Configure thresholds
- Set notification channels

## Mobile Usage

### Touch Optimization

- Minimum tap target size: 44x44px
- Hamburger button: 56x56px
- Swipe gestures for navigation

### Responsive Layouts

Pages automatically adapt to screen size:
- **Cards**: Stack vertically on mobile
- **Tables**: Horizontal scroll enabled
- **Charts**: Responsive height and font sizes

### Mobile-Specific Features

- Floating hamburger menu button
- Full-screen navigation overlay
- Body scroll lock when menu is open

## Data Export

Export data from any page with tables:

1. Click the **Export** button
2. Select format (CSV or JSON)
3. File downloads automatically with timestamp

### Export Formats

| Format | Use Case |
|--------|----------|
| CSV | Excel, spreadsheet analysis |
| JSON | Programmatic processing, backup |

## Alerts

### Alert Types

| Severity | Description | Color |
|----------|-------------|-------|
| Critical | System-wide issues | Red |
| Error | Component failures | Orange |
| Warning | Potential issues | Yellow |
| Info | Informational | Blue |

### Alert Workflows

1. **New Alert**: Appears in alerts feed and on dashboard
2. **Acknowledge**: Mark as seen, continues tracking
3. **Resolve**: Mark as fixed, stops tracking

### Alert Configuration

Configure alerts in Settings:
- Set thresholds for metrics
- Choose notification channels
- Set quiet hours

## Keyboard Shortcuts

On desktop, use these shortcuts:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Quick navigation |
| `R` | Refresh current page |
| `Esc` | Close modal/menu |

## Tips and Tricks

1. **Bookmark Pages**: Save frequently used pages as browser bookmarks
2. **Dashboard as Home**: Set Dashboard as your browser homepage for monitoring
3. **Export Regularly**: Export data periodically for backup
4. **Check Status**: Visit Status page first if experiencing issues
5. **Use Filters**: Filter tasks and messages to find specific information quickly

## Getting Help

- **Status Page**: Check `/status` for system health
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **API Docs**: See [API.md](API.md) for integration help

## Accessibility

The dashboard supports:
- Keyboard navigation
- Screen reader compatibility
- High contrast mode
- Font size scaling (browser zoom)
- ARIA labels on interactive elements
